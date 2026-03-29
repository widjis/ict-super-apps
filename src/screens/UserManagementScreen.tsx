import { Search, Info, UserPlus, Unlock, RotateCcw } from 'lucide-react';

interface UserManagementScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function UserManagementScreen({ onNavigate }: UserManagementScreenProps) {
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
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-lowest transition-all duration-250 text-on-surface placeholder:text-outline shadow-sm outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="px-4 py-2 bg-primary text-on-primary rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer">All Users</span>
          <span className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full text-xs font-semibold whitespace-nowrap hover:bg-surface-container-high transition-colors cursor-pointer">Active Only</span>
          <span className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full text-xs font-semibold whitespace-nowrap hover:bg-surface-container-high transition-colors cursor-pointer">Engineering</span>
          <span className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-full text-xs font-semibold whitespace-nowrap hover:bg-surface-container-high transition-colors cursor-pointer">Security</span>
        </div>
      </section>

      {/* User List Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end mb-2">
          <h3 className="font-headline font-bold text-lg text-on-surface">Directory (4)</h3>
          <span className="text-label text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">Sorted by activity</span>
        </div>

        {/* User Card 1 */}
        <div 
          onClick={() => onNavigate?.('user-profile')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high group transition-all cursor-pointer hover:bg-surface-container-lowest/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvuCJHJ_Xct6qTxiOs6W6p7QxbrG0M8J9fGv7YbxYmDj_3bnRUtZhMk0rmDQN68t60-bycZxI7fCAVaDt7PYACTKpmVEXLBOSr8P1VYoLvnk5nSVVZ1guVo7Mg0H0k8NAkfIRjcqjWyJzGJSm0auNj9ZL7rRW28QBNApUvY4OJ1hrzIt2HS36UlBkR6Knbtk3sovwvI-bb_Vlj0GPw6PQqFI-YPAe_KnshX-xEzvs5MahGKBajgf8Y34RIgAN1RJ7e82r3Em3S-jQ" alt="Sarah Jenkins" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_rgba(16,185,129,0.2)] animate-pulse"></div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Sarah Jenkins</h4>
                <p className="text-xs text-on-surface-variant font-medium">Cloud Infrastructure</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Active</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Password
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              Unlock Account
            </button>
          </div>
        </div>

        {/* User Card 2 (Locked/Inactive) */}
        <div 
          onClick={() => onNavigate?.('user-profile')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high group transition-all opacity-90 cursor-pointer hover:bg-surface-container-lowest/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDw0tXbS7tEK85BrRtmiC86_cxFZ1zne1_OKLnYfbFTNRdqonCDIhvOi9BsREz5GpEp4ZDiF-MhOB2LInLGF3WdlM4vbDjkedViPvV0EussB13cOI_Eo-bxjJgutkH5y6ggkiyxcIamUyFhq3TjbHJR8t1c4Yfl_MS12fX8p8s8VLGglC5aJZeZlw98JdWHgdIwqjx407lE6qx8V2J-T1lJhowd7BVYjzxrI_K21BZP7ZSlqD0sx77dTiZOVzJwmm1e4pHCqv9_6Gk" alt="Marcus Thorne" className="w-12 h-12 rounded-xl object-cover shadow-sm grayscale-[50%]" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-white"></div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Marcus Thorne</h4>
                <p className="text-xs text-on-surface-variant font-medium">Cybersecurity Lead</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight">Locked</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Password
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Unlock className="w-4 h-4" />
              Unlock Account
            </button>
          </div>
        </div>

        {/* User Card 3 */}
        <div 
          onClick={() => onNavigate?.('user-profile')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high group transition-all cursor-pointer hover:bg-surface-container-lowest/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuANUsMwIRLw9iemErsCBCgTZArIV98dhVxogl0cJqiMdwOQ6QdSiZwqP90BFBlSzbM5vosThfEXAAVSg0grRi8YUun6hC3IlDzyJAiTaYXxB8tA5w6hAwZYAtvkO6hWlir_XPmOt4VHLCAB_ZlFfkLoeUC9AxtFWTyX250eOcqt3NwfDPO_wwUODgsejbB-k6jUkE8CULmQ1cX8JranzGa5VGVdMBSecwv97rpw8-8LoWLsJ23naDaPbto426ue7D2bxr21BuW90_0" alt="Elena Rodriguez" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_rgba(16,185,129,0.2)] animate-pulse"></div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Elena Rodriguez</h4>
                <p className="text-xs text-on-surface-variant font-medium">Network Architecture</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Active</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Password
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              Unlock Account
            </button>
          </div>
        </div>

        {/* User Card 4 */}
        <div 
          onClick={() => onNavigate?.('user-profile')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(42,52,57,0.04)] border border-surface-container-high group transition-all cursor-pointer hover:bg-surface-container-lowest/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">DK</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_0_2px_rgba(16,185,129,0.2)] animate-pulse"></div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">David Kim</h4>
                <p className="text-xs text-on-surface-variant font-medium">Junior SysOps</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Active</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Password
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface px-3 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              Unlock Account
            </button>
          </div>
        </div>
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
