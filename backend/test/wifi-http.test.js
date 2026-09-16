import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Client } from 'ldapts';
import { signAccessToken } from '../src/core/auth/jwt.js';
const group = 'CN=VPN-IT,CN=Users,DC=mbma,DC=com';
const MAC = '02:00:00:00:00:01';
async function setup(t, lookup = async () => []) {
  const { createWifiRouter } = await import('../src/modules/wifi/wifi.routes.js').catch(() => ({}));
  assert.equal(typeof createWifiRouter, 'function');
  for (const [key, value] of Object.entries({ JWT_SECRET: 'synthetic-test-secret-at-least-32-characters', LDAP_ALLOWED_GROUPS: group, LDAP_URL: 'ldaps://invalid.test', LDAP_BIND_DN: 'fixture', LDAP_BIND_PASSWORD: 'fixture', LDAP_SEARCH_BASE: 'DC=test' })) {
    const old = process.env[key]; process.env[key] = value;
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
  }
  let memberOf = [group]; let fail = false; let calls = 0;
  t.mock.method(Client.prototype, 'bind', async () => { if (fail) throw new Error('private TLS certificate error'); });
  t.mock.method(Client.prototype, 'unbind', async () => {});
  t.mock.method(Client.prototype, 'search', async () => ({ searchEntries: [{ dn: 'CN=Actor,DC=test', sAMAccountName: 'actor', userAccountControl: '512', lockoutTime: '0', memberOf }] }));
  const app = express(); app.use(express.json()); app.use(createWifiRouter({ adapter: { lookup: async mac => { calls++; return lookup(mac); } } }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => server.close());
  const token = await signAccessToken({ sub: 'fixture-id', username: 'actor', role: 'admin' });
  return { calls: () => calls, deny: () => { memberOf = []; }, tlsFail: () => { fail = true; },
    request: (mac = MAC, auth = true) => fetch(`http://127.0.0.1:${server.address().port}/api/wifi/lookup`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ mac }) }) };
}
test('source errors stay safe, unavailable and retryable rather than negative lookups', async t => {
  let calls = 0;
  const api = await setup(t, async () => { calls++; throw new Error(calls === 1 ? 'SOURCE_AUTH_FAILED' : 'private diagnostic with secret'); });
  let response = await api.request(); assert.equal(response.status, 503); assert.equal((await response.json()).error, 'SOURCE_AUTH_FAILED');
  response = await api.request(); assert.equal(response.status, 503); assert.equal((await response.json()).error, 'SOURCE_UNAVAILABLE'); assert.equal(calls, 2);
});
test('rate limit blocks excess lookups per actor with Retry-After', async t => {
  const api = await setup(t);
  for (let i = 0; i < 20; i++) assert.equal((await api.request()).status, 200);
  const r = await api.request(); assert.equal(r.status, 429); assert.ok(Number(r.headers.get('retry-after')) > 0); assert.equal(api.calls(), 20);
});
test('production app mounts WiFi endpoint without reaching a database or router for unauthenticated requests', async t => {
  const { createApp } = await import('../src/core/server/app.js');
  const server = createApp().listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => server.close());
  const r = await fetch(`http://127.0.0.1:${server.address().port}/api/wifi/lookup`, { method: 'POST' });
  assert.equal(r.status, 401);
});
test('HTTP requires existing auth and fresh fail-closed ICT membership before read-only lookup', async t => {
  const api = await setup(t);
  let r = await api.request(MAC, false); assert.equal(r.status, 401); assert.equal(r.headers.get('cache-control'), 'no-store');
  r = await api.request(); assert.equal(r.status, 200); assert.equal((await r.json()).match, 'none'); assert.equal(api.calls(), 1);
  r = await api.request('bad'); assert.equal(r.status, 400);
  r = await api.request(null); assert.equal(r.status, 400);
  api.deny(); r = await api.request(); assert.equal(r.status, 403); assert.equal(api.calls(), 1);
  api.tlsFail(); r = await api.request(); assert.equal(r.status, 503); assert.equal(api.calls(), 1);
  delete process.env.LDAP_ALLOWED_GROUPS; r = await api.request(); assert.equal(r.status, 403);
});
