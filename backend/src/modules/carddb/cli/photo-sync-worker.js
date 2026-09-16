import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getPool } from '../../../core/db/pg.js';
import { createPhotoSource } from '../photo-sync.source.js';
import { activeEmployeeIds } from '../photo-sync.directory.js';
import { runPhotoSyncCycle } from '../photo-sync.worker.js';
import { runPhotoSyncLoop } from '../photo-sync.loop.js';

let stopped = false;
const shutdown = new AbortController();
let shutdownDeadline;
let wake = () => {};
const stop = () => {
 if (stopped) return;
 stopped = true;
 shutdown.abort();
 wake();
 // Leave five seconds before Docker SIGKILL even if a driver fails to settle.
 shutdownDeadline = setTimeout(() => {
  console.error(JSON.stringify({event:'photo_sync',state:'shutdown_timeout'}));
  process.exit(1);
 }, 55_000);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
const pool = getPool();
// Do not log pg errors: connection diagnostics can contain identifiers.
pool.on('error', () => { console.error(JSON.stringify({event:'photo_sync',state:'database_connection_error'})); });
let source;
let sourcePending;
let directoryPending;
let lastCycle = Date.now();
let state = 'starting';
const heartbeat = () => writeFileSync('/tmp/photo-sync-health.json',JSON.stringify({at:Date.now(),lastCycle,state}),{mode:0o600});
heartbeat();
const timer = setInterval(heartbeat,30000);
try {
 await runPhotoSyncLoop({
  stopping: () => stopped,
  run: () => runPhotoSyncCycle({pool,signal:shutdown.signal,
   listIds: options => (directoryPending=activeEmployeeIds(undefined,options)),stopping:()=>stopped,
   fetchPhoto:(id,options)=>{
    source ??= createPhotoSource();
    sourcePending = source.fetch(id,options);
    return sourcePending;
   }}),
  close:async()=>{
   // A cancelled cycle can finish before the existing MSSQL request/connect.
   // Await its configured timeout and close even a late-arriving connection.
   await Promise.all([sourcePending,directoryPending].map(pending=>pending?.catch(()=>undefined)));
   directoryPending=undefined;
   sourcePending=undefined;
   if(source) {await source.close();source=undefined;}
  },
  wait:ms=>new Promise(resolve=>{const timeout=setTimeout(resolve,ms);wake=()=>{clearTimeout(timeout);resolve();};if(stopped)wake();}),
  report:result=>{state=result.state;lastCycle=Date.now();heartbeat();console.log(JSON.stringify({event:'photo_sync',...result}));}
 });
} finally {
 clearInterval(timer);
 await pool.end();
 clearTimeout(shutdownDeadline);
 process.removeListener('SIGTERM',stop);
 process.removeListener('SIGINT',stop);
}
