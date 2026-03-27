import { Server, CloudOff, TrendingUp, TrendingDown, Ticket, FileBadge, KeyRound, Wifi, Package, BatteryCharging, CheckCircle2, UserPlus, RefreshCw } from 'lucide-react';

export default function HomeScreen() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-6 pb-32 space-y-10">
      {/* Critical Alerts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-xl text-on-surface">Critical Infrastructure</h2>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/20 text-error font-semibold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            2 Active Issues
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-error-container/10 flex items-start gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-error text-lg">Core Switch Downtime</h3>
              <p className="text-on-surface-variant text-sm mt-1">Building 4, Floor 2. Packet loss exceeding 40% threshold.</p>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-error text-on-error rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform">Assign Ticket</button>
                <button className="px-4 py-2 bg-surface-container-highest text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform">View Map</button>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-error-container/10 flex items-start gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error shrink-0">
              <CloudOff className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-error text-lg">Cloud Sync Failure</h3>
              <p className="text-on-surface-variant text-sm mt-1">Backup region US-East-1 reporting synchronization delays.</p>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-error text-on-error rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform">Restart Sync</button>
                <button className="px-4 py-2 bg-surface-container-highest text-on-surface-variant rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform">Logs</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards Section */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface">Operations Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-on-surface-variant font-medium text-sm">Active Alerts</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-extrabold text-on-surface leading-none tracking-tighter">14</span>
                <span className="text-error font-bold text-xs mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 12%
                </span>
              </div>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-surface-container-high opacity-40 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-on-surface-variant font-medium text-sm">Open Tickets</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-extrabold text-on-surface leading-none tracking-tighter">42</span>
                <span className="text-tertiary font-bold text-xs mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> 8%
                </span>
              </div>
            </div>
            <Ticket className="absolute -right-4 -bottom-4 w-24 h-24 text-surface-container-high opacity-40 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-on-surface-variant font-medium text-sm">Expiring Licenses</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-4xl font-extrabold text-on-surface leading-none tracking-tighter">03</span>
                <span className="text-on-surface-variant font-bold text-xs mb-1">Next 30 days</span>
              </div>
            </div>
            <FileBadge className="absolute -right-4 -bottom-4 w-24 h-24 text-surface-container-high opacity-40 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface">Quick Commands</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
          <button className="flex-none w-40 aspect-square bg-primary p-6 rounded-3xl flex flex-col justify-between group active:scale-95 transition-all shadow-lg shadow-primary/20">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-on-primary">
              <KeyRound className="w-6 h-6" />
            </div>
            <span className="text-on-primary font-bold leading-tight text-left">Reset Password</span>
          </button>
          
          <button className="flex-none w-40 aspect-square bg-surface-container-lowest p-6 rounded-3xl flex flex-col justify-between shadow-sm active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
              <Wifi className="w-6 h-6" />
            </div>
            <span className="text-on-surface font-bold leading-tight text-left">Check WiFi</span>
          </button>

          <button className="flex-none w-40 aspect-square bg-surface-container-lowest p-6 rounded-3xl flex flex-col justify-between shadow-sm active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-on-surface font-bold leading-tight text-left">Get Asset</span>
          </button>

          <button className="flex-none w-40 aspect-square bg-surface-container-lowest p-6 rounded-3xl flex flex-col justify-between shadow-sm active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <span className="text-on-surface font-bold leading-tight text-left">UPS Status</span>
          </button>
        </div>
      </section>

      {/* System Pulse */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface">System Pulse</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface">Server Maintenance Complete</h4>
                    <span className="text-xs text-on-surface-variant font-medium">12m ago</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">Node cluster #42 successfully patched and rebooted.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface">New User Onboarded</h4>
                    <span className="text-xs text-on-surface-variant font-medium">45m ago</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">Access granted for Sarah Miller (DevOps Team).</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface">Policy Update</h4>
                    <span className="text-xs text-on-surface-variant font-medium">2h ago</span>
                  </div>
                  <p className="text-on-surface-variant text-sm">Global firewall rules refreshed for DC-7.</p>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-inverse-surface text-on-primary rounded-3xl p-6 h-full flex flex-col justify-between relative overflow-hidden min-h-[240px]">
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-2">Network Health</h4>
                <p className="text-surface-variant text-sm opacity-80">Current system uptime is 99.98%. Latency is within normal parameters.</p>
              </div>
              <div className="relative z-10 mt-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tighter">1.2</span>
                  <span className="text-xl font-bold opacity-70">ms</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-50">Global Average Latency</p>
              </div>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnQyHu9zDgFAqKgbxfJ3wngiSP8fbJv5ju6h4DhKIo4HM1E6M8M0-5M_wDGyGybUadoaXU19rq5tSmz8FN9fADbtNnfgN4_F3ETcXXTWpAGNcDSGgwgNOik2zdiyx4LLv5seQon5NvAmTYOSFkFuE1fkQPVH7fD4nyPbeAR4a4hg2pZWlnp_spTsspP__A64c4aQH9DsZ18vqXxx_eTrsRHVfHWXySMahq9s8MzVJ-PWZWi0df3Qq4JIidIBEQ4Gp0l32utkmem7M" 
                alt="background texture" 
                className="absolute top-0 left-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
