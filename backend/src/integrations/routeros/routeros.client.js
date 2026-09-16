import { Client } from 'ssh2';
import { createHash } from 'node:crypto';
import { normalizeMac } from '../../modules/wifi/wifi.service.js';

const FIELDS = ['mac-address', 'server', 'address', 'active-address', 'status', 'disabled', 'dynamic'];
// This adapter deliberately exposes one operation, not exec or a generic RouterOS path.
// Length-prefixed fields support spaces/quotes without interpreting RouterOS output as code.
function commandFor(mac) {
  return `:foreach id in=[/ip dhcp-server lease find where mac-address="${mac}"] do={:foreach key in={${FIELDS.map(f => `"${f}"`).join(';')}} do={:local v [:tostr [/ip dhcp-server lease get $id value-name=$key]]; :put ([:len $v] . ":" . $v)}}; :put "END"`;
}
function parseFrames(buffer) {
  const values = [];
  while (!buffer.equals(Buffer.from('END\r\n')) && !buffer.equals(Buffer.from('END\n'))) {
    const prefix = buffer.subarray(0, 8).toString().match(/^(\d{1,5}):/);
    if (!prefix) throw new Error('SOURCE_INVALID_RESPONSE');
    const length = Number(prefix[1]);
    const start = prefix[0].length;
    values.push(buffer.subarray(start, start + length).toString('utf8'));
    buffer = buffer.subarray(start + length);
    if (buffer[0] === 13) buffer = buffer.subarray(1);
    if (buffer[0] !== 10) throw new Error('SOURCE_INVALID_RESPONSE');
    buffer = buffer.subarray(1);
  }
  if (values.length % FIELDS.length) throw new Error('SOURCE_INVALID_RESPONSE');
  const rows = [];
  for (let i = 0; i < values.length; i += FIELDS.length) rows.push(Object.fromEntries(FIELDS.map((f, j) => [f, values[i + j]])));
  return rows;
}
export function createRouterOsAdapter({ config = {}, clientFactory = () => new Client(), timeoutMs = 8000 } = {}) {
  return { async lookup(raw) {
    const mac = normalizeMac(raw);
    if (![config.host, config.username, config.password, config.fingerprint].every(v => typeof v === 'string' && v.length)) throw new Error('SOURCE_NOT_CONFIGURED');
    return new Promise((resolve, reject) => {
      const client = clientFactory();
      let settled = false;
      const finish = (error, rows) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (error) client.destroy(); else client.end();
        if (error) reject(error); else resolve(rows);
      };
      const timer = setTimeout(() => finish(new Error('SOURCE_TIMEOUT')), timeoutMs);
      let identityFailed = false;
      client.on('error', error => finish(new Error(identityFailed ? 'SOURCE_IDENTITY_FAILED' : error.level === 'client-authentication' ? 'SOURCE_AUTH_FAILED' : 'SOURCE_UNAVAILABLE')));
      client.on('close', () => finish(new Error('SOURCE_UNAVAILABLE')));
      client.on('ready', () => {
        if (settled) return;
        client.exec(commandFor(mac), (error, stream) => {
          if (error) return finish(new Error('SOURCE_UNAVAILABLE'));
          const chunks = [];
          let size = 0;
          stream.on('error', () => finish(new Error('SOURCE_UNAVAILABLE')));
          stream.on('data', data => {
            if (settled) return;
            size += data.length;
            if (size > 65536) return finish(new Error('SOURCE_INVALID_RESPONSE'));
            chunks.push(Buffer.from(data));
          });
          stream.stderr.on('data', () => finish(new Error('SOURCE_UNAVAILABLE')));
          stream.on('close', code => {
            if (code !== 0) return finish(new Error('SOURCE_UNAVAILABLE'));
            try {
              const rows = parseFrames(Buffer.concat(chunks));
              if (rows.length > 64 || rows.some(row =>
                row['mac-address'] !== mac || !row.server || !row.address ||
                !['true', 'false'].includes(row.disabled) || !['true', 'false'].includes(row.dynamic) ||
                !['waiting', 'testing', 'authorizing', 'busy', 'offered', 'bound', 'conflict', 'declined'].includes(row.status)
              )) throw new Error();
              finish(null, rows);
            } catch { finish(new Error('SOURCE_INVALID_RESPONSE')); }
          });
        });
      });
      try { client.connect({ host: config.host, port: 22, username: config.username, password: config.password,
        readyTimeout: timeoutMs, hostVerifier: key => {
          identityFailed = `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}` !== config.fingerprint;
          return !identityFailed;
        } }); } catch { finish(new Error('SOURCE_UNAVAILABLE')); }
    });
  } };
}
