// Read a GitHub contribution calendar straight out of the rendered page DOM and
// normalize it into the same grid[week][day] = { count, date } shape the
// renderer already consumes. This is what lets the browser extension animate the
// *live* streak graph with no API round-trip.
//
// GitHub has shipped several markups for this widget over the years; the walker
// below only relies on the stable bits:
//   - every day cell carries `data-date="YYYY-MM-DD"`
//   - the count is on `data-count` OR in an associated <tool-tip> ("12
//     contributions on ...") OR, as a last resort, inferred from `data-level`
//     (0..4) via a nominal ramp.

const LEVEL_TO_NOMINAL = [0, 1, 3, 6, 10];

/** Pull `{ date, count }` for every day cell found under `root`. */
export function parseCalendarEntries(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];

  const cells = root.querySelectorAll('[data-date]');
  const ownerDoc = root.ownerDocument || (typeof document !== 'undefined' ? document : null);
  const entries = [];

  for (const cell of cells) {
    const date = cell.getAttribute('data-date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    let count = null;

    const rawCount = cell.getAttribute('data-count');
    if (rawCount != null && rawCount !== '') count = Number(rawCount);

    if (count == null) {
      const id = cell.id;
      const tip =
        (id && ownerDoc && ownerDoc.querySelector(`tool-tip[for="${CSS && CSS.escape ? CSS.escape(id) : id}"]`)) ||
        cell.querySelector?.('tool-tip') ||
        null;
      const text = tip?.textContent || cell.getAttribute('aria-label') || '';
      const m = text.match(/(\d+)\s+contribution/i);
      if (m) count = Number(m[1]);
      else if (/no contribution/i.test(text)) count = 0;
    }

    if (count == null) {
      const lvl = Number(cell.getAttribute('data-level'));
      count = Number.isFinite(lvl) ? LEVEL_TO_NOMINAL[Math.max(0, Math.min(4, lvl))] : 0;
    }

    entries.push({ date, count: Number.isFinite(count) ? count : 0 });
  }

  return entries;
}

/** UTC weekday, 0 = Sunday .. 6 = Saturday. */
function weekday(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/**
 * Pure: turn a flat `{ date, count }[]` into `grid[week][day]`, column-major and
 * Sunday-aligned exactly like GitHub's own layout. Missing days are filled with
 * `{ count: 0 }` so the grid is always rectangular.
 *
 * @param {Array<{date:string,count:number}>} entries
 * @returns {Array<Array<{count:number,date:string}>>}
 */
export function entriesToGrid(entries) {
  const seen = new Map();
  for (const e of entries) {
    if (!e || !e.date) continue;
    seen.set(e.date, Math.max(0, Number(e.count) || 0));
  }
  if (seen.size === 0) return [];

  const dates = [...seen.keys()].sort();
  const first = dates[0];
  const last = dates[dates.length - 1];

  // back up to the Sunday of the first week
  const startMs = Date.parse(`${first}T00:00:00Z`) - weekday(first) * 86400000;
  const endMs = Date.parse(`${last}T00:00:00Z`);
  const weeks = Math.floor((endMs - startMs) / (7 * 86400000)) + 1;

  const grid = [];
  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const ms = startMs + (w * 7 + d) * 86400000;
      const iso = new Date(ms).toISOString().slice(0, 10);
      week.push({ count: seen.get(iso) ?? 0, date: iso });
    }
    grid.push(week);
  }
  return grid;
}

/**
 * One call for the extension: hand it the contribution-graph container (or any
 * ancestor of it) and get back a renderer-ready grid, or `null` if the page
 * has no recognizable calendar.
 */
export function scrapeContributionGrid(root) {
  const grid = entriesToGrid(parseCalendarEntries(root));
  return grid.length ? grid : null;
}
