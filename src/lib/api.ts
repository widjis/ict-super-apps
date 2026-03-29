export function getApiBaseUrl() {
  const base = (import.meta as any).env?.VITE_API_BASE_URL;
  return typeof base === 'string' ? base.replace(/\/+$/, '') : '';
}

