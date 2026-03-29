import { Timer, CalendarDays, Search, Plus } from 'lucide-react';

interface LeaseExpirationReportScreenProps {
  onBack?: () => void;
}

export default function LeaseExpirationReportScreen({ onBack }: LeaseExpirationReportScreenProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-32">
      {/* Header & Editorial Section */}
      <section className="mb-10">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2">Lease Expiration Report</h1>
        <p className="text-on-surface-variant max-w-2xl font-body">Real-time tracking of network lease lifecycles. Monitor critical device connectivity and manage upcoming expirations with precision.</p>
      </section>

      {/* Filters Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button className="flex flex-col items-start p-5 bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-label text-on-surface-variant mb-2 tracking-widest uppercase">Filter</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <Timer className="w-6 h-6" />
            </div>
            <span className="font-headline text-lg font-bold">Expiring Soon (24h)</span>
          </div>
        </button>
        <button className="flex flex-col items-start p-5 bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <span className="text-xs font-label text-on-surface-variant mb-2 tracking-widest uppercase">Schedule</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
            <span className="font-headline text-lg font-bold">Next 7 Days</span>
          </div>
        </button>
        <div className="md:col-span-2 flex items-center bg-surface-container-highest/50 px-6 rounded-2xl">
          <Search className="w-6 h-6 text-on-surface-variant mr-4" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-on-surface font-body w-full py-4 placeholder:text-outline outline-none" 
            placeholder="Search by Comment or MAC Address..." 
            type="text"
          />
          <kbd className="hidden md:inline-flex items-center px-2 py-1 bg-surface-container rounded text-[10px] text-on-surface-variant font-mono uppercase">Cmd + K</kbd>
        </div>
      </div>

      {/* Data List */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden p-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2 px-3">
            <thead>
              <tr className="text-on-surface-variant text-[11px] uppercase tracking-[0.15em] font-bold">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">MAC Address</th>
                <th className="px-6 py-4">Expires At</th>
                <th className="px-6 py-4">Comment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="space-y-4">
              {/* Item 1: Critical */}
              <tr className="bg-surface-container-lowest group hover:bg-surface-bright transition-colors">
                <td className="px-6 py-5 rounded-l-2xl">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                    </span>
                    <span className="text-xs font-bold text-error">Critical</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <code className="font-mono text-sm bg-surface-container px-2 py-1 rounded text-primary">00:1A:2B:3C:4D:5E</code>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Today, 22:45</span>
                    <span className="text-[10px] text-error font-bold uppercase tracking-tighter">Ends in 2h 15m</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-on-surface-variant italic">"Primary Core Router - North Wing"</span>
                </td>
                <td className="px-6 py-5 rounded-r-2xl text-right">
                  <button className="text-primary hover:bg-primary-container px-4 py-1 rounded-full text-xs font-bold transition-all">Renew</button>
                </td>
              </tr>

              {/* Item 2: Warning */}
              <tr className="bg-surface-container-lowest group hover:bg-surface-bright transition-colors">
                <td className="px-6 py-5 rounded-l-2xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-bold text-amber-600">Warning</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <code className="font-mono text-sm bg-surface-container px-2 py-1 rounded text-primary">AA:BB:CC:DD:EE:FF</code>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Tomorrow, 09:15</span>
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Ends in 14h 45m</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-on-surface-variant italic">"Office-Wifi-Access-Point-04"</span>
                </td>
                <td className="px-6 py-5 rounded-r-2xl text-right">
                  <button className="text-primary hover:bg-primary-container px-4 py-1 rounded-full text-xs font-bold transition-all">Renew</button>
                </td>
              </tr>

              {/* Item 3: Healthy */}
              <tr className="bg-surface-container-lowest group hover:bg-surface-bright transition-colors">
                <td className="px-6 py-5 rounded-l-2xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-tertiary"></span>
                    <span className="text-xs font-bold text-tertiary">Healthy</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <code className="font-mono text-sm bg-surface-container px-2 py-1 rounded text-primary">C0:FF:EE:12:34:56</code>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">May 24, 2024</span>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Ends in 6 days</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm text-on-surface-variant italic">"Lab-Testing-Server-Rack"</span>
                </td>
                <td className="px-6 py-5 rounded-r-2xl text-right">
                  <button className="text-primary hover:bg-primary-container px-4 py-1 rounded-full text-xs font-bold transition-all">Renew</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination / Footer Metadata */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center px-2">
        <span className="text-xs font-medium text-on-surface-variant mb-4 md:mb-0">Showing 3 of 12 critical leases</span>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container-lowest text-on-surface rounded-xl text-xs font-bold shadow-sm hover:bg-surface-bright transition-colors">Previous</button>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dim transition-colors">Next Page</button>
        </div>
      </div>

      {/* FAB Contextual */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-[0_8px_24px_rgba(0,83,219,0.3)] flex items-center justify-center active:scale-90 transition-all z-40 group">
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>
    </div>
  );
}
