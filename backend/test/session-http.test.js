import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { corsMiddleware } from '../src/core/http/cors.js';
import { createSessionControllers, authWriteGuard, sendSession } from '../src/modules/auth/session.controller.js';
const app = express(); app.use(express.json()); app.use(corsMiddleware);
const service = { refresh: async token => {
 if (token === 'outage') throw new Error('DB disconnected');
 if (token !== 'valid') throw Object.assign(new Error('bad'), { code: 'INVALID_REFRESH_TOKEN' });
 return { token: 'access', refreshToken: 'rotated', refreshExpiresAt: '2099-01-01T00:00:00.000Z' };
}, revoke: async token => { if (token === 'outage') throw new Error('DB disconnected'); } };
const controllers = createSessionControllers(() => service);
app.post('/api/auth/refresh', authWriteGuard, controllers.refresh);
app.post('/api/auth/logout', authWriteGuard, controllers.logout);
app.post('/session-fixture', (req,res) => sendSession(req,res,{ token:'access', refreshToken:'refresh', refreshExpiresAt:'2099-01-01T00:00:00.000Z' }));
let server, base;
test.before(async () => { process.env.CORS_ORIGIN = 'https://app.example.test'; server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening',r)); base = `http://127.0.0.1:${server.address().port}`; });
test.after(async () => { await new Promise(r => server.close(r)); });
const post = (path, body, headers={}) => fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('credentialed CORS reflects only allowlisted origin, never wildcard', async () => {
 const res = await post('/api/auth/refresh',{sessionTransport:'native',refreshToken:'valid'},{Origin:'https://app.example.test'});
 assert.equal(res.headers.get('access-control-allow-origin'),'https://app.example.test');
 assert.equal(res.headers.get('access-control-allow-credentials'),'true');
 const denied = await post('/api/auth/refresh',{}, {Origin:'https://evil.test'});
 assert.equal(denied.status,403);
 assert.notEqual(denied.headers.get('access-control-allow-origin'),'https://evil.test');
});
test('web refresh bearer is HttpOnly Secure SameSite Strict, native gets body', async () => {
 const web = await post('/session-fixture',{sessionTransport:'web'});
 assert.match(web.headers.get('set-cookie'), /HttpOnly/); assert.match(web.headers.get('set-cookie'),/Secure/); assert.match(web.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await web.json()).refreshToken,undefined);
 const native = await post('/session-fixture',{sessionTransport:'native'});
 assert.equal(native.headers.get('set-cookie'),null); assert.equal((await native.json()).refreshToken,'refresh');
 assert.equal(native.headers.get('cache-control'),'no-store');
});
test('refresh DB errors are 503, invalid credentials 401, logout failure does not clear cookie', async () => {
 for (const [token,status] of [['outage',503],['invalid',401],['valid',200]]) {
  const res = await post('/api/auth/refresh',{sessionTransport:'native',refreshToken:token}); assert.equal(res.status,status);
 }
 const res = await post('/api/auth/logout',{sessionTransport:'native',refreshToken:'outage'});
 assert.equal(res.status,503); assert.equal(res.headers.get('set-cookie'),null);
});
test('non-JSON cookie writes are rejected', async () => {
 const res = await fetch(base+'/api/auth/refresh',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
 assert.equal(res.status,415);
});
