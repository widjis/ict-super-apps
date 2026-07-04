import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RouterOSAPI } from 'node-routeros';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const host = (process.env.MIKROTIK_HOST || process.env.MIKROTIK_IP || '').trim();
const user = (process.env.MIKROTIK_USER || process.env.MIKROTIK_USERNAME || '').trim();
const password = (process.env.MIKROTIK_PASSWORD || '').trim();
const timeout = Number.parseInt(process.env.MIKROTIK_TIMEOUT, 10) || 20000;

if (!host || !user || !password) {
  console.error('Missing MikroTik config. Set MIKROTIK_IP (atau MIKROTIK_HOST), MIKROTIK_USERNAME (atau MIKROTIK_USER), dan MIKROTIK_PASSWORD di backend/.env');
  process.exit(2);
}

const defaultAllowedAddressPools = new Set([
  'CONTRACTOR_VLAN_67',
]);

const defaultAllowedPrefixAddressPools = [];

const normalize = (v) => String(v ?? '').trim();

const parseArgs = (argv) => {
  const deletePools = [];
  const filterPools = [];
  let filterAllPools = false;
  let deleteAllPools = false;
  let deleteMacCsv = '';
  const deleteMacs = [];
  let includeStatic = false;
  let dryRun = true;
  let skipBound = false;
  let yearMonth = '';
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const a = normalize(argv[i]);
    if (!a) continue;

    if (a === '--help' || a === '-h') {
      help = true;
      continue;
    }

    if (a === '--apply') {
      dryRun = false;
      continue;
    }

    if (a === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (a === '--include-static') {
      includeStatic = true;
      continue;
    }

    if (a === '--skip-bound') {
      skipBound = true;
      continue;
    }

    const readValue = () => {
      const eq = a.indexOf('=');
      if (eq >= 0) return normalize(a.slice(eq + 1));
      const next = normalize(argv[i + 1]);
      if (next && !next.startsWith('-')) {
        i += 1;
        return next;
      }
      return '';
    };

    if (a === '--ym' || a.startsWith('--ym=')) {
      const v = readValue();
      if (v) yearMonth = v;
      continue;
    }

    if (a === '--delete-mac-csv' || a.startsWith('--delete-mac-csv=')) {
      const v = readValue();
      if (v) deleteMacCsv = v;
      continue;
    }

    if (a === '--delete-mac' || a.startsWith('--delete-mac=')) {
      const v = readValue();
      if (v) deleteMacs.push(v);
      continue;
    }

    if (a === '--delete-pool' || a.startsWith('--delete-pool=')) {
      const v = readValue();
      if (!v || v === '*') {
        deleteAllPools = true;
      } else {
        deletePools.push(v);
      }
      continue;
    }

    if (a === '--filter-pool' || a.startsWith('--filter-pool=')) {
      const v = readValue();
      if (!v || v === '*') {
        filterAllPools = true;
      } else {
        filterPools.push(v);
      }
      continue;
    }
  }

  const mode = deleteAllPools || deletePools.length > 0 || Boolean(deleteMacCsv) || deleteMacs.length > 0 ? 'delete' : 'export';
  return {
    mode,
    help,
    dryRun,
    includeStatic,
    skipBound,
    yearMonth,
    filterAllPools,
    deleteAllPools,
    deleteMacCsv,
    deleteMacs,
    deletePools,
    filterPools,
  };
};

const usage = () => {
  console.log('Usage:');
  console.log('  node backend/scripts/export_mikrotik_leases_csv.js [--filter-pool <POOL|*>]...');
  console.log('  node backend/scripts/export_mikrotik_leases_csv.js --delete-pool <POOL|*> [--apply] [--dry-run] [--include-static] [--skip-bound] [--ym YYYY-MM]');
  console.log('  node backend/scripts/export_mikrotik_leases_csv.js --delete-mac-csv <PATH> [--apply] [--dry-run] [--include-static] [--skip-bound] [--ym YYYY-MM]');
  console.log('  node backend/scripts/export_mikrotik_leases_csv.js --delete-mac <MAC> [--delete-mac <MAC>]... [--apply] [--dry-run] [--include-static] [--skip-bound] [--ym YYYY-MM]');
  console.log('');
  console.log('Options:');
  console.log('  --filter-pool <POOL|*>   Export hanya pool tertentu (bisa diulang). Tanpa nilai / "*" = semua pool. Default: CONTRACTOR_VLAN_67');
  console.log('  --delete-pool <POOL|*>   Mode delete: hapus lease yang masuk pool (bisa diulang). Tanpa nilai / "*" = semua pool.');
  console.log('  --delete-mac-csv <PATH>  Mode delete: hapus lease yang mac-address ada di file CSV/teks.');
  console.log('  --delete-mac <MAC>       Mode delete: hapus lease berdasarkan MAC (bisa diulang).');
  console.log('  --dry-run                Default. Tidak melakukan delete, hanya preview.');
  console.log('  --apply                  Eksekusi delete (non-dry-run).');
  console.log('  --include-static         Ikut menghapus static lease (default: hanya dynamic).');
  console.log('  --skip-bound             Skip lease status=bound saat mode delete.');
  console.log('  --ym YYYY-MM             Filter berdasarkan lastConnectedDate (bulan & tahun).');
};

const deviceTypeFromPool = (poolName) => {
  const p = normalize(poolName);
  if (!p) return '';
  if (p === 'CONTRACTOR_VLAN_67') return 'PC / Laptop';
  if (p === 'EMPLOYEE - FULL_VLAN_63') return 'PC / Laptop';
  if (p === 'EMPLOYEE - LIMITED_VLAN_63') return 'PC / Laptop';
  if (p === 'VISITOR-STAFF_VLAN_64') return 'Mobile Device';
  if (p === 'VISITOR-MANAGEMENT_VLAN_64') return 'Mobile Device';
  if (p.startsWith('VISITOR-NON_STAFF_VLAN_64_')) return 'Mobile Device';
  return '';
};

const formatDateYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ipToInt = (ip) => {
  const parts = normalize(ip).split('.').map(n => Number.parseInt(n, 10));
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
};

const parseLastSeenSeconds = (lastSeen) => {
  const s = normalize(lastSeen).toLowerCase();
  if (!s || s === 'never') return null;
  let total = 0;
  const re = /(\d+)\s*([wdhms])/g;
  let m;
  let matched = false;
  while ((m = re.exec(s)) !== null) {
    matched = true;
    const n = Number.parseInt(m[1], 10);
    const unit = m[2];
    if (Number.isNaN(n)) continue;
    if (unit === 'w') total += n * 7 * 24 * 60 * 60;
    else if (unit === 'd') total += n * 24 * 60 * 60;
    else if (unit === 'h') total += n * 60 * 60;
    else if (unit === 'm') total += n * 60;
    else if (unit === 's') total += n;
  }
  if (!matched) return null;
  return total;
};

const lastConnectedDateFromLastSeen = (lastSeen, nowMs) => {
  const seconds = parseLastSeenSeconds(lastSeen);
  if (seconds === null) return null;
  return new Date(nowMs - seconds * 1000);
};

const parseYearMonth = (ym) => {
  const s = normalize(ym);
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
  return { year, month };
};

const matchesYearMonth = (d, ym) => {
  if (!ym) return true;
  if (!d) return false;
  return d.getFullYear() === ym.year && d.getMonth() + 1 === ym.month;
};

const normalizeMac = (mac) => normalize(mac).replace(/-/g, ':').toUpperCase();

const extractMacsFromText = (text) => {
  const macs = new Set();
  const re = /\b[0-9a-fA-F]{2}(?:(?::|-)[0-9a-fA-F]{2}){5}\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    macs.add(normalizeMac(m[0]));
  }
  return macs;
};

const isPoolNameAllowed = (poolName, allowedAddressPools, allowedPrefixAddressPools) => {
  const p = normalize(poolName);
  if (!p) return false;
  if (allowedAddressPools.has(p)) return true;
  return allowedPrefixAddressPools.some(prefix => p.startsWith(prefix));
};

const parsePoolRanges = (ranges) => {
  const s = normalize(ranges);
  if (!s) return [];
  return s
    .split(',')
    .map(r => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [start, end] = r.split('-').map(x => x.trim());
      const a = ipToInt(start);
      const b = ipToInt(end || start);
      if (a === null || b === null) return null;
      return a <= b ? { start: a, end: b } : { start: b, end: a };
    })
    .filter(Boolean);
};

const buildPoolsByPredicate = (pools, predicate) => {
  const out = [];
  for (const p of pools) {
    const name = normalize(p?.name);
    if (!name) continue;
    if (predicate && !predicate(name)) continue;
    out.push({ name, ranges: parsePoolRanges(p?.ranges) });
  }
  return out;
};

const findPoolByAddress = (allowedPools, address) => {
  const ip = ipToInt(address);
  if (ip === null) return null;
  for (const p of allowedPools) {
    for (const r of p.ranges) {
      if (ip >= r.start && ip <= r.end) return p.name;
    }
  }
  return null;
};

const getPoolNameForLease = (lease, poolNameSet, allowedPools, allowedAddressPools, allowedPrefixAddressPools) => {
  const raw = normalize(lease?.address);
  if (poolNameSet.has(raw)) {
    return isPoolNameAllowed(raw, allowedAddressPools, allowedPrefixAddressPools) ? raw : null;
  }
  const byIp = findPoolByAddress(allowedPools, raw);
  if (!byIp) return null;
  return isPoolNameAllowed(byIp, allowedAddressPools, allowedPrefixAddressPools) ? byIp : null;
};

const csvEscape = (value) => {
  if (value instanceof Date) return csvEscape(formatDateYMD(value));
  const s = String(value ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const pick = (lease, key) => lease?.[key] ?? '';

const toCsvRow = (lease, addressPool, nowMs) => {
  const rawAddress = pick(lease, 'address');
  const ipAddress = ipToInt(rawAddress) === null ? '' : rawAddress;
  const row = {
    id: pick(lease, '.id'),
    addressPool,
    deviceType: deviceTypeFromPool(addressPool),
    addressRaw: rawAddress,
    ipAddress,
    server: pick(lease, 'server'),
    macAddress: pick(lease, 'mac-address'),
    hostName: pick(lease, 'host-name'),
    comment: pick(lease, 'comment'),
    status: pick(lease, 'status'),
    lastConnectedDate: lastConnectedDateFromLastSeen(pick(lease, 'last-seen'), nowMs),
    activeAddress: pick(lease, 'active-address'),
    activeMacAddress: pick(lease, 'active-mac-address'),
    activeHostName: pick(lease, 'active-host-name'),
    expiresAfter: pick(lease, 'expires-after'),
    disabled: pick(lease, 'disabled'),
  };
  return row;
};

const headers = [
  'id',
  'addressPool',
  'deviceType',
  'addressRaw',
  'ipAddress',
  'server',
  'macAddress',
  'hostName',
  'comment',
  'status',
  'lastConnectedDate',
  'activeAddress',
  'activeMacAddress',
  'activeHostName',
  'expiresAfter',
  'disabled',
];

const isDynamicLease = (lease) => {
  const v = normalize(lease?.dynamic).toLowerCase();
  return v === 'true' || v === 'yes';
};

const isBoundLease = (lease) => normalize(lease?.status).toLowerCase() === 'bound';

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const ym = parseYearMonth(args.yearMonth);
  if (normalize(args.yearMonth) && !ym) {
    console.error('Invalid --ym format. Gunakan YYYY-MM (contoh: --ym 2026-04)');
    process.exitCode = 2;
    return;
  }

  const deleteMacSet = new Set(args.deleteMacs.map(m => normalizeMac(m)).filter(Boolean));
  if (args.deleteMacCsv) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), args.deleteMacCsv), 'utf8');
      const macsFromFile = extractMacsFromText(content);
      for (const m of macsFromFile) deleteMacSet.add(m);
    } catch (e) {
      const msg = e?.message ? String(e.message) : String(e);
      console.error(`Gagal baca --delete-mac-csv: ${msg}`);
      process.exitCode = 2;
      return;
    }
  }

  const conn = new RouterOSAPI({ host, user, password, timeout });
  try {
    const nowMs = Date.now();
    await conn.connect();
    const pools = await conn.write('/ip/pool/print');
    const leases = await conn.write('/ip/dhcp-server/lease/print');

    const poolsList = Array.isArray(pools) ? pools : [];
    const poolsWithRanges = buildPoolsByPredicate(poolsList, null);
    const poolNameSet = new Set(poolsWithRanges.map(p => normalize(p.name)).filter(Boolean));

    if (args.mode === 'delete') {
      const targets = new Set(args.deletePools.map(p => normalize(p)).filter(Boolean));
      const deleteAllPools = Boolean(args.deleteAllPools) || targets.size === 0;

      const allLeases = Array.isArray(leases) ? leases : [];
      const matches = allLeases
        .map((l) => {
          const raw = normalize(l?.address);
          const poolName = poolNameSet.has(raw) ? raw : findPoolByAddress(poolsWithRanges, raw);
          if (!deleteAllPools) {
            if (!poolName) return null;
            if (!targets.has(normalize(poolName))) return null;
          }
          if (!args.includeStatic && !isDynamicLease(l)) return null;
          if (args.skipBound && isBoundLease(l)) return null;
          const lastConnectedDate = lastConnectedDateFromLastSeen(pick(l, 'last-seen'), nowMs);
          if (!matchesYearMonth(lastConnectedDate, ym)) return null;
          if (deleteMacSet.size > 0) {
            const mac = normalizeMac(pick(l, 'mac-address'));
            if (!deleteMacSet.has(mac)) return null;
          }
          return { lease: l, poolName: poolName || '' };
        })
        .filter(Boolean);

      const ids = matches.map(m => normalize(m.lease?.['.id'])).filter(Boolean);
      const total = ids.length;
      const targetList = deleteAllPools ? '*' : Array.from(targets).join(', ');
      const macFilterInfo = deleteMacSet.size > 0 ? ` (mac filter: ${deleteMacSet.size})` : '';

      if (args.dryRun) {
        console.log(`[DRY RUN] Akan menghapus ${total} lease dari pool: ${targetList}${macFilterInfo}`);
        const sample = matches.slice(0, 20).map(m => ({
          id: normalize(m.lease?.['.id']),
          address: normalize(m.lease?.address),
          mac: normalize(m.lease?.['mac-address']),
          host: normalize(m.lease?.['host-name']),
          dynamic: normalize(m.lease?.dynamic),
          pool: normalize(m.poolName),
        }));
        console.log(`[DRY RUN] Sample (maks 20): ${JSON.stringify(sample)}`);
        console.log('[DRY RUN] Jalankan dengan --apply untuk eksekusi delete');
        return;
      }

      console.log(`Menghapus ${total} lease dari pool: ${targetList}${macFilterInfo}`);
      let ok = 0;
      let fail = 0;
      for (const id of ids) {
        try {
          await conn.write('/ip/dhcp-server/lease/remove', [`=.id=${id}`]);
          ok += 1;
        } catch (e) {
          fail += 1;
          const msg = e?.message ? String(e.message) : String(e);
          console.error(`Gagal remove .id=${id}: ${msg}`);
        }
      }
      console.log(`Delete selesai. ok=${ok}, fail=${fail}`);
      return;
    }

    const filterExact = args.filterPools.map(p => normalize(p)).filter(Boolean);
    const allowedAddressPools = filterExact.length > 0 ? new Set(filterExact) : defaultAllowedAddressPools;
    const allowedPrefixAddressPools = defaultAllowedPrefixAddressPools;
    const allowedPools = buildPoolsByPredicate(poolsList, (name) => {
      if (allowedAddressPools.has(name)) return true;
      return allowedPrefixAddressPools.some(prefix => name.startsWith(prefix));
    });

    const filtered = Array.isArray(leases)
      ? leases
          .map((l) => {
            if (args.filterAllPools) {
              const raw = normalize(l?.address);
              const poolName = poolNameSet.has(raw) ? raw : findPoolByAddress(poolsWithRanges, raw);
              if (!poolName) return null;
              const lastConnectedDate = lastConnectedDateFromLastSeen(pick(l, 'last-seen'), nowMs);
              if (!matchesYearMonth(lastConnectedDate, ym)) return null;
              return { lease: l, poolName };
            }

            const poolName = getPoolNameForLease(l, poolNameSet, allowedPools, allowedAddressPools, allowedPrefixAddressPools);
            if (!poolName) return null;
            const lastConnectedDate = lastConnectedDateFromLastSeen(pick(l, 'last-seen'), nowMs);
            if (!matchesYearMonth(lastConnectedDate, ym)) return null;
            return { lease: l, poolName };
          })
          .filter(Boolean)
      : [];

    const rows = filtered.map(x => toCsvRow(x.lease, x.poolName, nowMs));
    const csvLines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => csvEscape(r[h])).join(',')),
    ];

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outCsvPath = path.resolve(__dirname, `mikrotik_leases_filtered_${ts}.csv`);
    const outXlsxPath = path.resolve(__dirname, `mikrotik_leases_filtered_${ts}.xlsx`);
    await fs.writeFile(outCsvPath, `${csvLines.join('\n')}\n`, 'utf8');

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('leases');
    ws.columns = headers.map((h) => ({ header: h, key: h, width: 24 }));
    ws.getColumn('lastConnectedDate').numFmt = 'yyyy-mm-dd';
    for (const r of rows) ws.addRow(r);
    ws.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(outXlsxPath);

    const countsByPool = rows.reduce((acc, r) => {
      const k = normalize(r.addressPool) || '(empty)';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    console.log(`Exported ${rows.length} leases to ${outCsvPath}`);
    console.log(`Exported ${rows.length} leases to ${outXlsxPath}`);
    console.log(`Pools: ${JSON.stringify(countsByPool)}`);
  } catch (err) {
    const message = err?.message || String(err);
    console.error(`Export failed: ${message}`);
    process.exitCode = 1;
  } finally {
    try {
      conn.close();
    } catch {
    }
  }
};

await main();
