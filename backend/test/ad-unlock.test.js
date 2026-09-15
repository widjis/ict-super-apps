import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, Change, Attribute } from 'ldapts';
import { unlockActiveDirectoryUser } from '../src/integrations/ldap/ldap.client.js';

// Only mocked clients; no dotenv or network connections in this suite.
function mockLdap(t, { entries = [{ dn: 'CN=Test\\, User,DC=example,DC=test' }], verify = [{ dn: entries[0]?.dn, sAMAccountName: 'test.user', lockoutTime: '0', userAccountControl: '512' }], modifyError } = {}) {
  for (const [key, value] of Object.entries({ LDAP_URL: 'ldaps://invalid.test', LDAP_BIND_DN: 'CN=fixture', LDAP_BIND_PASSWORD: 'fixture-only', LDAP_SEARCH_BASE: 'DC=example,DC=test' })) {
    const old = process.env[key]; process.env[key] = value;
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
  }
  const calls = { search: [], modify: [], unbind: 0, bind: [] };
  t.mock.method(Client.prototype, 'bind', async (...args) => { calls.bind.push(args); });
  t.mock.method(Client.prototype, 'search', async (...args) => { calls.search.push(args); return { searchEntries: calls.search.length === 1 ? entries : verify }; });
  t.mock.method(Client.prototype, 'modify', async (...args) => { calls.modify.push(args); if (modifyError) throw modifyError; assert.ok(args[1] instanceof Change); assert.ok(args[1].modification instanceof Attribute); });
  t.mock.method(Client.prototype, 'unbind', async () => { calls.unbind++; });
  return calls;
}

for (const stage of ['bind', 'search', 'verify']) {
  test(`${stage} failure is sanitized and client is closed`, async (t) => {
    const calls = mockLdap(t);
    if (stage === 'bind') t.mock.method(Client.prototype, 'bind', async () => { throw { code: 49, message: 'private' }; });
    else if (stage === 'search') t.mock.method(Client.prototype, 'search', async () => { throw new Error('private'); });
    else t.mock.method(Client.prototype, 'search', async () => {
      if (calls.modify.length) throw new Error('private');
      return { searchEntries: [{ dn: 'CN=Test,DC=example,DC=test' }] };
    });
    await assert.rejects(unlockActiveDirectoryUser({ samAccountName: 'test' }), { code: stage === 'bind' ? 'LDAP_SERVICE_BIND_FAILED' : stage === 'search' ? 'LDAP_SEARCH_FAILED' : 'LDAP_UNLOCK_UNVERIFIED' });
    assert.equal(calls.unbind, 1);
    assert.equal(calls.modify.length, stage === 'verify' ? 1 : 0);
  });
}

test('rejects invalid identifiers without binding', async (t) => {
  const calls = mockLdap(t);
  for (const samAccountName of ['', ' test', 'test ', 'a\0b', null, 42, 'a'.repeat(257)]) {
    assert.deepEqual(await unlockActiveDirectoryUser({ samAccountName }), { ok: false, reason: 'INVALID_ID' });
  }
  assert.equal(calls.bind.length, 0);
});

test('escapes filter metacharacters without constructing the target DN', async (t) => {
  const calls = mockLdap(t);
  await unlockActiveDirectoryUser({ samAccountName: 'a*)(x=\\' });
  assert.ok(calls.search[0][1].filter.includes('sAMAccountName=a\\2a\\29\\28x=\\5c'));
});

for (const [name, options, expected] of [
  ['missing user', { entries: [] }, 'NOT_FOUND'],
  ['ambiguous user', { entries: [{ dn: 'a' }, { dn: 'b' }] }, 'AMBIGUOUS_ID'],
  ['permission denied', { modifyError: { code: 50, message: 'private AD diagnostic' } }, 'LDAP_INSUFFICIENT_ACCESS'],
  ['modify error', { modifyError: { code: 53 } }, 'LDAP_MODIFY_FAILED'],
  ['readback still locked', { verify: [{ lockoutTime: '99', userAccountControl: '512' }] }, 'LDAP_UNLOCK_UNVERIFIED'],
  ['readback missing', { verify: [] }, 'LDAP_UNLOCK_UNVERIFIED']
]) {
  test(name, async (t) => {
    const calls = mockLdap(t, options);
    if (expected.startsWith('LDAP_')) await assert.rejects(unlockActiveDirectoryUser({ samAccountName: 'test' }), { code: expected });
    else {
      assert.deepEqual(await unlockActiveDirectoryUser({ samAccountName: 'test' }), { ok: false, reason: expected });
      assert.equal(calls.modify.length, 0);
    }
    assert.equal(calls.unbind, 1);
  });
}

test('disabled account remains disabled after clearing lockout', async (t) => {
  mockLdap(t, { verify: [{ lockoutTime: '0', userAccountControl: '514' }] });
  assert.equal((await unlockActiveDirectoryUser({ samAccountName: 'test' })).user.status, 'DISABLED');
});

test('unlock replaces only lockoutTime using LDAP Change and verifies exact directory DN', async (t) => {
  const calls = mockLdap(t);
  const result = await unlockActiveDirectoryUser({ samAccountName: 'test.user' });
  assert.equal(result.ok, true);
  assert.equal(result.user.status, 'ACTIVE');
  assert.equal(calls.modify.length, 1);
  const [dn, change] = calls.modify[0];
  assert.equal(dn, 'CN=Test\\, User,DC=example,DC=test');
  assert.equal(change.operation, 'replace');
  assert.equal(change.modification.type, 'lockoutTime');
  assert.deepEqual(change.modification.values, ['0']);
  assert.equal(calls.search[1][0], dn);
  assert.equal(calls.search[1][1].scope, 'base');
  assert.equal(calls.unbind, 1);
});
