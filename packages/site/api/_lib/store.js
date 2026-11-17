// Per-user config storage. Uses an Upstash/Vercel KV REST endpoint when its env
// vars are present, and otherwise a process-local Map so `vercel dev` and tests
// work with zero setup. The Map is EPHEMERAL — do not rely on it in production.

const URL_ = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const mem = new Map();

const key = (login) => `gitpulse:config:${String(login).toLowerCase()}`;

async function kv(command) {
  const res = await fetch(`${URL_}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV ${command[0]} -> ${res.status}`);
  return (await res.json()).result;
}

export async function getConfig(login) {
  if (URL_ && TOKEN) {
    const raw = await kv(['get', key(login)]);
    return raw ? JSON.parse(raw) : null;
  }
  return mem.get(key(login)) || null;
}

export async function putConfig(login, config) {
  if (URL_ && TOKEN) {
    await kv(['set', key(login), JSON.stringify(config)]);
    return;
  }
  mem.set(key(login), config);
}
