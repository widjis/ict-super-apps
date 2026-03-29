import fs from 'node:fs';
import path from 'node:path';

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function getEnvValueFromFile(raw, name) {
  const m = raw.match(new RegExp(`^${name}=(.*)$`, 'm'));
  if (!m) return null;
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

function loadLocalPomonEnvIfNeeded() {
  const needKey = !process.env.POMON_API_KEY || process.env.POMON_API_KEY === '';
  const needBase =
    (!process.env.POMON_API_BASE_URL || process.env.POMON_API_BASE_URL === '') &&
    (!process.env.POMON_BASE_URL || process.env.POMON_BASE_URL === '');
  if (!needKey && !needBase) return;

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');

    if (!process.env.POMON_API_KEY || process.env.POMON_API_KEY === '') {
      const key = getEnvValueFromFile(raw, 'POMON_API_KEY');
      if (key) process.env.POMON_API_KEY = key;
    }

    if (!process.env.POMON_API_BASE_URL || process.env.POMON_API_BASE_URL === '') {
      const url = getEnvValueFromFile(raw, 'POMON_API_BASE_URL');
      if (url) process.env.POMON_API_BASE_URL = url;
    }

    if (!process.env.POMON_BASE_URL || process.env.POMON_BASE_URL === '') {
      const url = getEnvValueFromFile(raw, 'POMON_BASE_URL');
      if (url) process.env.POMON_BASE_URL = url;
    }
  } catch {}
}

export function getPomonConfig() {
  loadLocalPomonEnvIfNeeded();
  const baseUrl = normalizeBaseUrl(process.env.POMON_API_BASE_URL ?? process.env.POMON_BASE_URL ?? 'http://localhost:3001');
  const apiKey = process.env.POMON_API_KEY ?? '';
  return { baseUrl, apiKey };
}

export function createPomonClient() {
  async function requestJson(path, { method = 'GET', query = undefined, body = undefined, timeoutMs = 15000 } = {}) {
    const { baseUrl, apiKey } = getPomonConfig();
    const url = new URL(path, baseUrl);
    if (query && typeof query === 'object') {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method,
        headers: {
          accept: 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : undefined),
          ...(body ? { 'content-type': 'application/json' } : undefined),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const contentType = resp.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await resp.json().catch(() => null)
        : await resp.text().catch(() => null);

      return { ok: resp.ok, status: resp.status, payload };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { requestJson };
}
