import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

const port = Number(process.env.PORT ?? 8080);

app.listen(port, '0.0.0.0', () => {
  process.stdout.write(`backend listening on http://0.0.0.0:${port}\n`);
});
