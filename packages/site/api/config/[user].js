// GET  /api/config/:user   -> stored config (204 if none)
// PUT  /api/config/:user   -> validate the bearer *is* :user, then store
//
// The stored object is whatever normalizeConfig() produces, so the extension
// and the site always agree on its shape.

import { normalizeConfig, listAnimations, THEME_NAMES } from '@gitpulse/core';
import { bearer, whoAmI, readJsonBody } from '../_lib/gh.js';
import { getConfig, putConfig } from '../_lib/store.js';

function validate(cfg) {
  const n = normalizeConfig(cfg);
  if (!listAnimations().includes(n.animation)) throw new Error('unknown animation');
  if (!THEME_NAMES.includes(n.theme)) throw new Error('unknown theme');
  return n;
}

export default async function handler(req, res) {
  const user = String(req.query.user || '').toLowerCase();
  if (!user) {
    res.status(400).json({ error: 'missing user' });
    return;
  }

  if (req.method === 'GET') {
    const cfg = await getConfig(user);
    if (!cfg) {
      res.status(204).end();
      return;
    }
    res.status(200).json(cfg);
    return;
  }

  if (req.method === 'PUT') {
    const token = bearer(req);
    if (!token) {
      res.status(401).json({ error: 'bearer token required' });
      return;
    }
    try {
      const me = await whoAmI(token);
      if (me.login.toLowerCase() !== user) {
        res.status(403).json({ error: 'token does not match :user' });
        return;
      }
      const body = await readJsonBody(req);
      const cfg = validate(body);
      await putConfig(user, cfg);
      res.status(200).json(cfg);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    return;
  }

  res.setHeader('Allow', 'GET, PUT');
  res.status(405).end();
}
