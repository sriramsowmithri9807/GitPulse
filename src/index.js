#!/usr/bin/env node
// CLI entry point.
//
//   node src/index.js <user> <outPath> [flags]
//   node src/index.js --list-animations
//
// flags:
//   --animation=NAME     form name, e.g. spiral--pulse-glow (default sweep-left-right--reveal)
//   --theme=NAME         green | blue | purple | red | sunset | mono
//   --colors=HEX,...     5 level colors [+ empty [+ accent]] — overrides --theme
//   --text=STRING        append an animated pixel-art text panel
//   --token=TOKEN        GitHub token (else env GITHUB_TOKEN / GH_TOKEN)
//   --mock               use deterministic mock data, no network

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fetchContributions, generateMockGrid } from './fetchContributions.js';
import { renderSvg } from './renderSvg.js';
import { getPalette } from './themes.js';
import { listAnimations, CATALOG } from './animationCatalog.js';

function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  for (const a of argv) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq === -1) flags[a.slice(2)] = true;
      else flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      positionals.push(a);
    }
  }
  return { positionals, flags };
}

const { positionals, flags } = parseArgs(process.argv.slice(2));

if (flags['list-animations']) {
  for (const n of listAnimations()) console.log(n);
  console.log(`\n${CATALOG.length} animation forms.`);
  process.exit(0);
}

const user = positionals[0] || (typeof flags.user === 'string' ? flags.user : '') || 'octocat';
const outPath = positionals[1] || (typeof flags.out === 'string' ? flags.out : '') || 'contribution.svg';
const useMock = flags.mock === true;
const token =
  (typeof flags.token === 'string' ? flags.token : '') ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  '';

const animation = typeof flags.animation === 'string' ? flags.animation : 'sweep-left-right--reveal';
const text = typeof flags.text === 'string' ? flags.text : '';
const palette = getPalette({
  theme: typeof flags.theme === 'string' ? flags.theme : undefined,
  colors: typeof flags.colors === 'string' ? flags.colors : undefined,
});

let grid;
if (useMock) {
  grid = generateMockGrid();
  console.log('[info] using deterministic mock data (--mock)');
} else {
  try {
    grid = await fetchContributions(user, token);
    console.log(`[info] fetched ${grid.length} weeks for "${user}"`);
  } catch (err) {
    console.error(`[error] ${err.message}`);
    console.error('[info] falling back to mock data so a file is still produced');
    grid = generateMockGrid();
  }
}

const svg = renderSvg({ grid, animation, palette, text });

const dir = dirname(outPath);
if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
writeFileSync(outPath, svg);

const themeLabel = typeof flags.colors === 'string' && flags.colors.trim()
  ? 'custom'
  : (typeof flags.theme === 'string' && flags.theme) || 'green';

console.log(
  `Wrote ${outPath} (${(svg.length / 1024).toFixed(1)} KB) — animation="${animation}", theme="${themeLabel}", text="${text || '(none)'}"`,
);
