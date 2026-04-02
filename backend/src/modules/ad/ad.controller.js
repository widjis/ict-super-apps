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
      if (result.reason === 'INVALID_ID') return res.status(400).json({ ok: false, error: 'INVALID_ID' });
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({ ok: true });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'AD_UNLOCK_FAILED';
    const status = code === 'LDAP_CONFIG_MISSING' ? 500 : code.startsWith('LDAP_') ? 502 : 500;
    return res.status(status).json({ ok: false, error: code });
  }
}
