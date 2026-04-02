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

function parseIntSafe(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function adFileTimeToDate(value) {
  if (value == null) return null;
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' && typeof s !== 'number') return null;
  const raw = String(s).trim();
  if (!raw || raw === '0') return null;
  let ft;
  try {
    ft = BigInt(raw);
  } catch {
    return null;
  }
  const ms = Number(ft / 10000n) - 11644473600000;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms);
}

function isDisabledFromUac(uac) {
  const n = parseIntSafe(uac);
  if (n == null) return null;
  return (n & 2) === 2;
}

function isLockedFromLockoutTime(lockoutTime) {
  const d = adFileTimeToDate(lockoutTime);
  return Boolean(d);
}

async function getServiceClient() {
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
    await client.bind(bindDN, bindPassword);
  } catch (err) {
    await client.unbind().catch(() => undefined);
    throw toLdapStageError('SERVICE_BIND', err);
  }

  return { client, baseDN };
}

function buildUserSearchFilter(query, activeOnly) {
  const q = typeof query === 'string' ? query.trim() : '';
  const escaped = q ? escapeLdapFilterValue(q) : '';

  const base = '(&(objectCategory=person)(objectClass=user)(!(objectClass=computer))';
  const active = activeOnly ? '(!(userAccountControl:1.2.840.113556.1.4.803:=2))' : '';

  if (!escaped) return `${base}${active})`;

  const any = `(|(displayName=*${escaped}*)(mail=*${escaped}*)(userPrincipalName=*${escaped}*)(sAMAccountName=*${escaped}*)(department=*${escaped}*)(title=*${escaped}*))`;
  return `${base}${active}${any})`;
}

function mapAdEntryToDirectoryUser(entry) {
  const dn = entry.dn;
  const username = entry.sAMAccountName ?? null;
  const displayName = entry.displayName ?? entry.cn ?? username ?? null;
  const title = entry.title ?? null;
  const department = entry.department ?? null;
  const upn = entry.userPrincipalName ?? null;
  const email = entry.mail ?? null;
  const employeeId = entry.employeeID ?? null;
  const locked = isLockedFromLockoutTime(entry.lockoutTime);
  const disabled = isDisabledFromUac(entry.userAccountControl);

  let status = 'ACTIVE';
  if (disabled === true) status = 'DISABLED';
  else if (locked) status = 'LOCKED';

  return {
    id: username,
    dn,
    displayName,
    title,
    department,
    upn,
    email,
    employeeId,
    status
  };
}

function mapAdEntryToUserDetails(entry) {
  const directory = mapAdEntryToDirectoryUser(entry);
  const mobile = entry.mobile ?? entry.telephoneNumber ?? null;
  const employeeId = entry.employeeID ?? null;

  const lastPasswordChange = adFileTimeToDate(entry.pwdLastSet);
  const expiry = adFileTimeToDate(entry['msDS-UserPasswordExpiryTimeComputed']);
  const now = Date.now();
  const expiresInDays = expiry ? Math.ceil((expiry.getTime() - now) / (1000 * 60 * 60 * 24)) : null;

  return {
    ...directory,
    mobile,
    employeeId,
    lastPasswordChange: lastPasswordChange ? lastPasswordChange.toISOString() : null,
    passwordExpiry: expiry ? expiry.toISOString() : null,
    passwordExpiresInDays: expiresInDays
  };
}

export async function searchActiveDirectoryUsers({ query, activeOnly, limit }) {
  const { client, baseDN } = await getServiceClient();
  try {
    const filter = buildUserSearchFilter(query, Boolean(activeOnly));
    const sizeLimit = typeof limit === 'number' && limit > 0 ? Math.min(limit, 200) : 50;

    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter,
      sizeLimit,
      attributes: [
        'dn',
        'cn',
        'displayName',
        'title',
        'department',
        'mail',
        'userPrincipalName',
        'sAMAccountName',
        'employeeID',
        'userAccountControl',
        'lockoutTime'
      ]
    });

    const users = searchEntries
      .map(mapAdEntryToDirectoryUser)
      .filter((u) => u.id);

    return { ok: true, users };
  } catch (err) {
    throw toLdapStageError('SEARCH', err);
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function listActiveDirectoryUsersPaginated({ activeOnly, pageSize, limit } = {}) {
  const { client, baseDN } = await getServiceClient();
  try {
    const filter = buildUserSearchFilter('', Boolean(activeOnly));
    const resolvedPageSize = typeof pageSize === 'number' && pageSize > 0 ? Math.min(pageSize, 2000) : 1000;
    const resolvedLimit = typeof limit === 'number' && limit > 0 ? limit : null;
    const users = [];

    for await (const page of client.searchPaginated(baseDN, {
      scope: 'sub',
      filter,
      sizeLimit: 0,
      paged: { pageSize: resolvedPageSize },
      attributes: [
        'dn',
        'cn',
        'displayName',
        'title',
        'department',
        'mail',
        'userPrincipalName',
        'sAMAccountName',
        'employeeID',
        'userAccountControl',
        'lockoutTime'
      ]
    })) {
      for (const entry of page.searchEntries) {
        const u = mapAdEntryToUserDetails(entry);
        if (!u.id) continue;
        users.push(u);
        if (resolvedLimit && users.length >= resolvedLimit) return { ok: true, users };
      }
    }

    return { ok: true, users };
  } catch (err) {
    throw toLdapStageError('SEARCH', err);
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function getActiveDirectoryUserBySamAccountName({ samAccountName }) {
  const { client, baseDN } = await getServiceClient();
  try {
    const safe = escapeLdapFilterValue(String(samAccountName ?? '').trim());
    if (!safe) return { ok: false, reason: 'INVALID_ID' };

    const filter = `(&(objectCategory=person)(objectClass=user)(!(objectClass=computer))(sAMAccountName=${safe}))`;
    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter,
      sizeLimit: 2,
      attributes: [
        'dn',
        'cn',
        'displayName',
        'title',
        'department',
        'mail',
        'userPrincipalName',
        'sAMAccountName',
        'employeeID',
        'mobile',
        'telephoneNumber',
        'userAccountControl',
        'lockoutTime',
        'pwdLastSet',
        'msDS-UserPasswordExpiryTimeComputed',
        'memberOf'
      ]
    });

    if (searchEntries.length !== 1) return { ok: false, reason: 'NOT_FOUND' };

    const entry = searchEntries[0];
    const details = mapAdEntryToUserDetails(entry);
    const memberOf = normalizeStringArray(entry.memberOf);

    return { ok: true, user: { ...details, memberOf } };
  } catch (err) {
    throw toLdapStageError('SEARCH', err);
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function unlockActiveDirectoryUser({ samAccountName }) {
  const { client, baseDN } = await getServiceClient();
  try {
    const safe = escapeLdapFilterValue(String(samAccountName ?? '').trim());
    if (!safe) return { ok: false, reason: 'INVALID_ID' };

    const filter = `(&(objectCategory=person)(objectClass=user)(!(objectClass=computer))(sAMAccountName=${safe}))`;
    const { searchEntries } = await client.search(baseDN, {
      scope: 'sub',
      filter,
      sizeLimit: 2,
      attributes: ['dn']
    });

    if (searchEntries.length !== 1) return { ok: false, reason: 'NOT_FOUND' };

    const dn = searchEntries[0].dn;

    try {
      await client.modify(dn, {
        operation: 'replace',
        modification: { lockoutTime: '0' }
      });
    } catch (err) {
      throw toLdapStageError('MODIFY', err);
    }

    return { ok: true };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

