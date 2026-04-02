import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config();

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  process.stderr.write('POSTGRES_URL is not set. Define it in backend/.env or your environment.\n');
  process.exit(1);
}

const resolvedUrl = (() => {
  let u;
  try {
    u = new URL(databaseUrl);
  } catch {
    process.stderr.write('POSTGRES_URL is not a valid URL.\n');
    process.exit(1);
  }

  const username = process.env.POSTGRES_USERNAME?.trim();
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DATABASE?.trim();

  if (username) u.username = username;
  if (password != null) u.password = password;
  if (database) u.pathname = `/${database}`;

  return u.toString();
})();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedUrl;
}

if (!process.env.PGSSLMODE && process.env.POSTGRES_SSL) {
  const ssl = process.env.POSTGRES_SSL === 'true' || process.env.POSTGRES_SSL === '1' || process.env.POSTGRES_SSL === 'yes';
  process.env.PGSSLMODE = ssl ? 'require' : 'disable';
}

if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED && process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED) {
  const reject =
    process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === 'true' ||
    process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === '1' ||
    process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === 'yes';
  if (!reject) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

const bin = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'node-pg-migrate.cmd' : 'node-pg-migrate');

const child = spawn(
  bin,
  ['up', '-m', 'migrations', '--check-order=false'],
  { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' }
);

child.on('exit', (code) => process.exit(code ?? 1));

