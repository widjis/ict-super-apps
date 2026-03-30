import { authedGetJson, authedRequestJson } from './http';

export type CheckGoodsRecord = {
  prf_item_id: number;
  prf_id: number;
  prf_no: string | null;
  check_status: string;
  notes: string | null;
  checked_by_user_id: string | null;
  checked_at: string;
  updated_at: string;
};

export async function listCheckGoodsForPrf(prfId: number) {
  return (await authedGetJson(`/api/check-goods/prfs/${prfId}`)) as { ok: boolean; data: CheckGoodsRecord[] };
}

export async function upsertCheckGoodsForItem(itemId: number, payload: { prfId: number; prfNo?: string; checkStatus: string; notes?: string }) {
  return (await authedRequestJson(`/api/check-goods/items/${itemId}`, {
    method: 'PUT',
    bodyJson: payload,
  })) as { ok: boolean; data: CheckGoodsRecord | null };
}

