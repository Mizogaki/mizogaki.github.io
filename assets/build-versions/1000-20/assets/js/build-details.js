/* Give the existing generated artwork real, individually buildable targets. */
(() => {
  'use strict';

  const records = [];
  let prepared = false;
  let refreshing = false;
  const measuringClass = 'build-details-measuring';
  const copiedProperties = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
    'box-sizing', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-top-style', 'border-top-color',
    'border-right-width', 'border-right-style', 'border-right-color',
    'border-bottom-width', 'border-bottom-style', 'border-bottom-color',
    'border-left-width', 'border-left-style', 'border-left-color', 'border-radius',
    'background-color', 'background-image', 'background-size', 'background-position',
    'background-repeat', 'background-origin', 'background-clip', 'background-attachment', 'background-blend-mode',
    'mask-image', 'mask-mode', 'mask-repeat', 'mask-position', 'mask-size', 'mask-origin', 'mask-clip', 'mask-composite',
    '-webkit-mask-image', '-webkit-mask-repeat', '-webkit-mask-position', '-webkit-mask-size',
    '-webkit-mask-origin', '-webkit-mask-clip', '-webkit-mask-composite',
    'color', 'opacity', 'visibility', 'font-family', 'font-size', 'font-weight',
    'font-style', 'font-stretch', 'line-height', 'letter-spacing', 'word-spacing',
    'text-align', 'text-transform', 'text-decoration', 'white-space', 'vertical-align',
    'overflow-x', 'overflow-y', 'clip-path', 'transform', 'transform-origin',
    'mix-blend-mode', 'isolation', 'object-fit', 'object-position',
    'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content',
    'justify-self', 'flex-grow', 'flex-shrink', 'flex-basis', 'order', 'column-gap', 'row-gap',
    'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end'
  ];

  function numbered(owner, selector, prefix, suffix = '') {
    const index = [...document.querySelectorAll(selector)].indexOf(owner) + 1;
    return `${prefix}${String(index).padStart(2, '0')}${suffix}`;
  }

  // These are the meaningful, currently authored pseudos, rather than every
  // selector in the stylesheet (which also contains unused animation artwork).
  const sources = [
    { selector: '.hero-container', pseudo: 'before', kind: 'type' },
    { selector: '.home-marathon-ui', pseudo: 'before', kind: 'type' },
    { selector: '.home-marathon-ui', pseudo: 'after', kind: 'type' },
    { selector: '#services .container, #work .container, #career .container, #contact .container', pseudo: 'after', kind: 'type' },
    { selector: '#services, #work, #career, #contact', pseudo: 'before' },
    { selector: '.work-card-body', pseudo: 'before', kind: 'type', text: owner => numbered(owner.closest('.portfolio-item'), '.portfolio-item', 'REC ') },
    { selector: '.work-card-body', pseudo: 'after' },
    { selector: '.service-card', pseudo: 'before' },
    { selector: '.service-card', pseudo: 'after', kind: 'type', text: owner => numbered(owner, '.service-card', '', '  /  CAPABILITY') },
    { selector: '.career-item', pseudo: 'before' },
    { selector: '.career-item', pseudo: 'after', kind: 'type', text: owner => numbered(owner, '.career-item', 'LOG ') },
    { selector: '.impact-item', pseudo: 'before' },
    { selector: '.contact-panel', pseudo: 'after', kind: 'type' },
    { selector: '.intro-panel', pseudo: 'after', kind: 'type' },
    { selector: '.portrait-frame', pseudo: 'before' },
    { selector: '.portrait-frame', pseudo: 'after', kind: 'type' },
    { selector: '.sidebar-portrait', pseudo: 'before' },
    { selector: '.sidebar-portrait', pseudo: 'after' },
    { selector: '.ops-hud > div', pseudo: 'before' },
    { selector: '.ops-hud > div', pseudo: 'after' },
    { selector: '.focus-list > div', pseudo: 'after' },
    { selector: '#header', pseudo: 'after' },
    { selector: '#header .profile', pseudo: 'after' },
    { selector: '#header .social-links', pseudo: 'before', kind: 'type' },
    { selector: '#header .social-links > a', pseudo: 'before' },
    { selector: '#header .social-links > a', pseudo: 'after' },
    { selector: '#header .sidebar-terminal > span', pseudo: 'before' },
    { selector: '#navbar .nav-link', pseudo: 'before' },
    { selector: '#navbar .nav-link', pseudo: 'after', kind: 'type', text: owner => owner.dataset.code || '' },
    { selector: '.section-title > span, .contact-panel > div:first-child > span, .eyebrow', pseudo: 'before' },
    { selector: '.home-marathon-ui .hud-plus, .marathon-microbar .micro-x', pseudo: 'before' },
    { selector: '.home-marathon-ui .hud-plus, .marathon-microbar .micro-x', pseudo: 'after' },
    { selector: '.marathon-microbar .micro-dot', pseudo: 'after' }
  ];

  function contentText(content) {
    if (!content || content === 'none' || content === 'normal') return null;
    // All copied content is authored CSS text. Do not interpret it as HTML.
    if (!/^["']/.test(content)) return null;
    return content.slice(1, -1).replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi,
      (_, hexadecimal, character) => hexadecimal ? String.fromCodePoint(parseInt(hexadecimal, 16) || 0xfffd) : character);
  }

  function wrapDirectCopy() {
    const labels = '.hero-actions > a, .contact-actions > a, .title-sub, .profile-badge, ' +
      '.section-title > span, .contact-panel > div:first-child > span, ' +
      '.career-item > time, .work-card-body > span';
    document.querySelectorAll(labels).forEach(owner => {
      [...owner.childNodes].forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
        const copy = document.createElement('build-copy');
        copy.dataset.buildCopy = '';
        node.replaceWith(copy);
        copy.append(node);
      });
    });
  }

  function refresh() {
    if (!prepared || refreshing) return;
    refreshing = true;
    const root = document.documentElement;
    root.classList.add(measuringClass);
    // The original pseudo occupies its original layout slot while we read it;
    // clones are hidden only for this synchronous measuring pass.
    records.forEach(({ owner, attribute }) => owner.removeAttribute(attribute));
    try {
      const snapshots = records.map(record => {
        const computed = getComputedStyle(record.owner, `::${record.pseudo}`);
        const properties = copiedProperties.map(property => [property, computed.getPropertyValue(property)]);
        const text = record.text ? record.text(record.owner) : contentText(computed.content);
        return { record, properties, text, display: computed.display };
      });
      snapshots.forEach(({ record, properties, text, display }) => {
        const { element } = record;
        // Do not replace className, dataset build state, or the whole style
        // attribute: the scene owns those while preparing and replaying tasks.
        properties.forEach(([property, value]) => {
          const animated = property === 'clip-path' || property === 'transform';
          if (animated && element.dataset.buildObject === 'creating') return;
          element.style.setProperty(property, value);
        });
        element.textContent = text || '';
        element.style.display = text === null || display === 'none' ? 'none' : display;
      });
    } finally {
      records.forEach(({ owner, attribute }) => owner.setAttribute(attribute, ''));
      root.classList.remove(measuringClass);
      refreshing = false;
    }
  }

  function prepare() {
    if (prepared) return;
    prepared = true;
    wrapDirectCopy();
    sources.forEach(source => {
      document.querySelectorAll(source.selector).forEach(owner => {
        const element = document.createElement('build-detail');
        element.dataset.buildDetail = '';
        element.dataset.buildKind = source.kind || 'detail';
        element.dataset.buildPseudo = source.pseudo;
        element.setAttribute('aria-hidden', 'true');
        // Pseudo ::before/::after order matters for grid and flex slots, not
        // merely for absolutely positioned decorations.
        if (source.pseudo === 'before') owner.prepend(element);
        else owner.append(element);
        records.push({ ...source, owner, element, attribute: `data-build-source-${source.pseudo}` });
      });
    });
    refresh();
  }

  window.PortfolioBuildDetails = { prepare, refresh };
})();
