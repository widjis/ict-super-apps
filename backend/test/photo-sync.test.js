import test from 'node:test';
import { EventEmitter } from 'node:events';
import { Client } from 'ldapts';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { MigrationBuilder } from 'node-pg-migrate';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
async function fixture() {
 const db = new PGlite();
 for (const file of ['003_carddb_employee_photos','005_photo_sync']) {
  const pgm = new MigrationBuilder({}, {}, false); require(`../migrations/${file}.cjs`).up(pgm); await db.exec(pgm.getSql());
 }
 let locked = true;
 const client = Object.assign(new EventEmitter(), { query: (sql,args) => sql.includes('pg_try_advisory_lock') ? Promise.resolve({ rows: [{ locked }] }) : sql.includes('pg_advisory_unlock') ? Promise.resolve({rows:[]}) : db.query(sql,args), release() {} });
 const pool = { connect: async () => client };
 return { db, pool, client, lock(value) { locked=value; } };
}
test('cycle processes at most 50 missing active IDs, skips existing and is fair across runs', async () => {
 const { runPhotoSyncCycle } = await import('../src/modules/carddb/photo-sync.worker.js');
 const f = await fixture();
 try {
  await f.db.query("INSERT INTO carddb_employee_photos(employee_id,photo) VALUES ('existing',$1)",[Buffer.from('old')]);
  const ids=['existing',...Array.from({length:60},(_,i)=>`test-${i}`)]; const seen=[];
  const options={ pool:f.pool, listIds:async()=>ids, fetchPhoto:async id=>{seen.push(id);return {photo:Buffer.from('new'),contentType:'image/jpeg'};} };
  const first=await runPhotoSyncCycle(options); assert.equal(first.synced,50); assert.equal(seen.includes('existing'),false);
  const second=await runPhotoSyncCycle(options); assert.equal(second.synced,10); assert.equal(new Set(seen).size,60);
  assert.equal(Buffer.from((await f.db.query("SELECT photo FROM carddb_employee_photos WHERE employee_id='existing'")).rows[0].photo).toString(),'old');
 } finally {await f.db.close();}
});
test('absent and empty photos wait a day, source failure opens persistent circuit, stop and lock skip sources', async () => {
 const { runPhotoSyncCycle } = await import('../src/modules/carddb/photo-sync.worker.js');
 const f=await fixture(); let calls=0; const options={pool:f.pool,listIds:async()=>['a','b','c'],fetchPhoto:async()=>{calls++; return calls===2 ? {photo:Buffer.alloc(0)} : null;}};
 try {
  assert.equal((await runPhotoSyncCycle(options)).missing,3);
  assert.equal((await runPhotoSyncCycle(options)).attempted,0);
  assert.equal(calls,3);
  assert.equal((await f.db.query("SELECT count(*) FROM photo_sync_retry WHERE outcome='missing' AND next_attempt_at > now()+ interval '23 hours'")).rows[0].count,3);
  await f.db.query("UPDATE photo_sync_retry SET next_attempt_at=now()-interval '1 second'");
  options.fetchPhoto=async()=>{calls++; throw new Error('private source details');};
  assert.equal((await runPhotoSyncCycle(options)).state,'source_error');
  assert.equal(calls,4); assert.equal((await runPhotoSyncCycle(options)).state,'backoff'); assert.equal(calls,4);
  assert.equal((await f.db.query('SELECT count(*) FROM carddb_employee_photos')).rows[0].count,0);
  f.lock(false); assert.equal((await runPhotoSyncCycle(options)).state,'locked'); assert.equal(calls,4);
  f.lock(true); assert.equal((await runPhotoSyncCycle({...options,stopping:()=>true})).state,'stopped');
 } finally {await f.db.close();}
});
test('persistent circuit doubles and caps delay; source errors rotate fairly',async()=>{
 const {runPhotoSyncCycle,errorDelay}=await import('../src/modules/carddb/photo-sync.worker.js');
 assert.deepEqual([1,2,3,4,5,6,100].map(errorDelay),[3600,7200,14400,28800,57600,86400,86400]);
 const f=await fixture();const seen=[];
 try {
  const options={pool:f.pool,listIds:async()=>['a','b','c'],fetchPhoto:async id=>{seen.push(id);throw new Error('source unavailable');}};
  await runPhotoSyncCycle(options);
  await f.db.query("UPDATE photo_sync_status SET next_attempt_at=now()-interval '1 second'");
  await runPhotoSyncCycle(options);
  assert.deepEqual(seen,['a','b']);
  assert.equal((await f.db.query("SELECT count(*) FROM photo_sync_status WHERE failures=2 AND next_attempt_at > now()+interval '119 minutes'")).rows[0].count,1);
 }finally{await f.db.close();}
});
test('worker directory adapter paginates active users without login group restriction', async () => {
 const { activeEmployeeIds }=await import('../src/modules/carddb/photo-sync.directory.js');
 let args;
 assert.deepEqual(await activeEmployeeIds(async options=>{args=options;return {users:[{employeeId:'123'},{employeeId:null},{employeeId:'123'},{employeeId:'456'}]};}),['123','456']);
 assert.deepEqual(args,{activeOnly:true,pageSize:500});
});
test('scheduler executes immediately then waits hourly and closes source on graceful stop', async () => {
 const { runPhotoSyncLoop }=await import('../src/modules/carddb/photo-sync.loop.js');
 let stopped=false,closed=0,cycles=0,waited=0;
 await runPhotoSyncLoop({run:async()=>{cycles++;return {state:'completed'};},close:async()=>closed++,stopping:()=>stopped,wait:async ms=>{waited=ms;stopped=true;},report:()=>{}});
 assert.equal(cycles,1);assert.equal(waited,3600000);assert.equal(closed,1);
});
test('retry migration is additive and reversible', async () => {
 const db = new PGlite();
 try {
  for (const file of ['003_carddb_employee_photos','005_photo_sync']) {
   const pgm = new MigrationBuilder({}, {}, false); require(`../migrations/${file}.cjs`).up(pgm); await db.exec(pgm.getSql());
  }
  await db.query("INSERT INTO photo_sync_retry(employee_id) VALUES ('test')");
  assert.equal((await db.query('SELECT failures FROM photo_sync_retry')).rows[0].failures,0);
  assert.equal((await db.query('SELECT count(*) FROM carddb_employee_photos')).rows[0].count,0);
  const pgm = new MigrationBuilder({}, {}, false); require('../migrations/005_photo_sync.cjs').down(pgm); await db.exec(pgm.getSql());
  assert.equal((await db.query('SELECT count(*) FROM carddb_employee_photos')).rows[0].count,0);
 } finally { await db.close(); }
});

for (const source of ['listIds', 'fetchPhoto']) test(`connection loss while awaiting ${source} aborts without writes`, async () => {
 const { runPhotoSyncCycle } = await import('../src/modules/carddb/photo-sync.worker.js');
 const f = await fixture(); let resolveSource, entered; const ready = new Promise(r => entered=r);
 let released, sourceSignal; const queries=[]; const query=f.client.query;
 f.client.query=(sql,args)=>{queries.push(sql);return query(sql,args);};
 f.client.release=destroy=>{released=destroy;};
 const options={pool:f.pool,listIds:async()=>['a'],fetchPhoto:async()=>({photo:Buffer.from('new')})};
 options[source]=(...args)=>{sourceSignal=args.at(-1)?.signal;entered();return new Promise(r=>resolveSource=r);};
 try {
  const cycle=runPhotoSyncCycle(options); await ready;
  let handled=false;try {handled=f.client.emit('error',new Error('private connection details'));} catch {}
  const before=queries.length;
  resolveSource(source==='listIds'?['a']:{photo:Buffer.from('new')});
  await assert.rejects(cycle, error=>error.message==='Photo sync database connection failed');
  assert.equal(handled,true); assert.equal(sourceSignal.aborted,true);
  assert.equal(queries.length,before); assert.equal(released,true);
 } finally {await f.db.close();}
});
test('unlock failure destroys session and sanitizes diagnostics', async()=>{
 const { runPhotoSyncCycle }=await import('../src/modules/carddb/photo-sync.worker.js');
 const f=await fixture();const query=f.client.query;let released;
 f.client.query=(sql,args)=>sql.includes('pg_advisory_unlock')?Promise.reject(new Error('private unlock details')):query(sql,args);
 f.client.release=value=>released=value;
 try {await assert.rejects(runPhotoSyncCycle({pool:f.pool,listIds:async()=>[],fetchPhoto:async()=>null}),/Photo sync database connection failed/);assert.equal(released,true);} finally {await f.db.close();}
});
test('stop cancels pending directory source without opening retry circuit', async()=>{
 const { runPhotoSyncCycle }=await import('../src/modules/carddb/photo-sync.worker.js');
 const f=await fixture();const controller=new AbortController();let entered, sourceSignal;const ready=new Promise(r=>entered=r);
 try {
  const cycle=runPhotoSyncCycle({pool:f.pool,signal:controller.signal,listIds:({signal}={})=>{sourceSignal=signal;entered();return new Promise(()=>{});},fetchPhoto:async()=>null});
  await ready;controller.abort();
  assert.ok(sourceSignal,'source receives cancellation');
  assert.equal((await cycle).state,'stopped'); assert.equal(sourceSignal.aborted,true);
  assert.equal((await f.db.query('SELECT failures FROM photo_sync_status')).rows[0].failures,0);
 } finally {await f.db.close();}
});
test('stalled PG query is bounded and its session destroyed', {timeout:1000}, async()=>{
 const { runPhotoSyncCycle }=await import('../src/modules/carddb/photo-sync.worker.js');
 let released;const client=Object.assign(new EventEmitter(),{query:()=>new Promise(()=>{}),release:v=>released=v});
 await assert.rejects(runPhotoSyncCycle({pool:{connect:async()=>client},queryTimeoutMs:20}),/Photo sync database connection failed/);
 assert.equal(released,true);
});
test('LDAP cancellation stops pagination and unbinds using existing service configuration',async t=>{
 const { listActiveDirectoryUsersPaginated }=await import('../src/integrations/ldap/ldap.client.js');
 const saved={...process.env};Object.assign(process.env,{LDAP_URL:'ldap://example.invalid',LDAP_BIND_DN:'test',LDAP_BIND_PASSWORD:'test',LDAP_BASE_DN:'test'});
 const controller=new AbortController();let pages=0,unbound=0;
 t.mock.method(Client.prototype,'bind',async()=>{});
 t.mock.method(Client.prototype,'unbind',async()=>{unbound++;});
 t.mock.method(Client.prototype,'searchPaginated',async function*(){pages++;controller.abort();yield {searchEntries:[]};pages++;yield {searchEntries:[]};});
 try {await assert.rejects(listActiveDirectoryUsersPaginated({signal:controller.signal}),{name:'AbortError'});assert.equal(pages,1);assert.ok(unbound>0);}
 finally {process.env=saved;}
});
test('concurrent photo insertion is preserved',async()=>{
 const { runPhotoSyncCycle }=await import('../src/modules/carddb/photo-sync.worker.js');const f=await fixture();
 try {const result=await runPhotoSyncCycle({pool:f.pool,listIds:async()=>['a'],fetchPhoto:async()=>{await f.db.query("INSERT INTO carddb_employee_photos(employee_id,photo) VALUES ('a',$1)",[Buffer.from('concurrent')]);return {photo:Buffer.from('source')};}});assert.equal(result.skipped,1);assert.equal(result.synced,0);assert.equal(Buffer.from((await f.db.query('SELECT photo FROM carddb_employee_photos')).rows[0].photo).toString(),'concurrent');}finally{await f.db.close();}
});
