// GET /api/oauth/callback?code=...&state=...
// Exchanges the code server-side (client secret never touches the browser),
// then redirects back into the SPA.
//
// SECURITY NOTE — this hands the token to the SPA via the URL fragment, which
// keeps the frontend a pure static app. It is acceptable for a read-only
// `read:user` token but not ideal. To harden: set an httpOnly, Secure,
// SameSite=Lax session cookie here instead, add `GET /api/me`, and drop the
// fragment. The SPA's auth.js already isolates this in one place.

import { exchangeCode, whoAmI } from '../_lib/gh.js';

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error('missing code');

    let redirect = '/';
    try {
      redirect = JSON.parse(Buffer.from(String(state), 'base64url').toString()).redirect || '/';
    } catch {
      /* fall back to root */
    }

    const token = await exchangeCode(String(code));
    const me = await whoAmI(token);

    const frag = new URLSearchParams({
      token,
      login: me.login,
      avatar: me.avatar || '',
    }).toString();

    res.writeHead(302, { Location: `${redirect}#${frag}` });
    res.end();
  } catch (err) {
    res.status(400).send(`OAuth callback failed: ${err.message}`);
  }
}
