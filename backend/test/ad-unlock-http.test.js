import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { Client } from 'ldapts';
import { createAdRouter } from '../src/modules/ad/ad.routes.js';
import { signAccessToken } from '../src/core/auth/jwt.js';

for (const scenario of ['success', 'non-admin', 'disabled-admin', 'authorization-error', 'permission-error', 'search-error', 'unverified', 'missing-token', 'doc-token']) {
  test(`HTTP ${scenario}: authorization, response and audit`, async (t) => {
    process.env.JWT_SECRET = 'isolated-test-signing-key-only';
    Object.assign(process.env, { LDAP_UNLOCK_ADMIN_GROUPS: 'CN=Unlock Operators,DC=example,DC=test', LDAP_URL: 'ldaps://invalid.test', LDAP_BIND_DN: 'CN=fixture', LDAP_BIND_PASSWORD: 'fixture-only', LDAP_SEARCH_BASE: 'DC=example,DC=test' });
    let searches = 0; let modifies = 0;
    t.mock.method(Client.prototype, 'bind', async () => {});
    t.mock.method(Client.prototype, 'unbind', async () => {});
    t.mock.method(Client.prototype, 'search', async () => {
      searches++;
      if (scenario === 'authorization-error' || (scenario === 'search-error' && searches === 2)) throw new Error('private diagnostic');
      if (searches === 1) return { searchEntries: [{ dn: 'CN=Admin,DC=example,DC=test', sAMAccountName: 'admin', userAccountControl: scenario === 'disabled-admin' ? '514' : '512', lockoutTime: '0', memberOf: scenario === 'non-admin' ? [] : ['CN=Unlock Operators,DC=example,DC=test'] }] };
      if (searches === 2) return { searchEntries: [{ dn: 'CN=Target,DC=example,DC=test' }] };
      return { searchEntries: [{ lockoutTime: scenario === 'unverified' ? '99' : '0', userAccountControl: '512' }] };
    });
    t.mock.method(Client.prototype, 'modify', async () => { modifies++; if (scenario === 'permission-error') throw { code: 50, message: 'private diagnostic' }; });
    const logs = []; t.mock.method(console, 'info', line => logs.push(JSON.parse(line)));
    const app = express(); app.use(createAdRouter());
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => server.close());
    const token = await signAccessToken({ sub: 'admin-id', username: 'admin', ...(scenario === 'doc-token' ? { doc: true } : {}) });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ad/users/target/unlock`, { method: 'POST', headers: scenario === 'missing-token' ? {} : { authorization: `Bearer ${token}` } });
    const expected = { success: 200, 'non-admin': 403, 'disabled-admin': 403, 'authorization-error': 503, 'permission-error': 502, 'search-error': 502, unverified: 502, 'missing-token': 401, 'doc-token': 401 }[scenario];
    assert.equal(response.status, expected);
    const body = await response.json();
    assert.equal(body.ok, scenario === 'success');
    assert.equal(modifies, ['success', 'permission-error', 'unverified'].includes(scenario) ? 1 : 0);
    assert.equal(logs.length, 2);
    assert.equal(logs[0].requestId, logs[1].requestId);
    assert.equal(logs[1].outcome, scenario === 'success' ? 'SUCCESS' : body.error === 'MISSING_TOKEN' || body.error === 'INVALID_TOKEN' ? 'UNAUTHENTICATED' : body.error);
    assert.equal(JSON.stringify([body, logs]).includes('private diagnostic'), false);
    assert.equal(JSON.stringify(logs).includes(token), false);
  });
}

test('unlock route denies authenticated non-admin before modify and audits denial', async (t) => {
  process.env.JWT_SECRET = 'isolated-test-signing-key-only';
  delete process.env.LDAP_UNLOCK_ADMIN_GROUPS;
  let modified = false;
  t.mock.method(Client.prototype, 'modify', async () => { modified = true; });
  const logs = [];
  t.mock.method(console, 'info', (line) => logs.push(JSON.parse(line)));
  const app = express(); app.use(createAdRouter());
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());
  const token = await signAccessToken({ sub: 'test-id', username: 'ordinary.user', role: 'admin' });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/ad/users/target/unlock`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 403);
  assert.equal(modified, false);
  assert.equal(logs.at(-1).outcome, 'FORBIDDEN');
  assert.equal(JSON.stringify(logs).includes(token), false);
});
