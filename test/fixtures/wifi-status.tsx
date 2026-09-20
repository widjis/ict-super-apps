// TEST-ONLY local visual fixture. Never imported by production: no credentials,
// real backend traffic, auth bypass in App, or claim of native OCR execution.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from '../../src/App';
import CheckDeviceStatusScreen from '../../src/screens/CheckDeviceStatusScreen';
import { sessionClient } from '../../src/auth/session';
import '../../src/index.css';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') || 'single';
let calls = 0;
sessionClient.restore = async () => true;
sessionClient.request = async (_url, init) => {
  calls++;
  document.documentElement.dataset.fixtureCalls = String(calls);
  await new Promise(resolve => setTimeout(resolve, 700));
  if (mode === 'error' || (mode === 'stale' && calls > 1)) return Response.json({ error: 'SYNTHETIC_UNAVAILABLE' }, { status: 503 });
  const mac = JSON.parse(String(init?.body)).mac;
  const lease = { mac, server: 'SYNTHETIC-DHCP-A', deviceDescription: 'Local fixture — support test device, not production inventory', configuredPool: 'SYNTHETIC-POOL', configuredAddress: null, activeAddress: '192.0.2.10', dhcpStatus: 'bound', disabled: false, dynamic: false };
  const leases = mode === 'none' ? [] : mode === 'multiple' ? [lease, { ...lease, server: 'SYNTHETIC-DHCP-B', disabled: true, dhcpStatus: 'waiting', activeAddress: null }] : [lease];
  return Response.json({ ok: true, mac, match: leases.length > 1 ? 'multiple' : leases.length ? 'single' : 'none', leases, observedAt: new Date().toISOString(), stale: false, reachability: 'unknown', internetAccess: 'unknown' });
};
if (!location.hash) location.hash = 'check-device-status';
const ocr = params.has('ocr');
if (ocr) Capacitor.getPlatform = () => 'android';
createRoot(document.getElementById('root')!).render(<>
  <p className="bg-secondary-container text-on-secondary-container text-center text-xs py-1">LOCAL FIXTURE · synthetic data · {ocr ? 'OCR presentation only' : 'actual App route'}</p>
  {ocr ? <div className="min-h-screen bg-surface font-body text-on-surface"><CheckDeviceStatusScreen onBack={() => location.assign('./wifi-status.html#wifi-network')} scanImage={async () => { await new Promise(resolve => setTimeout(resolve, 600)); return ['02:AB:CD:EF:00:01', '04:AB:CD:EF:00:02']; }} /></div> : <App />}
</>);
