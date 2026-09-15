import test from 'node:test';
import assert from 'node:assert/strict';
import { SessionClient, type SavedSession } from '../src/auth/session-client';
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function fixture(handler: typeof fetch) {
 let session: SavedSession | null = { token: 'old', refreshToken: 'refresh', refreshExpiresAt: '2099-01-01T00:00:00Z' };
 let cleared = 0;
 const client = new SessionClient({
  load: async () => session, save: async s => { session = s; }, clear: async () => { session = null; cleared++; },
  fetch: handler, authUrl: p => `https://test/api/auth/${p}`, native: true, onExpired: () => {},
 });
 return { client, session: () => session, cleared: () => cleared };
}
test('503 and network startup failure preserve good credentials', async () => {
 for (const handler of [async () => json(503, { error: 'ME_UNAVAILABLE' }), async () => { throw new TypeError('offline'); }]) {
  const f = fixture(handler);
  await assert.rejects(f.client.restore('https://test/api/me'));
  assert.equal(f.session()?.token, 'old'); assert.equal(f.cleared(), 0);
 }
});
test('concurrent expired requests perform one refresh and retry with new access', async () => {
 let refreshes = 0;
 const f = fixture(async (url, init) => {
  if (String(url).endsWith('/refresh')) { refreshes++; await new Promise(r => setTimeout(r, 20)); return json(200, { ok: true, token: 'new', refreshToken: 'next', refreshExpiresAt: '2099-01-01T00:00:00Z' }); }
  return new Headers(init?.headers).get('Authorization') === 'Bearer new' ? json(200, { ok: true }) : json(401, { error: 'TOKEN_EXPIRED' });
 });
 const responses = await Promise.all(Array.from({ length: 12 }, () => f.client.request('https://test/api/me')));
 assert.ok(responses.every(r => r.ok)); assert.equal(refreshes, 1); assert.equal(f.session()?.refreshToken, 'next');
});
test('refresh outage preserves credentials; definitive revocation clears once', async () => {
 for (const status of [503, 401]) {
  const f = fixture(async url => String(url).endsWith('/refresh') ? json(status, { error: status === 503 ? 'AUTH_UNAVAILABLE' : 'SESSION_REVOKED' }) : json(401, { error: 'TOKEN_EXPIRED' }));
  await assert.rejects(f.client.request('https://test/api/me'));
  assert.equal(f.cleared(), status === 401 ? 1 : 0);
 }
});
test('logout racing refresh cannot resurrect credentials', async () => {
 let started!: () => void; const ready = new Promise<void>(r => { started = r; });
 const f = fixture(async url => {
  if (String(url).endsWith('/refresh')) { started(); await new Promise(r => setTimeout(r, 20)); return json(200, { ok: true, token: 'new', refreshToken: 'next' }); }
  if (String(url).endsWith('/logout')) return json(200, { ok: true });
  return json(401, { error: 'TOKEN_EXPIRED' });
 });
 const request = f.client.request('https://test/api/me').catch(() => null);
 await ready; await f.client.logout(); await request;
 assert.equal(f.session(), null);
});
test('upstream 401/403 is not mistaken for local session invalidation', async () => {
 for (const status of [401,403]) {
  const f = fixture(async () => json(status, { error: 'UPSTREAM_DENIED' }));
  assert.equal((await f.client.request('https://test/api/me')).status, status);
  assert.equal(f.cleared(), 0);
 }
});
test('login and logout are serialized and cannot leave a resurrected session', async () => {
 let started!: () => void; const ready = new Promise<void>(r => { started = r; });
 const f = fixture(async url => {
  if (String(url).endsWith('/login')) { started(); await new Promise(r => setTimeout(r, 20)); return json(200, { ok: true, token: 'login-new', refreshToken: 'login-refresh' }); }
  return json(200, { ok: true });
 });
 const login = f.client.login('test', 'test-only-password');
 await ready; await f.client.logout(); await login;
 assert.equal(f.session(), null);
});
test('expired legacy sessions require login rather than looping', async () => {
 const f = fixture(async () => json(401, { error: 'INVALID_TOKEN' }));
 await f.client.saveLogin({ token: 'legacy' });
 await assert.rejects(f.client.request('https://test/api/me'), { message: 'SESSION_EXPIRED' });
 assert.equal(f.session(), null);
});

test('two web tabs share a lock and refresh once with cookie credentials', async () => {
 let session: SavedSession | null = { token: 'old', refreshExpiresAt: '2099-01-01T00:00:00Z' };
 let tail = Promise.resolve(); let refreshes = 0;
 const lock = async <T,>(fn: () => Promise<T>): Promise<T> => {
  const prior = tail; let release!: () => void; tail = new Promise<void>(r => { release = r; });
  await prior; try { return await fn(); } finally { release(); }
 };
 const options = {
  load: async () => session, save: async (s: SavedSession) => { session = s; }, clear: async () => { session = null; },
  fetch: async (url: RequestInfo | URL, init?: RequestInit) => {
   if (String(url).endsWith('/refresh')) {
    refreshes++; assert.equal(init?.credentials,'include');
    assert.equal(JSON.parse(String(init?.body)).refreshToken,undefined);
    await new Promise(r => setTimeout(r,20)); return json(200,{ok:true,token:'new',refreshExpiresAt:'2099-01-01T00:00:00Z'});
   }
   return new Headers(init?.headers).get('Authorization') === 'Bearer new' ? json(200,{ok:true}) : json(401,{error:'TOKEN_EXPIRED'});
  }, authUrl: (p: string) => `https://test/api/auth/${p}`, native:false, onExpired:()=>{}, lock,
 };
 const tabs = [new SessionClient(options),new SessionClient(options)];
 assert.deepEqual(await Promise.all(tabs.map(t => t.restore('https://test/api/me'))),[true,true]);
 assert.equal(refreshes,1);
});
test('logout failure keeps credentials for a real revocation retry', async () => {
 const f = fixture(async () => json(503,{error:'AUTH_UNAVAILABLE'}));
 await assert.rejects(f.client.logout(),{message:'LOGOUT_UNAVAILABLE'});
 assert.equal(f.session()?.token,'old'); assert.equal(f.cleared(),0);
});
test('native login omits browser cookies for legacy wildcard CORS compatibility', async () => {
 const f = fixture(async (_url,init) => {
  assert.equal(init?.credentials,'omit');
  assert.equal(JSON.parse(String(init?.body)).sessionTransport,'native');
  return json(200,{ok:true,token:'legacy'});
 });
 await f.client.login('test','test-only-password'); assert.equal(f.session()?.token,'legacy');
});
