import { Client } from 'ldapts';

function escapeLdapFilterValue(value) {
  return value.replace(/[\0\(\)\*\\]/g, (ch) => {
    switch (ch) {
      case '\0':
        return '\\00';
      case '(':
        return '\\28';
      case ')':
        return '\\29';
      case '*':
        return '\\2a';
      case '\\':
        return '\\5c';
      default:
        return ch;
    }
  });
}

function getBooleanEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export async function authenticateWithActiveDirectory({ username, password }) {
  const url = process.env.LDAP_URL;
  const bindDN = process.env.LDAP_BIND_DN;
  const bindPassword = process.env.LDAP_BIND_PASSWORD;
  const baseDN = process.env.LDAP_SEARCH_BASE ?? process.env.LDAP_BASE_DN;

  if (!url || !bindDN || !bindPassword || !baseDN) {
    const missing = [
      !url ? 'LDAP_URL' : null,
      !bindDN ? 'LDAP_BIND_DN' : null,
      !bindPassword ? 'LDAP_BIND_PASSWORD' : null,
      !baseDN ? 'LDAP_SEARCH_BASE/LDAP_BASE_DN' : null
    ].filter(Boolean);
    const err = new Error(`Missing LDAP configuration: ${missing.join(', ')}`);
    err.code = 'LDAP_CONFIG_MISSING';
    throw err;
  }

  const allowInsecure = !getBooleanEnv('LDAP_TLS_REJECT_UNAUTHORIZED', true);
  const client = new Client({
    url,
    timeout: 10_000,
    connectTimeout: 10_000,
    tlsOptions: allowInsecure ? { rejectUnauthorized: false } : undefined
  });

  try {
    await client.bind(bindDN, bindPassword);

    const safe = escapeLdapFilterValue(username);
    const filter = username.includes('@')
      ? `(userPrincipalName=${safe})`
      : `(sAMAccountName=${safe})`;

    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter,
      sizeLimit: 2,
      attributes: ['dn', 'cn', 'displayName', 'mail', 'sAMAccountName', 'userPrincipalName', 'memberOf']
    });

    if (searchEntries.length !== 1) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    const entry = searchEntries[0];
    const userDN = entry.dn;

    const verifyClient = new Client({
      url,
      timeout: 10_000,
      connectTimeout: 10_000,
      tlsOptions: allowInsecure ? { rejectUnauthorized: false } : undefined
    });

    try {
      await verifyClient.bind(userDN, password);
    } catch {
      return { ok: false, reason: 'INVALID_CREDENTIALS' };
    } finally {
      await verifyClient.unbind().catch(() => undefined);
    }

    return {
      ok: true,
      user: {
        dn: userDN,
        username: entry.sAMAccountName ?? username,
        upn: entry.userPrincipalName ?? null,
        displayName: entry.displayName ?? entry.cn ?? null,
        email: entry.mail ?? null,
        memberOf: entry.memberOf ?? []
      }
    };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

