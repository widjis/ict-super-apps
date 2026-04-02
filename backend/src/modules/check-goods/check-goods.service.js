import { getCheckByItemId, listChecksByPrfId, upsertItemCheck } from './check-goods.repository.js';

export async function listChecks(prfId) {
  return await listChecksByPrfId(prfId);
}

export async function getCheck(itemId) {
  return await getCheckByItemId(itemId);
}

export async function saveCheck({ itemId, prfId, prfNo, checkStatus, notes, checkedByUserId }) {
  return await upsertItemCheck({ itemId, prfId, prfNo, checkStatus, notes, checkedByUserId });
}

