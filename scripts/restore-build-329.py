#!/usr/bin/env python3
"""Restore only the five portfolio build files from the verified 329 snapshot."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile


FILES = (
    "index.html",
    "assets/js/build-scene.js",
    "assets/js/build-details.js",
    "assets/css/build-scene.css",
    "assets/css/build-details.css",
)


def snapshot_bytes(root):
    snapshot = root / "assets/build-versions/329"
    manifest = json.loads((snapshot / "manifest.json").read_text(encoding="utf-8"))
    entries = manifest["files"]
    if manifest.get("version") != "329" or len(entries) != len(FILES):
        raise ValueError("Unexpected snapshot version or file count")
    by_path = {entry["path"]: entry for entry in entries}
    if set(by_path) != set(FILES):
        raise ValueError("Manifest must contain exactly the five supported files")
    verified = {}
    for relative in FILES:
        source = snapshot / relative
        if source.is_symlink() or not source.is_file():
            raise ValueError(f"Snapshot is not a regular file: {relative}")
        data = source.read_bytes()
        entry = by_path[relative]
        if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ValueError(f"Snapshot integrity check failed: {relative}")
        verified[relative] = data
    return verified


def restore(root, verified):
    # Preflight every destination before preparing or replacing any file.
    for relative in FILES:
        destination = root / relative
        if destination.is_symlink() or not destination.is_file():
            raise ValueError(f"Destination is not a regular file: {relative}")
        if destination.resolve() != destination:
            raise ValueError(f"Destination traverses a symbolic link: {relative}")

    pending = []
    try:
        for relative, data in verified.items():
            destination = root / relative
            with tempfile.NamedTemporaryFile(dir=destination.parent, prefix=".restore-329-", delete=False) as handle:
                temporary = Path(handle.name)
                pending.append((temporary, destination))
                handle.write(data)
                handle.flush()
                os.fsync(handle.fileno())
            temporary.chmod(destination.stat().st_mode & 0o777)
        for temporary, destination in pending:
            os.replace(temporary, destination)
        for relative, data in verified.items():
            if (root / relative).read_bytes() != data:
                raise ValueError(f"Restored bytes differ: {relative}")
    finally:
        for temporary, _ in pending:
            temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify the snapshot only; do not write any files")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    try:
        verified = snapshot_bytes(root)
        if args.check:
            print("329 snapshot verified: SHA-256 and sizes match for all 5 files. No files changed.")
            return 0
        restore(root, verified)
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Restore failed: {error}", file=sys.stderr)
        return 1
    print("Restored and verified build 329: index.html and the 4 build CSS/JS files only.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
