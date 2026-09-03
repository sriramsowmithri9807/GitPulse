// The design surface: form controls + a live SVG preview driven by @gitpulse/core.
// Emits `change` with a normalized config whenever anything moves.

import {
  listAnimations,
  THEME_NAMES,
  buildAnimatedSvg,
  getPalette,
  generateMockGrid,
  normalizeConfig,
} from '@gitpulse/core';

export function createEditor(mountControls, mountPreview, { onChange } = {}) {
  let grid = generateMockGrid({ weeks: 40, seed: 7 });
  let config = normalizeConfig({});

  mountControls.innerHTML = `
    <form class="ed-form">
      <label class="ed-row ed-toggle">
        <input type="checkbox" name="enabled" checked />
        <span>Enabled</span>
      </label>
      <label class="ed-row">
        <span>Animation form</span>
        <select name="animation">
          ${listAnimations().map((n) => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </label>
      <label class="ed-row">
        <span>Theme</span>
        <select name="theme">
          ${THEME_NAMES.map((n) => `<option value="${n}">${n}</option>`).join('')}
        </select>
      </label>
      <label class="ed-row">
        <span>Custom colors <small>(overrides theme)</small></span>
        <input type="text" name="colors" spellcheck="false"
          placeholder="#ebedf0,#9be9a8,#40c463,#30a14e,#216e39" />
      </label>
      <label class="ed-row">
        <span>Text panel</span>
        <input type="text" name="text" maxlength="32" spellcheck="false" placeholder="(optional)" />
      </label>
    </form>
  `;

  const form = mountControls.querySelector('.ed-form');

  function read() {
    return normalizeConfig({
      enabled: form.enabled.checked,
      animation: form.animation.value,
      theme: form.theme.value,
      colors: form.colors.value.trim(),
      text: form.text.value,
    });
  }

  function render() {
    try {
      mountPreview.innerHTML = buildAnimatedSvg({
        grid,
        animation: config.animation,
        palette: getPalette({ theme: config.theme, colors: config.colors }),
        text: config.text,
      });
      mountPreview.classList.toggle('is-off', !config.enabled);
      mountPreview.querySelector('.ed-error')?.remove();
    } catch (err) {
      mountPreview.innerHTML = `<p class="ed-error">${String(err.message || err)}</p>`;
    }
  }

  form.addEventListener('input', () => {
    config = read();
    render();
    onChange?.(config);
  });

  render();

  return {
    get config() {
      return config;
    },
    setConfig(next) {
      config = normalizeConfig(next);
      form.enabled.checked = config.enabled;
      form.animation.value = config.animation;
      form.theme.value = config.theme;
      form.colors.value = config.colors || '';
      form.text.value = config.text || '';
      render();
    },
    setGrid(next) {
      if (Array.isArray(next) && next.length) {
        grid = next;
        render();
      }
    },
  };
}
