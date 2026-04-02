import dotenv from 'dotenv';
import mssql from 'mssql';
import { getPool as getPostgresPool } from '../../../core/db/pg.js';
import { getActiveDirectoryUserBySamAccountName, listActiveDirectoryUsersPaginated } from '../../../integrations/ldap/ldap.client.js';
import { syncEmployeePhotosFromCardDb } from '../carddb-photo.service.js';

dotenv.config();

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

function normalizeColumnName(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectContentType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4) return 'application/octet-stream';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  return 'application/octet-stream';
}

async function connectCardDb() {
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

function parseTableOverride() {
  const raw = process.env.SRC_DB_TABLE;
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const parts = s.split('.');
  if (parts.length === 2) return { schema: parts[0], table: parts[1] };
  return { schema: 'dbo', table: s };
}

async function listCardCandidates(pool) {
  const result = await pool.request().query(`
    select s.name as schema_name, t.name as table_name
    from sys.tables t
    join sys.schemas s on s.schema_id = t.schema_id
    where t.is_ms_shipped = 0 and t.name like '%Card%'
    order by t.name asc
  `);
  return result.recordset.map((r) => ({ schema: r.schema_name, table: r.table_name }));
}

async function getTableColumns(pool, { schema, table }) {
  const fullName = `${schema}.${table}`;
  const result = await pool
    .request()
    .input('fullName', mssql.NVarChar, fullName)
    .query(
      `
      select c.name as column_name, ty.name as type_name
      from sys.columns c
      join sys.types ty on ty.user_type_id = c.user_type_id
      where c.object_id = object_id(@fullName)
      order by c.column_id asc
    `
    );

  return result.recordset.map((r) => ({ name: r.column_name, type: r.type_name }));
}

function pickBestMapping(columns) {
  const byNorm = columns.map((c) => ({
    ...c,
    norm: normalizeColumnName(c.name),
  }));

  const staffCandidates = byNorm.filter((c) => {
    const n = c.norm;
    return n.includes('staffno') || n === 'staff' || n.includes('employeeno') || n.includes('employeeid') || n === 'empid';
  });

  const photoCandidates = byNorm.filter((c) => {
    const n = c.norm;
    const typeOk = new Set(['varbinary', 'image', 'binary']).has(String(c.type).toLowerCase());
    return typeOk && (n.includes('photo') || n.includes('picture') || n.includes('image') || n.endsWith('img'));
  });

  const delCandidates = byNorm.filter((c) => {
    const n = c.norm;
    return n.includes('delstate') || n.includes('deleted') || n.includes('isdeleted') || n.includes('del') && n.includes('state');
  });

  const staff = staffCandidates[0]?.name ?? null;
  const photo = photoCandidates[0]?.name ?? null;
  const delState = delCandidates[0]?.name ?? null;

  if (!staff || !photo) return null;
  return { staffColumn: staff, photoColumn: photo, delStateColumn: delState };
}

async function resolveCardDbMapping(pool) {
  const override = parseTableOverride();
  if (override) {
    const cols = await getTableColumns(pool, override);
    const mapping = pickBestMapping(cols);
    if (!mapping) {
      const err = new Error(`SRC_DB_TABLE does not contain expected columns`);
      err.code = 'CARDDB_TABLE_INVALID';
      throw err;
    }
    return { ...override, ...mapping };
  }

  const candidates = await listCardCandidates(pool);
  if (candidates.length === 0) {
    const err = new Error('No Card* tables found');
    err.code = 'CARDDB_TABLE_NOT_FOUND';
    throw err;
  }

  let best = null;
  for (const c of candidates) {
    const cols = await getTableColumns(pool, c);
    const m = pickBestMapping(cols);
    if (!m) continue;
    const score = 100 + (m.delStateColumn ? 1 : 0);
    if (!best || score > best.score) best = { score, ...c, ...m };
  }

  if (!best) {
    const err = new Error('No Card* table with staff/photo columns found');
    err.code = 'CARDDB_MAPPING_NOT_FOUND';
    throw err;
  }

  return { schema: best.schema, table: best.table, staffColumn: best.staffColumn, photoColumn: best.photoColumn, delStateColumn: best.delStateColumn };
}

function buildDelStateFilter(mapping) {
  if (!mapping.delStateColumn) return '1=1';
  const c = quoteIdent(mapping.delStateColumn);
  return `(
    ${c} is null
    or lower(ltrim(rtrim(convert(varchar(32), ${c})))) in ('0','false','f','n','no','')
  )`;
}

async function fetchOnePhoto(pool, mapping, employeeId) {
  const staff = quoteIdent(mapping.staffColumn);
  const photo = quoteIdent(mapping.photoColumn);
  const schema = quoteIdent(mapping.schema);
  const table = quoteIdent(mapping.table);
  const delFilter = buildDelStateFilter(mapping);

  const result = await pool
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

  return result.recordset[0] ?? null;
}

async function fetchManyPhotos(pool, mapping, limit) {
  const staff = quoteIdent(mapping.staffColumn);
  const photo = quoteIdent(mapping.photoColumn);
  const schema = quoteIdent(mapping.schema);
  const table = quoteIdent(mapping.table);
  const delFilter = buildDelStateFilter(mapping);

  const result = await pool
    .request()
    .input('limit', mssql.Int, Number(limit))
    .query(
      `
      select top (@limit)
        ${staff} as staff_no,
        ${photo} as photo
      from ${schema}.${table}
      where ${photo} is not null
        and datalength(${photo}) > 0
        and ${staff} is not null
        and ltrim(rtrim(convert(varchar(64), ${staff}))) <> ''
        and ${delFilter}
      order by ${staff} asc
    `
    );

  return result.recordset;
}

async function upsertPhotoToPostgres({ employeeId, staffNo, contentType, photo }) {
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

function parseArgs(argv) {
  const args = { username: null, employeeId: null, all: false, limit: 100, probe: false, stats: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--employeeId' || a === '--employee-id') args.employeeId = argv[++i] ?? null;
    else if (a === '--username' || a === '--sam' || a === '--samAccountName') args.username = argv[++i] ?? null;
    else if (a === '--all') args.all = true;
    else if (a === '--limit') args.limit = Number(argv[++i] ?? '100');
    else if (a === '--probe') args.probe = true;
    else if (a === '--stats') args.stats = true;
    else if (!String(a).startsWith('-') && !args.username) args.username = a;
  }
  if (!args.username && typeof process.env.SYNC_PHOTO_USERNAME === 'string' && process.env.SYNC_PHOTO_USERNAME.trim()) {
    args.username = process.env.SYNC_PHOTO_USERNAME.trim();
  }
  if (!args.employeeId && typeof process.env.SYNC_PHOTO_EMPLOYEE_ID === 'string' && process.env.SYNC_PHOTO_EMPLOYEE_ID.trim()) {
    args.employeeId = process.env.SYNC_PHOTO_EMPLOYEE_ID.trim();
  }
  if (!args.all && (process.env.SYNC_PHOTO_ALL === 'true' || process.env.SYNC_PHOTO_ALL === '1' || process.env.SYNC_PHOTO_ALL === 'yes')) {
    args.all = true;
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = 100;
  if (process.env.SYNC_PHOTO_LIMIT && !Number.isNaN(Number(process.env.SYNC_PHOTO_LIMIT))) {
    args.limit = Number(process.env.SYNC_PHOTO_LIMIT);
  }
  return args;
}

async function fetchStats(pool, mapping) {
  const staff = quoteIdent(mapping.staffColumn);
  const photo = quoteIdent(mapping.photoColumn);
  const schema = quoteIdent(mapping.schema);
  const table = quoteIdent(mapping.table);

  const totalResult = await pool.request().query(`select count(*) as total from ${schema}.${table}`);
  const withPhotoResult = await pool
    .request()
    .query(`select count(*) as with_photo from ${schema}.${table} where ${photo} is not null and datalength(${photo}) > 0`);
  const sampleResult = await pool
    .request()
    .query(
      `select top (5) ${staff} as staff_no from ${schema}.${table} where ${photo} is not null and datalength(${photo}) > 0 and ${staff} is not null and ltrim(rtrim(convert(varchar(64), ${staff}))) <> '' order by ${staff} asc`
    );

  return {
    total: Number(totalResult.recordset?.[0]?.total ?? 0),
    withPhoto: Number(withPhotoResult.recordset?.[0]?.with_photo ?? 0),
    sampleStaffNos: sampleResult.recordset.map((r) => String(r.staff_no)).filter(Boolean)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const activeOnly = getBooleanEnv('SYNC_PHOTO_ACTIVE_ONLY', false);
  const adLimitRaw = process.env.SYNC_PHOTO_AD_LIMIT;
  const adLimit = adLimitRaw && !Number.isNaN(Number(adLimitRaw)) ? Number(adLimitRaw) : null;
  const concurrencyRaw = process.env.SYNC_PHOTO_CONCURRENCY;
  const concurrency = concurrencyRaw && !Number.isNaN(Number(concurrencyRaw)) ? Number(concurrencyRaw) : undefined;

  if (args.username && !args.employeeId && !args.all) {
    const samAccountName = String(args.username).trim();
    const result = await getActiveDirectoryUserBySamAccountName({ samAccountName });
    if (!result.ok) {
      process.stderr.write(`AD user not found: ${samAccountName}\n`);
      process.exitCode = result.reason === 'INVALID_ID' ? 2 : 1;
      return;
    }
    const employeeId = typeof result.user?.employeeId === 'string' ? result.user.employeeId.trim() : '';
    if (!employeeId) {
      process.stderr.write(`Missing employeeId in AD for ${samAccountName}\n`);
      process.exitCode = 1;
      return;
    }
    args.employeeId = employeeId;
  }

  if (!args.username && !args.employeeId && !args.all && !args.probe && !args.stats) {
    const ad = await listActiveDirectoryUsersPaginated({ activeOnly, limit: adLimit ?? undefined });
    const employeeIds = Array.from(
      new Set(
        ad.users
          .map((u) => (typeof u?.employeeId === 'string' ? u.employeeId.trim() : ''))
          .filter(Boolean)
      )
    );

    process.stdout.write(`AD users in scope: ${ad.users.length}\n`);
    process.stdout.write(`AD users with employeeId: ${employeeIds.length}\n`);

    const result = await syncEmployeePhotosFromCardDb(employeeIds, { concurrency });
    process.stdout.write(`Synced photos: ${result.synced}\n`);
    process.stdout.write(`Not found in CardDB: ${result.notFound}\n`);
    process.stdout.write(`Failed: ${result.failed}\n`);
    return;
  }
  const cardPool = await connectCardDb();
  try {
    const mapping = await resolveCardDbMapping(cardPool);
    process.stdout.write(
      `CardDB mapping: ${mapping.schema}.${mapping.table} staff=${mapping.staffColumn} photo=${mapping.photoColumn}${
        mapping.delStateColumn ? ` delState=${mapping.delStateColumn}` : ''
      }\n`
    );

    if (args.probe) return;

    if (args.stats) {
      const stats = await fetchStats(cardPool, mapping);
      process.stdout.write(`CardDB stats: total=${stats.total} withPhoto=${stats.withPhoto}\n`);
      if (stats.sampleStaffNos.length) process.stdout.write(`Sample staffNos with photos: ${stats.sampleStaffNos.join(', ')}\n`);
      return;
    }

    if (args.employeeId) {
      const row = await fetchOnePhoto(cardPool, mapping, args.employeeId);
      if (!row) {
        process.stdout.write(`No photo found for employeeId=${args.employeeId}\n`);
        return;
      }
      const photo = Buffer.isBuffer(row.photo) ? row.photo : Buffer.from(row.photo);
      const contentType = detectContentType(photo);
      await upsertPhotoToPostgres({ employeeId: args.employeeId, staffNo: row.staff_no, contentType, photo });
      process.stdout.write(`Saved photo for employeeId=${args.employeeId}\n`);
      return;
    }

    if (!args.all) {
      process.stderr.write(
        'Usage: node src/modules/carddb/cli/sync-photos.js --username <samAccountName> | --employeeId <id> | --all [--limit N] | --probe | --stats\n'
      );
      process.exitCode = 2;
      return;
    }

    const limit = Number.isFinite(args.limit) && args.limit > 0 ? Math.min(args.limit, 5000) : 100;
    const rows = await fetchManyPhotos(cardPool, mapping, limit);
    let saved = 0;
    for (const row of rows) {
      const employeeId = row.staff_no;
      if (employeeId == null || employeeId === '') continue;
      const photo = Buffer.isBuffer(row.photo) ? row.photo : Buffer.from(row.photo);
      const contentType = detectContentType(photo);
      await upsertPhotoToPostgres({ employeeId, staffNo: row.staff_no, contentType, photo });
      saved++;
    }
    process.stdout.write(`Saved ${saved} photos\n`);
  } finally {
    await cardPool.close().catch(() => undefined);
  }
}

main().catch((err) => {
  const code = typeof err?.code === 'string' ? err.code : 'SYNC_FAILED';
  process.stderr.write(`${code}\n`);
  if (typeof err?.message === 'string' && err.message) process.stderr.write(`${err.message}\n`);
  process.exitCode = 1;
});

