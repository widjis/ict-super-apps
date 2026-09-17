import test from 'node:test';
import assert from 'node:assert/strict';
const MAC = '02:AB:CD:EF:00:01';
test('lookup preserves every lease and separates pool, active IP, registration and DHCP state with authorized description only', async () => {
  const { createWifiService } = await load();
  assert.equal(typeof createWifiService, 'function');
  const rows = [
    { 'mac-address': MAC, server: 'fixture-A', address: 'EMPLOYEE - FULL_VLAN_63', 'active-address': '10.60.20.9', status: 'bound', disabled: 'false', dynamic: 'false', comment: 'private owner', 'host-name': 'private host' },
    { 'mac-address': MAC, server: 'fixture-B', address: '10.60.24.9', status: 'waiting', disabled: 'true', dynamic: 'false' }
  ];
  const service = createWifiService({ lookup: async mac => { assert.equal(mac, MAC); return rows; } });
  const result = await service.lookup(MAC);
  assert.equal(result.match, 'multiple'); assert.equal(result.leases.length, 2);
  assert.equal(result.leases[0].configuredPool, rows[0].address);
  assert.equal(result.leases[0].configuredAddress, null);
  assert.equal(result.leases[0].activeAddress, '10.60.20.9');
  assert.equal(result.leases[0].dhcpStatus, 'bound');
  assert.equal(result.leases[1].disabled, true);
  assert.equal(result.leases[1].dhcpStatus, 'waiting');
  assert.equal(result.leases[1].activeAddress, null);
  assert.equal(result.reachability, 'unknown'); assert.equal(result.internetAccess, 'unknown');
  assert.ok(Date.parse(result.observedAt)); assert.equal(result.stale, false);
  assert.equal(result.leases[0].deviceDescription, 'private owner');
  assert.equal(result.leases[1].deviceDescription, null);
  assert.doesNotMatch(JSON.stringify(result), /host-name|online|verifiedOwner/);
  assert.equal((await createWifiService({ lookup: async () => [] }).lookup(MAC)).match, 'none');
  assert.equal((await createWifiService({ lookup: async () => [rows[0]] }).lookup(MAC)).match, 'single');
});
test('bounded concurrency and short positive-only cache never cache source errors or absent leases', async () => {
  const { createWifiService } = await load(); let calls = 0; let release; let now = 0;
  const service = createWifiService({ lookup: async () => { calls++; return new Promise(r => { release = r; }); } }, { now: () => now, maxConcurrent: 1 });
  const pending = service.lookup(MAC);
  await assert.rejects(Promise.race([service.lookup(MAC), new Promise((_, reject) => setTimeout(() => reject(new Error('MISSING_CONCURRENCY_BOUND')), 30))]), /SOURCE_BUSY/);
  release([{ 'mac-address': MAC, server: 'fixture', address: '10.0.0.1', disabled: 'false', dynamic: 'false', status: 'waiting' }]);
  const first = await pending;
  assert.deepEqual(await service.lookup(MAC), first); assert.equal(calls, 1);
  now = 5001; const expired = service.lookup(MAC); release([]); assert.equal((await expired).match, 'none');
  const again = service.lookup(MAC); release([]); await again; assert.equal(calls, 3);
  let failures = 0; const failed = createWifiService({ lookup: async () => { failures++; throw new Error('SOURCE_AUTH_FAILED'); } });
  for (let i = 0; i < 2; i++) await assert.rejects(failed.lookup(MAC), /SOURCE_AUTH_FAILED/);
  assert.equal(failures, 2);
});
test('device description strips controls/bidi, bounds text and does not infer ownership', async () => {
  const { createWifiService } = await load();
  for (const [comment, expected] of [['  Lab\u0000\u202e phone\n  ', 'Lab phone'], ['x'.repeat(600), 'x'.repeat(512)], ['', null], [42, null]]) {
    const result = await createWifiService({ lookup: async () => [{ comment }] }).lookup(MAC);
    assert.equal(result.leases[0].deviceDescription, expected);
    assert.equal(result.leases[0].owner, undefined);
  }
});
const load = () => import('../src/modules/wifi/wifi.service.js').catch(() => ({}));
test('normalizes only explicit six-octet MAC formats; rejects multicast, zero and injection', async () => {
  const { normalizeMac } = await load();
  assert.equal(typeof normalizeMac, 'function');
  for (const raw of ['02:ab:cd:ef:00:01', ' 02-ab-cd-ef-00-01 ', '02abcdef0001']) assert.equal(normalizeMac(raw), '02:AB:CD:EF:00:01');
  for (const raw of [undefined, {}, '', '00:00:00:00:00:00', 'FF:FF:FF:FF:FF:FF', '01:00:00:00:00:01', '02:ab-cd:ef:00:01', '02:AB:CD:EF:00:01"; /system reboot']) assert.throws(() => normalizeMac(raw), /INVALID_MAC/);
});
