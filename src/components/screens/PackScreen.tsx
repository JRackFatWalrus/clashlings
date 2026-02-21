'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PackOpener from '@/components/cards/PackOpener';
import { useCollectionStore } from '@/stores/collection-store';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/types';

export default function PackScreen() {
  const [opening, setOpening] = useState(false);
  const { addCards, incrementPacksOpened, packsOpened, pushCardsToDB } = useCollectionStore();
  const { user } = useAuth();

  const handlePackDone = (cards: Card[]) => {
    addCards(cards);
    incrementPacksOpened();
    if (user) pushCardsToDB(user.id, cards);
    setOpening(false);
  };

  if (opening) {
    return <PackOpener onDone={handlePackDone} />;
  }

  return (
    <div className="cc-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Ambient particles */}
      <div className="cc-particles">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="cc-particle"
            style={{
              left: `${20 + i * 20}%`,
              width: 3,
              height: 3,
              animationDuration: `${14 + i * 3}s`,
              animationDelay: `${i * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        className="relative z-10 text-center mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="cc-heading text-3xl sm:text-4xl">Pack Shop</h1>
        <p className="cc-subtext mt-1">Open packs to discover new creatures!</p>
      </motion.div>

      {/* Booster pack */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
      >
        <motion.button
          onClick={() => setOpening(true)}
          className="relative w-44 h-60 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 group cc-shimmer cc-elevation"
          style={{
            background: 'linear-gradient(135deg, var(--cc-magic), #7c3aed)',
            border: '3px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 0 #6d28d9, 0 6px 16px rgba(124,58,237,0.4), inset 0 2px 0 rgba(255,255,255,0.25)',
          }}
          whileHover={{ scale: 1.05, y: -6 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-5xl relative z-10">🎁</span>
          <span className="text-lg font-black text-white relative z-10">
            Booster Pack
          </span>
          <span className="text-xs text-white/60 font-semibold relative z-10">15 cards inside</span>

          <span
            className="absolute -bottom-0.5 px-5 py-1.5 rounded-full text-xs font-black text-white shadow-lg z-10"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
            }}
          >
            FREE
          </span>
        </motion.button>

        {packsOpened > 0 && (
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--cc-text-muted)' }}>
            {packsOpened} pack{packsOpened !== 1 ? 's' : ''} opened
          </p>
        )}
      </motion.div>
    </div>
  );
}
