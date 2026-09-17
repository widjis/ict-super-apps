import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import CheckDeviceStatusScreen from '../src/screens/CheckDeviceStatusScreen';
import WifiNetworkScreen from '../src/screens/WifiNetworkScreen';
import RegisterDeviceScreen from '../src/screens/RegisterDeviceScreen';
import LeaseExpirationReportScreen from '../src/screens/LeaseExpirationReportScreen';
import { Capacitor } from '@capacitor/core';
import { sessionClient } from '../src/auth/session';
const MAC = '02:AB:CD:EF:00:01';
const result = (leases: any[] = []) => ({ ok: true, mac: MAC, match: leases.length > 1 ? 'multiple' : leases.length ? 'single' : 'none', leases, observedAt: new Date().toISOString(), stale: false, reachability: 'unknown', internetAccess: 'unknown' });
const lease = { deviceDescription: '<b>Synthetic device</b>', mac: MAC, server: 'fixture-A', configuredPool: 'fixture pool', configuredAddress: null, activeAddress: '10.0.0.8', dhcpStatus: 'bound', disabled: false, dynamic: false };
async function mount(t: TestContext, response: () => Promise<Response>, Screen: any = CheckDeviceStatusScreen) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://localhost' });
  const restore: (() => void)[] = [];
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    restore.push(() => old ? Object.defineProperty(globalThis, key, old) : Reflect.deleteProperty(globalThis, key));
  }
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(sessionClient, 'request', async (url: string, init: RequestInit) => { calls.push({ url, init }); return response(); });
  const root = createRoot(dom.window.document.getElementById('root')!);
  t.after(async () => { await act(async () => root.unmount()); dom.window.close(); restore.forEach(fn => fn()); });
  await act(async () => root.render(createElement(Screen)));
  const input = async (value: string) => act(async () => { const el = dom.window.document.querySelector('input')!; el.value = value; el.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
  const submit = async () => act(async () => { dom.window.document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
  return { document: dom.window.document, calls, input, submit };
}
test('camera OCR requires candidate selection then editable confirmation before any lookup', async t => {
  t.mock.method(Capacitor, 'getPlatform', () => 'android');
  const sources: string[] = [];
  const Screen = () => createElement(CheckDeviceStatusScreen, { scanImage: async (source: string) => { sources.push(source); return [MAC, '04:AB:CD:EF:00:02']; } } as any);
  const ui = await mount(t, async () => Response.json(result()), Screen);
  const click = async (text: string) => act(async () => { const button = [...ui.document.querySelectorAll('button')].find(b => b.textContent === text); assert.ok(button, text); button.click(); });
  await click('Camera'); assert.deepEqual(sources, ['camera']); assert.equal(ui.calls.length, 0);
  await ui.submit(); assert.equal(ui.calls.length, 0);
  await click(MAC); assert.equal(ui.calls.length, 0);
  assert.equal(ui.document.querySelector<HTMLInputElement>('#wifi-mac')!.value, MAC);
  await ui.input('04abcdef0002'); await ui.submit();
  assert.equal(ui.calls.length, 1); assert.equal(JSON.parse(ui.calls[0].init.body as string).mac, '04:AB:CD:EF:00:02');
});
test('late gallery OCR is discarded after manual editing; no automatic lookup', async t => {
  t.mock.method(Capacitor, 'getPlatform', () => 'android');
  let resolve!: (values: string[]) => void;
  const Screen = () => createElement(CheckDeviceStatusScreen, { scanImage: () => new Promise<string[]>(r => { resolve = r; }) });
  const ui = await mount(t, async () => Response.json(result()), Screen);
  await act(async () => [...ui.document.querySelectorAll('button')].find(b => b.textContent === 'Gallery')!.click());
  await ui.input('04abcdef0002'); await act(async () => resolve([MAC]));
  assert.equal(ui.document.querySelector('[aria-label="MAC candidates"]') === null, true);
  assert.equal(ui.document.querySelector<HTMLInputElement>('#wifi-mac')!.value, '04abcdef0002');
  assert.equal(ui.calls.length, 0);
});
for (const mode of ['empty', 'cancel', 'denied']) test(`gallery ${mode} retains manual fallback without exposing diagnostics`, async t => {
  t.mock.method(Capacitor, 'getPlatform', () => 'android');
  const Screen = () => createElement(CheckDeviceStatusScreen, { scanImage: async () => {
    if (mode === 'empty') return [];
    throw Object.assign(new Error('private image path'), { code: mode === 'cancel' ? 'CANCELLED' : 'IMAGE_UNAVAILABLE' });
  } });
  const ui = await mount(t, async () => Response.json(result()), Screen);
  await act(async () => [...ui.document.querySelectorAll('button')].find(b => b.textContent === 'Gallery')!.click());
  assert.match(ui.document.body.textContent!, mode === 'empty' ? /No valid MAC/ : mode === 'cancel' ? /cancelled/ : /OCR unavailable/);
  assert.doesNotMatch(ui.document.body.textContent!, /private image path/);
  assert.equal(ui.calls.length, 0); await ui.input(MAC); await ui.submit(); assert.equal(ui.calls.length, 1);
});
test('older backend without description is unavailable, not a false empty RouterOS comment', async t => {
  const { deviceDescription: _description, ...oldLease } = lease;
  const ui = await mount(t, async () => Response.json(result([oldLease])));
  await ui.input(MAC); await ui.submit(); assert.match(ui.document.body.textContent!, /Description unavailable.*backend update required/);
});
test('invalid MAC is rejected before transport; ordinary paste input works and none is not online', async t => {
  const ui = await mount(t, async () => Response.json(result()));
  for (const value of ['', 'invalid', 'FF:FF:FF:FF:FF:FF', '00:00:00:00:00:00', '02:AB-CD:EF:00:01']) {
    await ui.input(value); await ui.submit(); assert.equal(ui.calls.length, 0); assert.match(ui.document.querySelector('[role="alert"]')!.textContent!, /valid.*MAC/i);
  }
  await ui.input('02abcdef0001'); await ui.submit(); assert.match(ui.document.body.textContent!, /No DHCP lease found/);
});
for (const [status, message] of [[401, /Sign in again/], [403, /Only authorized ICT/], [429, /Too many/], [503, /unavailable/i]] as const) {
  test(`HTTP ${status} is an explicit error with retry, never a negative result`, async t => {
    const ui = await mount(t, async () => Response.json({ error: 'private diagnostic' }, { status }));
    await ui.input(MAC); await ui.submit();
    assert.match(ui.document.querySelector('[role="alert"]')!.textContent!, message);
    assert.doesNotMatch(ui.document.body.textContent!, /No DHCP lease found|private diagnostic/);
    assert.equal(ui.document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, false);
  });
}
test('failed refresh marks same-MAC result stale; authorization failure clears it', async t => {
  let status = 200;
  const ui = await mount(t, async () => status === 200 ? Response.json(result([lease])) : Response.json({ error: 'SOURCE_TIMEOUT' }, { status }));
  await ui.input(MAC); await ui.submit(); status = 503; await ui.submit();
  assert.match(ui.document.body.textContent!, /Stale/); assert.match(ui.document.body.textContent!, /Observed/);
  status = 403; await ui.submit(); assert.doesNotMatch(ui.document.body.textContent!, /fixture-A/);
});
test('old observation is stale, malformed response and network failures never become success', async t => {
  let mode = 0;
  const ui = await mount(t, async () => {
    if (mode === 0) return Response.json({ ...result([lease]), observedAt: '2020-01-01T00:00:00.000Z' });
    if (mode === 1) return Response.json({ ok: true, mac: 'other', leases: [] });
    throw new TypeError('private network failure');
  });
  await ui.input(MAC); await ui.submit(); assert.match(ui.document.body.textContent!, /Stale/);
  mode = 1; await ui.submit(); assert.match(ui.document.querySelector('[role="alert"]')!.textContent!, /unavailable/i);
  mode = 2; await ui.submit(); assert.match(ui.document.querySelector('[role="alert"]')!.textContent!, /unavailable/i);
});
test('WiFi hub and future screens expose no mock metrics or working provisioning/expiry actions', async t => {
  const ui = await mount(t, async () => { throw new Error('No request expected'); }, WifiNetworkScreen);
  assert.doesNotMatch(ui.document.body.textContent!, /1,204|64%|mk-hq|active directory/i);
  assert.match(ui.document.body.textContent!, /ICT support/);
  assert.ok([...ui.document.querySelectorAll('button')].filter(b => b.disabled).length >= 2);
});
for (const Screen of [RegisterDeviceScreen, LeaseExpirationReportScreen]) {
  test(`${Screen.name} remains unavailable without mock data`, async t => {
    const other = await mount(t, async () => { throw new Error('No request expected'); }, Screen);
    assert.match(other.document.body.textContent!, /not available/i);
    assert.doesNotMatch(other.document.body.textContent!, /Connecting to router|1,204|Renew|Provision Now/);
  });
}
test('observation ages to stale without a second request', async t => {
  const ui = await mount(t, async () => Response.json(result([lease])));
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() });
  await ui.input(MAC); await ui.submit();
  assert.doesNotMatch(ui.document.body.textContent!, /Stale observation/);
  await act(async () => t.mock.timers.tick(60001));
  assert.match(ui.document.body.textContent!, /Stale observation/);
});
test('editing input cancels old lookup and never renders a late response for another MAC', async t => {
  let resolve!: (r: Response) => void;
  const ui = await mount(t, () => new Promise(r => { resolve = r; }));
  await ui.input(MAC); await ui.submit();
  assert.ok(ui.calls[0].init.signal);
  await ui.input('02:00:00:00:00:02');
  assert.equal(ui.calls[0].init.signal!.aborted, true);
  await act(async () => resolve(Response.json(result([lease]))));
  assert.doesNotMatch(ui.document.body.textContent!, /fixture-A/);
  assert.equal(ui.document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, false);
});
test('Check Status starts empty, accepts typed/pasted MAC and renders all DHCP results without online claims', async t => {
  let resolve!: (r: Response) => void;
  const ui = await mount(t, () => new Promise(r => { resolve = r; }));
  assert.match(ui.document.body.textContent!, /Enter a MAC address/);
  assert.doesNotMatch(ui.document.body.textContent!, /user-macbook|Adriana|Hardware Hash|Uptime|Live Connection/);
  const field = ui.document.querySelector('input')!;
  assert.equal(field.id, ui.document.querySelector('label')!.htmlFor);
  await ui.input('02-ab-cd-ef-00-01'); await ui.submit();
  assert.equal(ui.calls.length, 1); assert.equal(ui.calls[0].url, 'https://localhost/api/wifi/lookup');
  assert.equal(ui.calls[0].init.method, 'POST'); assert.equal(ui.calls[0].init.cache, 'no-store');
  assert.equal(JSON.parse(ui.calls[0].init.body as string).mac, MAC);
  assert.match(ui.document.querySelector('[role="status"]')!.textContent!, /Checking/);
  assert.equal(ui.document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled, true);
  await act(async () => resolve(Response.json(result([lease, { ...lease, server: 'fixture-B', dhcpStatus: 'waiting', disabled: true, activeAddress: null }]))));
  assert.match(ui.document.body.textContent!, /Device description.*<b>Synthetic device<\/b>/);
  assert.equal(ui.document.querySelector('article b'), null);
  assert.match(ui.document.body.textContent!, /not verified.*owner/i);
  assert.match(ui.document.body.textContent!, /Multiple leases/);
  assert.match(ui.document.body.textContent!, /fixture-A/); assert.match(ui.document.body.textContent!, /fixture-B/);
  assert.match(ui.document.body.textContent!, /Disabled/); assert.match(ui.document.body.textContent!, /bound/); assert.match(ui.document.body.textContent!, /waiting/);
  assert.match(ui.document.body.textContent!, /Observed/); assert.match(ui.document.body.textContent!, /not prove.*internet/);
});
