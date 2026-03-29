import { getPool } from './db.js';

function ensureString(value) {
  return typeof value === 'string' ? value : null;
}

export async function upsertUserFromAd(client, adUser) {
  const adDn = ensureString(adUser?.dn);
  const username = ensureString(adUser?.username);
  if (!adDn || !username) {
    const err = new Error('Invalid AD user payload');
    err.code = 'AD_USER_INVALID';
    throw err;
  }

  const upn = ensureString(adUser?.upn);
  const email = ensureString(adUser?.email);
  const displayName = ensureString(adUser?.displayName);

  const { rows } = await client.query(
    `
      INSERT INTO users (ad_dn, username, upn, email, display_name, last_login_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, now(), now())
      ON CONFLICT (ad_dn) DO UPDATE SET
        username = EXCLUDED.username,
        upn = EXCLUDED.upn,
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        last_login_at = EXCLUDED.last_login_at,
        updated_at = EXCLUDED.updated_at
      RETURNING id
    `,
    [adDn, username, upn, email, displayName]
  );

  const userId = rows[0]?.id;
  return userId;
}

export async function ensureUserDefaults(client, userId) {
  await client.query(
    `INSERT INTO user_profiles (user_id, updated_at) VALUES ($1, now())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  await client.query(
    `INSERT INTO user_settings (user_id, updated_at) VALUES ($1, now())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

export async function replaceUserGroups(client, userId, groupDns) {
  const groups = Array.isArray(groupDns) ? groupDns.filter((g) => typeof g === 'string' && g.trim()) : [];

  await client.query('DELETE FROM user_group_memberships WHERE user_id = $1', [userId]);

  if (groups.length === 0) return;

  const values = [];
  const params = [];
  let idx = 1;
  for (const dn of groups) {
    values.push(`($${idx++}, $${idx++}, now())`);
    params.push(userId, dn);
  }

  await client.query(
    `INSERT INTO user_group_memberships (user_id, group_dn, created_at)
     VALUES ${values.join(', ')}`,
    params
  );
}

export async function insertLoginEvent(client, { userId, username, success, failureReason, ip, userAgent }) {
  await client.query(
    `
      INSERT INTO auth_login_events (user_id, username, success, failure_reason, ip, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, now())
    `,
    [
      userId ?? null,
      username ?? null,
      Boolean(success),
      failureReason ?? null,
      ip ?? null,
      userAgent ?? null
    ]
  );
}

export async function getUserBundleByIdOrDn({ userId, adDn }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `
      SELECT
        u.id,
        u.ad_dn,
        u.username,
        u.upn,
        u.email,
        u.display_name,
        u.job_title,
        u.department,
        u.avatar_url,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        p.bio,
        p.phone,
        p.location,
        s.appearance,
        s.notification_prefs,
        s.biometric_enabled
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN user_settings s ON s.user_id = u.id
      WHERE ($1::uuid IS NOT NULL AND u.id = $1::uuid) OR ($2::text IS NOT NULL AND u.ad_dn = $2::text)
      LIMIT 1
    `,
    [userId ?? null, adDn ?? null]
  );

  return rows[0] ?? null;
}

