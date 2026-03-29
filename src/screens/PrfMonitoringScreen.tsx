import { Search, ChevronDown, Building2, User, Cpu, Palette } from 'lucide-react';

interface PrfMonitoringScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function PrfMonitoringScreen({ onNavigate }: PrfMonitoringScreenProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-32">
      {/* Editorial Title */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">PRF Monitoring</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage and track Purchase Requisition Forms across departments.</p>
      </div>

      {/* Search & Filter Controls */}
      <section className="space-y-6 mb-10">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search PRF No., Item, or Requestor..." 
            className="w-full h-14 pl-12 pr-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all outline-none"
          />
        </div>

        {/* Chips and Dropdown Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button className="whitespace-nowrap px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold transition-all">All PRFs</button>
            <button className="whitespace-nowrap px-5 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-all">Req. Approved</button>
            <button className="whitespace-nowrap px-5 py-2 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-container-highest transition-all">Req. Approval Reqd</button>
          </div>
          <div className="relative inline-block w-full md:w-64">
            <select className="appearance-none w-full h-11 px-4 pr-10 bg-surface-container-high border-none rounded-lg text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none">
              <option>All Departments</option>
              <option>HR</option>
              <option>ICT</option>
              <option>Finance</option>
              <option>Operations</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-on-surface-variant" />
          </div>
        </div>
      </section>

      {/* PRF List (Cards) */}
      <div className="grid grid-cols-1 gap-6">
        {/* PRF Card 1 */}
        <div 
          onClick={() => onNavigate?.('prf-details')}
          className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] transition-all hover:translate-y-[-4px] active:scale-[0.99] duration-250 cursor-pointer"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">PRF NUMBER</span>
              <h2 className="font-headline text-2xl font-extrabold text-on-surface">43373</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">REQ. APPROVAL REQD</span>
              <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider">MEDIUM</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              This project involves the procurement of enterprise-grade networking infrastructure and cloud service expansion for the new regional hub operations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Department</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  HR / ICT
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Requestor</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Adriana User
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cost Code</span>
                <span className="text-sm font-mono font-medium text-on-surface">MTIRMRAD426249</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Year</span>
                <span className="text-sm font-semibold text-on-surface">2026</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Requested Amount</span>
                <span className="text-xl font-headline font-bold text-primary">Rp 38.200.000</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Pending Verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRF Card 2 */}
        <div 
          onClick={() => onNavigate?.('prf-details')}
          className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] transition-all hover:translate-y-[-4px] active:scale-[0.99] duration-250 cursor-pointer"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">PRF NUMBER</span>
              <h2 className="font-headline text-2xl font-extrabold text-on-surface">43290</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-wider">REQ. APPROVED</span>
              <span className="px-3 py-1 bg-error-container/20 text-error text-[10px] font-bold rounded-full uppercase tracking-wider">HIGH</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              Urgent replacement of core switches in Data Center Room B to prevent potential network latency issues and ensure 99.9% uptime.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Department</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-primary" />
                  Infrastructure / ICT
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Requestor</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Marcus Admin
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cost Code</span>
                <span className="text-sm font-mono font-medium text-on-surface">IXC0029-242</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Year</span>
                <span className="text-sm font-semibold text-on-surface">2024</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Requested Amount</span>
                <span className="text-xl font-headline font-bold text-primary">Rp 125.450.000</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-tertiary rounded-full"></div>
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-tertiary">Provisioning Phase</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRF Card 3 (Minimal) */}
        <div 
          onClick={() => onNavigate?.('prf-details')}
          className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] transition-all hover:translate-y-[-4px] active:scale-[0.99] duration-250 cursor-pointer"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">PRF NUMBER</span>
              <h2 className="font-headline text-2xl font-extrabold text-on-surface">43412</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider">DRAFT</span>
              <span className="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider">LOW</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              Annual software license renewal for the creative suite used by the Marketing and Branding department.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Department</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-primary" />
                  Marketing
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Requestor</span>
                <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Sarah Creative
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cost Code</span>
                <span className="text-sm font-mono font-medium text-on-surface">MKT-262-X</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Year</span>
                <span className="text-sm font-semibold text-on-surface">2026</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Requested Amount</span>
                <span className="text-xl font-headline font-bold text-primary">Rp 12.000.000</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-outline-variant rounded-full"></div>
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Incomplete Draft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
