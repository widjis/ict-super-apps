import test from 'node:test';
import assert from 'node:assert/strict';

import { EventEmitter } from 'node:events';
import mssql from 'mssql';
import { connectCardDb } from '../src/modules/carddb/carddb-photo.service.js';

test('worker source listener is registered before CardDB connects',async t=>{
 const keys=['SRC_DB_SERVER','SRC_DB_DATABASE','SRC_DB_USER','SRC_DB_PASSWORD'];
 const old=Object.fromEntries(keys.map(key=>[key,process.env[key]]));keys.forEach(key=>process.env[key]='test-only');
 t.after(()=>keys.forEach(key=>{if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}));
 const fake=new EventEmitter();let errors=0;
 fake.connect=async()=>{assert.equal(fake.listenerCount('error'),1);fake.emit('error',new Error('private'));};fake.close=async()=>{};
 t.mock.method(mssql,'ConnectionPool',function(){return fake;});
 assert.equal(await connectCardDb({onError:()=>errors++}),fake);assert.equal(errors,1);
});

test('source pool error events reject sanitized fetch and pool closes',async()=>{
 const { createPhotoSource }=await import('../src/modules/carddb/photo-sync.source.js');
 let onError,closed=0;
 const source=createPhotoSource({connect:async options=>{onError=options.onError;return {close:async()=>closed++};},fetch:async()=>{onError(new Error('private details'));return new Promise(()=>{});}});
 await assert.rejects(source.fetch('test'),error=>error.message==='Photo sync source failed');
 await source.close();assert.equal(closed,1);
});
