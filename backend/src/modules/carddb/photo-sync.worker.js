// Dedicated session lock: all cycle writes use this connection; loss aborts the cycle.
const LOCK_ID = 5059005;
export const errorDelay = failures => Math.min(86400, 3600 * 2 ** Math.min(Math.max(0, failures - 1), 5));
export async function runPhotoSyncCycle({ pool, listIds, fetchPhoto, stopping = () => false, signal, queryTimeoutMs = 10_000 }) {
 const db = await pool.connect();
 const controller = new AbortController();
 const databaseError = new Error('Photo sync database connection failed');
 let failed = false;
 const fail = () => { failed = true; controller.abort(databaseError); };
 const stop = () => controller.abort(new DOMException('Photo sync stopped', 'AbortError'));
 db.on('error', fail);
 signal?.addEventListener('abort', stop, { once: true });
 if (signal?.aborted) stop();
 const guarded = async operation => {
  controller.signal.throwIfAborted();
  let abort;
  const cancelled = new Promise((_, reject) => {
   abort = () => reject(controller.signal.reason);
   controller.signal.addEventListener('abort', abort, { once: true });
  });
  try { return await Promise.race([operation(), cancelled]); }
  finally { controller.signal.removeEventListener('abort', abort); }
 };
 const query = async (sql, args) => {
  controller.signal.throwIfAborted();
  const timeout = setTimeout(fail, queryTimeoutMs);
  try { return await guarded(() => db.query(sql, args)); }
  catch (error) { if (!controller.signal.aborted) fail(); throw failed ? databaseError : error; }
  finally { clearTimeout(timeout); }
 };
 let locked = false;
 const counts = { attempted: 0, synced: 0, missing: 0, failed: 0, skipped: 0 };
 const finish = async state => {
  const result={...counts,state};
  await query('UPDATE photo_sync_status SET completed_at=now(), counts=$1::jsonb WHERE id=1',[JSON.stringify(result)]);
  return result;
 };
 const sourceError = async id => {
  counts.failed++;
  const status=(await query('SELECT failures FROM photo_sync_status WHERE id=1')).rows[0];
  const delay=errorDelay(status.failures+1);
  if (id) await query(`INSERT INTO photo_sync_retry(employee_id,failures,next_attempt_at,last_attempt_at,outcome)
   VALUES ($1,1,now()+$2*interval '1 second',now(),'error') ON CONFLICT(employee_id) DO UPDATE SET
   failures=photo_sync_retry.failures+1, next_attempt_at=excluded.next_attempt_at,last_attempt_at=now(),outcome='error'`,[id,delay]);
  await query("UPDATE photo_sync_status SET failures=failures+1,next_attempt_at=now()+$1*interval '1 second' WHERE id=1",[delay]);
  return finish('source_error'); // First error opens the circuit; no further source requests this cycle.
 };
 try {
  locked = (await query('SELECT pg_try_advisory_lock($1) AS locked',[LOCK_ID])).rows[0].locked;
  if (!locked) return { ...counts, state: 'locked' };
  if (stopping()) return await finish('stopped');
  const {rows:[status]}=await query('SELECT next_attempt_at > now() AS waiting FROM photo_sync_status WHERE id=1');
  if (status.waiting) return {...counts,state:'backoff'};
  let sourceIds;
  try {sourceIds=await guarded(() => listIds({signal:controller.signal}));} catch {controller.signal.throwIfAborted();return await sourceError();}
  controller.signal.throwIfAborted();
  if (stopping()) return await finish('stopped');
  const ids = [...new Set(sourceIds.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))];
  const { rows } = await query(`SELECT id FROM unnest($1::text[]) AS ids(id)
   LEFT JOIN carddb_employee_photos p ON p.employee_id=id
   LEFT JOIN photo_sync_retry r ON r.employee_id=id
   WHERE p.employee_id IS NULL AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= now())
   ORDER BY r.last_attempt_at NULLS FIRST, id LIMIT 50`,[ids]);
  for (const {id} of rows) {
   if (stopping()) return await finish('stopped');
   // Recheck before source I/O; the INSERT conflict guard also protects concurrent writers.
   if ((await query('SELECT 1 FROM carddb_employee_photos WHERE employee_id=$1',[id])).rows.length) {counts.skipped++;continue;}
   counts.attempted++;
   let found;
   try {found=await guarded(() => fetchPhoto(id,{signal:controller.signal}));} catch {controller.signal.throwIfAborted();return await sourceError(id);}
   controller.signal.throwIfAborted();
   if (stopping()) return await finish('stopped');
   if (!Buffer.isBuffer(found?.photo) || !found.photo.length) {
    counts.missing++;
    await query(`INSERT INTO photo_sync_retry(employee_id,next_attempt_at,last_attempt_at,outcome)
     VALUES ($1,now()+interval '1 day',now(),'missing') ON CONFLICT(employee_id) DO UPDATE SET
     failures=0,next_attempt_at=excluded.next_attempt_at,last_attempt_at=now(),outcome='missing'`,[id]);
    continue;
   }
   const result = await query(`INSERT INTO carddb_employee_photos(employee_id,staff_no,content_type,photo)
    VALUES ($1,$2,$3,$4) ON CONFLICT(employee_id) DO NOTHING RETURNING employee_id`,
    [id,found.staffNo ?? null,found.contentType ?? 'application/octet-stream',found.photo]);
   if (result.rows.length) counts.synced++; else counts.skipped++;
   await query('DELETE FROM photo_sync_retry WHERE employee_id=$1',[id]);
  }
  await query('UPDATE photo_sync_status SET failures=0,next_attempt_at=now() WHERE id=1');
  return await finish('completed');
 } catch (error) {
  if (failed) throw databaseError;
  if (controller.signal.aborted) return {...counts,state:'stopped'};
  throw error;
 } finally {
  // Cancellation or a failed query may leave an in-flight statement or lock.
  // Destroy that session instead of issuing any further SQL on it.
  try {
   if (!controller.signal.aborted && locked) await query('SELECT pg_advisory_unlock($1)',[LOCK_ID]);
  } finally {
   signal?.removeEventListener('abort', stop);
   db.release(failed || controller.signal.aborted);
   db.removeListener('error', fail);
  }
 }
}
