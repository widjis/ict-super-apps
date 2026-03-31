import { useEffect, useState } from 'react';
import { Bell, ArrowLeft, MoreVertical } from 'lucide-react';
import { getAuthUserRaw } from '../auth/storage';
import MePhoto from './MePhoto';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  menuItems?: Array<{ label: string; onClick: () => void }>;
}

export default function TopBar({ title = "Good morning, Operator", showBack = false, onBack, menuItems = [] }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  let fallbackText = 'U';
  let alt = 'User profile';
  try {
    const raw = getAuthUserRaw();
    if (raw) {
      const parsed = JSON.parse(raw) as any;
      const displayName = typeof parsed?.displayName === 'string' ? parsed.displayName : null;
      const username = typeof parsed?.username === 'string' ? parsed.username : null;
      const label = (displayName || username || '').trim();
      if (label) {
        fallbackText = label
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('') || 'U';
        alt = label;
      }
    }
  } catch {}

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest('[data-topbar-menu-root="1"]')) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menuOpen]);

  const hasMenu = showBack && menuItems.length > 0;

  return (
    <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 py-safe-top-4 w-full shadow-[0_8px_24px_rgba(42,52,57,0.06)] relative">
      <div className="flex items-center gap-4">
        {showBack ? (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-250">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
        ) : (
          <MePhoto
            fallbackText={fallbackText}
            alt={alt}
            className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-primary-container flex items-center justify-center"
            fallbackClassName="text-primary font-bold text-sm"
          />
        )}
        <h1 className={`font-headline font-bold text-2xl tracking-tight ${showBack ? 'text-primary' : 'text-on-surface'}`}>
          {title}
        </h1>
      </div>
      
      {showBack ? (
        hasMenu ? (
          <div data-topbar-menu-root="1" className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant"
              aria-label="Open menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-44 bg-surface-container-lowest rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-surface-container-high overflow-hidden">
                {menuItems.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => {
                      setMenuOpen(false);
                      it.onClick();
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <MePhoto
            fallbackText={fallbackText}
            alt={alt}
            className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-white shadow-sm flex items-center justify-center"
            fallbackClassName="text-primary font-bold text-sm"
          />
        )
      ) : (
        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant">
          <Bell className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}
