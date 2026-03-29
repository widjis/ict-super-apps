import { ArrowLeft, MoreHorizontal, Search, Filter, Package } from 'lucide-react';

interface PrfDetailsScreenProps {
  onBack: () => void;
}

export default function PrfDetailsScreen({ onBack }: PrfDetailsScreenProps) {
  return (
    <div className="bg-surface font-body min-h-screen pb-20">
      {/* Header & Summary Section */}
      <section className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white pb-8 pt-6 px-6 relative overflow-hidden">
        {/* Abstract Background Circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-headline text-lg font-bold">PRF Details</h1>
          <button className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* PRF Summary */}
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight">PRF #43373</h2>
              <p className="text-white/70 text-xs mt-1 leading-relaxed">
                Submitted 2026-03-26T00:00:00.000Z by<br/>
                Adriana User
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">REQ. APPROVAL REQD</span>
              <div className="bg-amber-500 px-3 py-1 rounded border border-white/20">
                <span className="block text-[8px] font-bold uppercase tracking-tighter text-white/90 leading-none">PRIORITY:</span>
                <span className="block text-[10px] font-extrabold uppercase text-white">MEDIUM</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation (Segmented Control) */}
          <div className="mt-8 bg-white/10 rounded-xl p-1 flex gap-1">
            <button className="flex-1 py-2.5 text-sm font-semibold bg-white text-indigo-700 rounded-lg shadow-sm transition-all">Items</button>
            <button className="flex-1 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 rounded-lg transition-all">Documents</button>
            <button className="flex-1 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 rounded-lg transition-all">Activity</button>
          </div>
        </div>
      </section>

      <main className="px-4 -mt-4 relative z-20">
        {/* Info Grid Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline space-y-6 mb-6">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">DEPARTMENT</span>
              <span className="text-sm font-bold text-on-surface">HR / ICT</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">SUBMIT BY</span>
              <span className="text-sm font-bold text-on-surface">Adriana Riska Rante [MTI]</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">COST CODE</span>
              <span className="text-sm font-bold text-on-surface">MTIRMRAD426249</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">BUDGET YEAR</span>
              <span className="text-sm font-bold text-on-surface">2026</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">REQUESTED AMOUNT</span>
              <span className="text-base font-extrabold text-indigo-700">Rp 38.200.000</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">APPROVED AMOUNT</span>
              <span className="text-base font-extrabold text-on-surface">Rp 0</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">REQUIRED FOR</span>
            <p className="text-sm font-semibold text-on-surface">For Messhall Kitchen Makari Camp - For SS Team</p>
          </div>
          
          <div>
            <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">SUMMARY</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              This project involves the procurement of various IT and infrastructure equipment for the HR and ICT departments.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <input 
              className="w-full h-12 pl-10 pr-4 bg-white border border-outline rounded-xl text-sm placeholder:text-on-surface-variant focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
              placeholder="Search items..." 
              type="text"
            />
          </div>
          <button className="w-12 h-12 flex items-center justify-center bg-white border border-outline rounded-xl text-on-surface hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {/* Item Card 1 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline">
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3 className="font-bold text-sm leading-snug flex-1">Uniview 2MP HD IR Fixed Dome Network Camera PoE</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">PENDING</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">SKU: -</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-on-surface-variant text-[11px] font-medium">Quantity Verified</span>
                <span className="text-sm font-bold text-on-surface">0 / 1</span>
              </div>
            </div>
            <button className="w-full py-3 bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-800 active:scale-[0.98] transition-all shadow-md shadow-indigo-700/20">
              <Package className="w-5 h-5" />
              Check Goods
            </button>
          </div>

          {/* Item Card 2 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline">
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3 className="font-bold text-sm leading-snug flex-1">RACK, WALLMOUNT, SGL DOOR, WIR7012S-12U</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">PENDING</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">SKU: -</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-on-surface-variant text-[11px] font-medium">Quantity Verified</span>
                <span className="text-sm font-bold text-on-surface">0 / 1</span>
              </div>
            </div>
            <button className="w-full py-3 bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-800 active:scale-[0.98] transition-all shadow-md shadow-indigo-700/20">
              <Package className="w-5 h-5" />
              Check Goods
            </button>
          </div>

          {/* Item Card 3 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline">
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3 className="font-bold text-sm leading-snug flex-1">CABLE, UTP CAT6</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">PENDING</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">SKU: -</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-on-surface-variant text-[11px] font-medium">Quantity Verified</span>
                <span className="text-sm font-bold text-on-surface">0 / 4</span>
              </div>
            </div>
            <button className="w-full py-3 bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-800 active:scale-[0.98] transition-all shadow-md shadow-indigo-700/20">
              <Package className="w-5 h-5" />
              Check Goods
            </button>
          </div>

          {/* Item Card 4 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline">
            <div className="flex justify-between items-start gap-4 mb-3">
              <h3 className="font-bold text-sm leading-snug flex-1">Pipa conduit 20mm clipsal</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">PENDING</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-[11px]">
                <span className="text-on-surface-variant">SKU: -</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-on-surface-variant text-[11px] font-medium">Quantity Verified</span>
                <span className="text-sm font-bold text-on-surface">0 / 350</span>
              </div>
            </div>
            <button className="w-full py-3 bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-800 active:scale-[0.98] transition-all shadow-md shadow-indigo-700/20">
              <Package className="w-5 h-5" />
              Check Goods
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
