// The DOM walk itself needs a browser, but the grid assembly is pure — that's
// where the alignment bugs would live, so that's what we pin here.

import test from 'node:test';
import assert from 'node:assert/strict';

import { entriesToGrid } from '../src/contributions.js' /* re-exported below */;
import { entriesToGrid as fromScrape } from '../src/domScrape.js';

test('domScrape.entriesToGrid: Sunday-aligned, rectangular, column-major', () => {
  // 2024-01-01 is a Monday -> it must land in week 0, day 1, with day 0 padded.
  const entries = [
    { date: '2024-01-01', count: 5 },
    { date: '2024-01-02', count: 0 },
    { date: '2024-01-08', count: 12 },
  ];
  const grid = fromScrape(entries);

  assert.equal(grid.length, 2, 'spans two ISO weeks');
  assert.equal(grid[0].length, 7, 'weeks are always 7 days');
  assert.equal(grid[0][0].count, 0, 'the padded Sunday before Jan 1');
  assert.equal(grid[0][0].date, '2023-12-31');
  assert.equal(grid[0][1].count, 5, 'Monday Jan 1');
  assert.equal(grid[1][1].count, 12, 'Monday Jan 8');
});

test('domScrape.entriesToGrid: empty in -> empty out', () => {
  assert.deepEqual(fromScrape([]), []);
  assert.deepEqual(fromScrape([{ foo: 'bar' }]), []);
});

test('domScrape.entriesToGrid: dedupes and clamps negatives', () => {
  const grid = fromScrape([
    { date: '2024-06-02', count: 3 }, // Sunday
    { date: '2024-06-02', count: 9 }, // later write wins
    { date: '2024-06-03', count: -4 },
  ]);
  assert.equal(grid[0][0].count, 9);
  assert.equal(grid[0][1].count, 0);
});

// keep the alternate import path honest
test('contributions.js re-exports entriesToGrid', () => {
  assert.equal(typeof entriesToGrid, 'function');
});
