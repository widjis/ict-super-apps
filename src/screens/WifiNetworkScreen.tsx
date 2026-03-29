import { PlusCircle, Router, ArrowRight, Badge, Search, BarChart2, LineChart, RefreshCw } from 'lucide-react';

export default function WifiNetworkScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-32">
      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">WiFi & Network</h1>
        <p className="text-on-surface-variant text-lg max-w-2xl">Register and manage device network access across the enterprise infrastructure with real-time MikroTik integration.</p>
      </section>

      {/* Primary Action Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Register Device */}
        <div 
          onClick={() => onNavigate?.('register-device')}
          className="group relative bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] hover:shadow-[0_12px_32px_rgba(42,52,57,0.08)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <PlusCircle className="w-24 h-24" />
          </div>
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <Router className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-2">Register Device</h3>
            <p className="text-on-surface-variant leading-relaxed">Add a new MikroTik DHCP lease to the management system.</p>
          </div>
          <button className="mt-8 flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
            <span>Provision Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Check Status */}
        <div 
          onClick={() => onNavigate?.('check-device-status')}
          className="group relative bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] hover:shadow-[0_12px_32px_rgba(42,52,57,0.08)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Badge className="w-24 h-24" />
          </div>
          <div>
            <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-6">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-2">Check Status</h3>
            <p className="text-on-surface-variant leading-relaxed">Verify if a MAC address is registered in the active directory.</p>
          </div>
          <button className="mt-8 flex items-center gap-2 text-blue-800 font-semibold group-hover:gap-4 transition-all">
            <span>Verify Access</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Lease Report */}
        <div 
          onClick={() => onNavigate?.('lease-expiration')}
          className="group relative bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] hover:shadow-[0_12px_32px_rgba(42,52,57,0.08)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart2 className="w-24 h-24" />
          </div>
          <div>
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center mb-6">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="font-headline text-2xl font-bold mb-2">Lease Report</h3>
            <p className="text-on-surface-variant leading-relaxed">View expiring leases, active pools, and saturation metrics.</p>
          </div>
          <button className="mt-8 flex items-center gap-2 text-emerald-800 font-semibold group-hover:gap-4 transition-all">
            <span>View Analytics</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Available Pools Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-primary rounded-full"></div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">Available Pools</h2>
          </div>
          <button className="text-primary font-medium flex items-center gap-1 hover:underline">
            <span>Refresh Data</span>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
            {/* Pool 1 */}
            <div className="p-6 bg-surface-container-lowest md:bg-transparent hover:bg-surface-container transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Pool Label</span>
                  <h4 className="font-headline text-xl font-bold">Staff</h4>
                </div>
                <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Server Name</span>
                  <span className="font-mono font-medium text-on-surface">mk-hq-core-01</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Range</span>
                  <span className="font-mono text-xs text-on-surface">10.0.10.2 - 10.0.10.254</span>
                </div>
              </div>
            </div>

            {/* Pool 2 */}
            <div className="p-6 bg-surface-container-lowest md:bg-transparent hover:bg-surface-container transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Pool Label</span>
                  <h4 className="font-headline text-xl font-bold">Non Staff</h4>
                </div>
                <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Server Name</span>
                  <span className="font-mono font-medium text-on-surface">mk-hq-guest-02</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Range</span>
                  <span className="font-mono text-xs text-on-surface">172.16.20.2 - 172.16.23.254</span>
                </div>
              </div>
            </div>

            {/* Pool 3 */}
            <div className="p-6 bg-surface-container-lowest md:bg-transparent hover:bg-surface-container transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Pool Label</span>
                  <h4 className="font-headline text-xl font-bold">Contractor</h4>
                </div>
                <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Server Name</span>
                  <span className="font-mono font-medium text-on-surface">mk-hq-ext-01</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Range</span>
                  <span className="font-mono text-xs text-on-surface">192.168.50.2 - 192.168.50.100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Visualization (Mock) */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm bg-gradient-to-b from-transparent to-surface-container/50">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/3">
            <h3 className="font-headline text-xl font-bold mb-4">Network Health</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-on-surface-variant">IP Pool Saturation</span>
                  <span className="font-bold">64%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-on-surface-variant">Active Leases</span>
                  <span className="font-bold">1,204</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3 h-48 rounded-xl overflow-hidden relative bg-slate-900">
            <img 
              className="w-full h-full object-cover grayscale opacity-20" 
              alt="close-up of fiber optic cables and server lights in a dark data center with glowing blue status indicators" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRwXv8zObgXg_tQ_hvZ-qrZW57ZzSAUb0poHzdoW3zFvqnEd5HwiN2_MeMge4K2s2zNLjKsJb6Gy9BDbLSkiXf8f729k52Qu8OqjA2NoRG6Pt6eLYA3nbAzx1YTmd1tmvYoGWFOr5w5smfd2jHEynqcxtgO2xx13_cviWMi2PGmElVn_c_bNB-Z0A61vkOhfyllwk0zmC6jONPVoWlHqcVsGVFo833suzdWw1gbNe1ADYrll_q_LRF3FxGUyTli7vzAq0wuxP2d5E"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4 px-4 items-end h-24">
                {/* Visual data chips */}
                <div className="h-12 w-1.5 bg-primary/40 rounded-full"></div>
                <div className="h-16 w-1.5 bg-primary/60 rounded-full"></div>
                <div className="h-10 w-1.5 bg-primary/30 rounded-full"></div>
                <div className="h-24 w-1.5 bg-primary/80 rounded-full"></div>
                <div className="h-14 w-1.5 bg-primary/50 rounded-full"></div>
                <div className="h-20 w-1.5 bg-primary/70 rounded-full"></div>
                <div className="h-12 w-1.5 bg-primary/40 rounded-full"></div>
                <div className="h-16 w-1.5 bg-primary/60 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
