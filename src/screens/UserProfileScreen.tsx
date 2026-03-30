import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeInfo, Contact, Copy, History, Mail, MessageCircle, MoreVertical, Network, Phone, ShieldAlert, Verified } from 'lucide-react';
import { authedGetJson } from '../lib/http';

interface UserProfileScreenProps {
  onBack: () => void;
  samAccountName: string;
}

type AdUserDetails = {
  id: string;
  displayName: string | null;
  title: string | null;
  department: string | null;
  upn: string | null;
  email: string | null;
  mobile: string | null;
  employeeId: string | null;
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED';
  lastPasswordChange: string | null;
  passwordExpiry: string | null;
  passwordExpiresInDays: number | null;
};

function formatDateTime(value: string | null) {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatExpiry(value: string | null, days: number | null) {
  if (!value || days == null) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  if (days < 0) return `Expired (${monthDay})`;
  return `Expires in ${days} days (${monthDay})`;
}

export default function UserProfileScreen({ onBack, samAccountName }: UserProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AdUserDetails | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const initials = useMemo(() => {
    const label = user?.displayName || user?.id || samAccountName;
    return label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [user, samAccountName]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await authedGetJson(`/api/ad/users/${encodeURIComponent(samAccountName)}`);
        if (!active) return;
        setUser(data?.user ?? null);
      } catch {
        if (!active) return;
        setError('Failed to load user details from Active Directory.');
        setUser(null);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [samAccountName]);

  const mobileNumber = useMemo(() => {
    const raw = user?.mobile;
    if (raw == null) return null;
    const digits = String(raw).replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (!digits) return null;
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    return digits;
  }, [user?.mobile]);

  const copyValue = async (key: string, value: unknown) => {
    if (value == null) return;
    const text = String(value);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1200);
    } catch {
      setError('Failed to copy value.');
    }
  };

  const openWhatsapp = () => {
    if (!mobileNumber) return;
    window.open(`https://wa.me/${encodeURIComponent(mobileNumber)}`, '_blank', 'noopener,noreferrer');
  };

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
        {error && (
          <div className="bg-error-container/25 text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Hero Profile Section */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-surface-container-lowest">
              <div className="w-full h-full bg-primary-container/30 flex items-center justify-center">
                <span className="text-primary font-extrabold text-4xl">{initials || 'AD'}</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-tertiary text-on-tertiary p-1.5 rounded-lg shadow-md border-2 border-surface-container-lowest">
              <Verified className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">{user?.displayName || samAccountName}</h2>
            <p className="font-body text-on-surface-variant font-medium">{user?.title || user?.department || samAccountName}</p>
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
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Email / UPN</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-primary">{user?.email || user?.upn || 'Not available'}</p>
                    {(user?.email || user?.upn) && (
                      <button
                        type="button"
                        onClick={() => void copyValue('email', user.email || user.upn || '')}
                        className="h-10 w-10 rounded-xl bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                        aria-label="Copy email or UPN"
                        title={copiedKey === 'email' ? 'Copied' : 'Copy'}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-secondary-container/50 rounded-xl">
                  <Phone className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Mobile</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-on-surface">{user?.mobile || 'Not available'}</p>
                    {user?.mobile && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={openWhatsapp}
                          className="h-10 w-10 rounded-xl bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                          aria-label="Message on WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void copyValue('mobile', user.mobile)}
                          className="h-10 w-10 rounded-xl bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                          aria-label="Copy phone number"
                          title={copiedKey === 'mobile' ? 'Copied' : 'Copy'}
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-secondary-container/50 rounded-xl">
                  <Network className="w-5 h-5 text-on-secondary-container" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Department</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-on-surface">{user?.department || 'Not available'}</p>
                    {user?.department && (
                      <button
                        type="button"
                        onClick={() => void copyValue('department', user.department)}
                        className="h-10 w-10 rounded-xl bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                        aria-label="Copy department"
                        title={copiedKey === 'department' ? 'Copied' : 'Copy'}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                  </div>
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
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Employee ID</p>
                <p className="font-headline font-extrabold text-xl text-on-surface tracking-tight">{user?.employeeId || 'Not available'}</p>
              </div>
              {user?.employeeId && (
                <button
                  type="button"
                  onClick={() => void copyValue('employeeId', user.employeeId)}
                  className="h-10 w-10 rounded-xl bg-surface-container-highest hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant"
                  aria-label="Copy employee ID"
                  title={copiedKey === 'employeeId' ? 'Copied' : 'Copy'}
                >
                  <Copy className="w-5 h-5" />
                </button>
              )}
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
                  <span className="font-medium text-on-surface">{formatDateTime(user?.lastPasswordChange ?? null)}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Password Expiry Status</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary"></span>
                  </div>
                  <span className="font-medium text-tertiary">{formatExpiry(user?.passwordExpiry ?? null, user?.passwordExpiresInDays ?? null)}</span>
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
