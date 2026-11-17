// Renders every catalog form once against mock data and asserts none throw or
// produce malformed / script-bearing output.

import test from 'node:test';
import assert from 'node:assert/strict';

import { CATALOG, resolveAnimation, FALLBACK } from '../src/animationCatalog.js';
import { PATTERN_NAMES } from '../src/patterns.js';
import { EFFECT_NAMES } from '../src/effects.js';
import { renderSvg } from '../src/renderSvg.js';
import { generateMockGrid } from '../src/contributions.js';
import { getPalette, parseCustomPalette, THEMES } from '../src/themes.js';
import { layoutText } from '../src/textArt.js';

const grid = generateMockGrid({ weeks: 24, seed: 7 });
const palette = getPalette({ theme: 'green' });

test('catalog is exactly patterns × effects, all unique', () => {
  assert.equal(CATALOG.length, PATTERN_NAMES.length * EFFECT_NAMES.length);
  assert.equal(CATALOG.length, 100);
  assert.equal(new Set(CATALOG).size, CATALOG.length);
});

test('every form renders a valid, script-free SVG against mock data', () => {
  for (const name of CATALOG) {
    let svg;
    assert.doesNotThrow(() => {
      svg = renderSvg({ grid, animation: name, palette, text: 'AB 12' });
    }, `${name} threw`);
    assert.ok(svg.startsWith('<svg'), `${name}: missing <svg`);
    assert.ok(svg.trimEnd().endsWith('</svg>'), `${name}: missing </svg>`);
    assert.ok(!/<script/i.test(svg), `${name}: contains <script`);
    assert.ok(!/\bon\w+=/i.test(svg), `${name}: contains an inline event handler`);
    assert.ok(svg.includes('@keyframes'), `${name}: no @keyframes`);
    assert.ok(svg.includes('animation-name:'), `${name}: nothing animated`);
    assert.ok(svg.length > 800, `${name}: suspiciously short`);
  }
});

test('unrecognized animation name falls back with a warning', () => {
  const warnings = [];
  const orig = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    const r = resolveAnimation('totally-not-real--nope');
    assert.equal(r.name, FALLBACK);
    assert.ok(typeof r.pattern === 'function' && typeof r.effect === 'function');
  } finally {
    console.warn = orig;
  }
  assert.ok(warnings.some((w) => /Unknown animation/.test(w)));
});

test('an unknown form still renders (graceful, no crash)', () => {
  const svg = renderSvg({ grid, animation: 'bogus--bogus', palette, text: '' });
  assert.ok(svg.startsWith('<svg'));
});

test('themes visibly differ and custom colors override', () => {
  const a = renderSvg({ grid, animation: CATALOG[0], palette: getPalette({ theme: 'green' }), text: '' });
  const b = renderSvg({ grid, animation: CATALOG[0], palette: getPalette({ theme: 'purple' }), text: '' });
  assert.notEqual(a, b);
  assert.ok(a.includes(THEMES.green.levels[2]));
  assert.ok(b.includes(THEMES.purple.levels[2]));

  const custom = parseCustomPalette('#010101,#020202,#030303,#040404,#050505');
  assert.equal(custom.levels.length, 5);
  assert.equal(custom.empty, '#010101');
  assert.equal(custom.accent, '#050505');
  const c = renderSvg({ grid, animation: CATALOG[0], palette: custom, text: '' });
  assert.ok(c.includes('#030303'));
  assert.ok(!c.includes(THEMES.green.levels[2]));
});

test('parseCustomPalette rejects bad input', () => {
  assert.throws(() => parseCustomPalette('#111,#222,#333'));
  assert.throws(() => parseCustomPalette('#111,#222,#333,#444,notahex'));
});

test('text panel produces pixels, width, and its own keyframes', () => {
  const { pixels, width } = layoutText('HI 9');
  assert.ok(width > 0);
  assert.ok(pixels.length > 0);
  const svg = renderSvg({ grid, animation: CATALOG[0], palette, text: 'HI 9' });
  assert.ok(svg.includes('@keyframes tc0'));
  assert.ok(svg.includes('class="t"'));
});

test('no --text means no text-panel keyframes', () => {
  const svg = renderSvg({ grid, animation: CATALOG[0], palette, text: '' });
  assert.ok(!svg.includes('@keyframes tc'));
  assert.ok(!svg.includes('class="t"'));
});
