# @gitpulse/core

The framework-agnostic engine behind [GitPulse](../../README.md). Pure ES
modules, **zero runtime dependencies**, runs unchanged in Node and the browser.

```js
import {
  buildAnimatedSvg,     // grid + form + palette + text -> <svg> string
  getPalette,           // { theme } | { colors } -> palette
  listAnimations,       // all 100 form names
  scrapeContributionGrid, // DOM element -> grid[week][day]   (browser)
  fetchContributions,   // (login, token) -> grid[week][day]  (Node, GraphQL)
  generateMockGrid,     // deterministic sample data
  normalizeConfig,      // the config contract shared by every package
} from '@gitpulse/core';

const grid = generateMockGrid();
const svg = buildAnimatedSvg({
  grid,
  animation: 'spiral--pulse-glow',
  palette: getPalette({ theme: 'green' }),
  text: 'HELLO',
});
```

## Modules

| File | Responsibility |
| --- | --- |
| `patterns.js` | 10 timing functions → activation fraction `[0,1]` per filled cell (WHEN) |
| `effects.js` | 10 appearance functions → a `@keyframes` timeline (HOW) |
| `animationCatalog.js` | patterns × effects → 100 names + `resolveAnimation` with safe fallback |
| `themes.js` | named palettes + `parseCustomPalette` / `getPalette` |
| `textArt.js` | 3×5 dot-matrix font + `layoutText` |
| `renderSvg.js` | assembles one self-contained, script-free SVG string |
| `domScrape.js` | reads GitHub's rendered calendar (`[data-date]` cells) into a grid |
| `contributions.js` | GraphQL `contributionCalendar` fetch + `generateMockGrid` |
| `cli.js` | local preview / test-fixture CLI — not a shipping surface |

## Scripts

```bash
npm test              # node --test
npm run preview       # mock data -> preview.svg
npm run list-animations
npm run catalog       # regenerate ../../ANIMATIONS.md from the code
```
