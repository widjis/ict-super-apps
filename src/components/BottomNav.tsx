import { Home, LayoutGrid, Activity, Settings, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'hub', label: 'Hub', icon: LayoutGrid },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'service', label: 'Service', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-safe-3 bg-white/80 backdrop-blur-2xl rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-250 active:scale-90 ${
              isActive
                ? 'px-5 py-2 rounded-full bg-primary/15 text-primary ring-1 ring-primary/25 shadow-sm scale-[1.06]'
                : 'px-4 py-1.5 rounded-2xl text-slate-400 hover:text-primary/70'
            }`}
          >
            <Icon className={`${isActive ? 'w-7 h-7' : 'w-6 h-6'} mb-1`} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`font-label font-semibold uppercase tracking-wider ${isActive ? 'text-[11px]' : 'text-[10px]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
