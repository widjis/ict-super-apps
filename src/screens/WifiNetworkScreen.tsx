import { Search, Router, BarChart2 } from 'lucide-react';

export default function WifiNetworkScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  return <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-32 space-y-8">
    <header><h1 className="font-headline text-3xl font-bold">WiFi &amp; Network</h1><p className="mt-3 text-on-surface-variant">ICT support tools. Read-only DHCP lookup; access is verified by the backend on every request.</p></header>
    <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Network tools">
      <article className="rounded-2xl bg-surface-container-lowest p-6 space-y-4"><Search className="text-primary" /><h2 className="text-xl font-bold">Check Status</h2><p>Look up a MAC address across DHCP servers. Registration is not proof of connectivity.</p><button onClick={() => onNavigate?.('check-device-status')} className="min-h-12 px-5 rounded-xl bg-primary text-on-primary font-bold">Check Status</button></article>
      <article className="rounded-2xl bg-surface-container-low p-6 space-y-4"><Router /><h2 className="text-xl font-bold">Register Device</h2><p>Not available — controlled registration is a later phase.</p><button disabled className="min-h-12 opacity-60">Registration not available</button></article>
      <article className="rounded-2xl bg-surface-container-low p-6 space-y-4"><BarChart2 /><h2 className="text-xl font-bold">Lease Report</h2><p>Not available — registration expiry tracking is a later phase.</p><button disabled className="min-h-12 opacity-60">Report not available</button></article>
    </section>
    <section className="rounded-2xl bg-surface-container-low p-6"><h2 className="text-xl font-bold">Network inventory &amp; metrics</h2><p className="mt-2">Not available in Phase 1. Pool capacity, device reachability, internet access and VLAN/SSID mappings have not been verified.</p></section>
  </main>;
}
