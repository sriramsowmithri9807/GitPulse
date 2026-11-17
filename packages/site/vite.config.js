import { defineConfig } from 'vite';

// The `api/` directory is intentionally outside Vite's build — those files are
// deployed as serverless functions by the host (Vercel), not bundled here.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
