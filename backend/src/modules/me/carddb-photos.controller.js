import { sendBinaryWithEtag } from '../../core/http/binary.js';
import { getStoredEmployeePhoto } from '../carddb/carddb-photo.service.js';

export async function getEmployeePhotoController(req, res) {
  const employeeId = String(req.params.employeeId ?? '').trim();
  if (!employeeId) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const row = await getStoredEmployeePhoto(employeeId);
    if (!row) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return sendBinaryWithEtag(req, res, { contentType: row.contentType, body: row.photo });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
}
