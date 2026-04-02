import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config();

export function startServer() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 8080);
  return app.listen(port, '0.0.0.0', () => {
    process.stdout.write(`backend listening on http://0.0.0.0:${port}\n`);
  });
}

const entryArgv = process.argv[1];
if (entryArgv) {
  const entryPath = path.isAbsolute(entryArgv) ? entryArgv : path.resolve(process.cwd(), entryArgv);
  if (import.meta.url === pathToFileURL(entryPath).href) startServer();
}

