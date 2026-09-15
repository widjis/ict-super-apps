import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import UserManagementScreen from '../src/screens/UserManagementScreen';
import { sessionClient } from '../src/auth/session';

// Exercise the real screen + HTTP adapter. Only the authenticated transport is
// stubbed: no test may reach an actual AD server or mutate a real account.
async function mount(t: TestContext, status: 'ACTIVE' | 'LOCKED' | 'DISABLED', post: () => Promise<Response>) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://localhost' });
  const restoreGlobals: (() => void)[] = [];
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    restoreGlobals.push(() => { if (previous) Object.defineProperty(globalThis, key, previous); else Reflect.deleteProperty(globalThis, key); });
  }
  dom.window.confirm = () => assert.fail('Unlock must not depend on a native browser dialog');
  const calls: { url: string; method: string }[] = [];
  t.mock.method(sessionClient, 'request', async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method! });
    if (init.method === 'POST') return post();
    return Response.json({ ok: true, users: [{ id: 'test.user', displayName: 'Test User', status }] });
  });
  let opened = 0;
  const root = createRoot(dom.window.document.getElementById('root')!);
  t.after(async () => { await act(async () => root.unmount()); dom.window.close(); restoreGlobals.forEach(restore => restore()); });
  await act(async () => root.render(createElement(UserManagementScreen, { onOpenUser: () => opened++ })));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
  const button = (label: string) => {
    const result = [...dom.window.document.querySelectorAll('button')].find(el => el.textContent?.trim() === label);
    assert.ok(result, `visible button: ${label}`);
    return result;
  };
  const tap = async (label: string) => act(async () => button(label).click());
  return { document: dom.window.document, calls, button, tap, opened: () => opened };
}

test('tapping Unlock Account on an ACTIVE snapshot gives confirmation rather than silently doing nothing', async t => {
  const ui = await mount(t, 'ACTIVE', async () => Response.json({ ok: true, user: { id: 'test.user', status: 'ACTIVE' } }));
  await ui.tap('Unlock Account');
  assert.ok(ui.document.querySelector('[role="group"][aria-label="Confirm account unlock"]'), 'tap must display in-app confirmation even when the directory snapshot is ACTIVE');
  assert.equal(ui.calls.filter(c => c.method === 'POST').length, 0, 'confirmation is required before mutation');
  assert.equal(ui.opened(), 0, 'unlock must not navigate to the profile');
  await ui.tap('Cancel');
  assert.equal(ui.document.querySelector('[aria-label="Confirm account unlock"]'), null);
  assert.equal(ui.calls.filter(c => c.method === 'POST').length, 0);
});

for (const status of ['LOCKED', 'ACTIVE', 'DISABLED'] as const) {
  test(`${status}: confirm sends one POST, shows busy, and renders verified outcome without navigation`, async t => {
    let resolve!: (response: Response) => void;
    const ui = await mount(t, status, () => new Promise(r => { resolve = r; }));
    await ui.tap('Unlock Account');
    assert.equal(ui.calls.filter(c => c.method === 'POST').length, 0);
    await ui.tap('Confirm unlock');
    assert.equal(ui.button('Unlocking...').disabled, true);
    assert.equal(ui.button('Unlocking...').getAttribute('aria-busy'), 'true');
    await ui.tap('Unlocking...');
    assert.deepEqual(ui.calls.filter(c => c.method === 'POST'), [{ url: 'https://localhost/api/ad/users/test.user/unlock', method: 'POST' }]);
    await act(async () => resolve(Response.json({ ok: true, user: { id: 'test.user', status: status === 'DISABLED' ? 'DISABLED' : 'ACTIVE' } })));
    assert.match(ui.document.querySelector('[role="status"]')?.textContent ?? '', status === 'DISABLED' ? /remains disabled/ : /unlocked and verified/);
    assert.equal(ui.button('Unlock Account').disabled, false);
    assert.equal(ui.opened(), 0);
  });
}

for (const [name, post, message] of [
  ['authorization denial', async () => Response.json({ error: 'FORBIDDEN' }, { status: 403 }), /Only authorized/],
  ['expired session', async () => Response.json({ error: 'UNAUTHORIZED' }, { status: 401 }), /Sign in again/],
  ['LDAP permission failure', async () => Response.json({ error: 'LDAP_INSUFFICIENT_ACCESS' }, { status: 502 }), /lockoutTime delegation/],
  ['network failure', async () => { throw new TypeError('Failed to fetch'); }, /not verified/],
  ['malformed success', async () => Response.json({ ok: true, user: { id: 'other', status: 'ACTIVE' } }), /not verified/],
] as const) {
  test(`${name}: final error is visible on the account and retry is available`, async t => {
    const ui = await mount(t, 'LOCKED', post);
    await ui.tap('Unlock Account');
    await ui.tap('Confirm unlock');
    assert.match(ui.document.querySelector('[role="alert"]')?.textContent ?? '', message);
    assert.equal(ui.document.querySelector('[role="status"]'), null);
    assert.equal(ui.button('Unlock Account').disabled, false);
    assert.equal(ui.button('Unlock Account').getAttribute('aria-busy'), 'false');
    assert.equal(ui.opened(), 0);
  });
}
