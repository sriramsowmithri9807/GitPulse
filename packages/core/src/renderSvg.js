// Combine grid + pattern + effect + palette + optional text panel into one
// self-contained, script-free animated SVG string.

import { resolveAnimation } from './animationCatalog.js';
import { layoutText } from './textArt.js';

// grid geometry
const CELL = 11;
const GAP = 2;
const STRIDE = CELL + GAP; // 13
const RX = 2;
const MARGIN = 12;

// text panel geometry
const TXT = 9;
const TSTRIDE = 11;
const PANEL_GAP = STRIDE * 3; // blank gap between real grid and text panel

// timing
const STEP_S = 0.06; // per filled cell
const TAIL_S = 3; // settle time after the last cell fires
const ACTION_S = 1.0; // wall-clock length of one cell's effect

/** Round to 2dp and clamp to [0,100]. */
const pct = (p) => Math.min(100, Math.max(0, Math.round(p * 100) / 100));

/** Assemble one @keyframes block from [stop, decl] pairs (last write wins on a tie). */
function buildKeyframes(name, stops) {
  const byStop = new Map();
  for (const [p, decl] of stops) byStop.set(pct(p), decl);
  const keys = [...byStop.keys()].sort((a, b) => a - b);
  if (!byStop.has(0)) byStop.set(0, byStop.get(keys[0]));
  if (!byStop.has(100)) byStop.set(100, byStop.get(keys[keys.length - 1]));
  const body = [...byStop.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([p, d]) => `${p}%{${d}}`)
    .join('');
  return `@keyframes ${name}{${body}}`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * @param {object} args
 * @param {Array<Array<{count:number,date:string}>>} args.grid
 * @param {string} args.animation  form name, e.g. "spiral--pulse-glow"
 * @param {{levels:string[],empty:string,accent:string}} args.palette
 * @param {string} [args.text]
 * @returns {string} complete <svg> ... </svg>
 */
export function renderSvg({ grid, animation, palette, text }) {
  const weeks = grid.length;
  const days = grid.reduce((m, w) => Math.max(m, w.length), 0) || 7;
  const { pattern, effect, name } = resolveAnimation(animation);
  const { levels, empty, accent } = palette;

  // classify every cell into a GitHub-style tier (quartiles of the peak day)
  const peak = Math.max(1, ...grid.flat().map((d) => d.count));
  const tierOf = (count) => {
    if (count <= 0) return 0;
    const r = count / peak;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  };

  const staticRects = [];
  const filled = [];
  grid.forEach((week, x) => {
    week.forEach((d, y) => {
      const gx = MARGIN + x * STRIDE;
      const gy = MARGIN + y * STRIDE;
      if (d.count <= 0) {
        staticRects.push(`<rect x="${gx}" y="${gy}" width="${CELL}" height="${CELL}" rx="${RX}" fill="${empty}"/>`);
      } else {
        filled.push({ x, y, gx, gy, tier: tierOf(d.count) });
      }
    });
  });

  // one shared loop duration keeps the whole board in sync regardless of pattern
  const totalS = Math.max(4, Math.round((filled.length * STEP_S + TAIL_S) * 10) / 10);
  const win = Math.min(18, Math.max(3, Math.round((ACTION_S / totalS) * 10000) / 100));
  const maxTurn = 100 - win - 4;

  const activations = filled.length ? pattern(filled, { weeks, days }) : [];

  const kf = new Map(); // dedupe key -> { nm, css }
  let kfCount = 0;
  const cellRects = filled.map((c, i) => {
    const turn = pct(activations[i] * maxTurn);
    const target = levels[c.tier] || levels[levels.length - 1];
    const key = `${name}|${turn}`;
    let entry = kf.get(key);
    if (!entry) {
      const nm = `k${kfCount++}`;
      const stops = effect({ turn, win, target, empty, accent, levels });
      entry = { nm, css: buildKeyframes(nm, stops) };
      kf.set(key, entry);
    }
    return `<rect class="c" x="${c.gx}" y="${c.gy}" width="${CELL}" height="${CELL}" rx="${RX}" style="animation-name:${entry.nm}"/>`;
  });

  const gridW = weeks * STRIDE - GAP;
  const gridH = days * STRIDE - GAP;

  // ---- optional independent text panel (typewriter reveal, its own loop) ----
  let panelW = 0;
  let textDur = 0;
  let textKfCss = '';
  const panelRects = [];

  if (typeof text === 'string' && text.trim()) {
    const { pixels, width } = layoutText(text.trim());
    panelW = width * TSTRIDE - (TSTRIDE - TXT);
    const panelX = MARGIN + gridW + PANEL_GAP;
    const panelY = MARGIN + Math.max(0, (gridH - 5 * TSTRIDE) / 2);
    textDur = Math.max(4, Math.round(width * 3.5) / 10);

    const maxCol = Math.max(1, width - 1);
    const colKf = new Map();
    for (const px of pixels) {
      if (!colKf.has(px.x)) {
        const f = px.x / maxCol;
        const a = pct(f * 80);
        const b = pct(a + 1);
        colKf.set(px.x, `@keyframes tc${px.x}{0%,${a}%{opacity:0}${b}%{opacity:1}90%{opacity:1}100%{opacity:0}}`);
      }
      const tx = panelX + px.x * TSTRIDE;
      const ty = panelY + px.y * TSTRIDE;
      panelRects.push(`<rect class="t" x="${tx}" y="${ty}" width="${TXT}" height="${TXT}" rx="2" fill="${accent}" style="animation-name:tc${px.x}"/>`);
    }
    textKfCss = [...colKf.values()].join('');
  }

  const svgW = MARGIN * 2 + gridW + (panelW ? PANEL_GAP + panelW : 0);
  const svgH = MARGIN * 2 + gridH;

  const css = [
    `.c{transform-box:fill-box;transform-origin:center;animation-duration:${totalS}s;animation-iteration-count:infinite;animation-timing-function:ease-in-out;animation-fill-mode:both}`,
    `.t{transform-box:fill-box;transform-origin:center;animation-duration:${textDur || 6}s;animation-iteration-count:infinite;animation-timing-function:linear;animation-fill-mode:both}`,
    ...[...kf.values()].map((e) => e.css),
    textKfCss,
  ]
    .filter(Boolean)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" role="img" aria-label="Animated GitHub contribution graph — ${esc(name)}">
<style>
${css}
</style>
${staticRects.join('\n')}
${cellRects.join('\n')}
${panelRects.join('\n')}
</svg>
`;
}
