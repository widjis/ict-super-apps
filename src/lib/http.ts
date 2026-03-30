import { getAuthToken } from '../auth/storage';
import { getApiBaseUrl } from './api';

function buildUrl(path: string, query?: Record<string, unknown>) {
  const base = getApiBaseUrl();
  const url = new URL(`${base}${path}`, base ? undefined : window.location.origin);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function authedFetch(path: string, init?: RequestInit & { query?: Record<string, unknown> }) {
  const token = await getAuthToken();
  const query = (init as any)?.query as Record<string, unknown> | undefined;
  const headers: Record<string, string> = {};

  if (token) headers.Authorization = `Bearer ${token}`;
  if (init?.headers) {
    const h = init.headers as any;
    if (typeof h.forEach === 'function') {
      h.forEach((v: string, k: string) => (headers[k] = v));
    } else if (typeof h === 'object') {
      for (const [k, v] of Object.entries(h)) {
        if (typeof v === 'string') headers[k] = v;
      }
    }
  }

  const { query: _q, ...rest } = (init ?? {}) as any;
  const resp = await fetch(buildUrl(path, query), { ...rest, headers });
  if (!resp.ok) {
    const err = new Error('HTTP_ERROR');
    (err as any).status = resp.status;
    (err as any).text = await resp.text().catch(() => null);
    throw err;
  }
  return resp;
}

export async function authedGetJson(path: string, query?: Record<string, unknown>) {
  const token = await getAuthToken();
  const resp = await fetch(buildUrl(path, query), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const err = new Error('HTTP_ERROR');
    (err as any).status = resp.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export async function authedGetBlob(path: string, query?: Record<string, unknown>) {
  const resp = await authedFetch(path, { method: 'GET', query });
  return await resp.blob();
}
