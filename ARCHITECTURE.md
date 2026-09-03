# Architecture

GitPulse is three packages around one pure engine. The engine never changes
between environments; only its inputs and outputs do.

## `@gitpulse/core` — the engine

Pure, dependency-free ES modules. Two rules:

- nothing imports Node built-ins except `contributions.js` (which only uses
  global `fetch`) and the dev `cli.js`;
- nothing touches `document` except `domScrape.js`.

```
patterns.js        cells → activation fraction in [0,1]  (WHEN a cell animates)
effects.js         params → a CSS @keyframes timeline    (HOW a cell animates)
animationCatalog.js  patterns × effects → 100 names + safe resolver
themes.js          named palettes + custom hex parser
textArt.js         3×5 dot-matrix font + layout
renderSvg.js       grid + form + palette + text → one <svg> string
                   (exported as both `renderSvg` and `buildAnimatedSvg`)
domScrape.js       DOM [data-date] cells → grid[week][day]   (browser)
contributions.js   GraphQL contributionCalendar → same grid (Node)
index.js           the public surface + normalizeConfig() / DEFAULT_ANIMATION
```

`grid[week][day] = { count, date }` is the one shared data shape. Everything
upstream produces it; `renderSvg` is the only consumer.

### Config shape

`normalizeConfig()` is the contract every package agrees on:

```js
{ enabled: boolean, animation: string, theme: string, colors: string, text: string }
```

`colors` (comma-separated hex) overrides `theme` when non-empty. `text` is
clamped to 32 chars.

## `@gitpulse/extension` — where it renders

Manifest V3, built with esbuild into `dist/` (each entry an IIFE with core
inlined).

```
content/graph.js       on github.com:
                         1. findCalendar()      — locate the year graph across
                                                  GitHub's markup versions
                         2. scrapeContributionGrid(cal)   (core)
                         3. buildAnimatedSvg(...)          (core)
                         4. hide the native node, insert <div.gitpulse-wrap>
                         5. re-apply on turbo:load / pjax:end / MutationObserver
                            (GitHub navigates without full reloads)
                       config comes from chrome.storage.sync; a change re-renders.

background/            onInstalled → seed default config
service-worker.js      onMessageExternal → accept { GITPULSE_SET_CONFIG } from an
                       allow-listed dashboard origin, validate, persist

popup/ + options/      share ui/controls.js: the form + a live mock preview,
                       debounced writes to chrome.storage.sync. Options adds
                       custom colors, the extension id (for pairing), and a
                       paste-a-share-code import.
```

No host permission for the dashboard is needed: `externally_connectable` lets
the site `chrome.runtime.sendMessage(extensionId, ...)` directly.

## `@gitpulse/site` — where it's designed

Vite static SPA + serverless functions. The SPA is a thin shell around
`editor.js`, which is just `@gitpulse/core` with form controls.

```
src/auth.js            redirect to /api/oauth/login; read {token,login} back
                       from the callback's URL fragment (see the security note
                       in api/oauth/callback.js — httpOnly cookie is the harden)
src/api.js             GET /api/grid, GET/PUT /api/config/:user  (bearer = token)
src/editor.js          controls + live buildAnimatedSvg preview
src/main.js            wires auth + api + editor; "Push to extension" and
                       "Copy share code"

api/oauth/login.js     302 → GitHub authorize (scope read:user), SPA URL in state
api/oauth/callback.js  exchange code (client secret, server-only) → redirect back
api/grid.js            fetchContributions(login, token) (core) → grid JSON
api/config/[user].js   GET stored config; PUT validates the bearer *is* :user
api/_lib/               gh.js (fetch helpers), store.js (KV REST or in-memory)
```

## Data flow, end to end

1. User signs in on the dashboard → serverless OAuth exchange → SPA holds a
   `read:user` token.
2. User designs a form; `editor.js` previews it with `@gitpulse/core`; changes
   `PUT /api/config/:user`.
3. User clicks **Push to extension** → `chrome.runtime.sendMessage(id, …)` →
   service worker validates + writes `chrome.storage.sync`.
4. `chrome.storage.onChanged` fires in the content script on the open GitHub
   tab → it re-scrapes the calendar and re-renders the SVG.
5. The extension also works fully standalone — the popup writes the same
   storage key; the dashboard is optional.

## What was removed in the 2.x restructure

The 1.x delivery — a CLI + a GitHub Action that generated an SVG and
force-pushed it to an `output` branch for embedding in a profile README — is
gone (`action.yml`, `.github/workflows/generate.yml`). The engine that powered
it is now `@gitpulse/core`. A slim `packages/core/src/cli.js` remains for local
previews and test fixtures only.
