import { Pool } from 'pg';

function getBooleanEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export function resolvePostgresUrl() {
  const databaseUrl = process.env.POSTGRES_URL;
  if (!databaseUrl) {
    const err = new Error('POSTGRES_URL is not set');
    err.code = 'POSTGRES_URL_MISSING';
    throw err;
  }

  let u;
  try {
    u = new URL(databaseUrl);
  } catch {
    const err = new Error('POSTGRES_URL is not a valid URL');
    err.code = 'POSTGRES_URL_INVALID';
    throw err;
  }

  const username = process.env.POSTGRES_USERNAME?.trim();
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DATABASE?.trim();

  if (username) u.username = username;
  if (password != null) u.password = password;
  if (database) u.pathname = `/${database}`;

  const sslEnabled = getBooleanEnv('POSTGRES_SSL', false);
  const sslRejectUnauthorized = getBooleanEnv('POSTGRES_SSL_REJECT_UNAUTHORIZED', true);

  const params = u.searchParams;
  if (sslEnabled) {
    params.set('sslmode', 'require');
    if (!sslRejectUnauthorized) {
      params.set('sslaccept', 'accept_invalid_certs');
    }
  } else {
    params.set('sslmode', 'disable');
  }

  return u.toString();
}

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = resolvePostgresUrl();
    pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }
  return pool;
}

