// Content script: on a github.com profile, read the live contribution calendar
// out of the DOM and swap it for the animated version. This is the whole point
// of GitPulse — the animation runs *on the real streak graph*, in place, not in
// a README and not on a separate page.

import { scrapeContributionGrid } from '@gitpulse/core';
import { getConfig, onConfigChange } from '../lib/storage.js';
import { svgFromConfig } from '../lib/render.js';

const WRAP_CLASS = 'gitpulse-wrap';
const HIDE_CLASS = 'gitpulse-hidden-native';

let currentConfig = null;
let rafPending = false;

/** The container GitHub renders the year graph into, across its markup versions. */
function findCalendar() {
  return (
    document.querySelector('.js-calendar-graph') ||
    document.querySelector('.ContributionCalendar') ||
    document.querySelector('table.ContributionCalendar-grid')?.closest('div') ||
    document.querySelector('svg.js-calendar-graph-svg')?.closest('div') ||
    null
  );
}

function isProfilePage() {
  // /<user> or /<user>?tab=... — one non-empty path segment, no reserved words
  const seg = location.pathname.split('/').filter(Boolean);
  if (seg.length !== 1) return false;
  return !['orgs', 'sponsors', 'settings', 'notifications', 'marketplace', 'explore', 'topics', 'trending'].includes(
    seg[0].toLowerCase(),
  );
}

function removeOurRender(root) {
  root.querySelectorAll(`.${WRAP_CLASS}`).forEach((n) => n.remove());
  root.querySelectorAll(`.${HIDE_CLASS}`).forEach((n) => n.classList.remove(HIDE_CLASS));
}

function apply() {
  if (!currentConfig) return;
  const cal = findCalendar();
  if (!cal) return;

  const host = cal.parentElement || cal;
  removeOurRender(host);

  if (!currentConfig.enabled) return;
  if (host.querySelector(`.${WRAP_CLASS}`)) return;

  const grid = scrapeContributionGrid(cal);
  if (!grid) return;

  let svg;
  try {
    svg = svgFromConfig(currentConfig, grid);
  } catch (err) {
    console.warn('[GitPulse] render failed, leaving the native graph alone:', err);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = WRAP_CLASS;
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Contribution graph, animated by GitPulse');
  wrap.innerHTML = svg;

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.className = 'gitpulse-badge';
  badge.textContent = '⚡ GitPulse';
  badge.title = 'Show the original graph';
  badge.addEventListener('click', () => {
    removeOurRender(host);
    cal.classList.remove(HIDE_CLASS);
  });
  wrap.appendChild(badge);

  cal.classList.add(HIDE_CLASS);
  cal.insertAdjacentElement('afterend', wrap);
}

function scheduleApply() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    if (isProfilePage()) apply();
  });
}

async function boot() {
  currentConfig = await getConfig();

  onConfigChange((next) => {
    currentConfig = next;
    const host = findCalendar()?.parentElement;
    if (host) removeOurRender(host);
    scheduleApply();
  });

  // GitHub navigates with Turbo — the graph re-renders without a full reload.
  document.addEventListener('turbo:load', scheduleApply);
  document.addEventListener('pjax:end', scheduleApply);
  window.addEventListener('pageshow', scheduleApply);

  // and catch in-place DOM swaps that fire no navigation event
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node.nodeType === 1 && (node.matches?.('[class*="ContributionCalendar"], .js-calendar-graph') ||
            node.querySelector?.('[class*="ContributionCalendar"], .js-calendar-graph'))) {
          scheduleApply();
          return;
        }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  scheduleApply();
}

boot();
