import { ArrowLeft, MoreVertical, Verified, Contact, Mail, Phone, Network, BadgeInfo, ShieldAlert, History, UserCheck } from 'lucide-react';

interface UserProfileScreenProps {
  onBack: () => void;
}

export default function UserProfileScreen({ onBack }: UserProfileScreenProps) {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="text-blue-700 hover:bg-slate-200/50 transition-colors active:scale-95 duration-250 p-2 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-headline font-semibold text-lg tracking-tight text-blue-700">Service Directory</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-slate-500 hover:bg-slate-200/50 transition-colors active:scale-95 duration-250 p-2 rounded-full">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
        {/* Hero Profile Section */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-surface-container-lowest">
              <img 
                alt="User Profile Photo" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtbV3GNg3wo7AhXxgIJn0YY4dkeChQKIhXMeFpDCINPBOntH0H7BJhbMYDtexFQxib3H0w4usl8n6Rnq1LcM0A-TrhIFFpffpQNW6c-czB78dRMwZBEaRaq6-xMwvU80ysolsPUMzaa9s-5HQVyc0_0sVWyICn0rBq9F__kOz6otTYoYtDPZ1_k8nIqZ4vnxiQ-zxOXsUqdiXDN54mT6VgPcRzF-AfHYak81aH8JsEAu4NcwypolM5biv25ADdV0I7QF5fkGSbiyc"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-tertiary text-on-tertiary p-1.5 rounded-lg shadow-md border-2 border-surface-container-lowest">
              <Verified className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Alexander Sterling</h2>
            <p className="font-body text-on-surface-variant font-medium">Senior Solutions Architect</p>
          </div>
        </section>

        {/* Main Content Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Contact Card */}
          <div className="md:col-span-12 lg:col-span-12 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                <Contact className="w-5 h-5 text-primary" />
                Contact Details
              </h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-secondary-container/50 rounded-xl">
                  <Mail className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Email / UPN</p>
                  <p className="font-medium text-primary">a.sterling@enterprise-ict.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-secondary-container/50 rounded-xl">
                  <Phone className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Mobile</p>
                  <p className="font-medium text-on-surface">Not available</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-secondary-container/50 rounded-xl">
                  <Network className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Department</p>
                  <p className="font-medium text-on-surface">Infrastructure &amp; Cloud Engineering</p>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="md:col-span-12 bg-surface-container-low rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-container/30 rounded-2xl">
                <BadgeInfo className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Employee ID</p>
                <p className="font-headline font-extrabold text-xl text-on-surface tracking-tight">ICT-99283-X</p>
              </div>
            </div>
          </div>

          {/* Security Details Card */}
          <div className="md:col-span-12 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-error" />
              <h3 className="font-headline font-bold text-on-surface">Account Security</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-surface-container-low/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Last Password Change</p>
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-on-surface-variant" />
                  <span className="font-medium text-on-surface">October 14, 2023 • 09:42 AM</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Password Expiry Status</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary"></span>
                  </div>
                  <span className="font-medium text-tertiary">Expires in 42 days (Dec 25)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs / Stats (Bento Style Extension) */}
          <div className="md:col-span-12 bg-on-surface p-6 rounded-2xl text-on-primary-fixed">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-headline font-bold text-lg mb-1">System Authority</h4>
                <p className="text-on-surface-variant text-sm opacity-80">Tier 3 Administrative Clearance</p>
              </div>
              <button className="bg-primary hover:bg-primary-dim transition-colors text-white px-4 py-2 rounded-xl text-sm font-medium">
                Request Audit
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
