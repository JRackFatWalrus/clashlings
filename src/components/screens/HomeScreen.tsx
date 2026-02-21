'use client';

import { motion } from 'framer-motion';
import { useCollectionStore } from '@/stores/collection-store';

interface HomeScreenProps {
  onPlay: () => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const LOGO_CREATURE = `${SUPABASE_URL}/storage/v1/object/public/card-art/set1/decks/wild-pack.png`;

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  const { gamesPlayed, gamesWon, packsOpened, selectedDeckId } = useCollectionStore();

  return (
    <div className="cc-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Ambient particles */}
      <div className="cc-particles">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="cc-particle"
            style={{
              left: `${15 + i * 17}%`,
              width: 3,
              height: 3,
              animationDuration: `${12 + i * 4}s`,
              animationDelay: `${i * 2.5}s`,
            }}
          />
        ))}
      </div>

      {/* Logo area */}
      <motion.div
        className="relative z-10 flex flex-col items-center mb-8"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
      >
        <div
          className="absolute w-36 h-36 rounded-full -top-2 opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--cc-primary), transparent)' }}
        />

        <motion.img
          src={LOGO_CREATURE}
          alt="Creature Clash"
          className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl relative z-10"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        <h1 className="cc-heading text-4xl sm:text-5xl mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-400 to-teal-400">
          Creature Clash
        </h1>
        <p className="cc-subtext text-xs mt-1 tracking-wide">
          Your First Strategy Card Game
        </p>
      </motion.div>

      {/* Play button */}
      <motion.button
        onClick={onPlay}
        className="cc-btn-primary relative z-10 w-full max-w-xs py-4 rounded-2xl text-2xl overflow-hidden cc-shimmer"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 150 }}
      >
        <span className="relative z-10">Play!</span>
        {selectedDeckId && (
          <span className="block text-[10px] font-bold opacity-60 uppercase tracking-wider mt-0.5 relative z-10">
            {selectedDeckId.replace(/-/g, ' ')}
          </span>
        )}
      </motion.button>

      {/* Stats */}
      {gamesPlayed > 0 && (
        <motion.div
          className="relative z-10 mt-6 flex gap-4 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--cc-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span>{gamesPlayed} games</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{gamesWon} wins</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span>{packsOpened} packs</span>
        </motion.div>
      )}
    </div>
  );
}
