// Timing patterns: each takes the list of filled cells (+ grid dims) and returns
// an array (aligned with the input) of activation fractions in [0,1] — deciding
// WHEN each cell takes its turn in the shared loop.

/** Linearly rescale values into [0,1]; a flat array collapses to all-zero. */
function norm(values) {
  if (values.length === 0) return [];
  let mn = Infinity;
  let mx = -Infinity;
  for (const v of values) {
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const span = mx - mn || 1;
  return values.map((v) => (v - mn) / span);
}

/**
 * Real spiral-matrix traversal. Returns order[row][col] = visit index,
 * walking clockwise from the top-left, inward.
 */
export function spiralOrder(rows, cols) {
  const order = Array.from({ length: rows }, () => new Array(cols).fill(0));
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;
  let idx = 0;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) order[top][c] = idx++;
    top++;
    for (let r = top; r <= bottom; r++) order[r][right] = idx++;
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) order[bottom][c] = idx++;
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) order[r][left] = idx++;
      left--;
    }
  }
  return order;
}

/** Seeded integer hash -> [0,1). Deterministic; never Math.random(). */
function hash2(x, y, seed = 0x9e3779b9) {
  let h = (2166136261 ^ Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ seed) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export const PATTERNS = {
  'sweep-left-right': (cells) => norm(cells.map((c) => c.x)),
  'sweep-right-left': (cells) => norm(cells.map((c) => -c.x)),
  'sweep-top-bottom': (cells) => norm(cells.map((c) => c.y)),
  'sweep-bottom-top': (cells) => norm(cells.map((c) => -c.y)),
  'diagonal-tl-br': (cells) => norm(cells.map((c) => c.x + c.y)),
  'diagonal-tr-bl': (cells, dims) => norm(cells.map((c) => (dims.weeks - 1 - c.x) + c.y)),
  'radial-center': (cells, dims) => {
    const cx = (dims.weeks - 1) / 2;
    const cy = (dims.days - 1) / 2;
    return norm(cells.map((c) => Math.hypot(c.x - cx, c.y - cy)));
  },
  'radial-corner': (cells) => norm(cells.map((c) => Math.hypot(c.x, c.y))),
  spiral: (cells, dims) => {
    const order = spiralOrder(dims.days, dims.weeks);
    return norm(cells.map((c) => order[c.y]?.[c.x] ?? 0));
  },
  scatter: (cells) => norm(cells.map((c) => hash2(c.x, c.y))),
};

export const PATTERN_NAMES = Object.keys(PATTERNS);

export const PATTERN_DESCRIPTIONS = {
  'sweep-left-right': 'Wave advances column by column from the oldest week to the newest.',
  'sweep-right-left': 'Wave advances from the newest week back toward the oldest.',
  'sweep-top-bottom': 'Wave advances row by row from Sunday down to Saturday.',
  'sweep-bottom-top': 'Wave advances row by row from Saturday up to Sunday.',
  'diagonal-tl-br': 'Wavefront runs on the anti-diagonal, top-left to bottom-right.',
  'diagonal-tr-bl': 'Wavefront runs on the diagonal, top-right to bottom-left.',
  'radial-center': 'Expanding ring outward from the middle of the grid.',
  'radial-corner': 'Expanding ring outward from the top-left corner.',
  spiral: 'Cells fire in true spiral-matrix-traversal order, edge inward.',
  scatter: 'Deterministic seeded-hash order — looks random, reproduces exactly.',
};
