import { normalizeConfig } from '@gitpulse/core';
import { mountControls } from '../ui/controls.js';
import { setConfig } from '../lib/storage.js';

const DASHBOARD_URL = 'https://gitpulse-dashboard.vercel.app';

mountControls(document.getElementById('app'), { advanced: true });

// Extension id — the dashboard needs this to push config via
// chrome.runtime.sendMessage(id, ...).
const idEl = document.getElementById('ext-id');
idEl.textContent = chrome.runtime.id;
document.getElementById('copy-id').addEventListener('click', async () => {
  await navigator.clipboard.writeText(chrome.runtime.id);
  document.getElementById('copy-id').textContent = 'Copied';
  setTimeout(() => (document.getElementById('copy-id').textContent = 'Copy'), 1200);
});

document.getElementById('dash-link').href = DASHBOARD_URL;

// Paste a share code produced by the dashboard ("Export → copy code").
document.getElementById('import-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = document.getElementById('import-code').value.trim();
  const status = document.getElementById('import-status');
  try {
    const json = JSON.parse(atob(raw));
    await setConfig(normalizeConfig(json), 'import-code');
    status.textContent = 'Imported.';
    status.className = 'ok';
  } catch (err) {
    status.textContent = `Could not read that code: ${err.message}`;
    status.className = 'err';
  }
});

document.getElementById('reset').addEventListener('click', async () => {
  await setConfig(normalizeConfig({}), 'reset');
});
