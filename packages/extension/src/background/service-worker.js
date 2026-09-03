// MV3 service worker. Two jobs:
//   1. seed a default config on install
//   2. accept a config push from the hosted dashboard (externally_connectable)
//      and persist it — this is the "edit on the source site" half of GitPulse.
//
// Everything else (popup, options, content script) talks to chrome.storage.sync
// directly; the worker does not need to broker those.

import { normalizeConfig, listAnimations, THEME_NAMES } from '@gitpulse/core';
import { CONFIG_KEY, META_KEY, getConfig, setConfig } from '../lib/storage.js';

chrome.runtime.onInstalled.addListener(async () => {
  const bag = await chrome.storage.sync.get([CONFIG_KEY]);
  if (!bag[CONFIG_KEY]) {
    await chrome.storage.sync.set({
      [CONFIG_KEY]: normalizeConfig({}),
      [META_KEY]: { updatedAt: Date.now(), source: 'default' },
    });
  }
});

function validConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (cfg.animation && !listAnimations().includes(cfg.animation)) return false;
  if (cfg.theme && !THEME_NAMES.includes(cfg.theme)) return false;
  return true;
}

// Messages from the dashboard site (origin allow-listed in manifest).
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (!msg || msg.type !== 'GITPULSE_SET_CONFIG') {
      sendResponse({ ok: false, error: 'unknown message' });
      return;
    }
    if (!validConfig(msg.config)) {
      sendResponse({ ok: false, error: 'invalid config' });
      return;
    }
    const next = await setConfig(msg.config, `dashboard:${sender.origin || 'unknown'}`);
    sendResponse({ ok: true, config: next });
  })();
  return true; // async response
});

// Internal messages (options page "pull latest", diagnostics).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'GITPULSE_GET_CONFIG') {
      sendResponse({ ok: true, config: await getConfig() });
    } else {
      sendResponse({ ok: false, error: 'unknown message' });
    }
  })();
  return true;
});
