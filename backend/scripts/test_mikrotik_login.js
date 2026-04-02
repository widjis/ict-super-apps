import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { RouterOSAPI } from 'node-routeros';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const host = (process.env.MIKROTIK_HOST || process.env.MIKROTIK_IP || '10.60.0.1').trim();
const user = (process.env.MIKROTIK_USER || process.env.MIKROTIK_USERNAME || '').trim();
const password = (process.env.MIKROTIK_PASSWORD || '').trim();
const timeout = Number.parseInt(process.env.MIKROTIK_TIMEOUT, 10) || 20000;

if (!user || !password) {
  console.error('Missing MikroTik credentials. Set MIKROTIK_USER (atau MIKROTIK_USERNAME) dan MIKROTIK_PASSWORD di backend/.env');
  process.exitCode = 2;
} else {
  const conn = new RouterOSAPI({ host, user, password, timeout });
  try {
    await conn.connect();
    const identity = await conn.write('/system/identity/print');
    const name = identity?.[0]?.name ?? '(unknown)';
    console.log(`RouterOS API login OK. host=${host} user=${user} identity=${name}`);
  } catch (err) {
    const details = {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      errno: err?.errno,
      type: err?.type,
      status: err?.status,
      errors: err?.errors,
    };
    const message = err?.message || String(err);
    console.error(`RouterOS API login FAILED. host=${host} user=${user} error=${message}`);
    console.error(`Error details: ${JSON.stringify(details)}`);
    process.exitCode = 1;
  } finally {
    try {
      conn.close();
    } catch {
    }
  }
}
