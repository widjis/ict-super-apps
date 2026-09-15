import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createRequire } from 'node:module';
import { MigrationBuilder } from 'node-pg-migrate';
import { createSessionService } from '../src/modules/auth/session.service.js';
const require = createRequire(import.meta.url);
process.env.JWT_SECRET = 'test-only-secret-not-for-deployment';
delete process.env.POSTGRES_URL;
const userId = '00000000-0000-4000-8000-000000000001';
async function fixture() {
 const db = new PGlite();
 await db.exec('CREATE TABLE users (id uuid PRIMARY KEY, is_active boolean NOT NULL DEFAULT true)');
 const pgm = new MigrationBuilder({}, {}, false);
 require('../migrations/004_auth_sessions.cjs').up(pgm);
 await db.exec(pgm.getSql());
 await db.query('INSERT INTO users(id) VALUES ($1)', [userId]);
 // PGlite has one connection: serialize entire transactions as pg clients do.
 let tail = Promise.resolve();
 const pool = { query: (...args) => db.query(...args), async connect() {
  const previous = tail; let release; tail = new Promise(r => { release = r; }); await previous;
  return { query: (...args) => db.query(...args), release };
 } };
 let now = Date.now();
 const service = createSessionService({ pool, now: () => now });
 return { db, service, advance(ms) { now += ms; } };
}
test('refresh is opaque, hashed at rest, rotated atomically and bounded', async () => {
 const { db, service, advance } = await fixture();
 try {
  const first = await service.create({ sub: userId, username: 'test' });
  assert.equal(typeof first.token, 'string');
  const rows = await db.query('SELECT token_hash FROM auth_refresh_tokens');
  assert.equal(rows.rows[0].token_hash.length, 64);
  assert.ok(!JSON.stringify(rows.rows).includes(first.refreshToken));
  const [a,b] = await Promise.all([service.refresh(first.refreshToken), service.refresh(first.refreshToken)]);
  assert.notEqual(a.refreshToken, first.refreshToken);
  assert.equal(a.refreshToken, b.refreshToken); // lost-response/concurrent retry grace
  assert.equal(a.refreshExpiresAt, first.refreshExpiresAt);
  advance(31_000);
  await assert.rejects(service.refresh(first.refreshToken), { code: 'REFRESH_REUSED' });
  await assert.rejects(service.refresh(a.refreshToken), { code: 'SESSION_REVOKED' });
 } finally { await db.close(); }
});
test('logout revokes current and used refresh tokens and session access', async () => {
 const { db, service } = await fixture();
 try {
  const first = await service.create({ sub: userId });
  const next = await service.refresh(first.refreshToken);
  await service.revoke(first.refreshToken);
  await assert.rejects(service.refresh(next.refreshToken), { code: 'SESSION_REVOKED' });
  await assert.rejects(service.assertActive(first.sessionId, userId), { code: 'SESSION_REVOKED' });
 } finally { await db.close(); }
});
test('idle expiry and disabled accounts cannot refresh', async () => {
 const { db, service, advance } = await fixture();
 try {
  const first = await service.create({ sub: userId });
  advance(7 * 86400_000 + 1);
  await assert.rejects(service.refresh(first.refreshToken), { code: 'REFRESH_EXPIRED' });
  const second = await service.create({ sub: userId });
  await db.query('UPDATE users SET is_active = false');
  await assert.rejects(service.refresh(second.refreshToken), { code: 'SESSION_REVOKED' });
 } finally { await db.close(); }
});
test('absolute expiry cannot slide past thirty days', async () => {
 const { db, service, advance } = await fixture();
 try {
  let session = await service.create({ sub: userId }); const expiry = session.refreshExpiresAt;
  for (let i=0;i<5;i++) { advance(6*86400_000); if (i<4) { session = await service.refresh(session.refreshToken); assert.equal(session.refreshExpiresAt, expiry); } }
  await assert.rejects(service.refresh(session.refreshToken), { code: 'REFRESH_EXPIRED' });
 } finally { await db.close(); }
});

test('unknown refresh value cannot revoke a good session', async () => {
 const { db, service } = await fixture();
 try {
  const first = await service.create({sub:userId});
  const bogus = `${first.sessionId}.${'x'.repeat(43)}`;
  await assert.rejects(service.refresh(bogus),{code:'INVALID_REFRESH_TOKEN'});
  await service.revoke(bogus);
  assert.ok((await service.refresh(first.refreshToken)).token);
 } finally { await db.close(); }
});
test('access JWT lifetime is capped at fifteen minutes for new sessions', async () => {
 const { db, service } = await fixture();
 try {
  const first = await service.create({sub:userId});
  const payload = JSON.parse(Buffer.from(first.token.split('.')[1],'base64url').toString());
  assert.equal(payload.sid,first.sessionId); assert.ok(payload.exp-payload.iat <= 900);
 } finally { await db.close(); }
});
test('migration down removes only the session tables', async () => {
 const { db } = await fixture();
 try {
  const pgm = new MigrationBuilder({}, {}, false); require('../migrations/004_auth_sessions.cjs').down(pgm);
  await db.exec(pgm.getSql());
  assert.equal((await db.query('SELECT COUNT(*) AS count FROM users')).rows[0].count,1);
  await assert.rejects(db.query('SELECT * FROM auth_sessions'));
 } finally { await db.close(); }
});
