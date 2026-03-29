import { Scan, ClipboardPaste, Radar, Info, Wifi, Shield, ArrowRight, ExternalLink, Router, Laptop } from 'lucide-react';

interface CheckDeviceStatusScreenProps {
  onBack?: () => void;
}

export default function CheckDeviceStatusScreen({ onBack }: CheckDeviceStatusScreenProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-24">
      {/* Headline Section */}
      <div className="mb-10 space-y-2">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface">Check Device Status</h1>
        <p className="text-on-surface-variant font-medium">Verify network authorization and real-time connectivity metrics.</p>
      </div>

      {/* Asymmetric Bento-style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input & Action Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
            <label className="block text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Device Identifier</label>
            <div className="relative group">
              <input 
                className="w-full h-14 bg-surface-container-highest border-none rounded-xl px-4 text-on-surface font-body font-medium focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all placeholder:text-outline outline-none" 
                placeholder="XX:XX:XX:XX:XX:XX" 
                type="text"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <button className="p-2 text-primary hover:bg-primary-container/30 rounded-lg transition-colors" title="Scan QR/Barcode">
                  <Scan className="w-5 h-5" />
                </button>
                <button className="p-2 text-primary hover:bg-primary-container/30 rounded-lg transition-colors" title="Paste from Clipboard">
                  <ClipboardPaste className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button className="w-full mt-8 bg-gradient-to-br from-primary to-primary-dim text-on-primary h-14 rounded-xl font-headline font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Radar className="w-6 h-6" />
              Check Status
            </button>
          </div>

          {/* Empty State Hint */}
          <div className="bg-surface-container-low rounded-[1.5rem] p-6 flex items-start gap-4">
            <div className="bg-surface-container-highest p-3 rounded-full shrink-0">
              <Info className="w-6 h-6 text-on-surface-variant" />
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Enter a MAC address to check its current registration status. Our precision engine will query the Slate Nexus core for routing and DHCP history.
            </p>
          </div>
        </div>

        {/* Result Cards Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Success State Card */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0_8px_24px_rgba(42,52,57,0.06)] border-l-8 border-tertiary">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest bg-tertiary-container/30 px-2 py-1 rounded">Live Connection</span>
                <h3 className="font-headline text-2xl font-bold text-on-surface">user-macbook</h3>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-tertiary font-bold">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
                  </span>
                  Registered
                </div>
                <span className="text-label-sm text-on-surface-variant mt-1">Uptime: 14d 2h 12m</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">IPv4 Address</p>
                <p className="font-mono text-lg font-semibold text-primary">192.168.1.50</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">DHCP Server</p>
                <p className="font-body text-lg font-semibold text-on-surface">Internal</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Assigned To</p>
                <p className="font-body text-lg font-semibold text-on-surface">Adriana User</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hardware Hash</p>
                <p className="font-mono text-sm text-on-surface-variant truncate">F4:D4:88:AC:21:09</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-surface-container-highest flex justify-between items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary border-2 border-surface-container-lowest">
                  <Wifi className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary border-2 border-surface-container-lowest">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <button className="text-primary font-headline font-bold text-sm flex items-center gap-1 hover:underline">
                View Deep Metrics
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Data Card / Visualization */}
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden group">
            <div className="p-6 flex justify-between items-center bg-surface-container">
              <h4 className="font-headline font-bold text-on-surface">Network Topology</h4>
              <ExternalLink className="w-5 h-5 text-on-surface-variant" />
            </div>
            <div className="h-40 bg-surface-container-highest relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0053db 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              <div className="flex items-center gap-8 relative z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center">
                    <Router className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Core_Switch_01</span>
                </div>
                <div className="h-[2px] w-12 bg-tertiary/40 relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-tertiary"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-center ring-2 ring-primary">
                    <Laptop className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase">user-macbook</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
