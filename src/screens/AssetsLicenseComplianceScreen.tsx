import { BarChart3, BellRing, ChevronRight, QrCode, Search, ShieldCheck, Undo2 } from 'lucide-react';

interface AssetsLicenseComplianceScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export default function AssetsLicenseComplianceScreen({ onBack, onNavigate }: AssetsLicenseComplianceScreenProps) {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md flex items-center justify-between w-full px-6 h-safe-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors duration-200 active:scale-95"
            aria-label="Back"
          >
            <Undo2 className="w-6 h-6 text-primary" />
          </button>
          <h1 className="font-headline text-lg font-bold tracking-tight text-on-surface">Asset Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95" aria-label="Search">
            <Search className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-8 pb-32">
        <section className="mb-10">
          <p className="font-label text-xs font-bold tracking-widest text-primary uppercase mb-2">Operations Hub</p>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-tight">Compliance &amp; Assets</h2>
          <p className="mt-3 text-on-surface-variant leading-relaxed">
            Manage your hardware inventory and software licensing integrity from a single point of authority.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6">
          <button
            onClick={() => onNavigate?.('asset-lookup')}
            className="group flex items-start gap-5 p-6 bg-surface-container-lowest rounded-2xl transition-all duration-250 active:scale-95 text-left border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(42,52,57,0.04)]"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex-grow pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-lg font-bold text-on-surface">Asset Lookup (MVP)</h3>
                <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                Instant database search for specific hardware profiles and ownership history.
              </p>
            </div>
          </button>

          <button className="group relative flex items-start gap-5 p-6 bg-surface-container-lowest rounded-2xl transition-all duration-250 active:scale-95 text-left border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-tertiary-container flex items-center justify-center text-tertiary">
              <QrCode className="w-8 h-8" />
            </div>
            <div className="flex-grow pt-1 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-lg font-bold text-on-surface">Scan Asset</h3>
                <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                Use mobile camera to instantly verify asset tags and update deployment status.
              </p>
            </div>
          </button>

          <button className="group flex items-start gap-5 p-6 bg-surface-container-lowest rounded-2xl transition-all duration-250 active:scale-95 text-left border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-secondary">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="flex-grow pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg font-bold text-on-surface">Dashboard Ringkas</h3>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-bold text-outline uppercase tracking-wider">
                    Supervisor
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                High-level overview of utilization rates, lifecycle costs, and team allocations.
              </p>
            </div>
          </button>

          <button className="group flex items-start gap-5 p-6 bg-surface-container-lowest rounded-2xl transition-all duration-250 active:scale-95 text-left border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-container/60 flex items-center justify-center text-on-primary-container">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex-grow pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg font-bold text-on-surface">Licenses</h3>
                  <span className="px-2 py-0.5 rounded bg-on-secondary-fixed text-[10px] font-bold text-surface-container-lowest uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                Audit software keys, renewal dates, and compliance documentation for procurement.
              </p>
            </div>
          </button>

          <button className="group flex items-start gap-5 p-6 bg-surface-container-lowest rounded-2xl transition-all duration-250 active:scale-95 text-left border border-transparent hover:border-primary/10 shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-error-container/20 flex items-center justify-center text-error">
              <BellRing className="w-8 h-8 fill-error/10" />
            </div>
            <div className="flex-grow pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-lg font-bold text-on-surface">Alert &amp; Reminder</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  <ChevronRight className="w-6 h-6 text-primary/40 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mt-1">
                3 Critical alerts pending regarding hardware warranty expirations and license renewals.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-12 p-8 rounded-2xl bg-primary text-on-primary overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="font-headline text-xl font-bold mb-2">Compliance Status: Optimal</h4>
            <p className="text-on-primary/80 text-sm max-w-xs">
              98% of your assets are currently meeting enterprise standards. Next audit scheduled in 12 days.
            </p>
          </div>
          <ShieldCheck className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 rotate-12" />
        </div>
      </main>
    </div>
  );
}
