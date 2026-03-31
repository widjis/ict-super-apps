import { authedFetch, authedGetBlob, authedGetJson } from './http';

export type PomonListPrfsParams = {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  priority?: string;
  requestorId?: number;
  coaId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type PomonApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PomonPrfSummary = Record<string, unknown> & {
  PRFID?: number;
  PRFNo?: string;
  Title?: string;
  Department?: string;
  RequestedAmount?: number;
  ApprovedAmount?: number | null;
  Status?: string;
  Priority?: string;
  RequestDate?: string;
  RequiredDate?: string;
  RequestorName?: string;
  PurchaseCostCode?: string;
  BudgetYear?: number;
  DaysOpen?: number;
};

export type PomonPrfWithItems = Record<string, unknown> & {
  PRFID?: number;
  PRFNo?: string;
  Title?: string;
  Description?: string;
  Department?: string;
  RequestedAmount?: number;
  ApprovedAmount?: number | null;
  ActualAmount?: number | null;
  Status?: string;
  Priority?: string;
  RequestDate?: string;
  RequiredDate?: string;
  DateSubmit?: string;
  SubmitBy?: string;
  PurchaseCostCode?: string;
  RequiredFor?: string;
  BudgetYear?: number;
  Items?: Array<Record<string, unknown>>;
};

export async function pomonListPrfs(params: PomonListPrfsParams) {
  return (await authedGetJson('/api/pomon/prfs', params)) as PomonApiResponse<PomonPrfSummary[]>;
}

export async function pomonListPrfsWithItems(params: { page?: number; limit?: number }) {
  return (await authedGetJson('/api/pomon/prfs/with-items', params)) as PomonApiResponse<Array<PomonPrfWithItems>>;
}

export async function pomonGetStatusFilters() {
  return (await authedGetJson('/api/pomon/prfs/filters/status')) as PomonApiResponse<string[]>;
}

export async function pomonSearchPrfs(params: { q: string; limit?: number }) {
  return (await authedGetJson('/api/pomon/prfs/search', params)) as PomonApiResponse<PomonPrfSummary[]>;
}

export async function pomonGetPrfWithItems(id: number) {
  return (await authedGetJson(`/api/pomon/prfs/${id}/with-items`)) as PomonApiResponse<PomonPrfWithItems>;
}

export type PomonPrfDocument = Record<string, unknown> & {
  FileID?: number;
  PRFID?: number;
  OriginalFileName?: string;
  FileSize?: string | number;
  FileType?: string;
  MimeType?: string;
  UploadDate?: string;
  IsOriginalDocument?: boolean;
  Description?: string;
};

export async function pomonListPrfDocuments(prfId: number) {
  return (await authedGetJson(`/api/pomon/prf-documents/documents/${prfId}`)) as PomonApiResponse<PomonPrfDocument[]>;
}

export async function pomonGetPrfDocumentViewLink(fileId: number | string) {
  return (await authedGetJson(`/api/pomon/prf-documents/view-link/${fileId}`)) as { ok: boolean; url?: string };
}

export async function pomonGetPrfDocumentDownloadLink(fileId: number | string) {
  return (await authedGetJson(`/api/pomon/prf-documents/download-link/${fileId}`)) as { ok: boolean; url?: string };
}

export async function pomonViewPrfDocument(fileId: number | string) {
  return await authedGetBlob(`/api/pomon/prf-documents/view/${fileId}`);
}

export async function pomonDownloadPrfDocument(fileId: number | string) {
  return await authedGetBlob(`/api/pomon/prf-documents/download/${fileId}`);
}

export async function pomonUploadPrfFile(prfId: number, file: File, description?: string) {
  const form = new FormData();
  form.append('file', file);
  if (description) form.append('description', description);
  const resp = await authedFetch(`/api/pomon/prf-files/${prfId}/upload`, { method: 'POST', body: form });
  return (await resp.json().catch(() => null)) as unknown;
}

export async function pomonUpdatePrfItem(
  itemId: number,
  payload: { status?: string; pickedUpBy?: string; pickedUpByUserID?: number; pickedUpDate?: string; notes?: string }
) {
  const resp = await authedFetch(`/api/pomon/prfs/items/${itemId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return (await resp.json().catch(() => null)) as unknown;
}

export function setSelectedPomonPrfId(id: number) {
  localStorage.setItem('pomon_selected_prf_id', String(id));
}

export function getSelectedPomonPrfId() {
  const raw = localStorage.getItem('pomon_selected_prf_id');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
