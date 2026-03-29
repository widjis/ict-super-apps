import { useState } from 'react';
import { Badge, Users, HardHat, CreditCard, AlignLeft, Timer, ArrowRight, Loader2, ShieldAlert, Shield } from 'lucide-react';

interface RegisterDeviceScreenProps {
  onBack?: () => void;
}

export default function RegisterDeviceScreen({ onBack }: RegisterDeviceScreenProps) {
  const [selectedPool, setSelectedPool] = useState('laptop-full');
  const [expirationEnabled, setExpirationEnabled] = useState(true);
  const [testMode, setTestMode] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-6 pt-6 pb-32">
      {/* Editorial Header */}
      <div className="mb-10">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">Provisioning Engine</span>
        <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Register Device</h2>
        <p className="text-on-surface-variant mt-2 leading-relaxed">Onboard new hardware to the Slate Nexus network core with precise pool assignment and access control.</p>
      </div>

      {/* Form Canvas */}
      <section className="space-y-8">
        {/* Hardware Selection */}
        <div className="space-y-6">
          {/* Laptop / PC Section */}
          <div className="space-y-3">
            <h3 className="font-headline text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Laptop / PC</h3>
            <div className="bg-surface-container-low p-1 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                <button 
                  onClick={() => setSelectedPool('laptop-full')}
                  className={`flex flex-col items-start p-5 rounded-xl transition-colors text-left ${selectedPool === 'laptop-full' ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'}`}
                >
                  <ShieldAlert className={`w-6 h-6 mb-3 ${selectedPool === 'laptop-full' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="font-headline font-bold text-on-surface">Full Access</span>
                  <span className="text-xs text-on-surface-variant mt-1">Unrestricted internal network</span>
                </button>
                <button 
                  onClick={() => setSelectedPool('laptop-limited')}
                  className={`flex flex-col items-start p-5 rounded-xl transition-colors text-left ${selectedPool === 'laptop-limited' ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'}`}
                >
                  <Shield className={`w-6 h-6 mb-3 ${selectedPool === 'laptop-limited' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="font-headline font-bold text-on-surface">Limited Access</span>
                  <span className="text-xs text-on-surface-variant mt-1">Filtered web & intranet</span>
                </button>
                <button 
                  onClick={() => setSelectedPool('laptop-contractor')}
                  className={`flex flex-col items-start p-5 rounded-xl transition-colors text-left ${selectedPool === 'laptop-contractor' ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'}`}
                >
                  <HardHat className={`w-6 h-6 mb-3 ${selectedPool === 'laptop-contractor' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="font-headline font-bold text-on-surface">Contractor</span>
                  <span className="text-xs text-on-surface-variant mt-1">Time-limited project scope</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Device Section */}
          <div className="space-y-3">
            <h3 className="font-headline text-sm font-bold text-on-surface-variant ml-1 uppercase tracking-wider">Mobile Device</h3>
            <div className="bg-surface-container-low p-1 rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <button 
                  onClick={() => setSelectedPool('mobile-management')}
                  className={`flex flex-col items-start p-5 rounded-xl transition-colors text-left ${selectedPool === 'mobile-management' ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'}`}
                >
                  <Users className={`w-6 h-6 mb-3 ${selectedPool === 'mobile-management' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="font-headline font-bold text-on-surface">Management</span>
                  <span className="text-xs text-on-surface-variant mt-1">Priority bandwidth & VIP pool</span>
                </button>
                <button 
                  onClick={() => setSelectedPool('mobile-staff')}
                  className={`flex flex-col items-start p-5 rounded-xl transition-colors text-left ${selectedPool === 'mobile-staff' ? 'bg-surface-container-lowest border-2 border-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container-high border-2 border-transparent'}`}
                >
                  <Badge className={`w-6 h-6 mb-3 ${selectedPool === 'mobile-staff' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="font-headline font-bold text-on-surface">Staff</span>
                  <span className="text-xs text-on-surface-variant mt-1">Standard mobile BYOD profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs Group */}
        <div className="space-y-6">
          {/* MAC Address */}
          <div className="space-y-2">
            <label className="font-headline text-sm font-bold text-on-surface ml-1">MAC Address</label>
            <div className="relative">
              <input 
                className="w-full h-14 bg-surface-container-highest border-none rounded-xl px-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline outline-none" 
                placeholder="AA:BB:CC:DD:EE:FF" 
                type="text"
              />
              <CreditCard className="absolute right-4 top-4 w-6 h-6 text-outline" />
            </div>
            <p className="text-[11px] text-on-surface-variant ml-1">Accepts multiple formats (XX:XX... or XX-XX...)</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="font-headline text-sm font-bold text-on-surface ml-1">Comment</label>
            <div className="relative">
              <input 
                className="w-full h-14 bg-surface-container-highest border-none rounded-xl px-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline outline-none" 
                placeholder="Device owner, name, or location" 
                type="text"
              />
              <AlignLeft className="absolute right-4 top-4 w-6 h-6 text-outline" />
            </div>
          </div>
        </div>

        {/* Advanced Options Card */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Timer className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Set Expiration</h3>
                <p className="text-xs text-on-surface-variant">Automate session termination</p>
              </div>
            </div>
            {/* Toggle Switch */}
            <button 
              onClick={() => setExpirationEnabled(!expirationEnabled)}
              className={`w-12 h-6 rounded-full relative transition-colors ${expirationEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${expirationEnabled ? 'right-1' : 'left-1'}`}></span>
            </button>
          </div>

          {/* Hidden Options */}
          {expirationEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase font-bold text-on-surface-variant">Duration (Days)</label>
                <select className="w-full bg-surface-container-lowest border-none rounded-lg h-10 text-sm focus:ring-1 focus:ring-primary outline-none px-3">
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>Permanent</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between h-10 px-3 bg-surface-container-lowest rounded-lg">
                  <span className="text-sm font-medium">Test Mode</span>
                  <button 
                    onClick={() => setTestMode(!testMode)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${testMode ? 'bg-primary' : 'bg-outline-variant'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${testMode ? 'right-1' : 'left-1'}`}></span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-primary">Connecting to router...</span>
          <span className="ml-auto text-[10px] font-bold text-primary/60 uppercase tracking-widest">Core Engine</span>
        </div>

        {/* Primary Action */}
        <button className="w-full h-16 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-2xl font-headline font-bold text-lg shadow-[0_8px_24px_rgba(0,83,219,0.25)] hover:shadow-[0_12px_32px_rgba(0,83,219,0.35)] active:scale-95 transition-all flex items-center justify-center gap-3">
          Review Registration
          <ArrowRight className="w-6 h-6" />
        </button>
      </section>
    </div>
  );
}
