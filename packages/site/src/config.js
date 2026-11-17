// Client-side config: where the API lives and which extension id to push to.
// `VITE_*` vars are inlined at build time by Vite.

export const API_BASE = import.meta.env.VITE_API_BASE || '';
export const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID || '';
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
