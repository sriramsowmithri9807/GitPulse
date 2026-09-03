# Contribution Graph Animator

Generates a looping, **script-free** animated SVG of your GitHub contribution
graph. The animation is a *combinatorial system*, not one fixed effect:

- **10 timing patterns** decide *when* each filled cell takes its turn
- **10 visual effects** decide *how* a cell looks at its turn
- → **100 named forms**, e.g. `radial-center--pulse-glow`

Plus an optional animated **pixel-art text panel** and swappable **color
themes** (or a fully custom hex palette).

The output is a single self-contained `.svg` with no external assets and no
JavaScript — it animates with pure CSS `@keyframes`, so GitHub's `<img>` / camo
proxy renders it fine in a profile README.

## How it works

| Piece | File | Responsibility |
| --- | --- | --- |
| Fetch | [src/fetchContributions.js](src/fetchContributions.js) | GraphQL `contributionCalendar` → `grid[week][day] = {count,date}`, plus a deterministic mock generator |
| Patterns | [src/patterns.js](src/patterns.js) | 10 timing functions → `[0,1]` activation fraction per filled cell |
| Effects | [src/effects.js](src/effects.js) | 10 appearance functions → a unique `@keyframes` timeline |
| Catalog | [src/animationCatalog.js](src/animationCatalog.js) | patterns × effects → 100 names + resolver with safe fallback |
| Themes | [src/themes.js](src/themes.js) | named palettes + custom `--colors=` parser |
| Text | [src/textArt.js](src/textArt.js) | 3×5 dot-matrix font + left-to-right layout |
| Render | [src/renderSvg.js](src/renderSvg.js) | assembles one SVG string |
| CLI | [src/index.js](src/index.js) | `node src/index.js <user> <out> [flags]` |

All filled cells share **one** loop `animation-duration` (filled-cell count ×
a fixed per-step time), so the board stays in sync whichever pattern is chosen.
The text panel runs on its **own** independent loop, since text length varies.

The full form list lives in [ANIMATIONS.md](ANIMATIONS.md), which is
**generated** by [scripts/generate-catalog-doc.js](scripts/generate-catalog-doc.js)
(`npm run catalog`) straight from the code, so it can't drift.

## CLI

```
node src/index.js <username> <outPath> [flags]
node src/index.js --list-animations
```

| Flag | Meaning |
| --- | --- |
| `--animation=NAME` | form name (default `sweep-left-right--reveal`); unknown → warn + fallback |
| `--theme=NAME` | `green` \| `blue` \| `purple` \| `red` \| `sunset` \| `mono` |
| `--colors=HEX,...` | 5 level colors `[+ empty [+ accent]]` — **overrides** `--theme` |
| `--text=STRING` | append an animated pixel-art panel (A–Z, 0–9, space) |
| `--token=TOKEN` | GitHub token with `read:user` (else `GITHUB_TOKEN` / `GH_TOKEN` env) |
| `--mock` | deterministic mock data, no network |

### Examples

```bash
npm run list-animations
npm run preview                       # mock data → preview.svg

node src/index.js octocat out.svg --mock --animation=spiral--pulse-glow --theme=purple
node src/index.js octocat out.svg --mock --animation=scatter--twinkle --text="OCTOCAT"
node src/index.js octocat out.svg --mock --colors="#0d1117,#0e4429,#006d32,#26a641,#39d353,#0d1117,#7cffb2"
```

## Deployment — end to end

1. **Preview locally, no token.**
   ```bash
   npm run list-animations
   npm run preview
   node src/index.js me preview.svg --mock --animation=diagonal-tl-br--flash-accent --theme=sunset --text="HELLO"
   ```
   Open `preview.svg` in a browser and try a few `--animation=` / `--theme=` /
   `--text=` combinations.

2. **Confirm the real GraphQL path once.** Create a classic PAT with
   `read:user`, then:
   ```bash
   node src/index.js <your-username> real.svg --token=ghp_xxx --animation=radial-center--pulse-glow
   ```

3. **Push this project to its own repo**, e.g.
   `github.com/<you>/contribution-graph-animator`.

4. **Let Actions regenerate it on a schedule.**
   [.github/workflows/generate.yml](.github/workflows/generate.yml) runs daily
   on `cron` (+ `workflow_dispatch` for manual runs). It uses the built-in
   `secrets.GITHUB_TOKEN`, renders `dist/contribution.svg`, and **force-pushes
   only that file to a dedicated `output` branch** — `main` is never touched.
   Configure the look with repo **Variables** (Settings → Secrets and variables
   → Actions → Variables): `ANIMATION`, `THEME`, `COLORS`, `TEXT`. The manual
   run also takes `animation` / `theme` / `text` inputs that override the
   variables for that run.

5. **Embed it in your profile README** (`github.com/<you>/<you>`) as a plain
   markdown image so it silently refreshes:
   ```markdown
   ![My contributions](https://raw.githubusercontent.com/<you>/contribution-graph-animator/output/contribution.svg)
   ```

6. **(Optional) Publish the Action.** Tag a release (`v1`) and publish
   [action.yml](action.yml) to the Marketplace. Others then consume it:
   ```yaml
   - uses: <you>/contribution-graph-animator@v1
     with:
       username: ${{ github.repository_owner }}
       animation: scatter--twinkle
       theme: blue
       text: "MY NAME"
   ```

## Tests

```bash
npm test        # renders all 100 forms against mock data; asserts no <script>, valid SVG
npm run catalog # regenerates ANIMATIONS.md from the code
```

## Constraints honored

- No client-side JS in the output — pure CSS `@keyframes` on `fill` / `opacity`
  / `transform`.
- One self-contained `.svg`, no external assets or fonts.
- Zero runtime dependencies — Node's built-in `fetch`, no HTTP client library.
- A combinatorial pattern × effect system, not one bespoke animation.
