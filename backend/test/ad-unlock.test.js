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
