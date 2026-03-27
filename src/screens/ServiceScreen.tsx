import { Mail, Clock, CheckCircle, Search, ChevronRight, History } from 'lucide-react';

export default function ServiceScreen() {
  return (
    <div className="max-w-5xl mx-auto px-6 mt-8 space-y-10 pb-32">
      {/* Ticket Summary */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between group transition-all">
            <div>
              <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">Open Tickets</p>
              <h2 className="font-headline font-bold text-3xl text-primary">12</h2>
            </div>
            <div className="p-3 bg-primary-container/30 rounded-xl text-primary">
              <Mail className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">In Progress</p>
              <h2 className="font-headline font-bold text-3xl text-secondary">08</h2>
            </div>
            <div className="p-3 bg-secondary-container/30 rounded-xl text-secondary">
              <Clock className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between">
            <div>
              <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">Resolved Today</p>
              <h2 className="font-headline font-bold text-3xl text-tertiary">24</h2>
            </div>
            <div className="p-3 bg-tertiary-container/30 rounded-xl text-tertiary">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button className="px-5 py-2.5 bg-primary text-on-primary rounded-full font-label text-sm font-semibold transition-all shadow-md">All Tickets</button>
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface-variant rounded-full font-label text-sm font-medium hover:bg-surface-container-highest transition-colors">Critical</button>
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface-variant rounded-full font-label text-sm font-medium hover:bg-surface-container-highest transition-colors">High Priority</button>
          <button className="px-5 py-2.5 bg-surface-container-high text-on-surface-variant rounded-full font-label text-sm font-medium hover:bg-surface-container-highest transition-colors">Awaiting User</button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest rounded-xl text-on-surface-variant">
          <Search className="w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search ticket ID or subject..." 
            className="bg-transparent border-none focus:ring-0 text-sm font-body w-full md:w-64 placeholder:text-on-surface-variant/60 outline-none"
          />
        </div>
      </section>

      {/* Ticket List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="font-headline text-lg font-bold text-on-surface">Active Requests</h3>
          <span className="text-on-surface-variant text-sm font-medium">Sorted by: Recency</span>
        </div>
        
        <div className="space-y-3">
          {/* Critical Ticket */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error hidden md:block"></div>
            <div className="flex-grow md:pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label text-[10px] font-bold tracking-tighter text-on-surface-variant">INC-9021</span>
                <span className="px-2 py-0.5 bg-error-container/20 text-error text-[10px] font-bold rounded-md uppercase tracking-wider">Critical</span>
              </div>
              <h4 className="font-headline font-bold text-slate-900 text-lg">Primary Fiber Link Down - Branch Office A</h4>
              <p className="text-on-surface-variant text-sm font-body mt-1">Reported by: Sarah Jenkins • 14 mins ago</p>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">SLA Time</p>
                <p className="font-body font-bold text-error">00:14:22</p>
              </div>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Medium Ticket */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary hidden md:block"></div>
            <div className="flex-grow md:pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label text-[10px] font-bold tracking-tighter text-on-surface-variant">REQ-4458</span>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-md uppercase tracking-wider">In Progress</span>
              </div>
              <h4 className="font-headline font-bold text-slate-900 text-lg">New Employee Onboarding - Cloud Access</h4>
              <p className="text-on-surface-variant text-sm font-body mt-1">Reported by: HR Dept • 2 hours ago</p>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Priority</p>
                <p className="font-body font-bold text-on-surface">Medium</p>
              </div>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Resolved Ticket */}
          <div className="bg-surface-container-low/50 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 border-l-4 border-tertiary">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label text-[10px] font-bold tracking-tighter text-on-surface-variant/60">INC-8991</span>
                <span className="px-2 py-0.5 bg-tertiary-container/40 text-on-tertiary-container text-[10px] font-bold rounded-md uppercase tracking-wider">Resolved</span>
              </div>
              <h4 className="font-headline font-bold text-slate-900/60 text-lg line-through">VPN Authentication Failure</h4>
              <p className="text-on-surface-variant/60 text-sm font-body mt-1">Resolved by: System Admin • 3 hours ago</p>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-[10px] font-label text-on-surface-variant/60 uppercase tracking-widest">Duration</p>
                <p className="font-body font-bold text-on-surface-variant/60">45m</p>
              </div>
              <button className="p-2 text-on-surface-variant/40 hover:bg-surface-container-high rounded-xl transition-colors">
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
