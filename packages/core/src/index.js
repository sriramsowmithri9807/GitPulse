// @gitpulse/core — the framework-agnostic animation engine.
//
// Everything below is pure and dependency-free: it runs unchanged in Node (the
// dev CLI, the site's serverless functions) and in the browser (the extension
// content script, the site's live preview). Nothing here touches the network
// except `fetchContributions`, and nothing here touches `document` except
// `scrapeContributionGrid` / `parseCalendarEntries`.

export { PATTERNS, PATTERN_NAMES, PATTERN_DESCRIPTIONS, spiralOrder } from './patterns.js';
export { EFFECTS, EFFECT_NAMES, EFFECT_DESCRIPTIONS } from './effects.js';
export { CATALOG, FALLBACK, resolveAnimation, listAnimations } from './animationCatalog.js';
export { THEMES, THEME_NAMES, parseCustomPalette, getPalette } from './themes.js';
export { FONT, GLYPH_W, GLYPH_H, layoutText } from './textArt.js';

// `renderSvg` is the historical name; `buildAnimatedSvg` is the name the
// extension and site use. Same function.
export { renderSvg, renderSvg as buildAnimatedSvg } from './renderSvg.js';

export { fetchContributions, generateMockGrid } from './contributions.js';
export { scrapeContributionGrid, parseCalendarEntries, entriesToGrid } from './domScrape.js';

// A resolved animation config as passed around by the extension and stored by
// the site. Kept here so every package agrees on the shape.
export const DEFAULT_ANIMATION = {
  enabled: true,
  animation: 'spiral--pulse-glow',
  theme: 'green',
  colors: '', // comma-separated hex; overrides `theme` when set
  text: '',
};

/**
 * Normalize an arbitrary partial config object into a complete, safe one.
 * @param {Partial<typeof DEFAULT_ANIMATION>} [cfg]
 */
export function normalizeConfig(cfg = {}) {
  return {
    enabled: cfg.enabled !== false,
    animation: typeof cfg.animation === 'string' && cfg.animation ? cfg.animation : DEFAULT_ANIMATION.animation,
    theme: typeof cfg.theme === 'string' && cfg.theme ? cfg.theme : DEFAULT_ANIMATION.theme,
    colors: typeof cfg.colors === 'string' ? cfg.colors : '',
    text: typeof cfg.text === 'string' ? cfg.text.slice(0, 32) : '',
  };
}
