import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
const load = () => import('../src/integrations/routeros/routeros.client.js').catch(() => ({}));
const MAC = '02:AB:CD:EF:00:01';
const fields = [MAC, 'fixture-server', 'fixture pool', '10.0.0.8', 'bound', 'false', 'false'];
const frame = fields.map(s => `${Buffer.byteLength(s)}:${s}\r\n`).join('') + 'END\r\n';
const key = Buffer.from('synthetic-key');
const config = { host: 'fixture.invalid', username: 'fixture', password: 'fixture-secret', fingerprint: `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}` };
function client(output = frame, error) {
  const c = new EventEmitter(); c.end = () => { c.ended = true; }; c.destroy = c.end;
  c.connect = opts => { c.options = opts; queueMicrotask(() => {
    if (!opts.hostVerifier(key)) c.emit('error', new Error('Host denied'));
    else if (error) c.emit('error', error);
    else c.emit('ready');
  }); };
  c.exec = (command, callback) => { c.command = command;
    const stream = new EventEmitter(); stream.stderr = new EventEmitter(); callback(null, stream);
    if (output !== null) queueMicrotask(() => { stream.emit('data', Buffer.from(output)); stream.emit('close', 0); });
  };
  return c;
}
test('fails closed for missing config, identity, auth, timeout, malformed/oversized output and mismatched MAC', async () => {
  const { createRouterOsAdapter } = await load();
  for (const [options, expected] of [
    [{ config: {}, clientFactory: () => { assert.fail('must not connect'); } }, 'SOURCE_NOT_CONFIGURED'],
    [{ config: { ...config, fingerprint: 'SHA256:wrong' }, clientFactory: () => client() }, 'SOURCE_IDENTITY_FAILED'],
    [{ config, clientFactory: () => client(frame, Object.assign(new Error('private diagnostic'), { level: 'client-authentication' })) }, 'SOURCE_AUTH_FAILED'],
    [{ config, timeoutMs: 10, clientFactory: () => client(null) }, 'SOURCE_TIMEOUT'],
    ...['', 'END', frame.replace(MAC, '02:00:00:00:00:02'), frame.replace('5:bound', '7:unknown'), 'X'.repeat(65537)].map(output => [{ config, clientFactory: () => client(output) }, 'SOURCE_INVALID_RESPONSE'])
  ]) await assert.rejects(createRouterOsAdapter(options).lookup(MAC), err => err.message === expected);
});
test('timed-out SSH connection cannot execute after a late ready event', async () => {
  const { createRouterOsAdapter } = await load();
  const c = client(); c.connect = () => {};
  await assert.rejects(createRouterOsAdapter({ config, timeoutMs: 5, clientFactory: () => c }).lookup(MAC), /SOURCE_TIMEOUT/);
  c.emit('ready'); assert.equal(c.command, undefined); assert.equal(c.ended, true);
});
test('SSH lookup pins identity, uses only fixed read commands, parses bounded frames and omits PII', async () => {
  const { createRouterOsAdapter } = await load(); assert.equal(typeof createRouterOsAdapter, 'function');
  const c = client(); const adapter = createRouterOsAdapter({ config, clientFactory: () => c });
  const rows = await adapter.lookup(MAC);
  assert.equal(rows.length, 1); assert.equal(rows[0]['active-address'], '10.0.0.8');
  assert.equal(rows[0].address, 'fixture pool');
  assert.equal(c.options.hostVerifier(Buffer.from('wrong')), false);
  assert.match(c.command, /lease find where mac-address="02:AB:CD:EF:00:01"/);
  assert.doesNotMatch(c.command, /comment|host-name|\b(add|set|remove|enable|disable|export|password)\b/);
  assert.equal(c.ended, true);
  await assert.rejects(adapter.lookup(MAC + '"; reboot'), /INVALID_MAC/);
  assert.deepEqual(await createRouterOsAdapter({ config, clientFactory: () => client('END\r\n') }).lookup(MAC), []);
});
