import { useEffect, useRef, useState } from 'react';
import { Undo2, Router, Info, ClipboardList } from 'lucide-react';
import { extractMacCandidates } from '../lib/mac-ocr';

const card = 'rounded-2xl bg-surface-container-lowest p-5 min-[380px]:p-6 space-y-5 shadow-[0_4px_20px_rgba(42,52,57,0.04)]';
const field = 'w-full min-w-0 min-h-14 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base focus:outline-2 focus:outline-primary focus:outline-offset-2';
const action = 'min-h-12 rounded-xl px-4 py-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary';

export default function RegisterDeviceScreen({ onBack }: { onBack?: () => void }) {
  const [mac, setMac] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [description, setDescription] = useState('');
  const [review, setReview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const macInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);
  function reviewDraft(event: { preventDefault(): void }) {
    event.preventDefault();
    const raw = mac.trim();
    const candidates = extractMacCandidates(raw);
    // The OCR parser finds candidates inside text; manual input must be one whole MAC.
    if (!/^(?:[\da-f]{12}|[\da-f]{2}(?::[\da-f]{2}){5}|[\da-f]{2}(?:-[\da-f]{2}){5})$/i.test(raw) || candidates.length !== 1) {
      setError('Enter a valid unicast MAC address.'); macInput.current?.focus(); return;
    }
    // Preview safety bounds, not an approved production comment/type schema.
    if (deviceType.length > 64 || description.length > 512 || /[\p{Cc}\p{Cf}]/u.test(deviceType + description)) {
      setError('Use plain text without control or formatting characters: device type up to 64, description up to 512 characters.'); return;
    }
    setError(''); setReview(candidates[0]);
  }
  return <>
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md flex items-center gap-3 px-4 min-[380px]:px-6 h-safe-16">
      <button type="button" onClick={onBack} aria-label="Back to WiFi & Network" className="min-w-12 min-h-12 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"><Undo2 className="w-6 h-6" aria-hidden="true" /></button>
      <h1 className="font-headline text-lg font-bold tracking-tight">Register Device</h1>
    </header>
    <div className="max-w-2xl mx-auto px-4 min-[380px]:px-6 pt-8 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] space-y-6">
      <section className="flex items-start gap-4">
        <span className="shrink-0 w-12 h-12 rounded-xl bg-tertiary-container text-tertiary flex items-center justify-center"><Router className="w-7 h-7" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-primary">Operations Hub</p><h2 className="mt-1 font-headline text-2xl font-extrabold">Prepare a device</h2><p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Check your draft before registration becomes available.</p></div>
      </section>
      <div className="rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed space-y-2" role="status">
        <p className="font-bold flex items-center gap-2"><Info className="w-5 h-5 shrink-0 text-primary" aria-hidden="true" />Preview / Not connected</p>
        <p>Registration is not available. No registration has been executed. This preview does not check existing leases or send anything to the router.</p>
        <p className="text-on-surface-variant">Drafts stay only in this screen’s memory and are discarded when you leave. Do not include passwords or sensitive personal information.</p>
      </div>
      {review ? <section aria-label="Local review" className={card}>
        <h2 ref={reviewHeading} tabIndex={-1} className="font-headline text-xl font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" aria-hidden="true" />Local review</h2>
        <p className="text-sm text-on-surface-variant">Review only — not a registration request or confirmation of access.</p>
        <dl className="space-y-4 text-sm"><div><dt className="font-bold">MAC address</dt><dd className="mt-1 font-mono break-all">{review}</dd></div>
          <div><dt className="font-bold">Device type · Unverified draft</dt><dd className="mt-1 break-words">{deviceType.trim() || 'Not provided'}</dd></div>
          <div><dt className="font-bold">Device description · Unverified draft</dt><dd className="mt-1 break-words">{description.trim() || 'Not provided'}</dd></div>
        </dl>
        <p className="text-xs text-on-surface-variant">These notes are not verified ownership or an approved RouterOS comment.</p>
        <button type="button" className={`${action} w-full bg-primary text-on-primary`} onClick={() => { setReview(null); }}>Edit draft</button>
      </section> : <form noValidate autoComplete="off" onSubmit={reviewDraft} className={card}>
        <div className="space-y-2"><label htmlFor="register-mac" className="block font-bold text-sm">MAC address <span className="font-normal">(required)</span></label>
          <input ref={macInput} id="register-mac" value={mac} onInput={e => { setMac(e.currentTarget.value); setError(''); }} maxLength={64} autoCapitalize="characters" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'register-mac-help register-error' : 'register-mac-help'} className={`${field} font-mono`} placeholder="02:AB:CD:EF:00:01" />
          <p id="register-mac-help" className="text-xs leading-relaxed text-on-surface-variant">Type or paste the MAC from the device’s selected Wi-Fi network (SSID). Use its randomized MAC for that network, not another network’s address. The app does not auto-read it.</p>
        </div>
        <div className="space-y-2"><label htmlFor="register-type" className="block font-bold text-sm">Device type <span className="font-normal">(optional draft)</span></label>
          <input id="register-type" value={deviceType} onInput={e => { setDeviceType(e.currentTarget.value); setError(''); }} maxLength={64} spellCheck={false} aria-describedby="register-notes-help" className={field} placeholder="Describe the kind of device" />
        </div>
        <div className="space-y-2"><label htmlFor="register-description" className="block font-bold text-sm">Device description <span className="font-normal">(optional draft)</span></label>
          <textarea id="register-description" value={description} onInput={e => { setDescription(e.currentTarget.value); setError(''); }} maxLength={512} rows={3} spellCheck={false} aria-describedby="register-notes-help" className={`${field} resize-y`} />
          <p id="register-notes-help" className="text-xs leading-relaxed text-on-surface-variant">Unverified draft notes, not an owner identity or approved RouterOS comment. Plain single-line text only: type up to 64, description up to 512 characters. Final field choices and comment format are pending approval.</p>
        </div>
        {error && <p id="register-error" role="alert" className="text-sm text-error">{error}</p>}
        <button type="submit" className={`${action} w-full bg-primary text-on-primary`}>Review draft locally</button>
      </form>}
      <section aria-label="Registration requirements" className={`${card} text-sm leading-relaxed`}>
        <div><h2 className="font-bold">Employee directory</h2><p className="mt-1 text-on-surface-variant">Unavailable in this preview. No employee selected or verified; ownership is unverified. Directory-backed selection is required before connected registration.</p></div>
        <div><h2 className="font-bold">Category / pool</h2><p className="mt-1 text-on-surface-variant">Unavailable — live catalog and category permissions are not connected. No category or pool selected.</p></div>
        <p className="text-on-surface-variant">Registration policy and comment format still need approval. No expiry can be set: the enforcement worker is not implemented.</p>
      </section>
    </div>
  </>;
}
