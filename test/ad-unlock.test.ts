import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountUnlocker } from '../src/lib/ad-unlock';

test('per-account busy, duplicate suppression, verified response and isolated errors', async () => {
  const events: [string, unknown][] = [];
  let resolve!: (value: unknown) => void;
  let calls = 0;
  const unlock = createAccountUnlocker(async (path) => {
    calls++;
    if (path.includes('/bad/')) throw { text: JSON.stringify({ error: 'LDAP_INSUFFICIENT_ACCESS' }) };
    return new Promise(r => { resolve = r; });
  }, (id, state) => events.push([id, state]), (user) => events.push(['user', user]));
  const pending = unlock('good');
  await unlock('good');
  await unlock('bad');
  assert.equal(calls, 2);
  assert.deepEqual(events[0], ['good', { busy: true }]);
  assert.match(JSON.stringify(events), /delegation/);
  resolve({ ok: true, user: { id: 'good', status: 'DISABLED' } });
  await pending;
  assert.deepEqual(events.at(-2), ['user', { id: 'good', status: 'DISABLED' }]);
  assert.match(JSON.stringify(events.at(-1)), /remains disabled/);
});

test('malformed or false success never updates account status', async () => {
  for (const payload of [null, { ok: false }, { ok: true }, { ok: true, user: { id: 'other', status: 'ACTIVE' } }]) {
    const states: unknown[] = [];
    const unlock = createAccountUnlocker(async () => payload, (_, state) => states.push(state), () => assert.fail('must not update'));
    await unlock('target');
    assert.match(JSON.stringify(states.at(-1)), /not verified/);
  }
});
