import { EXTENSION_ID } from './config.js';
import { hydrateFromRedirect, signIn, signOut, getSession } from './auth.js';
import { fetchGrid, loadConfig, saveConfig } from './api.js';
import { createEditor } from './editor.js';

const els = {
  authSlot: document.getElementById('auth-slot'),
  editor: document.getElementById('editor'),
  signedOut: document.getElementById('signed-out'),
  controls: document.getElementById('controls'),
  preview: document.getElementById('preview'),
  pushStatus: document.getElementById('push-status'),
};

let session = hydrateFromRedirect();
let saveTimer = 0;

const editor = createEditor(els.controls, els.preview, {
  onChange: (config) => {
    if (!session) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveConfig(session, config).catch((e) => console.warn('save failed', e));
    }, 400);
  },
});

function renderAuth() {
  if (session) {
    els.authSlot.innerHTML = `
      <span class="who">
        ${session.avatar ? `<img src="${session.avatar}" alt="" width="20" height="20" />` : ''}
        ${session.login}
      </span>
      <button id="sign-out" class="linkish">Sign out</button>`;
    document.getElementById('sign-out').addEventListener('click', signOut);
  } else {
    els.authSlot.innerHTML = '';
  }
}

function showEditor(show) {
  els.editor.hidden = !show;
  els.signedOut.hidden = show;
}

async function boot() {
  renderAuth();
  showEditor(!!session || sessionStorage.getItem('gitpulse:anon') === '1');

  document.getElementById('sign-in')?.addEventListener('click', signIn);
  document.getElementById('try-anon')?.addEventListener('click', () => {
    sessionStorage.setItem('gitpulse:anon', '1');
    showEditor(true);
  });

  document.getElementById('export-code').addEventListener('click', async () => {
    const code = btoa(JSON.stringify(editor.config));
    await navigator.clipboard.writeText(code);
    flash('Share code copied — paste it into the extension’s Options.');
  });

  document.getElementById('push-ext').addEventListener('click', pushToExtension);

  if (session) {
    try {
      const [grid, saved] = await Promise.all([
        fetchGrid(session).catch(() => null),
        loadConfig(session).catch(() => null),
      ]);
      if (saved) editor.setConfig(saved);
      if (grid) editor.setGrid(grid);
    } catch (e) {
      console.warn(e);
    }
  }
}

function flash(msg, isError = false) {
  els.pushStatus.textContent = msg;
  els.pushStatus.className = isError ? 'err' : 'ok';
  setTimeout(() => (els.pushStatus.textContent = ''), 4000);
}

function pushToExtension() {
  const ext = typeof chrome !== 'undefined' ? chrome : undefined;
  if (!ext?.runtime?.sendMessage) {
    flash('Open this page in Chrome/Edge with the GitPulse extension installed.', true);
    return;
  }
  const id = EXTENSION_ID || prompt('Paste your GitPulse extension id (Options page shows it):') || '';
  if (!id) return;
  ext.runtime.sendMessage(id, { type: 'GITPULSE_SET_CONFIG', config: editor.config }, (resp) => {
    if (ext.runtime.lastError || !resp?.ok) {
      flash(`Push failed: ${ext.runtime.lastError?.message || resp?.error || 'unknown'}`, true);
    } else {
      flash('Pushed. Reload your GitHub profile to see it.');
    }
  });
}

boot();
