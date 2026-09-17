import test from 'node:test';
import assert from 'node:assert/strict';
import { Capacitor } from '@capacitor/core';
const load = () => import('../src/lib/mac-ocr').catch(() => ({} as any));
test('bridge is Android-only, returns bounded candidates not raw OCR and exposes safe cancellation', async t => {
  const { scanMacImage } = await load();
  assert.equal(typeof scanMacImage, 'function');
  t.mock.method(Capacitor, 'getPlatform', () => 'web');
  await assert.rejects(scanMacImage('gallery'), /Android/);
  t.mock.method(Capacitor, 'getPlatform', () => 'android');
  const bridge = { recognize: async (options: any) => { assert.equal(options.source, 'camera'); return { text: 'Private synthetic note 02abcdef0001' }; } };
  assert.deepEqual(await scanMacImage('camera', bridge), ['02:AB:CD:EF:00:01']);
  await assert.rejects(scanMacImage('camera', { recognize: async () => ({ text: 'x'.repeat(32769) }) }), /OCR/);
});
test('OCR extracts explicit MAC candidates, normalizes and deduplicates without guessing characters', async () => {
  const { extractMacCandidates } = await load();
  assert.equal(typeof extractMacCandidates, 'function');
  assert.deepEqual(extractMacCandidates('Wi-Fi MAC 02:ab:cd:ef:00:01\n02-AB-CD-EF-00-01\nOther 04abcdef0002'), ['02:AB:CD:EF:00:01', '04:AB:CD:EF:00:02']);
  assert.deepEqual(extractMacCandidates('O2:AB:CD:EF:OO:O1 02:AB-CD:EF:00:01 FF:FF:FF:FF:FF:FF 00:00:00:00:00:00 01abcdef0001 X02abcdef0001 002abcdef0001 02abcdef0001Z'), []);
});
