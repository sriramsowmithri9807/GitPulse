// Bundle the extension into dist/ with esbuild. Each entry point is an IIFE so
// it drops straight into a <script>/service_worker with @gitpulse/core inlined.
// Static assets (manifest, HTML, CSS, icons) are copied verbatim.
import { build } from 'esbuild';
import { cp, mkdir, rm, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const root = new URL('.', import.meta.url);
const dist = new URL('dist/', root);
const watch = process.argv.includes('--watch');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// icons: generate on first build if missing
try {
  await access(new URL('icons/128.png', root));
} catch {
  execFileSync(process.execPath, ['scripts/gen-icons.mjs'], { stdio: 'inherit' });
}

const common = {
  bundle: true,
  format: 'iife',
  target: ['chrome110'],
  legalComments: 'none',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
};

await build({
  ...common,
  entryPoints: {
    'content/graph': 'src/content/graph.js',
    'background/service-worker': 'src/background/service-worker.js',
    'popup/popup': 'src/popup/popup.js',
    'options/options': 'src/options/options.js',
  },
  outdir: 'dist',
});

async function copyStatic() {
  await cp(new URL('manifest.json', root), new URL('manifest.json', dist));
  await cp(new URL('icons/', root), new URL('icons/', dist), { recursive: true });
  await cp(new URL('src/popup/index.html', root), new URL('popup/index.html', dist));
  await cp(new URL('src/popup/popup.css', root), new URL('popup/popup.css', dist));
  await cp(new URL('src/content/graph.css', root), new URL('content/graph.css', dist));
  await cp(new URL('src/options/index.html', root), new URL('options/index.html', dist));
  await cp(new URL('src/options/options.css', root), new URL('options/options.css', dist));
}
await copyStatic();

console.log(`Built extension -> ${new URL('dist/', root).pathname}`);
console.log('Load it: chrome://extensions -> Developer mode -> Load unpacked -> select that dist/ folder.');
