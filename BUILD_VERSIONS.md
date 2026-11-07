# ポートフォリオの保存版

今回の改善前の状態を **329版** として保存しています。

現行版は、元の329オブジェクトを背景・辺・文字の区切りなど **約1,000の描画工程** に分けています。画像は帯分割をせず1回で配置し、背景や枠の塗り進める動きは維持しています。PCのトップ装飾は見出し・ボタン・HUDや互いの装飾に重ならない余白へ配置します。PCは最大28、スマホ（640px以下）は最大8カーソルで、表示範囲内の着手できる仕事を並行して進めます。同じパーツの工程はその場で連続し、次の仕事がないカーソルは非表示になります。組み立て中の本体はクリック・キーボード操作の対象外になり、全体のスキップはターミナルの「Skip all」に集約しています。画面幅変更時は完了した工程を保ち、未完成の表示対象だけを再配分します。

- 比較用の表示: [`build-previous.html`](build-previous.html)
- 元データ: `assets/build-versions/329/`
- 元の `index.html` と4つのビルド用CSS・JSをバイト単位で保存し、`manifest.json` にSHA-256とサイズを記録しています。
- 比較用ページは元のHTMLから4つのビルド用CSS・JSの参照先だけを保存版へ切り替え、検索対象外の `noindex,nofollow` を設定しています。他の共通アセットは現行版を参照します。

保存版の整合性だけを確認する場合は、リポジトリのルートで実行します。ファイルは変更しません。

```sh
python3 scripts/restore-build-329.py --check
```

329版へ戻す場合は、次を実行します。保存版を検証してから、下の5ファイルだけを復元します。実行直前の5ファイルの編集は上書きされるため、必要であれば先に別途保存してください。

```sh
python3 scripts/restore-build-329.py
```

- `index.html`
- `assets/js/build-scene.js`
- `assets/js/build-details.js`
- `assets/css/build-scene.css`
- `assets/css/build-details.css`

Gitのリセットやコミット操作は行いません。他のファイルや `.DS_Store` は変更しません。GitHub Pagesに公開済みの版を戻す場合は、復元した差分を通常の公開手順で反映してください。


## 1,000工程・PC最大20カーソル版（1000-20）

PCのカーソル数を28へ増やし、画像の表示演出やレイアウトを変更する前の状態も、**1000-20版** として保存しています。画像を帯ごとに組み立てる1,000工程・PC最大20カーソル・スマホ最大8カーソルの版です。

- 比較用の表示: [`build-1000-previous.html`](build-1000-previous.html)
- 元データ: `assets/build-versions/1000-20/`
- `index.html` と5つのビルド用CSS・JSをバイト単位で保存し、`manifest.json` にSHA-256とサイズを記録しています。
- 比較用ページは元のHTMLから5つのビルド用CSS・JSの参照先だけを保存版へ切り替え、検索対象外の `noindex,nofollow` を設定しています。他のリンクと共通アセットの参照先は保存時のままです。

保存版の整合性だけを確認する場合は、次を実行します。ファイルは変更しません。

```sh
python3 scripts/restore-build-1000-20.py --check
```

この版へ戻す場合は、次を実行します。保存版を検証してから、下の6ファイルだけを復元します。実行直前の6ファイルの編集は上書きされるため、必要であれば先に別途保存してください。

```sh
python3 scripts/restore-build-1000-20.py
```

- `index.html`
- `assets/js/build-scene.js`
- `assets/js/build-details.js`
- `assets/js/build-steps.js`
- `assets/css/build-scene.css`
- `assets/css/build-details.css`

Gitのリセットやコミット操作は行いません。329版の保存データ・比較用ページ・復元スクリプト、その他のファイルや `.DS_Store` は変更しません。公開済みの版を戻す場合は、復元した差分を通常の公開手順で反映してください。


## 2026-11-07の公開前の本番

今回のアニメーションを公開する前の本番ソースは、GitHub上のブランチ `codex/portfolio-before-build-20261107` に保存しています。コミットは `eb93d0ca3547eb1afbace5d0e4917f20908c50c8` です。

- 公開前の本番: <https://github.com/Mizogaki/mizogaki.github.io/tree/codex/portfolio-before-build-20261107>
- 公開先: <https://www.mizogaki-portfolio.com/>
- GitHub Pagesの公開元: `master` ブランチのルート

今回公開した変更を取り消す場合は、今回の公開コミットを `git revert` して `master` へpushすると、履歴を残したまま公開前のソースへ戻せます。直前の20カーソル版や329個版へ戻す場合は、それぞれの復元スクリプトで対象ファイルだけを戻し、その差分をコミット・pushします。復元スクリプト自体は公開操作を実行しません。
