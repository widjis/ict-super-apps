export default function RegisterDeviceScreen({ onBack }: { onBack?: () => void }) {
  return <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-5">
    <h1 className="text-3xl font-bold">Register Device</h1>
    <p role="status">Not available in Phase 1. Controlled registration is a later phase. No router changes are enabled.</p>
    {onBack && <button onClick={onBack} className="min-h-12 text-primary">Back to WiFi &amp; Network</button>}
  </main>;
}
