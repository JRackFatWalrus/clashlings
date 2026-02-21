'use client';

import { motion } from 'framer-motion';
import { GameScreen } from '@/types';
import { useAuth } from '@/components/AuthProvider';

interface NavBarProps {
  current: GameScreen;
  onNavigate: (screen: GameScreen) => void;
  showBack?: boolean;
  onBack?: () => void;
}

const NAV_ITEMS: { screen: GameScreen; icon: string; label: string; color: string }[] = [
  { screen: 'home', icon: '🏠', label: 'Home', color: '#3b82f6' },
  { screen: 'shop', icon: '🛒', label: 'Shop', color: '#a855f7' },
  { screen: 'collection', icon: '📚', label: 'Collection', color: '#22c55e' },
];

export default function NavBar({ current, onNavigate, showBack, onBack }: NavBarProps) {
  const { user } = useAuth();

  const initial = user?.user_metadata?.display_name?.[0]
    ?? user?.email?.[0]
    ?? '?';

  const isParentZone = current === 'parent-zone';

  return (
    <nav
      className="flex items-center justify-between px-3 py-2 relative z-30 shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0e1f3d 0%, #132a50 100%)',
        borderBottom: '2px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="w-20">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="cc-btn-secondary text-xs px-3 py-1.5"
          >
            &larr; Back
          </button>
        ) : (
          <span className="text-sm font-black text-white/70 tracking-tight">CC</span>
        )}
      </div>

      <div className="flex gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = current === item.screen;
          return (
            <motion.button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className="flex flex-col items-center rounded-xl transition-all"
              style={{
                padding: '6px 14px',
                background: isActive ? `${item.color}22` : 'transparent',
                border: isActive ? `2px solid ${item.color}55` : '2px solid transparent',
              }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: isActive ? 1.05 : 1 }}
            >
              <span className="text-xl leading-none mb-0.5">{item.icon}</span>
              <span
                className="text-[11px] font-black uppercase tracking-wide"
                style={{ color: isActive ? item.color : 'rgba(255,255,255,0.4)' }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="w-6 h-[3px] rounded-full mt-1"
                  style={{ background: item.color }}
                  layoutId="nav-indicator"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="w-20 flex justify-end">
        <motion.button
          onClick={() => onNavigate('parent-zone')}
          className="flex items-center justify-center w-9 h-9 rounded-full font-black text-sm uppercase"
          style={{
            background: isParentZone
              ? 'linear-gradient(135deg, #3b82f6, #a855f7)'
              : 'rgba(255,255,255,0.1)',
            color: isParentZone ? '#fff' : 'rgba(255,255,255,0.5)',
            border: isParentZone
              ? '2px solid rgba(59,130,246,0.6)'
              : '2px solid rgba(255,255,255,0.08)',
            boxShadow: isParentZone
              ? '0 0 12px rgba(59,130,246,0.3)'
              : 'none',
          }}
          whileTap={{ scale: 0.9 }}
        >
          {initial.toUpperCase()}
        </motion.button>
      </div>
    </nav>
  );
}
