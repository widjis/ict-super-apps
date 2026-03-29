import { Edit2, ShieldCheck, BellRing, Moon, Shield, Info, LogOut, ChevronRight } from 'lucide-react';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
      {/* User Profile Hero Section */}
      <section className="mb-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="relative group">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-xl ring-4 ring-surface-container-lowest">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2V_5UTUZ4Ppr8Zc8dr0hk2CkWe8vGaTf5mTTWUTYAnA1a5yekWR45kEvmYGF0YT9ibJ-w-BeV20jClaWiibq2NB6CmCW_Fan2X4AlT0ozZ8zX7APqirOb_-SbIWe057f7fm9XinJ7DxMjCzzsijn7bv5EN2ikdVrpeVTUVhO4vELp_yIWZWLdK2WA7iihe5x1tDlJmVP11qhbXQrYd_krQNjSUl7-sxGj6Ewj0YY_bc1vF32CoRWWIKE4aLFz19fRq3DPg0WRll4" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-xl shadow-lg border-2 border-surface hover:bg-primary-dim transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant font-semibold">Administrator Account</p>
            <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight">Alex Operator</h2>
            <p className="text-secondary font-medium text-lg">Lead System Admin</p>
          </div>
          
          {/* Access Level Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-container/30 text-on-tertiary-container rounded-2xl border border-tertiary/10">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-label text-sm font-bold tracking-wide">Full Admin Access</span>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button className="px-6 py-2.5 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-xl font-semibold shadow-md active:scale-95 transition-all">
              Edit Profile
            </button>
            <button className="px-6 py-2.5 bg-surface-container-highest text-on-surface rounded-xl font-semibold active:scale-95 transition-all hover:bg-surface-variant">
              Share
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Uptime</p>
          <p className="text-2xl font-headline font-bold text-tertiary tracking-tight">99.9%</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Incidents</p>
          <p className="text-2xl font-headline font-bold text-on-surface tracking-tight">12</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Systems</p>
          <p className="text-2xl font-headline font-bold text-primary tracking-tight">24</p>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">Points</p>
          <p className="text-2xl font-headline font-bold text-secondary tracking-tight">8.4k</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-6">
        <h3 className="font-headline text-xl font-bold px-2">Settings & Security</h3>
        
        <div className="bg-surface-container-lowest rounded-3xl p-2 shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
          {/* Notification Preferences */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-container/30 rounded-2xl flex items-center justify-center text-primary">
                <BellRing className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-on-surface">Notification Preferences</p>
                <p className="text-sm text-on-surface-variant">Alerts, updates, and reports</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Appearance */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-on-surface-variant">
                <Moon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-on-surface">Appearance</p>
                <p className="text-sm text-on-surface-variant">Light, Dark, or System mode</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary uppercase bg-primary-container/50 px-2 py-1 rounded-lg">Light</span>
              <ChevronRight className="w-5 h-5 text-outline-variant group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Security */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-error-container/10 rounded-2xl flex items-center justify-center text-error">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-on-surface">Security</p>
                <p className="text-sm text-on-surface-variant">2FA, Keys, and Login history</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          {/* About */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low rounded-2xl transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-outline">
                <Info className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-on-surface">About the App</p>
                <p className="text-sm text-on-surface-variant">Version 2.4.0 (Editorial Build)</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="px-2 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-error font-bold border-2 border-error/10 rounded-3xl hover:bg-error/5 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            Sign Out Account
          </button>
        </div>
      </div>
    </div>
  );
}
