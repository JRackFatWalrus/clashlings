'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_CREATURES, SHAPE_CARDS, ITEM_CARDS } from '@/lib/card-data';
import { useCollectionStore } from '@/stores/collection-store';
import { Card, FACTION_CONFIG, Ability, CreatureCard } from '@/types';
import GameCard from '@/components/cards/GameCard';

const ABILITY_SECTIONS: { label: string; emoji: string; ability: Ability; color: string }[] = [
  { label: 'Guard Creatures', emoji: '🛡️', ability: 'guard', color: '#22c55e' },
  { label: 'Flying Creatures', emoji: '🪽', ability: 'fly', color: '#a855f7' },
  { label: 'Big Creatures', emoji: '🦶', ability: 'big', color: '#ef4444' },
  { label: 'Fast Creatures', emoji: '⚡', ability: 'fast', color: '#f59e0b' },
];

function rarityGlowClass(rarity: string): string {
  switch (rarity) {
    case 'rare': return 'rarity-sheen-rare';
    case 'mythic': return 'rarity-sheen-mythic';
    case 'uncommon': return 'rarity-sheen-uncommon';
    default: return '';
  }
}

export default function CollectionScreen() {
  const { collection } = useCollectionStore();
  const total = ALL_CREATURES.length + SHAPE_CARDS.length + ITEM_CARDS.length;
  const ownedIds = new Set(collection.map((c) => c.cardId));
  const ownedCount = collection.length;
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  return (
    <div className="px-4 py-4 relative" style={{
      minHeight: '100vh',
      background:
        'radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.18) 0%, transparent 55%),' +
        'radial-gradient(ellipse at 50% 90%, rgba(20,184,166,0.1) 0%, transparent 50%),' +
        'linear-gradient(180deg, #0e1f3d 0%, #132a50 50%, #0e1f3d 100%)',
    }}>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="cc-heading text-3xl sm:text-4xl">Your Collection</h1>
          <p className="cc-subtext mt-1">
            {ownedCount} / {total} unique cards collected
          </p>
          {/* Progress bar */}
          <div className="w-48 mx-auto mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--cc-primary)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((ownedCount / total) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Ability sections */}
        {ABILITY_SECTIONS.map((section) => {
          const creatures = ALL_CREATURES.filter((c) => c.ability === section.ability);
          if (creatures.length === 0) return null;
          return (
            <div key={section.ability} className="mb-6">
              <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <span
                  className="w-1 h-5 rounded-full"
                  style={{ background: section.color }}
                />
                <span>{section.emoji}</span>
                <span>{section.label}</span>
                <span className="text-xs font-bold ml-auto" style={{ color: 'var(--cc-text-muted)' }}>
                  {creatures.filter((c) => ownedIds.has(c.id)).length}/{creatures.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {creatures.map((card, i) => {
                  const owned = ownedIds.has(card.id);
                  const qty = collection.find((c) => c.cardId === card.id)?.quantity || 0;
                  return (
                    <motion.div
                      key={card.id}
                      className={`relative ${rarityGlowClass((card as CreatureCard).rarity)} ${!owned ? 'opacity-25 grayscale' : ''}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.015 }}
                      whileHover={owned ? { scale: 1.08, y: -4 } : {}}
                      onMouseEnter={() => owned && setInspectedCard(card)}
                      onMouseLeave={() => setInspectedCard(null)}
                    >
                      <GameCard card={card} scale="sm" />
                      {owned && qty > 1 && (
                        <span className="absolute -top-2 -right-2 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: 'var(--cc-primary)', color: '#fff' }}
                        >
                          x{qty}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Diamond wild creatures */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{ background: '#06b6d4' }} />
            <span>{FACTION_CONFIG.diamond.icon}</span>
            <span>Wild Creatures</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CREATURES.filter((c) => c.shape === 'diamond').map((card, i) => {
              const owned = ownedIds.has(card.id);
              const qty = collection.find((c) => c.cardId === card.id)?.quantity || 0;
              return (
                <motion.div
                  key={card.id}
                  className={`relative ${!owned ? 'opacity-25 grayscale' : ''}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.015 }}
                  whileHover={owned ? { scale: 1.08, y: -4 } : {}}
                  onMouseEnter={() => owned && setInspectedCard(card)}
                  onMouseLeave={() => setInspectedCard(null)}
                >
                  <GameCard card={card} scale="sm" />
                  {owned && qty > 1 && (
                    <span className="absolute -top-2 -right-2 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                      style={{ background: 'var(--cc-primary)', color: '#fff' }}
                    >
                      x{qty}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Item cards */}
        {ITEM_CARDS.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full" style={{ background: 'var(--cc-magic)' }} />
              <span>✨</span>
              <span>Item Cards</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ITEM_CARDS.map((card) => {
                const owned = ownedIds.has(card.id);
                const qty = collection.find((c) => c.cardId === card.id)?.quantity || 0;
                return (
                  <motion.div
                    key={card.id}
                    className={`relative ${!owned ? 'opacity-25 grayscale' : ''}`}
                    whileHover={owned ? { scale: 1.08, y: -4 } : {}}
                    onMouseEnter={() => owned && setInspectedCard(card)}
                    onMouseLeave={() => setInspectedCard(null)}
                  >
                    <GameCard card={card} scale="sm" />
                    {owned && qty > 1 && (
                      <span className="absolute -top-2 -right-2 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        style={{ background: 'var(--cc-primary)', color: '#fff' }}
                      >
                        x{qty}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shape cards */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span>Shape Cards</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {SHAPE_CARDS.map((card) => (
              <motion.div
                key={card.id}
                className={!ownedIds.has(card.id) ? 'opacity-25 grayscale' : ''}
                whileHover={ownedIds.has(card.id) ? { scale: 1.08, y: -4 } : {}}
                onMouseEnter={() => ownedIds.has(card.id) && setInspectedCard(card)}
                onMouseLeave={() => setInspectedCard(null)}
              >
                <GameCard card={card} scale="sm" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating inspect panel */}
      <AnimatePresence>
        {inspectedCard && (
          <motion.div
            className="fixed right-4 top-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, x: 40, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: 40, y: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div
              className="rounded-2xl p-1"
              style={{
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 0 60px rgba(59,130,246,0.15), 0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <GameCard card={inspectedCard} scale="xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
