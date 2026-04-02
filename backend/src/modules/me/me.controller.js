import { sendBinaryWithEtag } from '../../core/http/binary.js';
import { getMeBundleFromAuth, getMyStoredPhotoByEmployeeId, resolveEmployeeIdFromAuth, syncMyPhotoByEmployeeId } from './me.service.js';

export async function getMeController(req, res) {
  try {
    const bundle = await getMeBundleFromAuth(req.auth);
    if (!bundle) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    return res.json({ ok: true, ...bundle });
  } catch {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

export async function syncMyPhotoController(req, res) {
  try {
    const { employeeId } = await resolveEmployeeIdFromAuth(req.auth);
    const result = await syncMyPhotoByEmployeeId(employeeId);
    if (!result.ok) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({ ok: true, employeeId: result.employeeId, staffNo: result.staffNo, contentType: result.contentType });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'SYNC_FAILED';
    const status =
      code === 'LDAP_CONFIG_MISSING' || code === 'EMPLOYEE_ID_MISSING' || code === 'MISSING_USERNAME'
        ? 500
        : code.startsWith('LDAP_')
          ? 502
          : code === 'INVALID_ID'
            ? 400
            : 500;
    return res.status(status).json({ ok: false, error: code });
  }
}

export async function getMyPhotoController(req, res) {
  try {
    const { employeeId } = await resolveEmployeeIdFromAuth(req.auth);
    const row = await getMyStoredPhotoByEmployeeId(employeeId);
    if (!row) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return sendBinaryWithEtag(req, res, { contentType: row.contentType, body: row.photo });
  } catch (err) {
    const code = typeof err?.code === 'string' ? err.code : 'PHOTO_FAILED';
    const status =
      code === 'LDAP_CONFIG_MISSING' || code === 'EMPLOYEE_ID_MISSING' || code === 'MISSING_USERNAME'
        ? 500
        : code.startsWith('LDAP_')
          ? 502
          : code === 'INVALID_ID'
            ? 400
            : 500;
    return res.status(status).json({ ok: false, error: code });
  }
}

