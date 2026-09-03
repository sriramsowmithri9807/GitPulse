# @gitpulse/site

The GitPulse dashboard: sign in with GitHub, design an animation with a live
preview, push it to the browser extension. Vite static SPA + serverless
functions.

## Develop

```bash
npm install                      # from the repo root
cp ../../.env.example ../../.env  # fill in GITHUB_CLIENT_ID / SECRET

npm run dev:site                 # SPA only, http://localhost:5173
# or, to also run the api/ functions:
npx vercel dev
```

Without OAuth configured, use **“try it with sample data.”**

## Build

```bash
npm run build:site   # -> packages/site/dist
```

## Endpoints (`api/`, deployed as serverless functions)

| Route | Method | Notes |
| --- | --- | --- |
| `/api/oauth/login?redirect=<url>` | GET | 302 → GitHub authorize (`read:user`) |
| `/api/oauth/callback` | GET | exchanges the code server-side, redirects back with `#token=…` |
| `/api/grid?login=<user>` | GET | `Authorization: Bearer <token>` → `grid[week][day]` |
| `/api/config/:user` | GET / PUT | GET is public; PUT requires the bearer to *be* `:user` |

Storage: `api/_lib/store.js` uses a KV REST endpoint when `KV_REST_API_URL` /
`KV_REST_API_TOKEN` are set, otherwise an in-memory `Map` (ephemeral — fine for
local dev, not for production).

## Deploy (Vercel)

`vercel.json` at this package root wires the build command, output directory,
`nodejs20.x` runtime for `api/**`, and SPA rewrites. Import the repo, set the
env vars from [.env.example](../../.env.example), and set the OAuth app's
callback URL to `https://<your-site>/api/oauth/callback`.

Then add `https://<your-site>/*` to `externally_connectable.matches` in
[../extension/manifest.json](../extension/manifest.json) so **Push to
extension** works.

### Security note

`api/oauth/callback.js` returns the token in the redirect URL fragment to keep
the frontend a pure static app. That's acceptable for a read-only `read:user`
token; to harden, switch the callback to an httpOnly session cookie and add a
`/api/me` endpoint. `src/auth.js` isolates this in one place.
