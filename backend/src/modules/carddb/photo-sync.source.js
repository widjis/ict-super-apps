import { connectCardDb, fetchCardDbEmployeePhoto } from './carddb-photo.service.js';

// Translate driver EventEmitter errors into ordinary source failures so the
// cycle persists its backoff instead of crashing/restarting without a circuit.
export function createPhotoSource({ connect = connectCardDb, fetch = fetchCardDbEmployeePhoto } = {}) {
 let connection;
 let rejectFailure;
 const failure = new Promise((_, reject) => { rejectFailure = reject; });
 void failure.catch(() => undefined); // An idle pool can also emit an error.
 const onError = () => rejectFailure(new Error('Photo sync source failed'));
 return {
  async fetch(id, { signal } = {}) {
   signal?.throwIfAborted();
   connection ??= connect({ onError });
   return Promise.race([failure, connection.then(pool => {
    signal?.throwIfAborted();
    return fetch(pool,id);
   })]);
  },
  async close() {
   const pool = await connection?.catch(() => undefined);
   if (pool) await pool.close().catch(() => undefined);
  }
 };
}
