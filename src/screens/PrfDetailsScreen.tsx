import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, MoreHorizontal, Search, SlidersHorizontal, Briefcase, RefreshCw, FileText, Download, Eye, MessageSquare, Hourglass, CheckCircle, Settings, FileUp, User } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { getAuthUserRaw } from '../auth/storage';
import { listCheckGoodsForPrf, upsertCheckGoodsForItem, type CheckGoodsRecord } from '../lib/check-goods-api';
import { getSelectedPomonPrfId, pomonGetPrfDocumentDownloadLink, pomonGetPrfDocumentViewLink, pomonGetPrfWithItems, pomonListPrfDocuments, pomonUpdatePrfItem, type PomonPrfDocument, type PomonPrfWithItems } from '../lib/pomon-api';

interface PrfDetailsScreenProps {
  onBack: () => void;
}

export default function PrfDetailsScreen({ onBack }: PrfDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'documents' | 'activity'>('items');
  const [prf, setPrf] = useState<PomonPrfWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [documents, setDocuments] = useState<PomonPrfDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [checkItem, setCheckItem] = useState<any | null>(null);
  const [checkStatus, setCheckStatus] = useState<string>('Pending');
  const [checkNotes, setCheckNotes] = useState<string>('');
  const [pickupName, setPickupName] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [checkSaving, setCheckSaving] = useState(false);
  const [checkMap, setCheckMap] = useState<Record<number, CheckGoodsRecord>>({});

  const prfId = useMemo(() => getSelectedPomonPrfId(), []);
  const currency = useMemo(() => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  }, []);

  const currentUser = useMemo(() => {
    try {
      const raw = getAuthUserRaw();
      if (!raw) return null;
      const parsed = JSON.parse(raw) as any;
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const displayName =
    typeof currentUser?.displayName === 'string'
      ? currentUser.displayName
      : typeof currentUser?.username === 'string'
        ? currentUser.username
        : typeof currentUser?.upn === 'string'
          ? currentUser.upn
          : null;

  const statusOptions = useMemo(() => {
    return ['Pending', 'Verified', 'Issue', 'Picked Up'];
  }, []);

  const refreshPrf = async () => {
    if (!prfId) return;
    const resp = await pomonGetPrfWithItems(prfId);
    if (!resp?.success || !resp.data || typeof resp.data !== 'object') {
      throw new Error('PRF_FETCH_FAILED');
    }
    setPrf(resp.data);
  };

  const refreshDocuments = async () => {
    if (!prfId) return;
    setDocsLoading(true);
    setDocsError(null);
    try {
      const resp = await pomonListPrfDocuments(prfId);
      if (!resp?.success || !Array.isArray(resp.data)) {
        setDocsError('Unable to load documents.');
        setDocuments([]);
        return;
      }
      setDocuments(resp.data);
    } catch {
      setDocsError('Unable to load documents.');
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!prfId) {
      setError('No PRF selected.');
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const resp = await pomonGetPrfWithItems(prfId);
        if (!active) return;
        if (!resp?.success || !resp.data || typeof resp.data !== 'object') {
          setError('Unable to load PRF details.');
          setPrf(null);
          return;
        }
        setPrf(resp.data);
      } catch {
        if (!active) return;
        setError('Unable to load PRF details.');
        setPrf(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [prfId]);

  useEffect(() => {
    if (!prfId) return;
    void refreshDocuments();
  }, [prfId]);

  useEffect(() => {
    if (!prfId) return;
    void (async () => {
      try {
        const resp = await listCheckGoodsForPrf(prfId);
        if (!resp?.ok || !Array.isArray(resp.data)) return;
        const m: Record<number, CheckGoodsRecord> = {};
        for (const r of resp.data) {
          if (typeof r?.prf_item_id === 'number') m[r.prf_item_id] = r;
        }
        setCheckMap(m);
      } catch {}
    })();
  }, [prfId]);

  const prfNo = typeof prf?.PRFNo === 'string' ? prf?.PRFNo : null;
  const submitBy = typeof prf?.SubmitBy === 'string' ? prf?.SubmitBy : null;
  const approvedBy =
    typeof (prf as any)?.ApprovedByName === 'string'
      ? (prf as any).ApprovedByName
      : typeof (prf as any)?.ApprovedBy === 'string'
        ? (prf as any).ApprovedBy
        : typeof (prf as any)?.ApproverName === 'string'
          ? (prf as any).ApproverName
          : null;
  const submittedAtRaw = typeof prf?.DateSubmit === 'string' ? prf.DateSubmit : typeof prf?.RequestDate === 'string' ? prf.RequestDate : null;
  const submittedAt = submittedAtRaw ? new Date(submittedAtRaw) : null;
  const statusLabel = typeof prf?.Status === 'string' ? prf.Status : null;
  const priorityLabel = typeof prf?.Priority === 'string' ? prf.Priority : null;
  const dept = typeof prf?.Department === 'string' ? prf.Department : null;
  const costCode = typeof prf?.PurchaseCostCode === 'string' ? prf.PurchaseCostCode : null;
  const budgetYear = typeof prf?.BudgetYear === 'number' ? prf.BudgetYear : null;
  const requestedAmount = typeof prf?.RequestedAmount === 'number' ? prf.RequestedAmount : null;
  const approvedAmount = typeof prf?.ApprovedAmount === 'number' ? prf.ApprovedAmount : null;
  const requiredFor = typeof prf?.RequiredFor === 'string' ? prf.RequiredFor : null;
  const summary = typeof prf?.SumDescriptionRequested === 'string' ? (prf as any).SumDescriptionRequested : typeof prf?.Description === 'string' ? prf.Description : null;
  const items = Array.isArray(prf?.Items) ? prf.Items : [];
  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return (items as any[]).filter((it) => {
      const values = [
        typeof it?.ItemName === 'string' ? it.ItemName : '',
        typeof it?.Description === 'string' ? it.Description : '',
        typeof it?.OriginalPONumber === 'string' ? it.OriginalPONumber : '',
        typeof it?.SplitPONumber === 'string' ? it.SplitPONumber : '',
        typeof it?.Status === 'string' ? it.Status : '',
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return values.some((s) => s.includes(q));
    });
  }, [itemSearch, items]);

  const openCheckGoods = (it: any) => {
    setError(null);
    setCheckItem(it);
    const itemId = typeof it?.PRFItemID === 'number' ? it.PRFItemID : null;
    const existing = itemId ? checkMap[itemId] : undefined;
    const curStatus = existing?.check_status ?? 'Pending';
    setCheckStatus(curStatus);
    const curNotes = existing?.notes ?? '';
    setCheckNotes(curNotes);

    const pickedBy =
      typeof it?.PickedUpBy === 'string'
        ? it.PickedUpBy
        : typeof it?.pickedUpBy === 'string'
          ? it.pickedUpBy
          : '';
    setPickupName(pickedBy);

    const pickedAtRaw =
      typeof it?.PickedUpDate === 'string'
        ? it.PickedUpDate
        : typeof it?.pickedUpDate === 'string'
          ? it.pickedUpDate
          : '';
    if (pickedAtRaw) {
      const d = new Date(pickedAtRaw);
      if (Number.isFinite(d.getTime())) {
        setPickupDate(d.toISOString().slice(0, 10));
      } else {
        setPickupDate('');
      }
    } else {
      setPickupDate('');
    }
  };

  const closeCheckGoods = () => {
    if (checkSaving) return;
    setCheckItem(null);
  };

  const activity = useMemo(() => {
    const list: Array<{ t: number; title: string; subtitle?: string; kind: 'submitted' | 'document' | 'split' | 'picked' | 'status' }> = [];

    if (submittedAt) {
      list.push({
        t: submittedAt.getTime(),
        title: 'PRF Submitted',
        subtitle: submitBy ? `Submitted by ${submitBy}` : undefined,
        kind: 'submitted',
      });
    }

    const prfUpdatedAtRaw = typeof (prf as any)?.UpdatedAt === 'string' ? (prf as any).UpdatedAt : null;
    const prfUpdatedAt = prfUpdatedAtRaw ? new Date(prfUpdatedAtRaw) : null;
    if (prfUpdatedAt && Number.isFinite(prfUpdatedAt.getTime())) {
      list.push({
        t: prfUpdatedAt.getTime(),
        title: 'PRF Updated',
        subtitle: statusLabel ? `Status: ${statusLabel}` : undefined,
        kind: 'status',
      });
    }

    for (const d of documents) {
      const whenRaw = typeof d.UploadDate === 'string' ? d.UploadDate : null;
      const when = whenRaw ? new Date(whenRaw) : null;
      const t = when && Number.isFinite(when.getTime()) ? when.getTime() : 0;
      const name = typeof d.OriginalFileName === 'string' ? d.OriginalFileName : 'Document';
      list.push({ t, title: 'Document uploaded', subtitle: name, kind: 'document' });
    }

    for (const it of items as any[]) {
      const splitPo = typeof it?.SplitPONumber === 'string' ? it.SplitPONumber : null;
      const updatedAtRaw = typeof it?.UpdatedAt === 'string' ? it.UpdatedAt : null;
      const when = updatedAtRaw ? new Date(updatedAtRaw) : null;
      const t = when && Number.isFinite(when.getTime()) ? when.getTime() : 0;
      if (splitPo) {
        list.push({ t, title: 'Split PO created', subtitle: splitPo, kind: 'split' });
      }

      const pickedUpAtRaw = typeof it?.PickedUpDate === 'string' ? it.PickedUpDate : null;
      const pickedUpAt = pickedUpAtRaw ? new Date(pickedUpAtRaw) : null;
      if (pickedUpAt && Number.isFinite(pickedUpAt.getTime())) {
        const itemName = typeof it?.ItemName === 'string' ? it.ItemName : 'Item';
        list.push({ t: pickedUpAt.getTime(), title: 'Item picked up', subtitle: itemName, kind: 'picked' });
      }
    }

    return list
      .filter((e) => Number.isFinite(e.t) && e.t > 0)
      .sort((a, b) => b.t - a.t)
      .slice(0, 30);
  }, [documents, items, prf, statusLabel, submitBy, submittedAt]);

  const openExternal = async (url: string) => {
    if (!url) return;
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#F8FAFC] font-body min-h-screen pb-20">
      {/* Header Section with Gradient */}
      <header className="bg-gradient-to-br from-[#4426A8] to-[#2A1A78] pt-safe-6 pb-6 px-6 text-white rounded-b-[40px] relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Top Controls */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold font-headline">PRF Details</h2>
            <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* PRF Info Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="text-3xl font-extrabold font-headline min-w-0 truncate">
                  {prfNo ? `PRF #${prfNo}` : 'PRF Details'}
                </h1>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {statusLabel && (
                    <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-white/95">
                      {statusLabel}
                    </span>
                  )}
                  {priorityLabel && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-400/95 text-[10px] font-extrabold uppercase tracking-wider text-[#2A1A78]">
                      {priorityLabel}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-white/70 text-xs leading-relaxed max-w-lg">
                {submittedAt
                  ? `Submitted ${submittedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}${submitBy ? ` by ${submitBy}` : ''}`
                  : loading
                    ? 'Loading…'
                    : ''}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('items')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'items' ? 'bg-white text-[#3E26A8]' : 'text-white/70 hover:bg-white/5'}`}
            >
              Items
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'documents' ? 'bg-white text-[#3E26A8]' : 'text-white/70 hover:bg-white/5'}`}
            >
              Documents
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-white text-[#3E26A8]' : 'text-white/70 hover:bg-white/5'}`}
            >
              Activity
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 -mt-4 pb-20">
        {error && (
          <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-6 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Main Info Card */}
        <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-6 relative z-10">
          <div className="grid grid-cols-2 gap-y-6 gap-x-6">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Department</span>
              <p className="text-slate-800 font-bold text-base truncate">{dept ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Submit By</span>
              <p className="text-slate-800 font-bold text-base truncate">{submitBy ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Approved By</span>
              <p className="text-slate-800 font-bold text-base truncate">{approvedBy ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cost Code</span>
              <p className="text-slate-800 font-bold text-base font-mono truncate">{costCode ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Budget Year</span>
              <p className="text-slate-800 font-bold text-base truncate">{budgetYear ?? '—'}</p>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-[#3E26A8]">Requested Amount</span>
              <p className="text-[#3E26A8] font-extrabold text-xl truncate">{requestedAmount !== null ? currency.format(requestedAmount) : '—'}</p>
            </div>
            <div className="min-w-0" />
            <div className="col-span-2 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Required For</span>
              <p className="text-slate-800 font-bold text-base">{requiredFor ?? '—'}</p>
            </div>
            <div className="col-span-2 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Summary</span>
              <p className="text-slate-500 text-sm leading-relaxed">
                {summary ?? '—'}
              </p>
            </div>
          </div>
        </section>

        {activeTab === 'items' && (
          <>
            {/* Search and Filter Row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E26A8] transition-colors w-5 h-5" />
                <input 
                  className="w-full bg-white border-none h-12 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-[#3E26A8]/20 text-sm text-slate-700 placeholder:text-slate-400 shadow-[0_4px_20px_rgba(0,0,0,0.04)] outline-none" 
                  placeholder="Search items..." 
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>
              <button className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-slate-600 hover:text-[#3E26A8] transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {!loading && !filteredItems.length && (
                <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-slate-500 text-sm">
                  No items found.
                </div>
              )}

              {filteredItems.map((it: any) => {
                const itemId = typeof it?.PRFItemID === 'number' ? it.PRFItemID : undefined;
                const name = typeof it?.ItemName === 'string' ? it.ItemName : '—';
                const itemStatus = typeof it?.Status === 'string' ? it.Status : '—';
                const qty = typeof it?.Quantity === 'number' ? it.Quantity : null;
                const total = typeof it?.TotalPrice === 'number' ? it.TotalPrice : null;
                const originalPo = typeof it?.OriginalPONumber === 'string' ? it.OriginalPONumber : null;
                const splitPo = typeof it?.SplitPONumber === 'string' ? it.SplitPONumber : null;
                const pickedBy =
                  typeof it?.PickedUpBy === 'string'
                    ? it.PickedUpBy
                    : typeof it?.pickedUpBy === 'string'
                      ? it.pickedUpBy
                      : null;
                const pickedAtRaw =
                  typeof it?.PickedUpDate === 'string'
                    ? it.PickedUpDate
                    : typeof it?.pickedUpDate === 'string'
                      ? it.pickedUpDate
                      : null;
                const pickedAt = pickedAtRaw ? new Date(pickedAtRaw) : null;
                const check = itemId ? checkMap[itemId] : undefined;
                const checkLabel = typeof check?.check_status === 'string' ? check.check_status : null;
                const checkedAtRaw = typeof check?.checked_at === 'string' ? check.checked_at : null;
                const checkedAt = checkedAtRaw ? new Date(checkedAtRaw) : null;

                return (
                  <div key={itemId ?? name} className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">{name}</h3>
                      <div className="flex items-center gap-2">
                        {splitPo && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-100">
                            Split PO
                          </span>
                        )}
                        {checkLabel && (
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-100">
                            {checkLabel}
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                          {itemStatus}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Quantity</span>
                        <span className="text-slate-800 font-bold">{qty ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Total</span>
                        <span className="text-slate-800 font-bold">{total !== null ? currency.format(total) : '—'}</span>
                      </div>
                      {(originalPo || splitPo) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">PO Number</span>
                          <span className="text-slate-800 font-bold font-mono text-right">
                            {splitPo ? (originalPo ? `${originalPo} → ${splitPo}` : splitPo) : originalPo}
                          </span>
                        </div>
                      )}
                      {(pickedBy || (pickedAt && Number.isFinite(pickedAt.getTime()))) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Pickup</span>
                          <span className="text-slate-800 font-bold text-right">
                            {pickedBy ? pickedBy : '—'}
                            {pickedAt && Number.isFinite(pickedAt.getTime()) ? ` • ${pickedAt.toLocaleDateString('id-ID')}` : ''}
                          </span>
                        </div>
                      )}
                      {checkedAt && Number.isFinite(checkedAt.getTime()) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Last Checked</span>
                          <span className="text-slate-800 font-bold text-right">{checkedAt.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <button
                      disabled={!itemId}
                      onClick={() => openCheckGoods(it)}
                      className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Briefcase className="w-5 h-5" />
                      Check Goods
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Documents List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="font-bold text-slate-800">Attached Documents ({documents.length})</h3>
                <button
                  onClick={() => void refreshDocuments()}
                  className="text-[#3E26A8] text-sm font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  {docsLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {docsError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                  {docsError}
                </div>
              )}

              {!docsLoading && !documents.length && !docsError && (
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-slate-500 text-sm">
                  No documents found.
                </div>
              )}

              {documents.map((d) => {
                const fileId = typeof d.FileID === 'number' ? d.FileID : null;
                const name = typeof d.OriginalFileName === 'string' ? d.OriginalFileName : 'Document';
                const sizeRaw = typeof d.FileSize === 'string' ? Number(d.FileSize) : typeof d.FileSize === 'number' ? d.FileSize : null;
                const sizeLabel = sizeRaw ? `${Math.max(1, Math.round(sizeRaw / 1024))} KB` : '';
                const whenRaw = typeof d.UploadDate === 'string' ? d.UploadDate : null;
                const when = whenRaw ? new Date(whenRaw) : null;
                const whenLabel = when && Number.isFinite(when.getTime()) ? when.toLocaleDateString() : '';
                const isOriginal = Boolean(d.IsOriginalDocument);

                return (
                  <div key={fileId ?? name} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isOriginal ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      <FileText className={`w-8 h-8 ${isOriginal ? 'text-amber-600' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-base truncate">{name}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        {sizeLabel && <span className="text-slate-400 text-xs font-medium">{sizeLabel}</span>}
                        {sizeLabel && whenLabel && <span className="w-1 h-1 bg-slate-300 rounded-full" />}
                        {whenLabel && <span className="text-slate-400 text-xs font-medium">{whenLabel}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!fileId}
                        onClick={() => {
                          if (!fileId) return;
                          void (async () => {
                            try {
                              const resp = await pomonGetPrfDocumentViewLink(fileId);
                              if (!resp?.ok || typeof resp.url !== 'string') {
                                setDocsError('Unable to open document.');
                                return;
                              }
                              await openExternal(resp.url);
                            } catch {
                              setDocsError('Unable to open document.');
                            }
                          })();
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        disabled={!fileId}
                        onClick={() => {
                          if (!fileId) return;
                          void (async () => {
                            try {
                              const resp = await pomonGetPrfDocumentDownloadLink(fileId);
                              if (!resp?.ok || typeof resp.url !== 'string') {
                                setDocsError('Unable to download document.');
                                return;
                              }
                              await openExternal(resp.url);
                            } catch {
                              setDocsError('Unable to download document.');
                            }
                          })();
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-bold text-slate-800 mb-8 font-headline">Recent Activity</h3>
            {!activity.length && (
              <div className="text-slate-500 text-sm">
                No activity found.
              </div>
            )}

            <div className="space-y-0">
              {activity.map((e, idx) => {
                const date = new Date(e.t);
                const timeLabel = Number.isFinite(date.getTime()) ? date.toLocaleString() : '';
                const isLast = idx === activity.length - 1;

                const icon = e.kind === 'submitted'
                  ? <FileUp className="text-[#3E26A8] w-5 h-5" />
                  : e.kind === 'document'
                    ? <FileText className="text-indigo-600 w-5 h-5" />
                    : e.kind === 'split'
                      ? <MessageSquare className="text-amber-600 w-5 h-5" />
                      : e.kind === 'picked'
                        ? <CheckCircle className="text-green-600 w-5 h-5" />
                        : <Hourglass className="text-slate-600 w-5 h-5" />;

                const bubble =
                  e.kind === 'submitted'
                    ? 'bg-[#3E26A8]/10'
                    : e.kind === 'document'
                      ? 'bg-indigo-100'
                      : e.kind === 'split'
                        ? 'bg-amber-100'
                        : e.kind === 'picked'
                          ? 'bg-green-100'
                          : 'bg-slate-100';

                return (
                  <div key={`${e.kind}-${e.t}-${idx}`} className={`relative flex gap-6 pb-10 ${!isLast ? "before:absolute before:left-[23px] before:top-10 before:bottom-0 before:w-0.5 before:bg-slate-200" : "pb-2"}`}>
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${bubble} flex items-center justify-center border-4 border-white`}>
                      {icon}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                        <h4 className="font-bold text-slate-800">{e.title}</h4>
                        <span className="text-xs text-slate-400 font-medium">{timeLabel}</span>
                      </div>
                      {e.subtitle && <p className="text-sm text-slate-500">{e.subtitle}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {checkItem && (
        <div className="fixed inset-0 z-[999]">
          <button
            onClick={closeCheckGoods}
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
          />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[28px] p-6 pb-safe-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-900 truncate">Check Goods</h3>
                <p className="text-sm text-slate-500 truncate">
                  {typeof checkItem?.ItemName === 'string' ? checkItem.ItemName : 'Item'}
                </p>
              </div>
              <button
                onClick={closeCheckGoods}
                disabled={checkSaving}
                className="h-10 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                  Status
                </label>
                <select
                  value={checkStatus}
                  onChange={(e) => setCheckStatus(e.target.value)}
                  disabled={checkSaving}
                  className="w-full h-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-[#3E26A8]/20"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={checkNotes}
                  onChange={(e) => setCheckNotes(e.target.value)}
                  disabled={checkSaving}
                  rows={4}
                  placeholder="Catatan pengecekan barang…"
                  className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-[#3E26A8]/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                    Pickup PIC
                  </label>
                  <input
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    disabled={checkSaving}
                    placeholder="Nama pengambil…"
                    className="w-full h-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-[#3E26A8]/20"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    disabled={checkSaving}
                    className="w-full h-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-[#3E26A8]/20"
                  />
                </div>
              </div>

              <button
                disabled={checkSaving || typeof checkItem?.PRFItemID !== 'number'}
                onClick={() => {
                  const itemId = typeof checkItem?.PRFItemID === 'number' ? checkItem.PRFItemID : null;
                  if (!itemId) return;
                  if (!prfId) return;
                  setCheckSaving(true);
                  setError(null);
                  void (async () => {
                    try {
                      const prfNo = typeof prf?.PRFNo === 'string' ? prf.PRFNo : undefined;
                      const resp = await upsertCheckGoodsForItem(itemId, {
                        prfId,
                        prfNo,
                        checkStatus,
                        notes: checkNotes?.trim() ? checkNotes.trim() : undefined,
                      });
                      if (resp?.ok && resp.data) {
                        setCheckMap((m) => ({ ...m, [itemId]: resp.data as CheckGoodsRecord }));
                      }

                      const pickedUpBy = pickupName.trim();
                      const pickedUpDate = pickupDate ? new Date(`${pickupDate}T00:00:00Z`).toISOString() : '';
                      if (pickedUpBy || pickedUpDate) {
                        const currentStatus = typeof checkItem?.Status === 'string' ? checkItem.Status : undefined;
                        await pomonUpdatePrfItem(itemId, {
                          status: currentStatus,
                          pickedUpBy: pickedUpBy ? pickedUpBy : undefined,
                          pickedUpDate: pickedUpDate ? pickedUpDate : undefined,
                        });
                        await refreshPrf();
                      }

                      setCheckItem(null);
                    } catch {
                      setError('Unable to update item.');
                    } finally {
                      setCheckSaving(false);
                    }
                  })();
                }}
                className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
