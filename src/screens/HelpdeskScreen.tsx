import { useMemo, useState } from 'react';
import { Bell, CheckCircle, ChevronRight, Clock, History, Mail, Plus, Search, TriangleAlert } from 'lucide-react';

type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

type Ticket = {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  title: string;
  reportedBy: string;
  ageLabel: string;
  slaLabel?: string;
  durationLabel?: string;
};

export default function HelpdeskScreen() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'awaiting-user'>('all');
  const [search, setSearch] = useState('');

  const tickets = useMemo<Ticket[]>(() => {
    return [
      {
        id: 'INC-9021',
        status: 'Open',
        priority: 'Critical',
        title: 'Primary Fiber Link Down - Branch Office A',
        reportedBy: 'Sarah Jenkins',
        ageLabel: '14 mins ago',
        slaLabel: '00:14:22',
      },
      {
        id: 'REQ-4458',
        status: 'In Progress',
        priority: 'Medium',
        title: 'New Employee Onboarding - Cloud Access',
        reportedBy: 'HR Dept',
        ageLabel: '2 hours ago',
      },
      {
        id: 'INC-8991',
        status: 'Resolved',
        priority: 'Low',
        title: 'VPN Authentication Failure',
        reportedBy: 'System Admin',
        ageLabel: '3 hours ago',
        durationLabel: '45m',
      },
    ];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter === 'critical' && t.priority !== 'Critical') return false;
      if (filter === 'high' && t.priority !== 'High') return false;
      if (filter === 'awaiting-user') return false;
      if (!q) return true;
      const hay = `${t.id} ${t.title} ${t.reportedBy}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, search, tickets]);

  const summary = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'Open').length;
    const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved').length;
    return { open, inProgress, resolved };
  }, [tickets]);

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-10">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">Open Tickets</p>
                <h2 className="font-headline font-bold text-3xl text-primary">{String(summary.open).padStart(2, '0')}</h2>
              </div>
              <div className="p-3 bg-primary-container/30 rounded-xl text-primary">
                <Mail className="w-8 h-8" />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">In Progress</p>
                <h2 className="font-headline font-bold text-3xl text-secondary">{String(summary.inProgress).padStart(2, '0')}</h2>
              </div>
              <div className="p-3 bg-secondary-container/30 rounded-xl text-secondary">
                <Clock className="w-8 h-8" />
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(42,52,57,0.06)] flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-widest mb-1">Resolved Today</p>
                <h2 className="font-headline font-bold text-3xl text-tertiary">{String(summary.resolved).padStart(2, '0')}</h2>
              </div>
              <div className="p-3 bg-tertiary-container/30 rounded-xl text-tertiary">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-full font-label text-sm transition-all shadow-md ${
                filter === 'all'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-5 py-2.5 rounded-full font-label text-sm transition-all ${
                filter === 'critical'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-5 py-2.5 rounded-full font-label text-sm transition-all ${
                filter === 'high'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              High Priority
            </button>
            <button
              onClick={() => setFilter('awaiting-user')}
              className={`px-5 py-2.5 rounded-full font-label text-sm transition-all ${
                filter === 'awaiting-user'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant font-medium hover:bg-surface-container-highest'
              }`}
            >
              Awaiting User
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest rounded-xl text-on-surface-variant">
            <Search className="w-5 h-5" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm font-body w-full md:w-64 placeholder:text-on-surface-variant/60 outline-none"
              placeholder="Search ticket ID or subject..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-headline text-lg font-bold text-on-surface">Active Requests</h3>
            <span className="text-on-surface-variant text-sm font-medium">Sorted by: Recency</span>
          </div>

          <div className="space-y-3">
            {filtered.map((t) => {
              const isCritical = t.priority === 'Critical';
              const isResolved = t.status === 'Resolved';
              const border =
                isCritical ? 'bg-error' : t.status === 'In Progress' ? 'bg-secondary' : isResolved ? 'bg-tertiary' : 'bg-outline-variant';
              const badge =
                t.priority === 'Critical'
                  ? 'bg-error-container/20 text-error'
                  : t.status === 'In Progress'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : t.status === 'Resolved'
                      ? 'bg-tertiary-container/40 text-on-tertiary-container'
                      : 'bg-surface-container-high text-on-surface-variant';
              const badgeText = t.priority === 'Critical' ? 'Critical' : t.status === 'In Progress' ? 'In Progress' : t.status === 'Resolved' ? 'Resolved' : t.status;

              return (
                <div
                  key={t.id}
                  className={`bg-surface-container-lowest p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all hover:translate-y-[-2px] hover:shadow-lg ${
                    isResolved ? 'bg-surface-container-low/50 border-l-4 border-tertiary' : ''
                  }`}
                >
                  {!isResolved && <div className={`flex-none w-1.5 h-12 ${border} rounded-full hidden md:block`} />}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-label text-[10px] font-bold tracking-tighter ${isResolved ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>{t.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${badge}`}>{badgeText}</span>
                      {t.priority === 'High' && <TriangleAlert className="w-4 h-4 text-amber-600" />}
                    </div>
                    <h4
                      className={`font-headline font-bold text-lg ${
                        isResolved ? 'text-slate-900/60 line-through' : 'text-slate-900'
                      }`}
                    >
                      {t.title}
                    </h4>
                    <p className={`text-sm font-body mt-1 ${isResolved ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
                      {isResolved ? 'Resolved by: ' : 'Reported by: '}
                      {t.reportedBy} • {t.ageLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-right">
                      {t.slaLabel ? (
                        <>
                          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">SLA Time</p>
                          <p className={`font-body font-bold ${isCritical ? 'text-error' : 'text-on-surface'}`}>{t.slaLabel}</p>
                        </>
                      ) : t.durationLabel ? (
                        <>
                          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Duration</p>
                          <p className="font-body font-bold text-on-surface-variant/60">{t.durationLabel}</p>
                        </>
                      ) : null}
                    </div>
                    <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-colors">
                      {isResolved ? <History className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-[0_8px_24px_rgba(0,83,219,0.3)] flex items-center justify-center z-40 active:scale-90 transition-transform duration-250">
        <Plus className="w-8 h-8" />
      </button>

      <button className="fixed top-safe-4 right-6 z-50 p-2 rounded-xl hover:bg-surface-container-high transition-colors active:scale-95">
        <Bell className="w-6 h-6 text-slate-500" />
      </button>
    </div>
  );
}

