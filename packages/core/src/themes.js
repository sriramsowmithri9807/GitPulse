// Named palettes + a parser for a fully custom comma-separated hex palette.
//
// Palette shape: { levels: [l0,l1,l2,l3,l4], empty, accent }
//   levels[0] = no contributions, levels[1..4] = GitHub's four intensity tiers
//   empty     = color for a zero-count cell
//   accent    = bright highlight used by effects that need one

export const THEMES = {
  green: { levels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'], empty: '#ebedf0', accent: '#dcffb8' },
  blue: { levels: ['#eef2f7', '#b6d8f2', '#5fa8e0', '#3178c6', '#1c4c8c'], empty: '#eef2f7', accent: '#d6f0ff' },
  purple: { levels: ['#f2eefb', '#d8c7f0', '#b184e0', '#8a4fcf', '#5b2a9d'], empty: '#f2eefb', accent: '#efdcff' },
  red: { levels: ['#fbeeee', '#f3c0c0', '#e57373', '#d23b3b', '#8c1c1c'], empty: '#fbeeee', accent: '#ffd9d9' },
  sunset: { levels: ['#fdeee2', '#ffd7a8', '#ffb066', '#f6792e', '#c9451a'], empty: '#fdeee2', accent: '#ffe6c2' },
  mono: { levels: ['#ededed', '#c6c6c6', '#9a9a9a', '#5f5f5f', '#1f1f1f'], empty: '#ededed', accent: '#ffffff' },
};

export const THEME_NAMES = Object.keys(THEMES);

const HEX = /^#?[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/;

/**
 * Parse "hex,hex,hex,hex,hex[,empty[,accent]]" — 5 required level colors, plus
 * an optional empty and accent color.
 */
export function parseCustomPalette(str) {
  const parts = String(str)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length < 5) {
    throw new Error(`--colors needs at least 5 hex colors (got ${parts.length}): "${str}"`);
  }
  const bad = parts.find((p) => !HEX.test(p));
  if (bad) throw new Error(`--colors contains an invalid hex value: "${bad}"`);

  const withHash = parts.map((p) => (p.startsWith('#') ? p : `#${p}`));
  const levels = withHash.slice(0, 5);
  return {
    levels,
    empty: withHash[5] || levels[0],
    accent: withHash[6] || levels[4],
  };
}

/**
 * Resolve theme/colors CLI inputs into a concrete palette. A custom --colors
 * string wins over any named --theme.
 */
export function getPalette({ theme, colors } = {}) {
  if (typeof colors === 'string' && colors.trim()) {
    return parseCustomPalette(colors);
  }
  if (typeof theme === 'string' && theme.trim()) {
    const found = THEMES[theme.toLowerCase()];
    if (found) return found;
    console.warn(`[warn] Unknown theme "${theme}". Using "green". Valid: ${THEME_NAMES.join(', ')}.`);
  }
  return THEMES.green;
}
