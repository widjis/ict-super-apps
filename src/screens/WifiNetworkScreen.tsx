import { Search, Router, BarChart2, ChevronRight } from 'lucide-react';

// Keep the Asset Management hub's tokens and horizontal card language local to WiFi.
const cardClass = 'flex w-full items-start gap-3 min-[380px]:gap-5 p-5 min-[380px]:p-6 bg-surface-container-lowest rounded-2xl text-left border border-transparent shadow-[0_4px_20px_rgba(42,52,57,0.04)]';
const titleClass = 'block font-headline text-lg font-bold text-on-surface leading-snug';
const descriptionClass = 'block mt-1 text-sm leading-relaxed text-on-surface-variant';
const badgeClass = 'inline-block mt-3 rounded-md bg-surface-container-low px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant';

export default function WifiNetworkScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 min-[380px]:px-6 pt-8 pb-[calc(8rem+env(safe-area-inset-bottom,0px))]">
      <header className="mb-10">
        <p className="font-label text-xs font-bold tracking-widest text-primary uppercase mb-2">Operations Hub</p>
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-tight">WiFi &amp; Network</h1>
        <p className="mt-3 text-on-surface-variant leading-relaxed">ICT support tools for device registration checks and DHCP lease information.</p>
      </header>

      <section className="grid grid-cols-1 gap-6" aria-label="Network tools">
        <button
          type="button"
          onClick={() => onNavigate?.('check-device-status')}
          aria-labelledby="wifi-check-title"
          aria-describedby="wifi-check-description"
          className={`${cardClass} group hover:border-primary/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary`}
        >
          <span className="shrink-0 w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 rounded-xl bg-primary-container flex items-center justify-center text-primary" aria-hidden="true"><Search className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8" /></span>
          <span className="min-w-0 flex-1 pt-1">
            <span className="flex items-start justify-between gap-2">
              <span id="wifi-check-title" className={titleClass}>Check Status</span>
              <ChevronRight className="w-5 h-6 shrink-0 text-primary/60" aria-hidden="true" />
            </span>
            <span id="wifi-check-description" className={descriptionClass}>Look up a MAC address across DHCP servers. Registration is not proof of connectivity.</span>
          </span>
        </button>

        <button type="button" disabled aria-labelledby="wifi-register-title wifi-register-badge" aria-describedby="wifi-register-description" className={`${cardClass} cursor-not-allowed`}>
          <span className="shrink-0 w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 rounded-xl bg-tertiary-container flex items-center justify-center text-tertiary" aria-hidden="true"><Router className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8" /></span>
          <span className="min-w-0 flex-1 pt-1">
            <span id="wifi-register-title" className={titleClass}>Register Device</span>
            <span id="wifi-register-description" className={descriptionClass}>Controlled device registration is not available yet.</span>
            <span id="wifi-register-badge" className={badgeClass}>Coming soon</span>
          </span>
        </button>

        <button type="button" disabled aria-labelledby="wifi-report-title wifi-report-badge" aria-describedby="wifi-report-description" className={`${cardClass} cursor-not-allowed`}>
          <span className="shrink-0 w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 rounded-xl bg-secondary-container flex items-center justify-center text-secondary" aria-hidden="true"><BarChart2 className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8" /></span>
          <span className="min-w-0 flex-1 pt-1">
            <span id="wifi-report-title" className={titleClass}>Lease Report</span>
            <span id="wifi-report-description" className={descriptionClass}>Registration expiry tracking is not available yet.</span>
            <span id="wifi-report-badge" className={badgeClass}>Coming soon</span>
          </span>
        </button>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-on-surface-variant">Read-only lookup. Network inventory and metrics are not available in Phase 1. Connectivity and VLAN/SSID mappings are not verified.</p>
    </div>
  );
}
