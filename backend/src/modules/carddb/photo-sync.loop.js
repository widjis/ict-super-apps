export async function runPhotoSyncLoop({ run, close, stopping, wait, report }) {
 while (!stopping()) {
  let result;
  try { result = await run(); }
  catch { result = { state: 'worker_error' }; }
  finally { await close(); }
  report(result);
  if (!stopping()) await wait(3600000);
 }
}
