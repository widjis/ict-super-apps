import { BatteryCharging, Server, Router, TrendingUp, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export default function MonitoringScreen() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10 pb-32">
      {/* Infrastructure Status */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Infrastructure Status</h2>
          <span className="text-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Real-time Feed</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* UPS Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] space-y-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tertiary/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse shadow-[0_0_4px_rgba(0,109,74,0.5)]"></div>
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Healthy</span>
              </div>
            </div>
            <div>
              <h3 className="text-on-surface-variant text-sm font-medium">Core UPS Cluster</h3>
              <p className="text-3xl font-bold font-headline mt-1 tracking-tight">98<span className="text-sm font-normal text-on-surface-variant ml-1">% Capacity</span></p>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-tertiary w-[98%] rounded-full"></div>
            </div>
          </div>

          {/* Server Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] space-y-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                <Server className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Latency</span>
              </div>
            </div>
            <div>
              <h3 className="text-on-surface-variant text-sm font-medium">Mainframe S-04</h3>
              <p className="text-3xl font-bold font-headline mt-1 tracking-tight">742<span className="text-sm font-normal text-on-surface-variant ml-1">ms response</span></p>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[75%] rounded-full"></div>
            </div>
          </div>

          {/* Network Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] space-y-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Router className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_4px_rgba(0,83,219,0.5)]"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active</span>
              </div>
            </div>
            <div>
              <h3 className="text-on-surface-variant text-sm font-medium">External Gateway</h3>
              <p className="text-3xl font-bold font-headline mt-1 tracking-tight">1.2<span className="text-sm font-normal text-on-surface-variant ml-1">Gbps Uplink</span></p>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[45%] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Bento */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="font-headline font-bold text-lg mb-1">Network Traffic</h3>
            <p className="text-sm text-on-surface-variant mb-8">Last 24 Hours Load Analysis</p>
            
            {/* Simple Bar Chart Representation */}
            <div className="h-48 flex items-end gap-2">
              {[40, 60, 35, 85, 100, 75, 50, 30, 45, 20].map((height, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-lg transition-all duration-500 ${
                    height === 100 ? 'bg-primary' : 
                    height > 70 ? 'bg-primary/60' : 
                    height > 40 ? 'bg-primary/30' : 'bg-primary/10'
                  }`}
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-primary p-8 rounded-3xl shadow-[0_8px_24px_rgba(0,83,219,0.15)] text-on-primary relative overflow-hidden h-[200px] flex flex-col justify-center">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Peak Utilization</p>
              <h4 className="text-4xl font-headline font-extrabold mt-2 tracking-tight">92.4%</h4>
              <p className="text-sm mt-3 font-medium leading-relaxed opacity-90">System load is currently approaching threshold on Node B.</p>
            </div>
            <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 pointer-events-none" />
          </div>
          
          <div className="bg-surface-container-high p-6 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider mb-1">Uptime</p>
              <p className="text-2xl font-bold font-headline tracking-tight">99.998%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-tertiary/20 border-t-tertiary animate-[spin_3s_linear_infinite]"></div>
          </div>
        </div>
      </section>

      {/* Alert List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Recent Alerts</h2>
          <button className="text-primary text-sm font-bold hover:underline">View History &rsaquo;</button>
        </div>
        
        <div className="space-y-3">
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98] relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
            <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-on-surface truncate pr-2">Thermal Overload: Rack 12</h4>
                <span className="text-[10px] font-bold text-error uppercase px-2 py-0.5 bg-error/10 rounded shrink-0">Critical</span>
              </div>
              <p className="text-sm text-on-surface-variant truncate">Sensor detected 42°C in the cold aisle. Cooling unit 02 failure suspected.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-on-surface-variant">12:04 PM</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98] relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-on-surface truncate pr-2">SSL Certificate Expiration</h4>
                <span className="text-[10px] font-bold text-amber-600 uppercase px-2 py-0.5 bg-amber-500/10 rounded shrink-0">Warning</span>
              </div>
              <p className="text-sm text-on-surface-variant truncate">Primary domain cert expires in 7 days. Auto-renewal failed.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-on-surface-variant">11:45 AM</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98] relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-on-surface truncate pr-2">Backup Routine Complete</h4>
                <span className="text-[10px] font-bold text-tertiary uppercase px-2 py-0.5 bg-tertiary/10 rounded shrink-0">Healthy</span>
              </div>
              <p className="text-sm text-on-surface-variant truncate">Incremental backup for Database-SRV-01 successful. 14GB synced.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-on-surface-variant">10:30 AM</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
