import { Users, Wifi, Server, ShieldCheck, Headset, Activity, Gauge, ChevronRight } from 'lucide-react';

interface HubScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function HubScreen({ onNavigate }: HubScreenProps) {
  const features = [
    { 
      icon: Users, 
      title: 'User Management', 
      desc: 'Directory services and access control', 
      colorClasses: 'bg-primary-container/30 text-primary group-hover:bg-primary group-hover:text-on-primary' 
    },
    { 
      icon: Wifi, 
      title: 'WiFi & Network', 
      desc: 'WLAN configuration and mesh topology', 
      colorClasses: 'bg-secondary-container/30 text-secondary group-hover:bg-secondary group-hover:text-on-secondary' 
    },
    { 
      icon: Server, 
      title: 'Infrastructure', 
      desc: 'Server health and hardware lifecycle', 
      colorClasses: 'bg-tertiary-container/20 text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary' 
    },
    { 
      icon: ShieldCheck, 
      title: 'License & Compliance', 
      desc: 'Audit trails and software entitlements', 
      colorClasses: 'bg-error-container/10 text-error group-hover:bg-error group-hover:text-on-error' 
    },
    { 
      icon: Headset, 
      title: 'Helpdesk', 
      desc: 'Incident response and ticket queue', 
      colorClasses: 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 group-hover:bg-blue-700 group-hover:text-white' 
    },
    { 
      icon: Activity, 
      title: 'Monitoring Tools', 
      desc: 'Real-time telemetry and log analysis', 
      colorClasses: 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 group-hover:bg-amber-600 group-hover:text-white' 
    },
    { 
      icon: Gauge,
      title: 'PRF Monitoring', 
      desc: 'High-precision performance monitoring and frequency analysis.', 
      colorClasses: 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 group-hover:bg-indigo-700 group-hover:text-white' 
    },
  ];

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-12">
      {/* Hero Section */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-3xl aspect-[16/9] mb-6 shadow-xl">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5WRXi2DCNkpGfj2DcuFdtFtO2vSnm46WRGztQ2D2le1W_srvqJ2WDHlMuvpOK5C4AZ8fAbzUzU7Rrb7m8w0cWnPJUxdTp0nTAfI2BoR7oiGPQF_XEmfU1jJzPSHSPbFnt0XluL0lIIPsWZYw7_hWRVgr0sWd_1U3fviQCPGNthiVaU4z80u_oGyEcgLJx4I48KwyzdGs-NFHALb25fh9Hg8uSFs-zsyFkmg49ANQ1zpChXcy4OOFqESM4W5mVYKnbez595yiTw28" 
            alt="Network Core" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 to-transparent flex flex-col justify-end p-6">
            <span className="text-tertiary-fixed font-label text-[10px] uppercase tracking-[0.2em] mb-2">System Status</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-tertiary/20 backdrop-blur-md border border-tertiary/30 rounded-full">
                <span className="w-2 h-2 bg-tertiary-fixed-dim rounded-full animate-pulse"></span>
                <span className="text-tertiary-fixed text-xs font-semibold">ALL SYSTEMS ONLINE</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">Feature Hub</h2>
          <p className="text-on-surface-variant text-base leading-relaxed">Centralized control for your enterprise infrastructure.</p>
        </div>
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <button 
              key={idx} 
              onClick={() => {
                if (onNavigate) {
                  if (feature.title === 'User Management') onNavigate('user-management');
                  if (feature.title === 'PRF Monitoring') onNavigate('prf-monitoring');
                }
              }}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.04)] flex flex-col gap-4 border border-transparent hover:border-primary/10 transition-all active:scale-95 group text-left"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${feature.colorClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface leading-tight">{feature.title}</h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">{feature.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Activity Asymmetric Layout */}
      <section className="mt-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline font-bold text-xl text-on-surface">Recent Alerts</h2>
          <button className="text-primary font-label text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">View History</button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-3xl flex items-center gap-4">
            <div className="w-2 h-10 bg-error rounded-full"></div>
            <div className="flex-1">
              <p className="text-on-surface font-semibold text-sm">Critical Latency Detected</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Node: NYC-CORE-04 • 2m ago</p>
            </div>
            <ChevronRight className="w-5 h-5 text-outline" />
          </div>
          
          <div className="bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="w-2 h-10 bg-tertiary rounded-full"></div>
            <div className="flex-1">
              <p className="text-on-surface font-semibold text-sm">Patch Deployment Success</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Vulnerability fix applied to 142 endpoints</p>
            </div>
            <ChevronRight className="w-5 h-5 text-outline" />
          </div>
        </div>
      </section>
    </div>
  );
}
