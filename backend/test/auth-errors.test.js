import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { requireAccessToken, requireAccessTokenOrDocToken } from '../src/core/http/auth.js';
import { getMeController } from '../src/modules/me/me.controller.js';
process.env.JWT_SECRET = 'test-only-secret-not-for-deployment';
delete process.env.POSTGRES_URL; // Never contact a configured/live database.
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
test('me database/config failure is a server error, not invalid auth', async () => {
 const res = response();
 await getMeController({ auth: { sub: '00000000-0000-4000-8000-000000000001' } }, res);
 assert.equal(res.statusCode, 503);
 assert.equal(res.body.error, 'ME_UNAVAILABLE');
});
test('expired access tokens have consistent TOKEN_EXPIRED response', async () => {
 const token = await new SignJWT({ sub: 'user' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(1).sign(new TextEncoder().encode(process.env.JWT_SECRET));
 for (const middleware of [requireAccessToken, requireAccessTokenOrDocToken]) {
  const res = response();
  await middleware({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail('authorized expired token'));
  assert.equal(res.statusCode, 401); assert.equal(res.body.error, 'TOKEN_EXPIRED');
 }
});

test('malformed and document tokens cannot authenticate ordinary API requests', async () => {
 const doc = await new SignJWT({ doc: true, fileId: 'one', action: 'view' }).setProtectedHeader({alg:'HS256'}).setExpirationTime('5m').sign(new TextEncoder().encode(process.env.JWT_SECRET));
 for (const token of ['bad.token.value', doc]) {
  const res = response(); await requireAccessToken({headers:{authorization:`Bearer ${token}`}},res,()=>assert.fail('authorized invalid token'));
  assert.equal(res.statusCode,401); assert.equal(res.body.error,'INVALID_TOKEN');
 }
});
test('missing signing configuration is 503 rather than invalid credentials', async () => {
 const secret = process.env.JWT_SECRET; delete process.env.JWT_SECRET;
 try {
  const res = response(); await requireAccessToken({headers:{authorization:'Bearer something'}},res,()=>assert.fail('authorized'));
  assert.equal(res.statusCode,503); assert.equal(res.body.error,'AUTH_UNAVAILABLE');
 } finally { process.env.JWT_SECRET = secret; }
});
test('expired document URL has the same expiry error', async () => {
 const token = await new SignJWT({ doc:true, fileId:'one' }).setProtectedHeader({alg:'HS256'}).setExpirationTime(1).sign(new TextEncoder().encode(process.env.JWT_SECRET));
 const res = response(); await requireAccessTokenOrDocToken({headers:{},query:{docToken:token},params:{fileId:'one'}},res,()=>assert.fail('authorized'));
 assert.equal(res.statusCode,401); assert.equal(res.body.error,'TOKEN_EXPIRED');
});
