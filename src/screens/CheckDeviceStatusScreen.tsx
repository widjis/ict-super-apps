import { useEffect, useRef, useState } from 'react';
import { Undo2, Search, Camera, Image, ShieldCheck, LoaderCircle, Info, AlertCircle, Network } from 'lucide-react';
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
  return <>
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md flex items-center gap-3 w-full px-4 min-[380px]:px-6 h-safe-16">
      {onBack && <button type="button" onClick={onBack} aria-label="Back to WiFi & Network" className="shrink-0 min-w-11 min-h-11 -ml-2 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"><Undo2 className="w-6 h-6" aria-hidden="true" /></button>}
      <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">Check Device Status</h1>
    </header>
    <div className="max-w-2xl mx-auto px-4 min-[380px]:px-6 pt-6 pb-24 space-y-6">
    <header>
      <p className="font-label text-xs font-bold tracking-widest text-primary uppercase mb-3">Operations Hub</p>
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-primary"><Search className="w-6 h-6" aria-hidden="true" /></span>
        <div><h2 className="font-headline text-2xl font-extrabold tracking-tight leading-tight">Device lookup</h2><p className="text-sm text-on-surface-variant mt-1">ICT support · read-only DHCP check</p></div>
      </div>
    </header>
    <form onSubmit={submit} className="bg-surface-container-lowest rounded-2xl p-4 min-[380px]:p-5 space-y-4 shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
      <div className="space-y-2">
        <label htmlFor="wifi-mac" className="block text-sm font-bold">MAC address</label>
        <input id="wifi-mac" type="text" value={mac} onInput={e => changeMac(e.currentTarget.value)} autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} maxLength={64} placeholder="02:AB:CD:EF:00:01" aria-describedby="wifi-help" className="w-full min-w-0 min-h-14 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-base font-mono focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2" />
        <p id="wifi-help" className="text-xs leading-relaxed text-on-surface-variant">Enter a MAC address or paste using your keyboard.</p>
        <details className="text-sm text-on-surface-variant">
          <summary className="min-h-11 py-3 cursor-pointer text-primary font-semibold rounded-lg focus-visible:outline-2 focus-visible:outline-primary">Where to find your MAC</summary>
          <p className="pb-2 leading-relaxed">On Android, open Wi-Fi settings for the selected SSID and use its randomized MAC, not another network's MAC. This app does not auto-read your MAC.</p>
        </details>
      </div>
      <div className="border-t border-surface-container-high pt-4 space-y-3">
        <p className="text-xs font-semibold text-on-surface-variant">Or read a MAC from a photo</p>
        <div className="grid grid-cols-2 gap-3">
          {(['camera', 'gallery'] as const).map(source => <button key={source} type="button" aria-describedby="wifi-photo-help" disabled={scanning || Capacitor.getPlatform() !== 'android'} onClick={() => void scan(source)} className="flex items-center justify-center gap-2 min-h-12 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface border border-surface-container-high hover:border-primary/30 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">{source === 'camera' ? <Camera className="w-5 h-5 text-tertiary" aria-hidden="true" /> : <Image className="w-5 h-5 text-secondary" aria-hidden="true" />}{source === 'camera' ? 'Camera' : 'Gallery'}</button>)}
        </div>
        <p id="wifi-photo-help" className="text-xs leading-relaxed text-on-surface-variant">{Capacitor.getPlatform() === 'android' ? 'On-device OCR. Review and confirm the MAC before lookup.' : 'Browser photo OCR is not available. Type or paste instead.'}</p>
        <details className="text-xs text-on-surface-variant">
          <summary className="min-h-11 py-3 cursor-pointer font-semibold rounded-lg focus-visible:outline-2 focus-visible:outline-primary">Photo OCR &amp; privacy</summary>
          <p className="pb-2 leading-relaxed">Android on-device photo OCR. Images and recognized text are not uploaded. ML Kit may send usage/performance metrics to Google. Only the confirmed MAC is sent for lookup.</p>
        </details>
      </div>
      {scanning && <p role="status" className="flex items-center gap-2 rounded-xl bg-surface-container-low p-3 text-sm"><LoaderCircle className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />Reading image on device...</p>}
      {scanNotice && <p role="status" className="rounded-xl bg-secondary-container/30 p-3 text-sm leading-relaxed">{scanNotice}</p>}
      {candidates.length > 0 && <section aria-label="MAC candidates" className="rounded-xl bg-surface-container-low p-3 space-y-2">
        {candidates.map(candidate => <button type="button" key={candidate} onClick={() => { changeMac(candidate); setCandidates([]); setConfirmScan(true); }} className="w-full min-h-12 border border-outline-variant bg-surface-container-lowest rounded-xl font-mono text-sm text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">{candidate}</button>)}
        <button type="button" onClick={() => { setCandidates([]); setScanNotice(''); }} className="min-h-12 px-3 text-sm font-semibold text-on-surface-variant rounded-lg focus-visible:outline-2 focus-visible:outline-primary">Discard scan</button>
      </section>}
      <button type="submit" disabled={busy || scanning || candidates.length > 0} aria-busy={busy} className="flex items-center justify-center gap-2 w-full min-h-14 px-3 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4">{busy ? <LoaderCircle className="w-5 h-5 shrink-0 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="w-5 h-5 shrink-0" aria-hidden="true" />}{busy ? 'Checking...' : confirmScan ? 'Confirm MAC & Check Status' : 'Check Status'}</button>
    </form>
    {error && <p role="alert" className="flex items-start gap-3 rounded-2xl bg-error-container text-on-error-container p-4 text-sm leading-relaxed"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />{error}</p>}
    {busy && <p role="status" className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Checking DHCP source...</p>}
    {!result && !busy && !error && <div className="flex items-start gap-3 px-1 text-on-surface-variant"><ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-secondary" aria-hidden="true" /><p className="text-xs leading-relaxed">Enter a MAC address to check registration. No lookup performed yet.</p></div>}
    {result && <section aria-label="DHCP lookup result" className="space-y-4 [overflow-wrap:anywhere]">
      {stale && <p role="status" className="rounded-xl bg-secondary-container p-3 text-sm font-semibold text-on-secondary-container">Stale observation — refresh required; not current status.</p>}
      <h2 className="flex items-start gap-2 font-headline text-lg font-bold"><Network className="w-5 h-5 shrink-0 mt-1 text-primary" aria-hidden="true" />{result.match === 'none' ? 'No DHCP lease found' : result.match === 'multiple' ? 'Multiple leases — review every server' : 'DHCP lease found'}</h2>
      <p className="font-mono text-sm text-primary">{result.mac}</p><p className="text-xs text-on-surface-variant">Observed: {new Date(result.observedAt).toLocaleString()}</p>
      {result.leases.map((lease, index) => <article key={`${lease.server}-${index}`} className="rounded-2xl bg-surface-container-lowest p-4 min-[380px]:p-5 space-y-3 text-sm leading-relaxed shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
        <h3 className="font-bold">DHCP server: {lease.server}</h3>
        <p>Device description (RouterOS comment): {lease.deviceDescription === undefined ? 'Description unavailable — backend update required' : lease.deviceDescription || 'Not provided'}</p>
        <p className="text-sm text-on-surface-variant">Free-text registration note, not verified AD owner information.</p>
        <p>{lease.dynamic ? 'Dynamic lease' : 'Registered (static lease)'} · {lease.disabled ? 'Disabled' : 'Enabled'}</p>
        <p>DHCP status: {lease.dhcpStatus}</p><p>Configured pool: {lease.configuredPool ?? '—'}</p>
        <p>Configured IP: {lease.configuredAddress ?? '—'}</p><p>Active IP: {lease.activeAddress ?? 'Not allocated / unknown'}</p>
      </article>)}
      <p className="flex items-start gap-2 rounded-xl bg-surface-container-low p-4 text-xs leading-relaxed text-on-surface-variant"><Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />Registration and DHCP bound do not prove reachability or internet access. Both are unverified. Pool names do not verify VLAN/SSID or Full/Limited access policy. Owner and registration expiry are unknown.</p>
    </section>}
  </div></>;
}
