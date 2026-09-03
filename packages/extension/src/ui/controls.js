// Shared config UI for the popup and the options page. Renders the controls,
// keeps a live mock preview in sync, and persists every change to
// chrome.storage.sync via lib/storage.

import { listAnimations, THEME_NAMES } from '@gitpulse/core';
import { getConfig, setConfig, getMeta, onConfigChange } from '../lib/storage.js';
import { svgFromConfig } from '../lib/render.js';

const RESERVED = new Set(['colors']); // advanced-only fields, hidden in the popup

export async function mountControls(root, { advanced = false } = {}) {
  const cfg = await getConfig();

  root.innerHTML = `
    <form class="gp-form">
      <label class="gp-row gp-toggle">
        <input type="checkbox" name="enabled">
        <span>Animate my contribution graph</span>
      </label>

      <label class="gp-row">
        <span>Animation</span>
        <select name="animation">
          ${listAnimations().map((n) => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </label>

      <label class="gp-row">
        <span>Theme</span>
        <select name="theme">
          ${THEME_NAMES.map((n) => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </label>

      ${
        advanced
          ? `<label class="gp-row">
               <span>Custom colors</span>
               <input type="text" name="colors" placeholder="#ebedf0,#9be9a8,#40c463,#30a14e,#216e39" spellcheck="false">
             </label>
             <p class="gp-hint">5+ comma-separated hex values. Overrides the theme when set.</p>`
          : ''
      }

      <label class="gp-row">
        <span>Text panel</span>
        <input type="text" name="text" maxlength="32" placeholder="(optional)" spellcheck="false">
      </label>
    </form>

    <div class="gp-preview" aria-label="Preview (sample data)"></div>
    <p class="gp-meta"></p>
  `;

  const form = root.querySelector('.gp-form');
  const preview = root.querySelector('.gp-preview');
  const meta = root.querySelector('.gp-meta');

  function fill(values) {
    form.enabled.checked = values.enabled;
    form.animation.value = values.animation;
    form.theme.value = values.theme;
    if (form.colors) form.colors.value = values.colors || '';
    form.text.value = values.text || '';
  }

  function readForm() {
    const out = {
      enabled: form.enabled.checked,
      animation: form.animation.value,
      theme: form.theme.value,
      text: form.text.value,
    };
    if (form.colors && !RESERVED.has('__none__')) out.colors = form.colors.value.trim();
    return out;
  }

  function renderPreview(values) {
    try {
      preview.innerHTML = svgFromConfig(values);
      preview.classList.toggle('gp-off', !values.enabled);
    } catch (err) {
      preview.innerHTML = `<p class="gp-error">${String(err.message || err)}</p>`;
    }
  }

  async function showMeta() {
    const m = await getMeta();
    if (!m.updatedAt) {
      meta.textContent = '';
      return;
    }
    const when = new Date(m.updatedAt).toLocaleString();
    meta.textContent = `Last change: ${when} · ${m.source}`;
  }

  fill(cfg);
  renderPreview(cfg);
  showMeta();

  let saveTimer = 0;
  form.addEventListener('input', () => {
    const values = readForm();
    renderPreview(values);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await setConfig(values, advanced ? 'options' : 'popup');
      showMeta();
    }, 180);
  });

  // reflect a dashboard push / other-surface edit without a reopen
  onConfigChange((next) => {
    fill(next);
    renderPreview(next);
    showMeta();
  });
}
