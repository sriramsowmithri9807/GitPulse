// Minimal GitHub OAuth client. The secret exchange happens server-side in
// /api/oauth/callback; this module only kicks off the redirect and reads back
// the session the callback drops into sessionStorage.
//
// NOTE: the callback currently returns the token in the redirect URL fragment
// for simplicity. A production deployment should switch to an httpOnly session
// cookie set by the callback and a `/api/me` endpoint — see api/oauth/callback.js.

import { API_BASE } from './config.js';

const KEY = 'gitpulse:session';

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function setSession(s) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function signOut() {
  sessionStorage.removeItem(KEY);
  location.hash = '';
  location.reload();
}

export function signIn() {
  const redirect = `${location.origin}${location.pathname}`;
  location.href = `${API_BASE}/api/oauth/login?redirect=${encodeURIComponent(redirect)}`;
}

/** Call once on load: consume `#token=...&login=...` from the OAuth callback. */
export function hydrateFromRedirect() {
  if (!location.hash.startsWith('#')) return getSession();
  const p = new URLSearchParams(location.hash.slice(1));
  const token = p.get('token');
  const login = p.get('login');
  if (token && login) {
    const session = { token, login, avatar: p.get('avatar') || '', at: Date.now() };
    setSession(session);
    history.replaceState(null, '', location.pathname + location.search);
    return session;
  }
  return getSession();
}
