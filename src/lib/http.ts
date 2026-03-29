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

