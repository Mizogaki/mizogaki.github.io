/* A full-page, rehearsed build. All cursors are local animation actors. */
(() => {
  'use strict';

  const hero = document.querySelector('#hero');
  if (!hero || typeof Element.prototype.animate !== 'function' ||
      !('IntersectionObserver' in window)) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 640px)');
  const cursorColor = '#c8e87b';
  const sectionNames = { hero: 'HOME', about: 'PROFILE', services: 'MISSION OPS',
    work: 'PRODUCT WORK', career: 'CAREER LOG', contact: 'CONTACT' };
  const selector = [
    '#header .profile-badge', '#header .sidebar-portrait', '#header .sidebar-portrait > img', '#header .profile > h1',
    '#header .profile-role', '#header .social-links > a', '#header .social-links > a > i', '#header .sidebar-terminal', '#navbar li',
    '#header .sidebar-terminal > span',
    '#navbar .nav-link > span', '#navbar .nav-link > i',
    '#hero .eyebrow', '#hero .title-unit', '#hero .marathon-microbar', '#hero .hero-lead',
    '#hero .hero-actions > a', '#hero .hero-actions > a > i', '#hero .ops-hud > div', '#hero .ops-hud > div > span',
    '#hero .ops-hud > div > strong', '#hero .ops-hud > div > small',
    '#hero .marathon-microbar > strong', '#hero .marathon-microbar > em', '#hero .marathon-microbar > .micro-icon',
    '#hero .home-marathon-ui > .home-glyph', '#hero .home-marathon-ui > .home-panel',
    '#hero .home-marathon-ui > .micro-terminal', '#hero .home-blocks > i', '#hero .checksum > i',
    '#header .sidebar-hud > span', '#about .profile-marathon-ui > .profile-glyph',
    '#main .section-title > span', '#main .section-title > h2', '#main .section-title > p',
    '#about .portrait-frame', '#about .portrait-frame > img', '#about .intro-panel', '#about .intro-panel > h3',
    '#about .profile-terminal > span', '#about .intro-panel > p', '#about .focus-list > div',
    '#about .focus-list > div > strong', '#about .focus-list > div > span',
    '#about .impact-item', '#about .impact-item > strong', '#about .impact-item > span',
    '.service-card', '.service-card > i', '.service-card > h3', '.service-card > p',
    '.work-card', '.work-card > img', '.work-card-body', '.work-card-body > span', '.work-card-body > h3',
    '.work-card-body > p', '.work-card-body > a', '.work-card-body > a > i', '.career-item', '.career-item > time',
    '.career-item > div > h3', '.career-item > div > p', '.contact-panel',
    '.contact-panel > div:first-child > span', '.contact-panel > div:first-child > h2',
    '.contact-panel > div:first-child > p', '.contact-actions > a', '.contact-actions > a > i', '.contact-actions > p',
    '#footer .copyright', '#footer .credits', '[data-build-copy]', '[data-build-detail]'
  ].join(',');
  const items = [];

  function registerTargets() {
    window.PortfolioBuildDetails?.prepare();
    const surfaces = '.service-card, .work-card, .work-card-body, .career-item, .contact-panel, ' +
      '.intro-panel, .impact-item, .ops-hud > div, #navbar li, .sidebar-terminal, .marathon-microbar, ' +
      '.focus-list > div, .sidebar-portrait, .portrait-frame, .hero-actions > a, .contact-actions > a, ' +
      '#header .social-links > a, .work-card-body > a, .title-sub, .profile-badge, .section-title > span, ' +
      '.contact-panel > div:first-child > span, .career-item > time, .work-card-body > span';
    const decorations = '.home-glyph, .home-panel, .micro-terminal, .home-blocks > i, .checksum > i, ' +
      '.micro-icon, .sidebar-hud > span, .profile-glyph';
    document.querySelectorAll(selector).forEach(element => {
      const decorative = element.matches(decorations);
      const mode = element.dataset.buildKind || (element.matches(surfaces) ? 'frame'
        : element.matches('img') ? 'image'
          : (element.matches('[data-build-copy], h1, h2, h3, p, strong, time, span, small, em, a, .copyright, .credits') && element.textContent.trim()) ? 'type' : 'detail');
      if (decorative) {
        element.classList.add('build-decoration');
        element.style.setProperty('--build-static-opacity', String(Math.max(0.45, Number(getComputedStyle(element).opacity) || 0.65)));
      }
      items.push({ element, played: false, section: element.closest('section')?.id || 'hero', mode, parents: [] });
    });
    const byElement = new Map(items.map(item => [item.element, item]));
    items.forEach(item => {
      for (let parent = item.element.parentElement; parent; parent = parent.parentElement) {
        if (byElement.has(parent)) item.parents.unshift(byElement.get(parent));
      }
    });
  }
  let active = null;
  let timer;
  let observer;
  let enabled = false;
  let initialized = false;
  let interacted = false;
  let autoTour = false;
  let autoScrolling = false;
  let scrollFrame;
  let advanceTimer;
  let scrollLogLine = null;
  let expectedScrollY = null;
  let previousScrollRestoration = null;

  if (!motionPreference.matches && (!location.hash || location.hash === '#hero') &&
      'scrollRestoration' in history) {
    previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
  }

  document.body.classList.add('build-scene-ready');
  const controls = document.createElement('div');
  controls.className = 'build-controls';
  controls.innerHTML = `
    <div class="build-toolbar">
      <span class="build-caption" aria-hidden="true"><span class="build-terminal-title">BUILD TERMINAL <span class="build-team"></span></span><span data-build-caption>SCROLL TO BUILD</span></span>
      <div class="build-terminal-actions">
        <button type="button" data-build-skip aria-label="ページ全体の組み立てアニメーションをスキップ"><span>Skip all</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 3 5 5-5 5M12 3v10"/></svg></button>
        <button type="button" data-build-replay aria-label="ページ全体の組み立てアニメーションを最初から再生"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6a5 5 0 1 1 0 4M3 2v4h4"/></svg><span>Replay all</span></button>
      </div>
    </div>
    <div class="build-terminal-body" data-terminal-body>
      <div class="build-log" role="log" aria-label="サイト構築の進行ログ" aria-live="off"></div>
      <div class="build-terminal-command" aria-hidden="true"><span class="build-terminal-prompt">~/portfolio $</span><span data-terminal-command></span><i class="build-terminal-caret"></i></div>
    </div>
    <span class="build-progress" aria-hidden="true"><span></span></span>
    <span class="build-announcement" role="status" aria-live="polite"></span>`;
  const skip = controls.querySelector('[data-build-skip]');
  const replay = controls.querySelector('[data-build-replay]');
  const caption = controls.querySelector('[data-build-caption]');
  const team = controls.querySelector('.build-team');
  const announcement = controls.querySelector('[role="status"]');
  const terminalLog = controls.querySelector('.build-log');
  const terminalCommand = controls.querySelector('[data-terminal-command]');
  let commandFrame;
  let commandTarget = '';
  const actorCount = () => compact.matches ? 10 : 12;

  function showCommand(command, immediate = false) {
    cancelAnimationFrame(commandFrame);
    commandTarget = command;
    if (immediate || motionPreference.matches || document.hidden) {
      terminalCommand.textContent = command;
      return;
    }
    const started = performance.now();
    const duration = Math.max(45, Math.min(160, command.length * 2));
    const tick = now => {
      const progress = Math.min(1, (now - started) / duration);
      terminalCommand.textContent = command.slice(0, Math.ceil(command.length * progress));
      if (progress < 1) commandFrame = requestAnimationFrame(tick);
    };
    terminalCommand.textContent = '';
    commandFrame = requestAnimationFrame(tick);
  }

  function setLogStatus(line, state) {
    line.className = `build-log-line is-${state}`;
    line.querySelector('.build-log-status').textContent = `[${state === 'complete' ? 'done' : state === 'skipped' ? 'skip' : state === 'running' ? 'run' : state}]`;
  }

  function logOperation(command, state = 'running', worker = 'sys', echo = true) {
    const line = document.createElement('div');
    const owner = document.createElement('span');
    owner.className = 'build-log-worker';
    owner.textContent = worker;
    const text = document.createElement('span');
    text.className = 'build-log-command';
    text.textContent = command;
    const status = document.createElement('span');
    status.className = 'build-log-status';
    line.append(owner, text, status);
    setLogStatus(line, state);
    terminalLog.append(line);
    while (terminalLog.children.length > 80) terminalLog.firstElementChild.remove();
    terminalLog.scrollTop = terminalLog.scrollHeight;
    if (echo) showCommand(command);
    return line;
  }

  function objectCommand(item) {
    const image = item.element.matches('img') ? item.element : item.element.querySelector('img');
    const identity = element => element.id ? `#${element.id}` :
      [...element.classList].filter(name => !name.startsWith('build-')).slice(0, 2).join('.') || element.localName;
    const detailName = item.element.dataset.buildPseudo ?
      `${identity(item.element.parentElement)}::${item.element.dataset.buildPseudo}` : identity(item.element);
    const title = item.element.closest('#navbar a, #navbar li')?.querySelector('span')?.textContent ||
      (item.mode === 'image' ? image?.alt : item.element.querySelector('h2,h3,strong')?.textContent) ||
      item.element.getAttribute('aria-label') || item.element.textContent.trim() || detailName;
    const name = title.replace(/\s+/g, ' ').trim().slice(0, 42);
    const operation = item.mode === 'type' ? 'text.write' : item.mode === 'image' ? 'image.place' : item.mode === 'frame' ? 'frame.draw' : 'detail.draw';
    return `${operation} ${JSON.stringify(name)}`;
  }

  function workAreaBottom() {
    const dockHeight = controls.isConnected && !controls.hidden ? controls.getBoundingClientRect().height : 0;
    return Math.max(innerHeight * 0.4, Math.min(innerHeight * 0.84, innerHeight - dockHeight - 20));
  }

  function updateSections() {
    document.querySelectorAll('#hero, #main > section').forEach(section => {
      const own = items.filter(item => item.section === section.id);
      section.dataset.buildState = active?.section === section.id ? 'building'
        : own.every(item => item.played || !item.element.getClientRects().length) ? 'assembled' : 'pending';
    });
  }

  function settle(reveal = false) {
    if (!active) return;
    const scene = active;
    active = null;
    scene.resolveTasks?.forEach(resolve => resolve(false));
    clearTimeout(scene.fallback);
    scene.animations.forEach(animation => animation.cancel());
    scene.overlay.remove();
    terminalLog.querySelectorAll('.is-running').forEach(line => setLogStatus(line, 'skipped'));
    scene.items.forEach(item => {
      if (reveal || item.played) {
        item.played = true;
        item.element.classList.remove('build-pending');
        item.element.dataset.buildObject = 'complete';
      } else {
        item.element.classList.add('build-pending');
        item.element.dataset.buildObject = 'queued';
      }
    });
    document.body.classList.remove('build-scene-running');
    caption.textContent = enabled ? 'SCROLL TO BUILD' : 'ASSEMBLED';
    updateSections();
  }

  function stopAll(reason = 'reveal') {
    pauseTour(true);
    enabled = false;
    clearTimeout(timer);
    settle(true);
    observer?.disconnect();
    items.forEach(item => {
      item.played = true;
      item.element.classList.remove('build-pending');
    });
    const restoreFocus = document.activeElement === skip;
    skip.hidden = true;
    caption.textContent = 'ASSEMBLED';
    announcement.textContent = 'ページ全体の組み立てが完了しました。';
    logOperation(reason === 'complete' ? 'build.complete --all-objects-ready' : reason === 'error' ? 'build.abort --show-all' : 'view.reveal --remaining-objects',
      reason === 'complete' ? 'complete' : reason === 'error' ? 'error' : 'skipped');
    if (restoreFocus) replay.focus({ preventScroll: true });
    updateSections();
  }

  function animate(scene, element, keyframes, options = {}) {
    const animation = element.animate(keyframes, {
      fill: 'both', easing: 'cubic-bezier(0.16, 1, 0.3, 1)', ...options
    });
    scene.animations.add(animation);
    animation.finished.catch(() => {});
    return animation;
  }

  function collapsedClip(clip) {
    if (!clip.startsWith('polygon(')) return 'inset(0 0 100% 0)';
    // Collapse only Y, retaining each X coordinate and the adopted corner shape.
    return `polygon(${clip.slice(8, -1).split(',').map(point =>
      point.trim().replace(/\s+(?:calc\([^)]*\)|[^\s]+)$/, ' 0')
    ).join(',')})`;
  }

  async function play(scene, element, keyframes, options, finalStyle) {
    if (active !== scene) return false;
    const animation = animate(scene, element, keyframes, options);
    try {
      await animation.finished;
    } catch {
      return false;
    }
    if (active !== scene) return false;
    if (finalStyle) Object.assign(element.style, finalStyle);
    animation.cancel();
    scene.animations.delete(animation);
    return true;
  }

  function measureTyping(target) {
    const nodes = [];
    const walker = document.createTreeWalker(target.item.element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
    }
    const length = nodes.reduce((sum, node) => sum + node.textContent.length, 0);
    const stride = Math.max(1, Math.ceil(length / 400));
    const glyphs = [];
    const range = document.createRange();
    let count = 0;
    for (const node of nodes) {
      let offset = 0;
      for (const character of node.textContent) {
        const start = offset;
        offset += character.length;
        count += 1;
        if (!character.trim() || (count % stride && offset < node.textContent.length)) continue;
        range.setStart(node, start);
        range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const x = Math.max(0, Math.min(target.rect.width, rect.right - target.rect.left + 1));
        const top = Math.max(0, rect.top - target.rect.top - 1);
        const bottom = Math.min(target.rect.height, rect.bottom - target.rect.top + 1);
        glyphs.push({ x, left: Math.max(0, rect.left - target.rect.left), top, bottom, height: rect.height });
      }
    }
    return glyphs;
  }

  function selection(scene, target) {
    const frame = document.createElement('div');
    frame.className = 'build-selection';
    frame.style.setProperty('--actor-color', cursorColor);
    Object.assign(frame.style, {
      width: `${target.rect.width + 8}px`, height: `${target.rect.height + 8}px`,
      transform: `translate(${target.rect.left - 4}px, ${target.rect.top - 4}px)`, opacity: '0.45'
    });
    frame.innerHTML = '<i></i><i></i><i></i><i></i>';
    scene.overlay.append(frame);
    return frame;
  }

  function createWorkers(scene) {
    const left = innerWidth >= 1200 ? hero.getBoundingClientRect().left + 12 : 12;
    return Array.from({ length: actorCount() }, (_, index) => {
      const cursor = document.createElement('div');
      cursor.className = 'build-cursor';
      cursor.style.setProperty('--actor-color', cursorColor);
      const park = [index % 2 ? innerWidth - 28 : left,
        58 + Math.floor(index / 2) * Math.max(35, (workAreaBottom() - 130) / Math.max(1, Math.ceil(actorCount() / 2) - 1))];
      cursor.style.transform = `translate(${park[0]}px, ${park[1]}px)`;
      cursor.style.opacity = '0.2';
      cursor.innerHTML = '<svg viewBox="0 0 25 30" fill="currentColor" stroke="#020304" stroke-width="1.5"><path d="M2 2 21 18l-9 1-5 8z"/></svg><i class="build-click"></i>';
      scene.overlay.append(cursor);
      return { element: cursor, park, name: `w${String(index + 1).padStart(2, '0')}` };
    });
  }

  function moveWorker(scene, worker, destination, duration, opacity = 1, easing = 'cubic-bezier(0.65, 0, 0.35, 1)') {
    const transform = `translate(${destination[0]}px, ${destination[1]}px)`;
    return play(scene, worker.element, [
      { transform: worker.element.style.transform, opacity: worker.element.style.opacity },
      { transform, opacity }
    ], { duration, easing }, { transform, opacity: String(opacity) });
  }

  function workDuration(item) {
    if (item.mode === 'type') return Math.max(900, Math.min(4200, item.element.textContent.trim().length * 45));
    return item.mode === 'image' ? 1700 : item.mode === 'frame' ? 1100 : 650;
  }

  async function constructObject(scene, item, worker) {
    if (active !== scene) return false;
    // Re-measure each real object at its turn, after any preceding frame or image.
    const rect = item.element.getBoundingClientRect();
    const target = { item, rect };
    const clampX = x => Math.max(6, Math.min(x, innerWidth - 20));
    const fixedSidebar = innerWidth >= 1200 && item.element.closest('#header, #footer');
    const clampY = y => Math.max(12, Math.min(y, fixedSidebar ? innerHeight - 24 : workAreaBottom() - 10));
    const upper = [clampX(item.mode === 'type' ? rect.left + 8 : rect.right - 8), clampY(rect.top + 8)];
    const pickup = upper;
    logOperation(`target.measure --box ${Math.round(rect.width)}x${Math.round(rect.height)}`, 'complete', worker.name, false);
    caption.textContent = `${sectionNames[scene.section] || 'PORTFOLIO'} / ${scene.completed} OF ${scene.items.length}`;
    if (!await moveWorker(scene, worker, pickup, 420)) return false;
    const svg = worker.element.querySelector('svg');
    if (!await play(scene, svg, [{ transform: 'scale(1)' }, { transform: 'scale(0.78)' }],
      { duration: 130 }, { transform: 'scale(0.78)' })) return false;
    animate(scene, worker.element.querySelector('.build-click'), [
      { opacity: 0.7, transform: 'translate(-50%, -50%) scale(0.3)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(1.4)' }
    ], { duration: 450 });
    if (active !== scene) return false;
    logOperation(`pointer.press --at ${Math.round(upper[0])},${Math.round(upper[1])}`, 'complete', worker.name, false);
    item.element.classList.remove('build-pending');
    const clip = getComputedStyle(item.element).clipPath;
    const finalClip = clip === 'none' ? 'inset(0 0 0 0)' : clip;
    const duration = workDuration(item);
    const frame = selection(scene, target);
    const logLine = logOperation(objectCommand(item), 'running', worker.name);
    item.element.dataset.buildObject = 'creating';
    let caret;
    let objectFrames;
    let movement;
    let glyphCount = 0;
    let easing = 'linear';
    if (item.mode === 'type') {
      const glyphs = measureTyping(target);
      glyphCount = glyphs.length;
      objectFrames = [{ clipPath: 'polygon(0 0,0 0,0 0,0 0,0 0,0 0)', opacity: 1, offset: 0 }];
      glyphs.forEach((glyph, position) => {
        objectFrames.push({ opacity: 1, offset: (position + 1) / (glyphs.length + 1),
          clipPath: `polygon(0 0,100% 0,100% ${glyph.top}px,${glyph.x}px ${glyph.top}px,${glyph.x}px ${glyph.bottom}px,0 ${glyph.bottom}px)` });
      });
      objectFrames.push({ opacity: 1, clipPath: finalClip, offset: 1 });
      objectFrames = objectFrames.map(frame => ({ ...frame, easing: 'steps(1, end)' }));
      if (!glyphs.length) {
        objectFrames = [{ clipPath: collapsedClip(finalClip) }, { clipPath: finalClip }];
        movement = moveWorker(scene, worker, [upper[0], clampY(rect.bottom - 3)], duration, 1, 'linear');
      }
      if (glyphs.length) {
        caret = document.createElement('i');
        caret.className = 'build-caret';
        caret.style.height = `${Math.min(60, glyphs[0].height)}px`;
        scene.overlay.append(caret);
        const first = glyphs[0];
        const last = glyphs[glyphs.length - 1];
        const caretFrames = [{ offset: 0, opacity: 0.9, easing: 'steps(1, end)',
          transform: `translate(${rect.left + first.left}px, ${rect.top + first.bottom - Math.min(60, first.height)}px)`
        }, ...glyphs.map((glyph, position) => ({
          offset: (position + 1) / (glyphs.length + 1), opacity: 0.9,
          transform: `translate(${rect.left + glyph.x}px, ${rect.top + glyph.bottom - Math.min(60, glyph.height)}px)`,
          easing: 'steps(1, end)'
        })), { offset: 1, opacity: 0,
          transform: `translate(${rect.left + last.x}px, ${rect.top + last.bottom - Math.min(60, last.height)}px)` }];
        animate(scene, caret, caretFrames, { duration, easing });
      }
    } else if (item.mode === 'frame' || item.mode === 'detail') {
      objectFrames = [{ clipPath: collapsedClip(finalClip) }, { clipPath: finalClip }];
      animate(scene, frame, [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration, easing });
      movement = moveWorker(scene, worker, [upper[0], clampY(rect.bottom - 3)], duration, 1, 'linear');
    } else {
      // Render the image in small scan bands rather than showing the whole photograph at once.
      objectFrames = Array.from({ length: 13 }, (_, band) => ({
        offset: band / 12, opacity: 1, clipPath: `inset(0 0 ${100 - band / 12 * 100}% 0)`, easing: 'steps(1, end)'
      }));
      movement = moveWorker(scene, worker, [upper[0], clampY(rect.bottom - 3)], duration, 1, 'linear');
    }
    const created = await play(scene, item.element, objectFrames, { duration, easing });
    if (!created || active !== scene) return false;
    if (movement && !await movement) return false;
    caret?.remove();
    item.played = true;
    setLogStatus(logLine, 'complete');
    logOperation(item.mode === 'type' ? `text.commit --glyphs ${glyphCount}` : `layer.commit --kind ${item.mode}`, 'complete', worker.name, false);
    item.element.dataset.buildObject = 'complete';
    if (!await play(scene, svg, [{ transform: 'scale(0.78)' }, { transform: 'scale(1)' }],
      { duration: 150 }, { transform: 'scale(1)' })) return false;
    frame.remove();
    logOperation('pointer.release --committed', 'complete', worker.name, false);
    scene.completed += 1;
    caption.textContent = `${sectionNames[scene.section] || 'PORTFOLIO'} / ${scene.completed} OF ${scene.items.length}`;
    controls.querySelector('.build-progress span').style.transform = `scaleX(${scene.completed / scene.items.length})`;
    // The release and return make each completed object a separate, legible action.
    return moveWorker(scene, worker, worker.park, 300, 0.2);
  }

  async function constructScene(scene) {
    const workers = createWorkers(scene);
    const pending = [...scene.items];
    scene.resolveTasks = [];
    const wakeWorkers = () => scene.resolveTasks.splice(0).forEach(resolve => resolve(true));
    await Promise.all(workers.map(async worker => {
      while (active === scene) {
        // Free cursors take the next ready object instead of waiting behind a busy card.
        const ready = pending.findIndex(item => item.parents.every(parent => parent.played));
        if (ready < 0) {
          if (!pending.length) return;
          await new Promise(resolve => scene.resolveTasks.push(resolve));
          continue;
        }
        const [item] = pending.splice(ready, 1);
        const created = await constructObject(scene, item, worker);
        if (!created) {
          if (active === scene) throw new Error('Object construction was interrupted.');
          return;
        }
        wakeWorkers();
      }
    }));
    if (active !== scene) return;
    settle();
    schedule();
  }

  function haltScroll() {
    cancelAnimationFrame(scrollFrame);
    clearTimeout(advanceTimer);
    if (scrollLogLine) {
      setLogStatus(scrollLogLine, 'skipped');
      scrollLogLine = null;
    }
    autoScrolling = false;
    expectedScrollY = window.scrollY;
  }

  function pauseTour(silent = false) {
    const wasAutomatic = autoTour || autoScrolling;
    autoTour = false;
    haltScroll();
    restoreScrollHistory();
    controls.dataset.tour = 'manual';
    if (!active) caption.textContent = 'SCROLL TO BUILD';
    if (wasAutomatic && !silent) logOperation('tour.pause --manual-control', 'complete');
    schedule(180);
  }

  function restoreScrollHistory() {
    if (previousScrollRestoration !== null) {
      history.scrollRestoration = previousScrollRestoration;
      previousScrollRestoration = null;
    }
  }

  function scrollToNext(top) {
    const origin = window.scrollY;
    const destination = Math.min(top, document.documentElement.scrollHeight - innerHeight);
    const distance = destination - origin;
    if (distance < 2) {
      stopAll('complete');
      caption.textContent = 'BUILD COMPLETE';
      return;
    }
    autoScrolling = true;
    controls.dataset.tour = 'scrolling';
    caption.textContent = 'AUTO SCROLL / NEXT';
    scrollLogLine = logOperation(`view.scroll --to ${Math.round(destination)}px`, 'running');
    const started = performance.now();
    const travelTime = Math.min(1400, 750 + distance * 0.2);
    const tick = now => {
      if (!autoTour || !enabled) return;
      const progress = Math.min(1, (now - started) / travelTime);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      expectedScrollY = origin + distance * eased;
      window.scrollTo({ top: expectedScrollY, behavior: 'instant' });
      if (progress < 1) scrollFrame = requestAnimationFrame(tick);
      else scrollFrame = requestAnimationFrame(() => {
        if (!autoTour) return;
        if (scrollLogLine) {
          setLogStatus(scrollLogLine, 'complete');
          scrollLogLine = null;
        }
        autoScrolling = false;
        controls.dataset.tour = 'auto';
        schedule(100);
      });
    };
    scrollFrame = requestAnimationFrame(tick);
  }

  function advanceTour() {
    if (!autoTour || !enabled || autoScrolling || active || document.hidden) return;
    const below = items.filter(item => !item.played).map(item => item.element.getBoundingClientRect())
      .filter(rect => rect.width && rect.height && rect.right > 8 && rect.left < innerWidth - 8 && rect.top >= workAreaBottom());
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    if (!below.length) {
      if (window.scrollY < maximum - 2) scrollToNext(maximum);
      else {
        stopAll('complete');
        caption.textContent = 'BUILD COMPLETE';
      }
      return;
    }
    const nearest = Math.min(...below.map(rect => rect.top + window.scrollY));
    const next = Math.max(window.scrollY + workAreaBottom() * 0.72, nearest - workAreaBottom() * 0.16);
    scrollToNext(Math.min(maximum, next));
  }

  function buildVisible() {
    if (!enabled || active || autoScrolling || document.hidden || motionPreference.matches) return;
    try {
      // Batch geometry reads before changing any visibility or animation state.
      const visible = items.filter(item => !item.played).map(item => ({
        item, rect: item.element.getBoundingClientRect()
      })).filter(({ item, rect }) => rect.width && rect.height && rect.right > 8 &&
        rect.left < innerWidth - 8 && rect.bottom > 8 &&
        rect.top < (innerWidth >= 1200 && item.element.closest('#header, #footer') ? innerHeight - 8 : workAreaBottom()))
        .sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
      const selected = new Set();
      for (const candidate of visible) {
        const needed = [...candidate.item.parents, candidate.item].filter(item => !item.played && !selected.has(item));
        if (selected.size && selected.size + needed.length > 72) break;
        needed.forEach(item => selected.add(item));
      }
      const targets = [...selected].map(item => ({ item }));
      if (!targets.length) {
        updateSections();
        if (autoTour) advanceTimer = setTimeout(advanceTour, 180);
        return;
      }
      const counts = {};
      targets.forEach(({ item }) => { counts[item.section] = (counts[item.section] || 0) + 1; });
      const section = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const overlay = document.createElement('div');
      overlay.className = 'build-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const scene = { section, items: targets.map(target => target.item), overlay, animations: new Set(), completed: 0 };
      active = scene;
      const budget = scene.items.reduce((sum, item) => sum + workDuration(item) + 1100, 0);
      scene.fallback = setTimeout(() => { settle(); schedule(); }, budget + 5000);
      document.body.append(overlay);
      document.body.classList.add('build-scene-running');
      team.textContent = `${actorCount()} CURSORS`;
      controls.querySelector('.build-progress span').style.transform = 'scaleX(0)';
      announcement.textContent = `${actorCount()}個のカーソルが、それぞれのオブジェクトを並行して作成しています。`;
      logOperation(`view.mount ${sectionNames[section] || 'PORTFOLIO'}`, 'complete');
      constructScene(scene).catch(error => {
        if (active !== scene) return;
        stopAll('error');
        console.warn('Portfolio construction stopped; all content is available.', error);
      });
      updateSections();
    } catch (error) {
      stopAll('error');
      console.warn('Portfolio build animation stopped; all content is available.', error);
    }
  }

  function schedule(delay = 140) {
    clearTimeout(timer);
    if (enabled && !active && !autoScrolling) timer = setTimeout(buildVisible, delay);
  }

  function arm(tour = true) {
    if (motionPreference.matches) return;
    enabled = true;
    autoTour = tour;
    controls.dataset.tour = tour ? 'auto' : 'manual';
    skip.hidden = false;
    team.textContent = `${actorCount()} CURSORS`;
    terminalLog.textContent = '';
    logOperation(`portfolio.build --workers ${actorCount()}`, 'complete');
    items.forEach(item => {
      item.played = false;
      item.element.dataset.buildObject = 'queued';
      item.element.classList.add('build-target', 'build-pending');
    });
    observer?.disconnect();
    observer = new IntersectionObserver(() => schedule(), { rootMargin: '60px 0px', threshold: 0 });
    items.forEach(item => observer.observe(item.element));
    schedule(0);
  }

  skip.addEventListener('click', () => stopAll('skip'));
  replay.addEventListener('click', () => {
    if (motionPreference.matches) return;
    haltScroll();
    settle();
    clearTimeout(timer);
    expectedScrollY = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    arm(true);
  });
  window.addEventListener('scroll', () => {
    // Browser history can restore a scroll position while fonts are loading.
    if (!initialized) return;
    if (autoScrolling || (autoTour && expectedScrollY !== null && Math.abs(window.scrollY - expectedScrollY) < 2)) return;
    interacted = true;
    if (autoTour) pauseTour();
    settle();
    schedule(180);
  }, { passive: true });
  const pauseFromInput = () => {
    interacted = true;
    pauseTour();
  };
  window.addEventListener('wheel', pauseFromInput, { passive: true });
  window.addEventListener('touchstart', pauseFromInput, { passive: true });
  window.addEventListener('resize', () => {
    haltScroll();
    settle();
    window.PortfolioBuildDetails?.refresh();
    team.textContent = `${actorCount()} CURSORS`;
    schedule(180);
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    interacted = true;
    if (controls.contains(event.target)) return;
    pauseTour();
    settle(true);
    if (event.target.closest('.mobile-nav-toggle')) {
      items.filter(item => item.element.closest('#header')).forEach(item => {
        item.played = true;
        item.element.classList.remove('build-pending');
      });
    }
    schedule(220);
  }, { passive: true });
  document.addEventListener('keydown', event => {
    interacted = true;
    if (event.key === 'Escape' || event.key === 'Tab' || event.ctrlKey || event.metaKey) stopAll();
    else if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) pauseTour();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseTour();
      clearTimeout(timer);
      settle();
      showCommand(commandTarget, true);
    } else schedule();
  });
  window.addEventListener('pagehide', restoreScrollHistory);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) {
      stopAll();
      controls.hidden = true;
      document.body.classList.remove('build-terminal-visible');
    } else if (initialized) {
      controls.hidden = false;
      document.body.classList.add('build-terminal-visible');
      arm(false);
    } else initialize();
  });

  function initialize() {
    if (motionPreference.matches || initialized) return;
    initialized = true;
    document.body.append(controls);
    document.body.classList.add('build-terminal-visible');
    registerTargets();
    // Keyboard users and visitors already interacting keep the completed page.
    if (interacted) stopAll();
    else {
      const fromTop = !location.hash || location.hash === '#hero';
      if (fromTop) {
        expectedScrollY = 0;
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      arm(fromTop);
    }
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(initialize);
})();
