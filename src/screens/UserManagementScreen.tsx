import { useEffect, useMemo, useState } from 'react';
import { Info, Search, Unlock, UserPlus } from 'lucide-react';
import { authedGetJson } from '../lib/http';

interface UserManagementScreenProps {
  onOpenUser?: (samAccountName: string) => void;
}

type DirectoryUser = {
  id: string;
  displayName: string | null;
  title: string | null;
  department: string | null;
  email: string | null;
  upn: string | null;
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED';
};

export default function UserManagementScreen({ onOpenUser }: UserManagementScreenProps) {
  const [query, setQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  const statusPill = useMemo(() => {
    return activeOnly ? 'Active Only' : 'All Users';
  }, [activeOnly]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const t = setTimeout(() => {
      void (async () => {
        try {
          const data = await authedGetJson('/api/ad/users', { query, activeOnly: activeOnly ? 'true' : '' });
          if (!active) return;
          const list = Array.isArray(data?.users) ? data.users : [];
          setUsers(list);
        } catch {
          if (!active) return;
          setError('Failed to load users from Active Directory.');
          setUsers([]);
        } finally {
          if (!active) return;
          setLoading(false);
        }
      })();
    }, 250);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, activeOnly]);

  const onUnlock = async (samAccountName: string) => {
    setError(null);
    setLoading(true);
    try {
      await authedGetJson(`/api/ad/users/${encodeURIComponent(samAccountName)}/unlock`);
      const data = await authedGetJson('/api/ad/users', { query, activeOnly: activeOnly ? 'true' : '' });
      const list = Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
    } catch {
      setError('Failed to unlock account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-6 pb-32">
      {/* Editorial Header Section */}
      <section className="mb-8">
        <div className="inline-block px-3 py-1 mb-3 rounded-full bg-primary-container/30 text-primary font-label font-semibold text-[10px] uppercase tracking-wider">
          Administration
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Service Directory</h2>
        <p className="text-on-surface-variant leading-relaxed">Manage personnel access and security credentials across the ICT ecosystem.</p>
      </section>

      {/* Search & Filter Bar */}
      <section className="mb-8 space-y-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-outline" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all duration-250 text-on-surface placeholder:text-outline shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveOnly(false)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!activeOnly ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            All Users
          </button>
          <button
            type="button"
            onClick={() => setActiveOnly(true)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeOnly ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            Active Only
          </button>
        </div>
      </section>

      {/* User List Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-headline font-bold text-lg text-on-surface">Directory ({users.length})</h3>
          <span className="text-label text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">{statusPill}</span>
        </div>

        {error && (
          <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high">
            <span className="text-sm text-on-surface-variant font-medium">Loading...</span>
          </div>
        )}

        {!loading && users.map((u) => {
          const isLocked = u.status === 'LOCKED';
          const isDisabled = u.status === 'DISABLED';
          const badgeClasses = isLocked
            ? 'bg-red-50 text-red-600'
            : isDisabled
              ? 'bg-slate-100 text-slate-600'
              : 'bg-emerald-50 text-emerald-600';
          const dotClasses = isLocked ? 'bg-red-400' : isDisabled ? 'bg-slate-400' : 'bg-emerald-500';
          const label = isLocked ? 'Locked' : isDisabled ? 'Disabled' : 'Active';

          const initials = (u.displayName || u.id)
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join('');

          return (
            <div
              key={u.id}
              onClick={() => onOpenUser?.(u.id)}
              className={`bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high group transition-all cursor-pointer hover:bg-surface-container-lowest/50 ${isDisabled ? 'opacity-90' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center">
                      <span className="text-primary font-bold text-lg">{initials || 'AD'}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${dotClasses} border-2 border-white ${!isLocked && !isDisabled ? 'shadow-[0_0_0_2px_rgba(16,185,129,0.2)] animate-pulse' : ''}`}></div>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{u.displayName || u.id}</h4>
                    <p className="text-xs text-on-surface-variant font-medium">{u.title || u.department || u.upn || '-'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${badgeClasses}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`}></span>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all opacity-60"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void onUnlock(u.id);
                  }}
                  disabled={loading || !isLocked}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${isLocked ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-surface-container-low text-on-surface opacity-60'}`}
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Account
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-40">
        <button className="w-14 h-14 rounded-full bg-primary shadow-xl flex items-center justify-center text-on-primary active:scale-90 transition-transform">
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Secondary Info Area */}
      <section className="mt-12 p-6 rounded-2xl bg-blue-50/50 border border-primary/10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Info className="w-6 h-6 text-primary" />
          <h4 className="font-headline font-bold text-on-surface">Bulk Operations</h4>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">For organization-wide migrations or CSV user imports, please visit the main Hub dashboard on desktop.</p>
        <button className="w-full bg-white border border-primary/20 text-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform hover:bg-primary/5">
          Visit Hub Desktop
        </button>
      </section>
    </div>
  );
}
