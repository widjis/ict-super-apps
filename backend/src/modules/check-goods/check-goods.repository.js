import { getPool } from '../../core/db/pg.js';

export async function listChecksByPrfId(prfId) {
  const pool = getPool();
  const { rows } = await pool.query(
    'select prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at from prf_item_checks where prf_id = $1 order by prf_item_id asc',
    [prfId]
  );
  return rows;
}

export async function getCheckByItemId(itemId) {
  const pool = getPool();
  const { rows } = await pool.query(
    'select prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at from prf_item_checks where prf_item_id = $1 limit 1',
    [itemId]
  );
  return rows[0] ?? null;
}

export async function upsertItemCheck({ itemId, prfId, prfNo, checkStatus, notes, checkedByUserId }) {
  const pool = getPool();
  const { rows } = await pool.query(
    `insert into prf_item_checks (prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, now(), now())
     on conflict (prf_item_id) do update set
       prf_id = excluded.prf_id,
       prf_no = excluded.prf_no,
       check_status = excluded.check_status,
       notes = excluded.notes,
       checked_by_user_id = excluded.checked_by_user_id,
       checked_at = excluded.checked_at,
       updated_at = now()
     returning prf_item_id, prf_id, prf_no, check_status, notes, checked_by_user_id, checked_at, updated_at`,
    [itemId, prfId, prfNo, checkStatus, notes, checkedByUserId]
  );
  return rows[0] ?? null;
}
