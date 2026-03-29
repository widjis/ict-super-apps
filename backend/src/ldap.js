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

function toLdapStageError(stage, err) {
  const code = typeof err?.code === 'string' ? err.code : undefined;
  const message = typeof err?.message === 'string' ? err.message : '';

  const tlsHints = ['certificate', 'self signed', 'unable to verify', 'CERT_', 'tls', 'SSL'];
  const isTls = tlsHints.some((h) => message.toLowerCase().includes(h.toLowerCase())) || (code?.startsWith('CERT_') ?? false);

  const connectCodes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET']);
  const isConnect = code ? connectCodes.has(code) : false;

  const stageCode = `${stage}_FAILED`;
  const errCode = isTls ? 'LDAP_TLS_FAILED' : isConnect ? 'LDAP_CONNECT_FAILED' : `LDAP_${stageCode}`;

  const wrapped = new Error('LDAP operation failed');
  wrapped.code = errCode;
  wrapped.details = {
    stage,
    originalCode: code ?? null
  };
  return wrapped;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  if (typeof value === 'string' && value) return [value];
  return [];
}

function parseAllowedGroupDns() {
  const raw = process.env.LDAP_ALLOWED_GROUPS;
  if (!raw) return [];
  if (raw.includes(';')) {
    return raw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [raw.trim()].filter(Boolean);
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

  const defaultRejectUnauthorized = process.env.NODE_ENV === 'production';
  const allowInsecure = !getBooleanEnv('LDAP_TLS_REJECT_UNAUTHORIZED', defaultRejectUnauthorized);
  const client = new Client({
    url,
    timeout: 10_000,
    connectTimeout: 10_000,
    tlsOptions: allowInsecure ? { rejectUnauthorized: false } : undefined
  });

  try {
    try {
      await client.bind(bindDN, bindPassword);
    } catch (err) {
      throw toLdapStageError('SERVICE_BIND', err);
    }

    const safe = escapeLdapFilterValue(username);
    const filter = username.includes('@')
      ? `(userPrincipalName=${safe})`
      : `(sAMAccountName=${safe})`;

    let searchEntries;
    try {
      ({ searchEntries } = await client.search(baseDN, {
        scope: 'sub',
        filter,
        sizeLimit: 2,
        attributes: ['dn', 'cn', 'displayName', 'mail', 'sAMAccountName', 'userPrincipalName', 'memberOf']
      }));
    } catch (err) {
      throw toLdapStageError('SEARCH', err);
    }

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
      try {
        await verifyClient.bind(userDN, password);
      } catch {
        return { ok: false, reason: 'INVALID_CREDENTIALS' };
      }
    } catch {
      return { ok: false, reason: 'INVALID_CREDENTIALS' };
    } finally {
      await verifyClient.unbind().catch(() => undefined);
    }

    const memberOf = normalizeStringArray(entry.memberOf);
    const allowedGroups = parseAllowedGroupDns();
    if (allowedGroups.length > 0) {
      const memberOfLower = new Set(memberOf.map((dn) => dn.toLowerCase()));
      const ok = allowedGroups.some((dn) => memberOfLower.has(dn.toLowerCase()));
      if (!ok) {
        return { ok: false, reason: 'NOT_ALLOWED' };
      }
    }

    return {
      ok: true,
      user: {
        dn: userDN,
        username: entry.sAMAccountName ?? username,
        upn: entry.userPrincipalName ?? null,
        displayName: entry.displayName ?? entry.cn ?? null,
        email: entry.mail ?? null,
        memberOf
      }
    };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}
