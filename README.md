# GitPulse

**A browser extension that animates your _live_ GitHub contribution graph.**

You sign in, pick an animation form, a theme, and an optional pixel-art text
panel — on the extension popup or on the hosted dashboard — and GitPulse
replaces the real streak grid on `github.com/<you>` with the animated version,
in place, as you browse.

It is **not** a README image, **not** a profile embed, and it doesn't write
anything to any repo. The animation exists only in your browser, painted over
the contribution calendar GitHub already rendered.

```
 ┌───────────┐        ┌──────────────────────────┐        ┌───────────────────┐
 │  Dashboard │  push  │   Extension (MV3)         │  reads │  github.com/<you> │
 │  (sign in, ├───────►│   • popup / options UI    ├───────►│  contribution     │
 │   design)  │ config │   • content script        │  DOM   │  calendar         │
 └───────────┘        │   • swaps in animated SVG │        └───────────────────┘
        ▲              └──────────────────────────┘
        │  GitHub OAuth (read:user) — serverless, secret stays on the server
        ▼
   /api/oauth/*  ·  /api/config/:user  ·  /api/grid
```

## Repository layout

This is an npm-workspaces monorepo.

| Package | Path | What it is |
| --- | --- | --- |
| `@gitpulse/core` | [packages/core](packages/core) | The animation engine. 10 timing **patterns** × 10 visual **effects** = 100 named forms, color **themes**, a 3×5 **text** font, a **DOM scraper** that reads GitHub's calendar, and the GraphQL fetch for Node contexts. Zero runtime dependencies. Pure — runs identically in Node and the browser. |
| `@gitpulse/extension` | [packages/extension](packages/extension) | The Chrome/Edge **Manifest V3** extension. Content script finds the contribution calendar, scrapes it with `@gitpulse/core`, and swaps in `buildAnimatedSvg(...)`. Popup + options pages for local config. Accepts a config push from the dashboard via `externally_connectable`. |
| `@gitpulse/site` | [packages/site](packages/site) | The hosted **dashboard**: a Vite static SPA (sign in with GitHub, design with a live preview, push to the extension) plus serverless functions in `api/` for the OAuth secret exchange and per-user config storage. |

The animation catalog (all 100 forms, with descriptions) is in
[ANIMATIONS.md](ANIMATIONS.md), generated from the code by
`npm run catalog` so it can't drift.

## Quick start

```bash
npm install            # installs all three workspaces

npm test               # @gitpulse/core unit tests
npm run build:extension # -> packages/extension/dist  (load unpacked in Chrome)
npm run dev:site        # dashboard on http://localhost:5173
```

### Load the extension

```
npm run build:extension
# chrome://extensions → enable "Developer mode" → "Load unpacked"
# → select packages/extension/dist
```

Open your GitHub profile. Click the extension icon to choose a form/theme/text;
hover the graph and click **⚡ GitPulse** to peek at the original.

### Run the dashboard locally

```bash
cp .env.example .env      # fill in a GitHub OAuth app's client id/secret
npm run dev:site
```

Without OAuth configured you can still click **“try it with sample data.”**
`vercel dev` runs the `api/` functions; plain `npm run dev:site` serves only
the SPA.

## Deploying the dashboard

`packages/site/vercel.json` is set up for Vercel: build command, output
directory, `nodejs20.x` functions, SPA rewrites. Set these env vars in the
project:

| Var | Where | Purpose |
| --- | --- | --- |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | server | OAuth app; callback URL `https://<site>/api/oauth/callback` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | server | optional — persist per-user config (else in-memory, ephemeral) |
| `VITE_API_BASE` | build | usually empty (same origin) |
| `VITE_EXTENSION_ID` | build | published extension id, so “Push to extension” skips the prompt |

Add the deployed origin to the extension's `externally_connectable.matches` in
[packages/extension/manifest.json](packages/extension/manifest.json).

## Design constraints (carried over from the engine)

- The injected SVG has **no script** — pure CSS `@keyframes` on `fill` /
  `opacity` / `transform`. It survives GitHub's CSP.
- One self-contained SVG string, no external assets or fonts.
- `@gitpulse/core` has **zero runtime dependencies**.
- Animation = a **pattern × effect** combination, not one bespoke timeline.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the data flow in detail.

## License

MIT
