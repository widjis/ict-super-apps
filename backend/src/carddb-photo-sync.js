import mssql from 'mssql';
import { getPool as getPostgresPool } from './db.js';

function getBooleanEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function getRequiredEnv(name) {
  const v = process.env[name];
  if (typeof v === 'string' && v.trim()) return v.trim();
  const err = new Error(`Missing ${name}`);
  err.code = 'ENV_MISSING';
  throw err;
}

function quoteIdent(name) {
  return `[${String(name).replaceAll(']', ']]')}]`;
}

function detectContentType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return 'application/octet-stream';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  return 'application/octet-stream';
}

function resolveCardDbMapping() {
  const rawTable = typeof process.env.SRC_DB_TABLE === 'string' ? process.env.SRC_DB_TABLE.trim() : '';
  const staffColumn = (typeof process.env.SRC_DB_STAFF_COLUMN === 'string' && process.env.SRC_DB_STAFF_COLUMN.trim()) ? process.env.SRC_DB_STAFF_COLUMN.trim() : 'StaffNo';
  const photoColumn = (typeof process.env.SRC_DB_PHOTO_COLUMN === 'string' && process.env.SRC_DB_PHOTO_COLUMN.trim()) ? process.env.SRC_DB_PHOTO_COLUMN.trim() : 'Photo';
  const delStateColumn =
    (typeof process.env.SRC_DB_DELSTATE_COLUMN === 'string' && process.env.SRC_DB_DELSTATE_COLUMN.trim())
      ? process.env.SRC_DB_DELSTATE_COLUMN.trim()
      : 'Del_State';

  let schema = 'dbo';
  let table = 'CardDB';
  if (rawTable) {
    const parts = rawTable.split('.');
    if (parts.length === 2) {
      schema = parts[0];
      table = parts[1];
    } else {
      table = rawTable;
    }
  }

  return { schema, table, staffColumn, photoColumn, delStateColumn };
}

function buildDelStateFilterSql(mapping) {
  const c = quoteIdent(mapping.delStateColumn);
  return `(
    ${c} is null
    or lower(ltrim(rtrim(convert(varchar(32), ${c})))) in ('0','false','f','n','no','')
  )`;
}

export async function connectCardDb() {
  const server = getRequiredEnv('SRC_DB_SERVER');
  const database = getRequiredEnv('SRC_DB_DATABASE');
  const user = getRequiredEnv('SRC_DB_USER');
  const password = getRequiredEnv('SRC_DB_PASSWORD');
  const port = Number(process.env.SRC_DB_PORT ?? 1433);
  const encrypt = getBooleanEnv('SRC_DB_ENCRYPT', true);
  const trustServerCertificate = getBooleanEnv('SRC_DB_TRUST_SERVER_CERTIFICATE', false);

  const pool = await mssql.connect({
    server,
    database,
    user,
    password,
    port: Number.isFinite(port) ? port : 1433,
    options: {
      encrypt,
      trustServerCertificate
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30_000
    },
    connectionTimeout: 15_000,
    requestTimeout: 30_000
  });

  return pool;
}

export async function fetchCardDbEmployeePhoto(cardPool, employeeId) {
  const mapping = resolveCardDbMapping();
  const staff = quoteIdent(mapping.staffColumn);
  const photo = quoteIdent(mapping.photoColumn);
  const schema = quoteIdent(mapping.schema);
  const table = quoteIdent(mapping.table);
  const delFilter = buildDelStateFilterSql(mapping);

  const result = await cardPool
    .request()
    .input('employeeId', mssql.NVarChar, String(employeeId))
    .query(
      `
      select top (1)
        ${staff} as staff_no,
        ${photo} as photo
      from ${schema}.${table}
      where ${staff} = @employeeId
        and ${photo} is not null
        and datalength(${photo}) > 0
        and ${delFilter}
    `
    );

  const row = result.recordset[0] ?? null;
  if (!row) return null;
  const buf = Buffer.isBuffer(row.photo) ? row.photo : Buffer.from(row.photo);
  const staffNo = row.staff_no == null ? null : String(row.staff_no).trim();
  return { staffNo, photo: buf, contentType: detectContentType(buf) };
}

export async function upsertEmployeePhotoToPostgres({ employeeId, staffNo, contentType, photo }) {
  const pg = getPostgresPool();
  await pg.query(
    `
    insert into carddb_employee_photos (employee_id, staff_no, content_type, photo, created_at, updated_at)
    values ($1, $2, $3, $4, now(), now())
    on conflict (employee_id) do update set
      staff_no = excluded.staff_no,
      content_type = excluded.content_type,
      photo = excluded.photo,
      updated_at = now()
  `,
    [String(employeeId).trim(), staffNo ? String(staffNo).trim() : null, contentType, photo]
  );
}

export async function syncEmployeePhotoFromCardDb(employeeId) {
  const cardPool = await connectCardDb();
  try {
    const found = await fetchCardDbEmployeePhoto(cardPool, employeeId);
    if (!found) return { ok: false, reason: 'NOT_FOUND' };
    await upsertEmployeePhotoToPostgres({ employeeId, staffNo: found.staffNo, contentType: found.contentType, photo: found.photo });
    return { ok: true, employeeId: String(employeeId).trim(), staffNo: found.staffNo, contentType: found.contentType };
  } finally {
    await cardPool.close().catch(() => undefined);
  }
}

export async function syncEmployeePhotosFromCardDb(employeeIds, { concurrency } = {}) {
  const ids = Array.isArray(employeeIds) ? employeeIds.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
  const limit = typeof concurrency === 'number' && concurrency > 0 ? Math.min(concurrency, 10) : 4;
  if (ids.length === 0) return { ok: true, total: 0, synced: 0, notFound: 0, failed: 0 };

  const cardPool = await connectCardDb();
  try {
    let next = 0;
    let synced = 0;
    let notFound = 0;
    let failed = 0;

    async function worker() {
      while (true) {
        const i = next++;
        if (i >= ids.length) return;
        const employeeId = ids[i];
        try {
          const found = await fetchCardDbEmployeePhoto(cardPool, employeeId);
          if (!found) {
            notFound++;
            continue;
          }
          await upsertEmployeePhotoToPostgres({ employeeId, staffNo: found.staffNo, contentType: found.contentType, photo: found.photo });
          synced++;
        } catch {
          failed++;
        }
      }
    }

    const workers = Array.from({ length: Math.min(limit, ids.length) }, () => worker());
    await Promise.all(workers);
    return { ok: true, total: ids.length, synced, notFound, failed };
  } finally {
    await cardPool.close().catch(() => undefined);
  }
}

export async function getStoredEmployeePhoto(employeeId) {
  const pg = getPostgresPool();
  const { rows } = await pg.query(
    'select employee_id, staff_no, content_type, photo, updated_at from carddb_employee_photos where employee_id = $1 limit 1',
    [String(employeeId).trim()]
  );
  const row = rows[0] ?? null;
  if (!row) return null;
  return {
    employeeId: row.employee_id,
    staffNo: row.staff_no,
    contentType: row.content_type,
    photo: row.photo,
    updatedAt: row.updated_at
  };
}
