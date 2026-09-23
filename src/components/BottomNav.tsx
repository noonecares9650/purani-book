import { Home, Plus, Heart, User, Shield } from 'lucide-react';

export type Tab = 'home' | 'sell' | 'wishlist' | 'profile' | 'admin';

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
  isAdmin?: boolean;
};

export default function BottomNav({ active, onChange, isAdmin = false }: Props) {
  const items: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'sell', label: 'Sell', icon: Plus },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    items.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-800 bg-ink-900/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isSell = item.id === 'sell';

          if (isSell) {
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="flex flex-1 flex-col items-center gap-0.5 py-2"
              >
                <div className={`flex h-11 w-11 -translate-y-1 items-center justify-center rounded-full shadow-lg transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-brand/30 scale-110'
                    : 'bg-brand text-white shadow-brand/20'
                }`}>
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-brand' : 'text-ink-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? 'text-brand' : 'text-ink-500'}`}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive && item.id === 'wishlist' ? 'currentColor' : 'none'}
              />
              <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-brand' : 'text-ink-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
