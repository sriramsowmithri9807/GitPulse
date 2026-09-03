// GET /api/oauth/login?redirect=<url>
// Bounces the browser to GitHub's consent screen. The final SPA URL is carried
// in `state` (base64) and echoed back by the callback.

import { OAUTH_AUTHORIZE } from '../_lib/gh.js';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GITHUB_CLIENT_ID is not configured');
    return;
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const callbackUrl = `${proto}://${host}/api/oauth/callback`;

  const redirect = String(req.query.redirect || `${proto}://${host}/`);
  const state = Buffer.from(JSON.stringify({ redirect, n: Date.now() })).toString('base64url');

  const url = new URL(OAUTH_AUTHORIZE);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);

  res.writeHead(302, { Location: url.toString() });
  res.end();
}
