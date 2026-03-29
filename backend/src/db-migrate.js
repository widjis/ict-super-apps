import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) {
  process.stderr.write('POSTGRES_URL is not set. Define it in backend/.env or your environment.\n');
  process.exit(1);
}

const bin = path.resolve('node_modules', '.bin', 'node-pg-migrate');

const child = spawn(
  bin,
  ['up', '-m', 'migrations', '-d', databaseUrl],
  { stdio: 'inherit', env: process.env }
);

child.on('exit', (code) => process.exit(code ?? 1));
