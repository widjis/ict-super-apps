import { getCheck, listChecks, saveCheck } from './check-goods.service.js';

export async function listChecksByPrfController(req, res) {
  const prfId = Number(req.params.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const rows = await listChecks(prfId);
    return res.json({ ok: true, data: rows });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
}

export async function getCheckByItemController(req, res) {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  try {
    const row = await getCheck(itemId);
    return res.json({ ok: true, data: row });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
}

export async function upsertItemCheckController(req, res) {
  const itemId = Number(req.params.itemId);
  if (!Number.isFinite(itemId) || itemId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_ID' });

  const prfId = typeof req.body?.prfId === 'number' ? req.body.prfId : Number(req.body?.prfId);
  if (!Number.isFinite(prfId) || prfId <= 0) return res.status(400).json({ ok: false, error: 'INVALID_PRF_ID' });

  const prfNo = typeof req.body?.prfNo === 'string' ? req.body.prfNo.trim() : null;
  const checkStatus = typeof req.body?.checkStatus === 'string' ? req.body.checkStatus.trim() : '';
  if (!checkStatus) return res.status(400).json({ ok: false, error: 'INVALID_STATUS' });

  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : null;
  const checkedByUserId = typeof req.auth?.sub === 'string' ? req.auth.sub : null;

  try {
    const row = await saveCheck({ itemId, prfId, prfNo, checkStatus, notes, checkedByUserId });
    return res.json({ ok: true, data: row });
  } catch {
    return res.status(500).json({ ok: false, error: 'DB_ERROR' });
  }
}

