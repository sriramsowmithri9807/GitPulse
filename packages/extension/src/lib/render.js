// Shared helper: config -> animated SVG string. Used by the content script
// (real grid) and by the popup/options live preview (mock grid).

import { buildAnimatedSvg, getPalette, generateMockGrid } from '@gitpulse/core';

export function svgFromConfig(config, grid) {
  const source = grid && grid.length ? grid : generateMockGrid({ weeks: 30, seed: 7 });
  return buildAnimatedSvg({
    grid: source,
    animation: config.animation,
    palette: getPalette({ theme: config.theme, colors: config.colors }),
    text: config.text || '',
  });
}
