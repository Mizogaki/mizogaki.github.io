/* Plan actual drawing stages without changing the authored document. */
(() => {
  'use strict';

  const modes = ['type', 'image', 'frame', 'detail'];
  const edges = ['top', 'right', 'bottom', 'left'];

  function describe(item) {
    const mode = modes.includes(item.mode) ? item.mode : 'detail';
    const glyphs = mode === 'type'
      ? Array.from(item.element?.textContent || '').filter(character => /\S/u.test(character)).length
      : 0;
    const minimum = mode === 'frame' ? 5 : mode === 'image' ? 1 : mode === 'type' && !glyphs ? 0 : 1;
    const maximum = mode === 'frame' ? 5 : mode === 'image' ? 1 : mode === 'type' ? Math.min(12, glyphs) : 4;
    // Text capacity follows its actual copy; each image is placed as one asset.
    // Section identity is stable across layouts, including hidden targets.
    const emphasis = item.section === 'hero' || item.section === 'header' ? 1.15 : 1;
    const weight = (mode === 'type' ? 1 + Math.log2(Math.max(1, glyphs)) / 3
      : mode === 'image' ? 3 : 1) * emphasis;
    return { item, mode, glyphs, minimum, maximum, weight, count: minimum, credit: 0 };
  }

  function stages(record) {
    const { mode, count, glyphs } = record;
    if (mode === 'frame') {
      return [{ kind: 'surface', index: 0, total: count, start: 0, end: 1 },
        ...edges.map((edge, index) => ({ kind: 'edge', edge, index: index + 1,
          total: count, start: 0, end: 1 }))];
    }
    const kind = mode === 'type' ? 'text' : mode;
    return Array.from({ length: count }, (_, index) => ({
      kind, index, total: count,
      start: mode === 'type' ? Math.floor(index * glyphs / count) / glyphs : index / count,
      end: mode === 'type' ? Math.floor((index + 1) * glyphs / count) / glyphs : (index + 1) / count
    }));
  }

  // Mutates only item.steps. Counts are stage totals by mode; descriptor indices
  // are zero-based and text fractions address non-whitespace code points.
  function plan(items, goal = 1000) {
    const records = Array.from(items, describe);
    const minimum = records.reduce((sum, record) => sum + record.minimum, 0);
    const maximum = records.reduce((sum, record) => sum + record.maximum, 0);
    const requested = Number.isFinite(Number(goal)) ? Math.floor(Number(goal)) : 1000;
    const target = Math.max(minimum, Math.min(maximum, requested));
    let total = minimum;

    // Smooth weighted round-robin distributes extra stages deterministically.
    // Exhausted capacities leave the pool; neither geometry nor visibility is read.
    while (total < target) {
      let selected = null;
      let weight = 0;
      records.forEach(record => {
        if (record.count >= record.maximum) return;
        record.credit += record.weight;
        weight += record.weight;
        if (!selected || record.credit > selected.credit) selected = record;
      });
      if (!selected) break;
      selected.count += 1;
      selected.credit -= weight;
      total += 1;
    }

    const counts = { type: 0, image: 0, frame: 0, detail: 0 };
    records.forEach(record => {
      record.item.steps = stages(record);
      counts[record.mode] += record.count;
    });
    return { total, counts };
  }

  window.PortfolioBuildSteps = { plan };
})();
