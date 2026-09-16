import { isIP } from 'node:net';

export function createWifiService(adapter, { now = Date.now, maxConcurrent = 4 } = {}) {
  let active = 0;
  const cache = new Map();
  return { async lookup(raw) {
    const mac = normalizeMac(raw);
    const hit = cache.get(mac);
    if (hit && now() - hit.time < 5000) return hit.result;
    cache.delete(mac);
    if (active >= maxConcurrent) throw new Error('SOURCE_BUSY');
    active++;
    let rows;
    try { rows = await adapter.lookup(mac); } finally { active--; }
    const leases = rows.map(row => ({
      mac, server: row.server,
      configuredAddress: isIP(row.address ?? '') ? row.address : null,
      configuredPool: row.address && !isIP(row.address) ? row.address : null,
      activeAddress: isIP(row['active-address'] ?? '') ? row['active-address'] : null,
      dhcpStatus: row.status || 'unknown', disabled: row.disabled === 'true', dynamic: row.dynamic === 'true'
    }));
    const result = { ok: true, mac, match: leases.length === 0 ? 'none' : leases.length === 1 ? 'single' : 'multiple', leases,
      observedAt: new Date(now()).toISOString(), stale: false, reachability: 'unknown', internetAccess: 'unknown' };
    if (leases.length) {
      if (cache.size >= 128) cache.delete(cache.keys().next().value);
      cache.set(mac, { time: now(), result });
    }
    return result;
  } };
}

export function normalizeMac(raw) {
  if (typeof raw !== 'string') throw new Error('INVALID_MAC');
  const value = raw.trim();
  if (!/^(?:[\da-f]{12}|[\da-f]{2}(:[\da-f]{2}){5}|[\da-f]{2}(-[\da-f]{2}){5})$/i.test(value)) throw new Error('INVALID_MAC');
  const hex = value.replace(/[:-]/g, '').toUpperCase();
  if (hex === '000000000000' || (parseInt(hex.slice(0, 2), 16) & 1)) throw new Error('INVALID_MAC');
  return hex.match(/.{2}/g).join(':');
}
