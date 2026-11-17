// Promise wrapper around chrome.storage.sync, plus the single source of truth
// for the config key and its default. Everything the extension persists lives
// under one key so a dashboard push / options reset is one atomic write.

import { normalizeConfig, DEFAULT_ANIMATION } from '@gitpulse/core';

export const CONFIG_KEY = 'gitpulse:config';
export const META_KEY = 'gitpulse:meta';

export async function getConfig() {
  const bag = await chrome.storage.sync.get([CONFIG_KEY]);
  return normalizeConfig(bag[CONFIG_KEY] || DEFAULT_ANIMATION);
}

export async function setConfig(patch, source = 'local') {
  const current = await getConfig();
  const next = normalizeConfig({ ...current, ...patch });
  await chrome.storage.sync.set({
    [CONFIG_KEY]: next,
    [META_KEY]: { updatedAt: Date.now(), source },
  });
  return next;
}

export async function getMeta() {
  const bag = await chrome.storage.sync.get([META_KEY]);
  return bag[META_KEY] || { updatedAt: 0, source: 'default' };
}

/** Subscribe to config changes; returns an unsubscribe fn. */
export function onConfigChange(fn) {
  const handler = (changes, area) => {
    if (area === 'sync' && changes[CONFIG_KEY]) {
      fn(normalizeConfig(changes[CONFIG_KEY].newValue || DEFAULT_ANIMATION));
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
