import { getActiveDirectoryUserBySamAccountName, searchActiveDirectoryUsers, unlockActiveDirectoryUser } from '../../integrations/ldap/ldap.client.js';

export async function searchAdUsersController(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q : typeof req.query.query === 'string' ? req.query.query : '';
  const activeOnly = req.query.activeOnly === 'true' || req.query.activeOnly === '1';
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

  try {
    const result = await searchActiveDirectoryUsers({ query, activeOnly, limit });
    return res.json({ ok: true, users: result.users });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_SEARCH_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
}

export async function getAdUserController(req, res) {
  const samAccountName = req.params.samAccountName;
  try {
    const result = await getActiveDirectoryUserBySamAccountName({ samAccountName });
    if (!result.ok) {
      if (result.reason === 'INVALID_ID') return res.status(400).json({ ok: false, error: 'INVALID_ID' });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({ ok: true, user: result.user });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_LOOKUP_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
}

export async function unlockAdUserController(req, res) {
  const samAccountName = req.params.samAccountName;
  try {
    const result = await unlockActiveDirectoryUser({ samAccountName });
    if (!result.ok) {
      const status = result.reason === 'INVALID_ID' ? 400 : result.reason === 'AMBIGUOUS_ID' ? 409 : 404;
      res.locals.unlockOutcome = result.reason;
      return res.status(status).json({ ok: false, error: result.reason });
    }
    res.locals.unlockOutcome = 'SUCCESS';
    return res.json({ ok: true, user: result.user });
  } catch (err) {
    const safeCodes = ['LDAP_CONFIG_MISSING', 'LDAP_SERVICE_BIND_FAILED', 'LDAP_TLS_FAILED', 'LDAP_CONNECT_FAILED', 'LDAP_SEARCH_FAILED', 'LDAP_MODIFY_FAILED', 'LDAP_INSUFFICIENT_ACCESS', 'LDAP_UNLOCK_UNVERIFIED'];
    const code = safeCodes.includes(err?.code) ? err.code : 'AD_UNLOCK_FAILED';
    res.locals.unlockOutcome = code;
    const status = code === 'LDAP_CONFIG_MISSING' || code === 'AD_UNLOCK_FAILED' ? 500 : 502;
    return res.status(status).json({ ok: false, error: code });
  }
}
