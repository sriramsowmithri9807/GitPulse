// Thin wrapper over the serverless endpoints. All calls carry the GitHub token
// as a bearer so the function can act as the user (fetch their calendar, scope
// their stored config).

import { API_BASE } from './config.js';

async function req(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text().catch(() => '')}`.trim());
  return res.status === 204 ? null : res.json();
}

/** Contribution calendar for the signed-in user, as grid[week][day]. */
export function fetchGrid(session) {
  return req(`/api/grid?login=${encodeURIComponent(session.login)}`, { token: session.token });
}

export function loadConfig(session) {
  return req(`/api/config/${encodeURIComponent(session.login)}`, { token: session.token });
}

export function saveConfig(session, config) {
  return req(`/api/config/${encodeURIComponent(session.login)}`, {
    token: session.token,
    method: 'PUT',
    body: config,
  });
}
