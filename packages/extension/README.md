# @gitpulse/extension

Chrome/Edge (Manifest V3) extension. Replaces the live GitHub contribution
graph on `github.com` with an animated SVG built by `@gitpulse/core`.

## Build & load

```bash
npm install            # from the repo root
npm run build:extension # -> dist/
```

1. `chrome://extensions`
2. enable **Developer mode**
3. **Load unpacked** → select `packages/extension/dist`
4. open any GitHub profile

`npm run watch` rebuilds on change (unminified, inline sourcemaps). Reload the
extension from `chrome://extensions` after each rebuild.

## Layout

```
manifest.json            MV3 manifest (source of truth; copied to dist/)
build.mjs                esbuild bundle + static asset copy
scripts/gen-icons.mjs    dependency-free PNG icon generator
src/
  content/graph.js       the injector (see ARCHITECTURE.md)
  content/graph.css      styles for our wrapper + badge only
  background/service-worker.js
  popup/                 quick config UI
  options/               full config UI + dashboard pairing + share-code import
  ui/controls.js         shared form + live preview
  lib/storage.js         chrome.storage.sync wrapper, config key + default
  lib/render.js          config -> SVG string
```

## Pairing with the dashboard

The dashboard pushes config via `chrome.runtime.sendMessage(extensionId, …)`,
allowed by `externally_connectable.matches` in the manifest. Add your deployed
dashboard origin there. The Options page shows the extension id to paste into
the dashboard (or use `VITE_EXTENSION_ID` at build time).

## Publishing

`dist/` is a complete unpacked extension. Zip it for the Chrome Web Store.
Bump `version` in both `manifest.json` and `package.json`.
