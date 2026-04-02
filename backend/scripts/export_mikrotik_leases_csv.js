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

const allowedAddressPools = new Set([
  'CONTRACTOR_VLAN_67',
  'EMPLOYEE - FULL_VLAN_63',
  'EMPLOYEE - LIMITED_VLAN_63',
  'VISITOR-STAFF_VLAN_64',
  'VISITOR-MANAGEMENT_VLAN_64',
]);

const allowedPrefixAddressPools = [
  'VISITOR-NON_STAFF_VLAN_64_',
];

const normalize = (v) => String(v ?? '').trim();

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

const isPoolNameAllowed = (poolName) => {
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

const buildAllowedPools = (pools) => {
  const allowed = [];
  for (const p of pools) {
    const name = normalize(p?.name);
    if (!name) continue;
    const ok = allowedAddressPools.has(name) || allowedPrefixAddressPools.some(prefix => name.startsWith(prefix));
    if (!ok) continue;
    allowed.push({ name, ranges: parsePoolRanges(p?.ranges) });
  }
  return allowed;
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

const getAllowedPoolForLease = (allowedPools, lease) => {
  const rawAddress = normalize(lease?.address);
  if (isPoolNameAllowed(rawAddress)) return rawAddress;
  return findPoolByAddress(allowedPools, rawAddress);
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

const main = async () => {
  const conn = new RouterOSAPI({ host, user, password, timeout });
  try {
    const nowMs = Date.now();
    await conn.connect();
    const pools = await conn.write('/ip/pool/print');
    const allowedPools = buildAllowedPools(Array.isArray(pools) ? pools : []);
    const leases = await conn.write('/ip/dhcp-server/lease/print');
    const filtered = Array.isArray(leases)
      ? leases
          .map((l) => {
            const poolName = getAllowedPoolForLease(allowedPools, l);
            if (!poolName) return null;
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
