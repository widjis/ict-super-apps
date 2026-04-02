import { getActiveDirectoryUserBySamAccountName } from '../../integrations/ldap/ldap.client.js';
import { getUserBundleByIdOrDn } from '../users/user.repository.js';
import { getStoredEmployeePhoto, syncEmployeePhotoFromCardDb } from '../carddb/carddb-photo.service.js';

export async function getMeBundleFromAuth(auth) {
  const sub = typeof auth?.sub === 'string' ? auth.sub : null;
  const adDn = typeof auth?.adDn === 'string' ? auth.adDn : null;
  const isUuid = Boolean(sub && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub));

  const row = await getUserBundleByIdOrDn({ userId: isUuid ? sub : null, adDn: !isUuid ? (adDn ?? sub) : adDn });
  if (!row) return null;

  const user = {
    id: row.id,
    adDn: row.ad_dn,
    username: row.username,
    upn: row.upn,
    email: row.email,
    displayName: row.display_name,
    jobTitle: row.job_title,
    department: row.department,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  const profile = {
    bio: row.bio,
    phone: row.phone,
    location: row.location
  };

  const settings = {
    appearance: row.appearance,
    notificationPrefs: row.notification_prefs,
    biometricEnabled: row.biometric_enabled
  };

  return { user, profile, settings };
}

export async function resolveEmployeeIdFromAuth(auth) {
  const username = typeof auth?.username === 'string' ? auth.username.trim() : '';
  if (!username) {
    const err = new Error('Missing username in token');
    err.code = 'MISSING_USERNAME';
    throw err;
  }

  const result = await getActiveDirectoryUserBySamAccountName({ samAccountName: username });
  if (!result.ok) {
    const err = new Error('User not found in AD');
    err.code = result.reason === 'INVALID_ID' ? 'INVALID_ID' : 'NOT_FOUND';
    throw err;
  }

  const employeeId = typeof result.user?.employeeId === 'string' ? result.user.employeeId.trim() : null;
  if (!employeeId) {
    const err = new Error('Missing employeeId in AD');
    err.code = 'EMPLOYEE_ID_MISSING';
    throw err;
  }

  return { employeeId, adUser: result.user };
}

export async function syncMyPhotoByEmployeeId(employeeId) {
  return await syncEmployeePhotoFromCardDb(employeeId);
}

export async function getMyStoredPhotoByEmployeeId(employeeId) {
  return await getStoredEmployeePhoto(employeeId);
}
