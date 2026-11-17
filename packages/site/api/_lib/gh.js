// Shared GitHub helpers for the serverless functions. No SDK — just fetch.

export const OAUTH_AUTHORIZE = 'https://github.com/login/oauth/authorize';
export const OAUTH_TOKEN = 'https://github.com/login/oauth/access_token';

export function bearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

/** Exchange an OAuth `code` for an access token. */
export async function exchangeCode(code) {
  const res = await fetch(OAUTH_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(json.error_description || 'token exchange failed');
  return json.access_token;
}

/** The authenticated user, or throw. */
export async function whoAmI(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'gitpulse' },
  });
  if (!res.ok) throw new Error(`GitHub /user -> ${res.status}`);
  const u = await res.json();
  return { login: u.login, avatar: u.avatar_url };
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}
