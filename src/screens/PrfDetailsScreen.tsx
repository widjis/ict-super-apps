import { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Search, SlidersHorizontal, Briefcase, CloudUpload, RefreshCw, FileText, Download, Eye, MessageSquare, Hourglass, CheckCircle, Settings, FileUp, User } from 'lucide-react';

interface PrfDetailsScreenProps {
  onBack: () => void;
}

export default function PrfDetailsScreen({ onBack }: PrfDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'documents' | 'activity'>('items');

  return (
    <div className="bg-[#F8FAFC] font-body min-h-screen pb-20">
      {/* Header Section with Gradient */}
      <header className="bg-gradient-to-br from-[#4426A8] to-[#2A1A78] pt-8 pb-10 px-6 text-white rounded-b-[40px] relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Top Controls */}
          <div className="flex justify-between items-center mb-10">
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
              <h1 className="text-3xl font-extrabold font-headline mb-2">PRF #43373</h1>
              <p className="text-white/70 text-sm leading-relaxed max-w-lg">
                Submitted 2026-03-26T00:00:00.000Z by Adriana User
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 text-center">
                <span className="text-[10px] font-bold block leading-tight">REQ. APPROVAL</span>
                <span className="text-[10px] font-bold block leading-tight">REQD</span>
              </div>
              <div className="bg-[#F59E0B] px-4 py-2 rounded-lg text-center shadow-lg">
                <span className="text-[10px] font-black block leading-tight text-white">PRIORITY:</span>
                <span className="text-[10px] font-black block leading-tight text-white uppercase">Medium</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-12 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1">
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
        {/* Main Info Card */}
        <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] mb-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Department</span>
              <p className="text-slate-800 font-bold text-base">HR / ICT</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Submit By</span>
              <p className="text-slate-800 font-bold text-base">Adriana Riska Rante [MTI]</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cost Code</span>
              <p className="text-slate-800 font-bold text-base font-mono">MTIRMRAD426249</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Budget Year</span>
              <p className="text-slate-800 font-bold text-base">2026</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-[#3E26A8]">Requested Amount</span>
              <p className="text-[#3E26A8] font-extrabold text-xl">Rp 38.200.000</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Approved Amount</span>
              <p className="text-slate-800 font-bold text-xl">Rp 0</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Required For</span>
              <p className="text-slate-800 font-bold text-base">For Messhall Kitchen Makari Camp - For SS Team</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Summary</span>
              <p className="text-slate-500 text-sm leading-relaxed">
                This project involves the procurement of various IT and infrastructure equipment for the HR and ICT departments.
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
                />
              </div>
              <button className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-slate-600 hover:text-[#3E26A8] transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {/* Item Card 1 */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">Uniview 2MP HD IR Fixed Dome Network Camera PoE</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">Pending</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-32">SKU:</span>
                    <span className="text-slate-800 font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Quantity Verified</span>
                    <span className="text-slate-800 font-bold">0 / 1</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#3E26A8] h-full w-0"></div>
                  </div>
                </div>
                <button className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20">
                  <Briefcase className="w-5 h-5" />
                  Check Goods
                </button>
              </div>

              {/* Item Card 2 */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">RACK, WALLMOUNT, SGL DOOR, WIR7012S-12U</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">Pending</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-32">SKU:</span>
                    <span className="text-slate-800 font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Quantity Verified</span>
                    <span className="text-slate-800 font-bold">0 / 1</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#3E26A8] h-full w-0"></div>
                  </div>
                </div>
                <button className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20">
                  <Briefcase className="w-5 h-5" />
                  Check Goods
                </button>
              </div>

              {/* Item Card 3 */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">CABLE, UTP CAT6</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">Pending</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-32">SKU:</span>
                    <span className="text-slate-800 font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Quantity Verified</span>
                    <span className="text-slate-800 font-bold">0 / 4</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#3E26A8] h-full w-0"></div>
                  </div>
                </div>
                <button className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20">
                  <Briefcase className="w-5 h-5" />
                  Check Goods
                </button>
              </div>

              {/* Item Card 4 */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">Pipa conduit 20mm clipsal</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">Pending</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-32">SKU:</span>
                    <span className="text-slate-800 font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Quantity Verified</span>
                    <span className="text-slate-800 font-bold">0 / 350</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#3E26A8] h-full w-0"></div>
                  </div>
                </div>
                <button className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20">
                  <Briefcase className="w-5 h-5" />
                  Check Goods
                </button>
              </div>

              {/* Item Card 5 */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex-1 mr-4">Sambungan pipa COUPLING, PIPE, CONDT, SKT, 20MM</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">Pending</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-slate-400 w-32">SKU:</span>
                    <span className="text-slate-800 font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Quantity Verified</span>
                    <span className="text-slate-800 font-bold">0 / 4</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-[#3E26A8] h-full w-0"></div>
                  </div>
                </div>
                <button className="w-full bg-[#3E26A8] py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3E26A8]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#3E26A8]/20">
                  <Briefcase className="w-5 h-5" />
                  Check Goods
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center text-center group hover:border-[#3E26A8] transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-[#3E26A8]/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#3E26A8]/10 transition-colors">
                <CloudUpload className="text-[#3E26A8] w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Upload new documents</h3>
              <p className="text-slate-500 text-sm">Drag and drop files here or click to browse</p>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="font-bold text-slate-800">Attached Documents (3)</h3>
                <button className="text-[#3E26A8] text-sm font-bold flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Document Card 1 */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="text-red-500 w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-base truncate">Quotation_Vendor_A.pdf</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-slate-400 text-xs font-medium">1.2 MB</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-400 text-xs font-medium">Mar 27, 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Card 2 */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="text-blue-500 w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-base truncate">Technical_Specs.docx</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-slate-400 text-xs font-medium">456 KB</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-400 text-xs font-medium">Mar 27, 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Card 3 */}
              <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                  <FileText className="text-green-500 w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-base truncate">Budget_Approval.pdf</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-slate-400 text-xs font-medium">890 KB</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-slate-400 text-xs font-medium">Mar 26, 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-[#3E26A8] hover:text-white transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <h3 className="text-xl font-bold text-slate-800 mb-8 font-headline">Recent Activity</h3>
            <div className="space-y-0">
              {/* Activity 4: Comment Added */}
              <div className="relative flex gap-6 pb-10 before:absolute before:left-[23px] before:top-10 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden last:pb-2">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-[#3E26A8]/10 flex items-center justify-center border-4 border-white">
                  <MessageSquare className="text-[#3E26A8] w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                    <h4 className="font-bold text-slate-800">Comment added</h4>
                    <span className="text-xs text-slate-400 font-medium">Mar 26, 2026 • 03:45 PM</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full bg-slate-300 overflow-hidden">
                        <div className="w-full h-full bg-[#3E26A8] flex items-center justify-center text-[10px] text-white font-bold">SV</div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Supervisor</span>
                    </div>
                    <p className="text-sm text-slate-600 italic">"Please verify the quantities for the cable conduit."</p>
                  </div>
                </div>
              </div>

              {/* Activity 3: Status Update */}
              <div className="relative flex gap-6 pb-10 before:absolute before:left-[23px] before:top-10 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden last:pb-2">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center border-4 border-white">
                  <Hourglass className="text-amber-600 w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-slate-800">Status Update</h4>
                    <span className="text-xs text-slate-400 font-medium">Mar 26, 2026 • 02:15 PM</span>
                  </div>
                  <p className="text-sm text-slate-500">PRF status changed to <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase ml-1">Awaiting Finance Approval</span></p>
                </div>
              </div>

              {/* Activity 2: Technical Review */}
              <div className="relative flex gap-6 pb-10 before:absolute before:left-[23px] before:top-10 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden last:pb-2">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-4 border-white">
                  <CheckCircle className="text-green-600 w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-slate-800">Technical Review Completed</h4>
                    <span className="text-xs text-slate-400 font-medium">Mar 26, 2026 • 01:30 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <Settings className="text-slate-500 w-3 h-3" />
                    </div>
                    <p className="text-sm text-slate-500">Processed by <span className="font-semibold text-slate-700">System</span></p>
                  </div>
                </div>
              </div>

              {/* Activity 1: PRF Submitted */}
              <div className="relative flex gap-6 pb-10 before:absolute before:left-[23px] before:top-10 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden last:pb-2">
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-[#3E26A8]/10 flex items-center justify-center border-4 border-white">
                  <FileUp className="text-[#3E26A8] w-5 h-5" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-slate-800">PRF Submitted</h4>
                    <span className="text-xs text-slate-400 font-medium">Mar 26, 2026 • 09:00 AM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="text-indigo-600 w-3 h-3" />
                    </div>
                    <p className="text-sm text-slate-500">Submitted by <span className="font-semibold text-slate-700">Adriana User</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
