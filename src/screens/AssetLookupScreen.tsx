import { useMemo, useState } from 'react';
import { Bell, ChevronDown, Laptop, Monitor, MoreVertical, PackageSearch, Plus, Search, Server, Smartphone, Undo2 } from 'lucide-react';
import MePhoto from '../components/MePhoto';

type AssetStatus = 'Deployed' | 'Ready' | 'Archived' | 'Pending';
type AssetCategory = 'Laptops' | 'Mobile' | 'Infrastructure' | 'Peripherals';
type IconNode = JSX.Element;

type Asset = {
  name: string;
  tag: string;
  status: AssetStatus;
  serial: string;
  assignedTo?: { initials: string; name: string; tone: 'secondary' | 'tertiary' };
  category: AssetCategory;
};

interface AssetLookupScreenProps {
  onBack: () => void;
}

export default function AssetLookupScreen({ onBack }: AssetLookupScreenProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AssetStatus>('Deployed');
  const [category, setCategory] = useState<AssetCategory>('Laptops');

  const assets = useMemo<Asset[]>(() => {
    return [
      {
        name: 'MacBook Pro 16" M2',
        tag: 'AST-2024-001',
        status: 'Deployed',
        serial: 'C02FX123P0W1',
        assignedTo: { initials: 'JD', name: 'Jane Doe', tone: 'secondary' },
        category: 'Laptops',
      },
      {
        name: 'Dell XPS 15 9530',
        tag: 'AST-2024-054',
        status: 'Ready',
        serial: '8VH7G22L9X',
        category: 'Laptops',
      },
      {
        name: 'MacBook Air M1',
        tag: 'AST-2023-912',
        status: 'Deployed',
        serial: 'FVFFG876Q05N',
        assignedTo: { initials: 'MS', name: 'Marcus Smith', tone: 'tertiary' },
        category: 'Laptops',
      },
      {
        name: 'Lenovo ThinkPad T14',
        tag: 'AST-2024-088',
        status: 'Pending',
        serial: 'PF4TQ11K2W',
        category: 'Laptops',
      },
    ];
  }, []);

  const categoryCounts = useMemo(() => {
    const base: Record<AssetCategory, number> = {
      Laptops: 124,
      Mobile: 82,
      Infrastructure: 45,
      Peripherals: 312,
    };
    return base;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (a.category !== category) return false;
      if (a.status !== status) return false;
      if (!q) return true;
      const hay = `${a.name} ${a.tag} ${a.serial} ${a.assignedTo?.name ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assets, category, query, status]);

  const categories: Array<{ label: AssetCategory; icon: IconNode; count?: number }> = [
    { label: 'Laptops', icon: <Laptop className="w-5 h-5" />, count: categoryCounts.Laptops },
    { label: 'Mobile', icon: <Smartphone className="w-5 h-5" />, count: categoryCounts.Mobile },
    { label: 'Infrastructure', icon: <Server className="w-5 h-5" />, count: categoryCounts.Infrastructure },
    { label: 'Peripherals', icon: <Monitor className="w-5 h-5" />, count: categoryCounts.Peripherals },
  ];

  const getStatusBadge = (s: AssetStatus) => {
    if (s === 'Deployed') return 'bg-tertiary-container/30 text-tertiary';
    if (s === 'Ready') return 'bg-primary-container/30 text-primary';
    if (s === 'Archived') return 'bg-surface-container-high text-on-surface-variant';
    return 'bg-surface-container-highest text-on-surface-variant';
  };

  const getAvatarTone = (tone: 'secondary' | 'tertiary') => {
    if (tone === 'tertiary') return 'bg-tertiary-fixed text-on-tertiary-fixed';
    return 'bg-secondary-fixed text-on-secondary-fixed';
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <header className="bg-surface flex justify-between items-center w-full px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
            aria-label="Back"
          >
            <Undo2 className="w-6 h-6 text-primary" />
          </button>
          <div className="flex items-center gap-3">
            <PackageSearch className="w-6 h-6 text-primary" />
            <h1 className="font-headline font-bold text-on-surface text-lg tracking-tight">Assets &amp; Compliance</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>
          <MePhoto
            fallbackText="U"
            alt="User profile"
            className="w-10 h-10 rounded-full overflow-hidden bg-secondary-container flex items-center justify-center ring-2 ring-white shadow-sm"
            fallbackClassName="text-on-secondary-container font-bold text-sm"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32 pt-8">
        <section className="mb-10">
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-outline" />
            </div>
            <input
              className="w-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/40 rounded-2xl py-4 pl-14 pr-28 text-on-surface placeholder:text-on-surface-variant transition-all duration-250 outline-none"
              placeholder="Search by Keyword, Serial, or Asset Tag..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <button
                className="bg-primary text-on-primary px-6 h-full rounded-xl font-bold tracking-tight hover:bg-primary-dim transition-colors shadow-lg shadow-primary/20"
                onClick={() => undefined}
              >
                Lookup
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {(['Deployed', 'Ready', 'Archived', 'Pending'] as AssetStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full transition-transform active:scale-95 ${
                  status === s
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container transition-colors font-medium'
                }`}
              >
                <PackageSearch className="w-[18px] h-[18px]" />
                {s === 'Ready' ? 'Ready to Deploy' : s}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-surface-container-low p-6 rounded-3xl">
              <h3 className="font-headline font-bold text-on-surface mb-6 text-sm tracking-widest uppercase">Asset Categories</h3>
              <nav className="space-y-2">
                {categories.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => setCategory(c.label)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      category === c.label
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-highest group'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={category === c.label ? 'text-primary' : 'text-on-surface-variant'}>{c.icon}</span>
                      <span>{c.label}</span>
                    </div>
                    {category === c.label ? (
                      <span className="text-xs bg-primary/10 px-2 py-1 rounded-md">{c.count}</span>
                    ) : (
                      <span className="text-xs text-outline group-hover:text-on-surface">{c.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-surface-container-low p-6 rounded-3xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center mb-3">
                <PackageSearch className="w-6 h-6 text-outline-variant" />
              </div>
              <p className="text-xs font-medium text-on-surface-variant">No recent lookups found. Try searching for a serial number.</p>
            </div>
          </aside>

          <section className="lg:col-span-9">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Search Results</h2>
                <p className="text-on-surface-variant font-body">
                  Showing {filtered.length} results for &quot;{category}&quot;
                </p>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer hover:underline">
                <span>Sort by: Newest</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((a) => (
                <div
                  key={a.tag}
                  className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusBadge(a.status)}`}>
                      {a.status}
                    </div>
                    <button className="text-outline-variant hover:text-primary" aria-label="More">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{a.name}</h3>
                  <p className="text-on-surface-variant font-body text-sm mb-4">{a.tag}</p>
                  <div className="space-y-3 pt-4 border-t border-surface-container">
                    <div className="flex justify-between text-xs">
                      <span className="text-outline">Serial Number</span>
                      <span className="text-on-surface font-mono font-medium">{a.serial}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-outline">Assigned To</span>
                      {a.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarTone(
                              a.assignedTo.tone
                            )}`}
                          >
                            {a.assignedTo.initials}
                          </div>
                          <span className="text-on-surface font-medium">{a.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-outline-variant italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-surface-container-highest rounded-full"></div>
                <div className="h-4 w-32 bg-surface-container-highest rounded-full"></div>
                <div className="h-3 w-48 bg-surface-container-highest rounded-full"></div>
              </div>
            </div>

            {filtered.length === 0 && (
              <div className="mt-12 flex flex-col items-center justify-center py-20 px-6 bg-surface-container-low rounded-[2.5rem]">
                <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-outline-variant" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">No Assets Found</h3>
                <p className="text-on-surface-variant max-w-md text-center mb-8">
                  We couldn't find any matches for that serial or tag. Try adjusting your filters or check the spelling.
                </p>
                <button
                  className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all"
                  onClick={() => setQuery('')}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <button className="fixed right-6 bottom-28 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(42,52,57,0.15)] hover:scale-105 active:scale-95 transition-all z-40">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
