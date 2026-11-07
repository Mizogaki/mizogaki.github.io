/* Place the authored desktop hero artwork in the remaining whitespace. */
(() => {
  'use strict';

  const desktop = window.matchMedia('(min-width: 1000px)');
  const ownedProperties = ['left', 'top', 'right', 'bottom', 'display'];
  const originals = new WeakMap();
  // Earlier entries keep their place first when a short viewport has less room.
  // Each preferred center has a different part of the canvas to preserve the
  // scattered instrument-panel composition instead of creating an edge stack.
  const artwork = [
    ['.home-panel-a', 0.82, 0.22],
    ['.micro-terminal-a', 0.12, 0.70],
    ['.micro-terminal-b', 0.88, 0.60],
    ['.hud-plus-a', 0.075, 0.34],
    ['.hud-plus-b', 0.92, 0.36],
    ['.hud-plus-c', 0.93, 0.82],
    ['.home-blocks-a', 0.88, 0.25],
    ['.home-blocks-b', 0.20, 0.82],
    ['.checksum-a', 0.10, 0.52],
    ['.checksum-b', 0.83, 0.75],
    ['.home-glyph-a', 0.18, 0.13],
    ['.home-glyph-b', 0.72, 0.15],
    ['.home-glyph-c', 0.80, 0.90]
  ];

  function remember(element) {
    if (originals.has(element)) return;
    originals.set(element, ownedProperties.map(property => [
      property, element.style.getPropertyValue(property),
      element.style.getPropertyPriority(property)
    ]));
  }

  function restore(element) {
    originals.get(element)?.forEach(([property, value, priority]) => {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    });
  }

  // Layout coordinates intentionally ignore transforms, opacity and clip-path.
  // Targets can be pending or half-built without moving the protected content
  // or the next placement pass. The inset overlay shares the hero's origin.
  function layoutOrigin(element) {
    let left = 0;
    let top = 0;
    for (let node = element; node; node = node.offsetParent) {
      left += node.offsetLeft;
      top += node.offsetTop;
    }
    return { left, top };
  }

  function rectangle(element, origin, clearance = 0) {
    const position = layoutOrigin(element);
    return {
      left: position.left - origin.left - clearance,
      top: position.top - origin.top - clearance,
      right: position.left - origin.left + element.offsetWidth + clearance,
      bottom: position.top - origin.top + element.offsetHeight + clearance
    };
  }

  function intersects(a, b) {
    return a.left < b.right && a.right > b.left &&
      a.top < b.bottom && a.bottom > b.top;
  }

  function protectReadout(overlay, pseudo, width, height, protectedRects) {
    const style = getComputedStyle(overlay, `::${pseudo}`);
    if (style.display === 'none') return;
    const readoutHeight = parseFloat(style.height);
    if (!readoutHeight) return;
    const top = parseFloat(style.top);
    const bottom = parseFloat(style.bottom);
    const y = Number.isFinite(top) ? top : height - bottom - readoutHeight;
    if (!Number.isFinite(y)) return;
    protectedRects.push({
      left: (parseFloat(style.left) || 0) - 10,
      right: width - (parseFloat(style.right) || 0) + 10,
      top: y - 10,
      bottom: y + readoutHeight + 10
    });
  }

  function candidates(size, limit, preferred, blockers, start, end) {
    const points = new Set([start, limit - size - end, preferred]);
    // Obstacle boundaries include the corners of every available rectangular
    // gap. Unlike a viewport-percentage anchor, these respond to wrapped copy.
    blockers.forEach(rect => {
      points.add(rect.start - size);
      points.add(rect.end);
    });
    [0.08, 0.18, 0.30, 0.5, 0.70, 0.82, 0.92].forEach(fraction => {
      points.add(limit * fraction - size / 2);
    });
    return [...points].filter(value => value >= start && value + size <= limit - end)
      .sort((a, b) => a - b);
  }

  function place(width, height, preferred, protectedRects, placed, bounds) {
    const gap = 14;
    const blockers = protectedRects.concat(placed.map(rect => ({
      left: rect.left - gap,
      top: rect.top - gap,
      right: rect.right + gap,
      bottom: rect.bottom + gap
    })));
    const x = preferred[0] * bounds.width - width / 2;
    const y = preferred[1] * bounds.height - height / 2;
    const xs = candidates(width, bounds.width, x,
      blockers.map(rect => ({ start: rect.left, end: rect.right })), bounds.inset, bounds.inset);
    const ys = candidates(height, bounds.height, y,
      blockers.map(rect => ({ start: rect.top, end: rect.bottom })), bounds.inset, bounds.inset);
    let winner = null;
    let bestScore = Infinity;
    for (const top of ys) {
      for (const left of xs) {
        const rect = { left, top, right: left + width, bottom: top + height };
        if (blockers.some(blocker => intersects(rect, blocker))) continue;
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const dx = (left - x) / bounds.width;
        const dy = (top - y) / bounds.height;
        // Soft local repulsion balances whitespace without sending every item
        // to an outermost corner. Collision exclusion above remains absolute.
        const crowding = placed.reduce((score, other) => {
          const distanceX = (centerX - (other.left + other.right) / 2) / bounds.width;
          const distanceY = (centerY - (other.top + other.bottom) / 2) / bounds.height;
          return score + Math.max(0, 0.034 - distanceX * distanceX - distanceY * distanceY) * 0.8;
        }, 0);
        const score = dx * dx + dy * dy + crowding;
        if (score < bestScore) {
          winner = rect;
          bestScore = score;
        }
      }
    }
    return winner;
  }

  function layout() {
    const hero = document.querySelector('#hero');
    const overlay = hero?.querySelector('.home-marathon-ui');
    if (!hero || !overlay) return;
    const targets = artwork.map(([selector, ...preferred]) => ({
      element: overlay.querySelector(selector), preferred
    })).filter(target => target.element);

    if (!desktop.matches) {
      targets.forEach(({ element }) => {
        restore(element);
        element.classList.remove('hero-layout-decoration');
        element.removeAttribute('data-hero-decoration');
        element.removeAttribute('data-hero-layout-hidden');
      });
      overlay.removeAttribute('data-hero-layout');
      return;
    }

    overlay.dataset.heroLayout = 'desktop';
    targets.forEach(({ element }, index) => {
      remember(element);
      restore(element);
      element.classList.add('hero-layout-decoration');
      element.dataset.heroDecoration = String(index);
      element.removeAttribute('data-hero-layout-hidden');
    });
    const width = overlay.clientWidth;
    const height = overlay.clientHeight;
    if (!width || !height) return;
    const origin = layoutOrigin(overlay);
    const protectedRects = [];
    const protectedSelectors = [
      ['.hero-container h2', 22], ['.eyebrow', 18],
      ['.marathon-microbar', 16], ['.hero-lead', 20],
      ['.hero-actions', 18], ['.ops-hud', 18]
    ];
    protectedSelectors.forEach(([selector, clearance]) => {
      const element = hero.querySelector(selector);
      if (element?.offsetWidth && element.offsetHeight) {
        protectedRects.push(rectangle(element, origin, clearance));
      }
    });
    // The hero's first generated label becomes a build-detail during prepare().
    // Protect its original grid slot both before and after materialization.
    const container = hero.querySelector('.hero-container');
    const eyebrow = hero.querySelector('.eyebrow');
    if (container && eyebrow) {
      const label = rectangle(eyebrow, origin, 18);
      label.top = rectangle(container, origin).top - 18;
      protectedRects.push(label);
    }
    protectReadout(overlay, 'before', width, height, protectedRects);
    protectReadout(overlay, 'after', width, height, protectedRects);

    const placed = [];
    const bounds = { width, height, inset: 24 };
    targets.forEach(({ element, preferred }) => {
      const itemWidth = element.offsetWidth;
      const itemHeight = element.offsetHeight;
      if (!itemWidth || !itemHeight) return;
      const position = place(itemWidth, itemHeight, preferred, protectedRects, placed, bounds);
      if (!position) {
        element.style.setProperty('display', 'none');
        element.dataset.heroLayoutHidden = '';
        return;
      }
      // Pixel coordinates are stable across repeated calls and leave transform
      // and clip-path available to the existing per-object construction scene.
      element.style.setProperty('left', `${position.left}px`);
      element.style.setProperty('top', `${position.top}px`);
      element.style.setProperty('right', 'auto');
      element.style.setProperty('bottom', 'auto');
      placed.push(position);
    });
  }

  window.PortfolioHeroLayout = { layout };
})();
