// GET /api/grid?login=<user>   Authorization: Bearer <github token>
// Returns the contribution calendar as grid[week][day] = { count, date }.

import { fetchContributions } from '@gitpulse/core';
import { bearer } from './_lib/gh.js';

export default async function handler(req, res) {
  const token = bearer(req);
  const login = String(req.query.login || '');
  if (!token || !login) {
    res.status(401).json({ error: 'bearer token and ?login= required' });
    return;
  }
  try {
    const grid = await fetchContributions(login, token);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).json(grid);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
