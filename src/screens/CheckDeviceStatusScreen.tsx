import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { scanMacImage, type ImageSource } from '../lib/mac-ocr';
import { authedRequestJson } from '../lib/http';

type Lease = { deviceDescription?: string | null; mac: string; server: string; configuredAddress: string | null; configuredPool: string | null; activeAddress: string | null; dhcpStatus: string; disabled: boolean; dynamic: boolean };
type Lookup = { ok: true; mac: string; match: 'none' | 'single' | 'multiple'; leases: Lease[]; observedAt: string; stale: boolean; reachability: 'unknown'; internetAccess: 'unknown' };
function validResult(data: any, mac: string): data is Lookup {
  const nullableText = (v: unknown) => v === null || typeof v === 'string';
  return data?.ok === true && data.mac === mac && typeof data.observedAt === 'string' && Number.isFinite(Date.parse(data.observedAt)) && Date.parse(data.observedAt) <= Date.now() + 5000
    && typeof data.stale === 'boolean' && data.reachability === 'unknown' && data.internetAccess === 'unknown'
    && Array.isArray(data.leases) && data.leases.length <= 64 && data.match === (data.leases.length > 1 ? 'multiple' : data.leases.length ? 'single' : 'none')
    && data.leases.every((l: any) => l && l.mac === mac && typeof l.server === 'string' && typeof l.dhcpStatus === 'string' && typeof l.disabled === 'boolean' && typeof l.dynamic === 'boolean' && nullableText(l.configuredPool) && nullableText(l.configuredAddress) && nullableText(l.activeAddress) && (l.deviceDescription === undefined || l.deviceDescription === null || (typeof l.deviceDescription === 'string' && l.deviceDescription.length <= 512)));
}
export default function CheckDeviceStatusScreen({ onBack, scanImage = scanMacImage }: { onBack?: () => void; scanImage?: (source: ImageSource) => Promise<string[]> }) {
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [confirmScan, setConfirmScan] = useState(false);
  const [scanNotice, setScanNotice] = useState('');
  const [mac, setMac] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Lookup | null>(null);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const scanGeneration = useRef(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { scanGeneration.current++; pending.current?.abort(); pending.current = null; }, []);
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setStale(true), Math.max(0, Date.parse(result.observedAt) + 60000 - Date.now()));
    return () => clearTimeout(timer);
  }, [result]);
  function changeMac(value: string) {
    scanGeneration.current++; setScanning(false); setCandidates([]); setScanNotice('');
    pending.current?.abort(); pending.current = null;
    setBusy(false); setMac(value); setResult(null); setError(''); setStale(false);
  }
  async function scan(source: ImageSource) {
    changeMac(''); setCandidates([]); setConfirmScan(false); setScanNotice(''); setScanning(true);
    const generation = ++scanGeneration.current;
    try {
      const found = await scanImage(source);
      if (generation !== scanGeneration.current) return;
      setCandidates(found);
      setScanNotice(found.length ? 'Select a candidate, compare with the original image, then confirm the editable MAC.' : 'No valid MAC found. Try a clearer photo or type/paste manually.');
    } catch (failure) {
      if (generation !== scanGeneration.current) return;
      setScanNotice((failure as { code?: string })?.code === 'CANCELLED' ? 'Image selection cancelled.' : 'Photo OCR unavailable. Check camera/photo access or type/paste manually.');
    } finally { if (generation === scanGeneration.current) setScanning(false); }
  }
  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (pending.current || scanning || candidates.length) return;
    const raw = mac.trim();
    const hex = raw.replace(/[:-]/g, '').toUpperCase();
    if (!/^(?:[\da-f]{12}|[\da-f]{2}(:[\da-f]{2}){5}|[\da-f]{2}(-[\da-f]{2}){5})$/i.test(raw) || hex === '000000000000' || (parseInt(hex.slice(0, 2), 16) & 1)) {
      setResult(null); setError('Enter a valid unicast MAC address.'); return;
    }
    const normalized = hex.match(/.{2}/g)!.join(':');
    if (result?.mac !== normalized) setResult(null);
    const controller = new AbortController(); pending.current = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    setBusy(true); setError('');
    try {
      const data = await authedRequestJson('/api/wifi/lookup', { method: 'POST', cache: 'no-store', signal: controller.signal, bodyJson: { mac: normalized } });
      if (pending.current !== controller) return;
      if (!validResult(data, normalized)) throw new Error('INVALID_RESPONSE');
      setResult(data); setStale(data.stale || Date.now() - Date.parse(data.observedAt) > 60000);
    } catch (failure) {
      if (pending.current !== controller) return;
      const status = (failure as { status?: number })?.status;
      if (status === 401 || status === 403) setResult(null); else setStale(true);
      setError(status === 401 ? 'Sign in again to check status.' : status === 403 ? 'Only authorized ICT support can check status.' : status === 429 ? 'Too many lookups. Wait one minute and retry.' : 'DHCP source unavailable. Registration was not verified. Retry Check Status.');
    } finally { clearTimeout(timer); if (pending.current === controller) { pending.current = null; setBusy(false); } }
  }
  return <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6">
    {onBack && <button onClick={onBack} className="min-h-12 text-primary">Back</button>}
    <header><h1 className="font-headline text-3xl font-bold">Check Device Status</h1><p className="mt-2">ICT support · read-only DHCP registration lookup.</p></header>
    <form onSubmit={submit} className="bg-surface-container-lowest rounded-2xl p-5 space-y-4">
      <label htmlFor="wifi-mac" className="block font-semibold">MAC address</label>
      <input id="wifi-mac" type="text" value={mac} onInput={e => changeMac(e.currentTarget.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={64} placeholder="02:AB:CD:EF:00:01" aria-describedby="wifi-help" className="w-full min-h-14 rounded-xl bg-surface-container-highest px-4 font-mono" />
      <p id="wifi-help" className="text-sm text-on-surface-variant">Enter a MAC address or paste using your keyboard. On Android, open Wi-Fi settings for the selected SSID and use its randomized MAC, not another network's MAC. This app does not auto-read your MAC.</p>
      <div className="flex gap-3">
        {(['camera', 'gallery'] as const).map(source => <button key={source} type="button" disabled={scanning || Capacitor.getPlatform() !== 'android'} onClick={() => void scan(source)} className="flex-1 min-h-12 rounded-xl border border-outline disabled:opacity-50">{source === 'camera' ? 'Camera' : 'Gallery'}</button>)}
      </div>
      <p className="text-sm">Android on-device photo OCR. Images and recognized text are not uploaded. ML Kit may send usage/performance metrics to Google. Browser photo OCR is not available.</p>
      {scanning && <p role="status">Reading image on device...</p>}
      {scanNotice && <p role="status">{scanNotice}</p>}
      {candidates.length > 0 && <section aria-label="MAC candidates" className="space-y-2">
        {candidates.map(candidate => <button type="button" key={candidate} onClick={() => { changeMac(candidate); setCandidates([]); setConfirmScan(true); }} className="w-full min-h-12 border border-outline rounded-xl font-mono">{candidate}</button>)}
        <button type="button" onClick={() => { setCandidates([]); setScanNotice(''); }} className="min-h-12">Discard scan</button>
      </section>}
      <button type="submit" disabled={busy || scanning || candidates.length > 0} aria-busy={busy} className="w-full min-h-14 bg-primary text-on-primary rounded-xl font-bold disabled:opacity-50">{busy ? 'Checking...' : confirmScan ? 'Confirm MAC & Check Status' : 'Check Status'}</button>
    </form>
    {error && <p role="alert" className="rounded-xl bg-error-container p-4">{error}</p>}
    {busy && <p role="status">Checking DHCP source...</p>}
    {!result && !busy && !error && <p>Enter a MAC address to check registration. No lookup performed yet.</p>}
    {result && <section aria-label="DHCP lookup result" className="space-y-4 break-words">
      {stale && <p role="status" className="font-bold">Stale observation — refresh required; not current status.</p>}
      <h2 className="text-xl font-bold">{result.match === 'none' ? 'No DHCP lease found' : result.match === 'multiple' ? 'Multiple leases — review every server' : 'DHCP lease found'}</h2>
      <p className="font-mono">{result.mac}</p><p>Observed: {new Date(result.observedAt).toLocaleString()}</p>
      {result.leases.map((lease, index) => <article key={`${lease.server}-${index}`} className="rounded-2xl bg-surface-container-lowest p-5 space-y-2">
        <h3 className="font-bold">DHCP server: {lease.server}</h3>
        <p>Device description (RouterOS comment): {lease.deviceDescription === undefined ? 'Description unavailable — backend update required' : lease.deviceDescription || 'Not provided'}</p>
        <p className="text-sm text-on-surface-variant">Free-text registration note, not verified AD owner information.</p>
        <p>{lease.dynamic ? 'Dynamic lease' : 'Registered (static lease)'} · {lease.disabled ? 'Disabled' : 'Enabled'}</p>
        <p>DHCP status: {lease.dhcpStatus}</p><p>Configured pool: {lease.configuredPool ?? '—'}</p>
        <p>Configured IP: {lease.configuredAddress ?? '—'}</p><p>Active IP: {lease.activeAddress ?? 'Not allocated / unknown'}</p>
      </article>)}
      <p className="text-sm">Registration and DHCP bound do not prove reachability or internet access. Both are unverified. Pool names do not verify VLAN/SSID or Full/Limited access policy. Owner and registration expiry are unknown.</p>
    </section>}
  </main>;
}
