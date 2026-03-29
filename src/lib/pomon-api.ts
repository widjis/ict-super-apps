import { authedGetJson } from './http';

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

export async function pomonGetStatusFilters() {
  return (await authedGetJson('/api/pomon/prfs/filters/status')) as PomonApiResponse<string[]>;
}

export async function pomonSearchPrfs(params: { q: string; limit?: number }) {
  return (await authedGetJson('/api/pomon/prfs/search', params)) as PomonApiResponse<PomonPrfSummary[]>;
}

export async function pomonGetPrfWithItems(id: number) {
  return (await authedGetJson(`/api/pomon/prfs/${id}/with-items`)) as PomonApiResponse<PomonPrfWithItems>;
}

export function setSelectedPomonPrfId(id: number) {
  localStorage.setItem('pomon_selected_prf_id', String(id));
}

export function getSelectedPomonPrfId() {
  const raw = localStorage.getItem('pomon_selected_prf_id');
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

