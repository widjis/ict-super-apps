import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'ldapts';
import { parseAllowedGroupDns } from '../src/integrations/ldap/ldap.client.js';
import { requireAdUnlockAdmin } from '../src/modules/ad/ad-unlock.security.js';

const approvedGroup = 'CN=VPN-IT,CN=Users,DC=mbma,DC=com';

for (const [name, raw, parsed, allowed] of [
  ['single full DN preserves commas', approvedGroup, [approvedGroup], true],
  ['semicolon list trims blanks and matches case insensitively', ` ; CN=Other,DC=test ; ${approvedGroup.toLowerCase()} ; `, ['CN=Other,DC=test', approvedGroup.toLowerCase()], true],
  ['unset denies', undefined, [], false],
  ['empty denies', '', [], false],
  ['whitespace denies', '   ', [], false],
  ['empty list denies', ' ; ; ', [], false],
  ['unrelated group denies', 'CN=Other,DC=test', ['CN=Other,DC=test'], false],
  ['DN fragment is not membership', 'CN=VPN-IT', ['CN=VPN-IT'], false]
]) {
  test(`shared allowed-group policy: ${name}`, async (t) => {
    const env = { LDAP_ALLOWED_GROUPS: raw, LDAP_URL: 'ldaps://invalid.test', LDAP_BIND_DN: 'CN=fixture', LDAP_BIND_PASSWORD: 'fixture-only', LDAP_SEARCH_BASE: 'DC=mbma,DC=com' };
    for (const [key, value] of Object.entries(env)) {
      const previous = process.env[key];
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
      t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
    }
    assert.deepEqual(parseAllowedGroupDns(), parsed);
    let binds = 0;
    t.mock.method(Client.prototype, 'bind', async () => { binds++; });
    t.mock.method(Client.prototype, 'unbind', async () => {});
    t.mock.method(Client.prototype, 'search', async () => ({ searchEntries: [{ dn: 'CN=Actor,DC=mbma,DC=com', sAMAccountName: 'actor', userAccountControl: '512', lockoutTime: '0', memberOf: approvedGroup }] }));
    const res = { locals: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    let authorized = false;
    const req = { auth: { username: 'actor', role: 'admin' } };
    await requireAdUnlockAdmin(req, res, () => { authorized = true; });
    assert.equal(authorized, allowed);
    assert.equal(binds, parsed.length ? 1 : 0);
    if (!allowed) {
      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.body, { ok: false, error: 'FORBIDDEN' });
    } else {
      // Membership is re-read on the next request, not trusted from login/token state.
      t.mock.method(Client.prototype, 'search', async () => ({ searchEntries: [{ dn: 'CN=Actor,DC=mbma,DC=com', sAMAccountName: 'actor', userAccountControl: '512', lockoutTime: '0', memberOf: [] }] }));
      authorized = false;
      await requireAdUnlockAdmin(req, res, () => { authorized = true; });
      assert.equal(authorized, false);
      assert.equal(res.statusCode, 403);
      assert.equal(binds, 2);
    }
  });
}
