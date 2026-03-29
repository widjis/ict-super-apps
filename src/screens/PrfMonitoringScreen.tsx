import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, Building2, User, Cpu, Palette } from 'lucide-react';
import { pomonListPrfs, setSelectedPomonPrfId, type PomonPrfSummary } from '../lib/pomon-api';

interface PrfMonitoringScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function PrfMonitoringScreen({ onNavigate }: PrfMonitoringScreenProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'Req. Approved' | 'Req. Approval Reqd'>('all');
  const [department, setDepartment] = useState('All Departments');
  const [items, setItems] = useState<PomonPrfSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = useMemo(() => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const resp = await pomonListPrfs({
          limit: 50,
          status: status === 'all' ? undefined : status,
          department: department === 'All Departments' ? undefined : department,
          search: debouncedSearch ? debouncedSearch : undefined,
        });

        if (!active) return;
        if (!resp?.success || !Array.isArray(resp.data)) {
          setError('Unable to load PRFs.');
          setItems([]);
          return;
        }

        setItems(resp.data);
      } catch {
        if (!active) return;
        setError('Unable to load PRFs.');
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [status, department, debouncedSearch]);

  const departmentOptions = useMemo(() => {
    const base = ['All Departments', 'HR', 'ICT', 'Finance', 'Operations'];
    const fromData = Array.from(
      new Set(
        items
          .map((p) => (typeof p.Department === 'string' ? p.Department : null))
          .filter((d): d is string => Boolean(d))
      )
    );
    for (const d of fromData) {
      if (typeof d === 'string' && !base.includes(d)) base.push(d);
    }
    return base;
  }, [items]);

  const getStatusClasses = (value: string | undefined) => {
    if (value === 'Req. Approval Reqd') return 'bg-amber-100 text-amber-700';
    if (value === 'Req. Approved') return 'bg-tertiary-container text-on-tertiary-container';
    return 'bg-surface-container-highest text-on-surface-variant';
  };

  const getPriorityClasses = (value: string | undefined) => {
    const v = (value ?? '').toLowerCase();
    if (v === 'high' || v === 'critical') return 'bg-error-container/20 text-error';
    if (v === 'medium') return 'bg-surface-container-highest text-on-surface-variant';
    if (v === 'low') return 'bg-surface-container-highest text-on-surface-variant';
    return 'bg-surface-container-highest text-on-surface-variant';
  };

  const renderDepartmentIcon = (dept: string | undefined) => {
    const v = (dept ?? '').toLowerCase();
    if (v.includes('ict') || v.includes('infra')) return <Cpu className="w-4 h-4 text-primary" />;
    if (v.includes('marketing')) return <Palette className="w-4 h-4 text-primary" />;
    return <Building2 className="w-4 h-4 text-primary" />;
  };

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all outline-none"
          />
        </div>

        {/* Chips and Dropdown Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setStatus('all')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm transition-all ${
                status === 'all'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              All PRFs
            </button>
            <button
              onClick={() => setStatus('Req. Approved')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm transition-all ${
                status === 'Req. Approved'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              Req. Approved
            </button>
            <button
              onClick={() => setStatus('Req. Approval Reqd')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm transition-all ${
                status === 'Req. Approval Reqd'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              Req. Approval Reqd
            </button>
          </div>
          <div className="relative inline-block w-full md:w-64">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none w-full h-11 px-4 pr-10 bg-surface-container-high border-none rounded-lg text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none"
            >
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-on-surface-variant" />
          </div>
        </div>
      </section>

      {/* PRF List (Cards) */}
      <div className="grid grid-cols-1 gap-6">
        {error && (
          <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {loading && !items.length && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)]">
            <div className="h-6 w-40 bg-surface-container-high rounded-lg mb-4" />
            <div className="h-4 w-full bg-surface-container-high rounded-lg mb-2" />
            <div className="h-4 w-5/6 bg-surface-container-high rounded-lg" />
          </div>
        )}

        {!loading && !items.length && !error && (
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] text-on-surface-variant">
            No PRFs found.
          </div>
        )}

        {items.map((prf) => {
          const id = typeof prf.PRFID === 'number' ? prf.PRFID : null;
          const prfNo = typeof prf.PRFNo === 'string' ? prf.PRFNo : '-';
          const title = typeof prf.Title === 'string' ? prf.Title : '';
          const dept = typeof prf.Department === 'string' ? prf.Department : '';
          const requestor = typeof prf.RequestorName === 'string' ? prf.RequestorName : '';
          const costCode = typeof prf.PurchaseCostCode === 'string' ? prf.PurchaseCostCode : '';
          const year = typeof prf.BudgetYear === 'number' ? prf.BudgetYear : null;
          const statusLabel = typeof prf.Status === 'string' ? prf.Status : '';
          const priorityLabel = typeof prf.Priority === 'string' ? prf.Priority : '';
          const requested = typeof prf.RequestedAmount === 'number' ? prf.RequestedAmount : null;

          return (
            <div
              key={id ?? `${prfNo}-${title}`}
              onClick={() => {
                if (id) setSelectedPomonPrfId(id);
                onNavigate?.('prf-details');
              }}
              className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_8px_24px_rgba(42,52,57,0.04)] transition-all hover:translate-y-[-4px] active:scale-[0.99] duration-250 cursor-pointer"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">PRF NUMBER</span>
                  <h2 className="font-headline text-2xl font-extrabold text-on-surface">{prfNo}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusLabel && (
                    <span
                      className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getStatusClasses(
                        statusLabel
                      )}`}
                    >
                      {statusLabel}
                    </span>
                  )}
                  {priorityLabel && (
                    <span
                      className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${getPriorityClasses(
                        priorityLabel
                      )}`}
                    >
                      {priorityLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">{title}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Department</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                      {renderDepartmentIcon(dept)}
                      {dept || '-'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Requestor</span>
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" />
                      {requestor || '-'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cost Code</span>
                    <span className="text-sm font-mono font-medium text-on-surface">{costCode || '-'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Year</span>
                    <span className="text-sm font-semibold text-on-surface">{year ?? '-'}</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Requested Amount</span>
                    <span className="text-xl font-headline font-bold text-primary">
                      {requested !== null ? currency.format(requested) : '-'}
                    </span>
                  </div>
                  {statusLabel && (
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          statusLabel === 'Req. Approval Reqd'
                            ? 'bg-amber-500 animate-pulse'
                            : statusLabel === 'Req. Approved'
                              ? 'bg-tertiary'
                              : 'bg-outline-variant'
                        }`}
                      />
                      <span
                        className={`text-sm font-bold text-on-surface-variant uppercase tracking-widest ${
                          statusLabel === 'Req. Approved' ? 'text-tertiary' : ''
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
