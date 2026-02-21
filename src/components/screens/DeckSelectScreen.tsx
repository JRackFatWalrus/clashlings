'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_STARTER_DECKS } from '@/lib/deck-data';
import { getCardById } from '@/lib/card-data';
import { useCollectionStore } from '@/stores/collection-store';
import { DeckDefinition, CreatureCard, Card } from '@/types';
import GameCard from '@/components/cards/GameCard';

interface DeckSelectScreenProps {
  onSelect: (deck: DeckDefinition) => void;
  onBuildDeck?: () => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

function deckBoxUrl(deckId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/card-art/set1/decks/${deckId}.png`;
}

// ── Per-deck retail metadata ────────────────────────────────────

interface BoxMeta {
  tagline: string;
  gradient: string;
  glow: string;
  abilityIcon: string;
  borderAccent: string;
  recommended?: boolean;
}

const BOX_META: Record<string, BoxMeta> = {
  'sky-pack': {
    tagline: 'Rule the skies. Strike from where no one can reach.',
    gradient: 'from-violet-700 via-purple-800 to-indigo-950',
    glow: 'rgba(139, 92, 246, 0.5)',
    abilityIcon: '🪽',
    borderAccent: '#9333ea',
  },
  'stomp-pack': {
    tagline: 'Crash through defenders and smash hearts.',
    gradient: 'from-red-700 via-rose-800 to-red-950',
    glow: 'rgba(239, 68, 68, 0.5)',
    abilityIcon: '🦶',
    borderAccent: '#dc2626',
  },
  'dash-pack': {
    tagline: 'Hit first, hit fast, never look back.',
    gradient: 'from-amber-600 via-orange-700 to-red-900',
    glow: 'rgba(245, 158, 11, 0.5)',
    abilityIcon: '⚡',
    borderAccent: '#d97706',
  },
  'shield-pack': {
    tagline: 'Build an unbreakable wall. Nothing gets through.',
    gradient: 'from-emerald-600 via-green-700 to-teal-950',
    glow: 'rgba(16, 185, 129, 0.5)',
    abilityIcon: '🛡️',
    borderAccent: '#059669',
    recommended: true,
  },
  'wild-pack': {
    tagline: 'Every trick in the book. Unpredictable power.',
    gradient: 'from-blue-600 via-cyan-700 to-sky-950',
    glow: 'rgba(6, 182, 212, 0.45)',
    abilityIcon: '💎',
    borderAccent: '#0891b2',
  },
};

// ── Compute "Includes" stats from card IDs ──────────────────────

function getDeckIncludes(deck: DeckDefinition) {
  let creatures = 0;
  let shapes = 0;
  let items = 0;
  let rares = 0;

  for (const id of deck.cardIds) {
    const card = getCardById(id);
    if (!card) continue;
    if (card.type === 'creature') {
      creatures++;
      const c = card as CreatureCard;
      if (c.rarity === 'rare' || c.rarity === 'mythic') rares++;
    } else if (card.type === 'shape') {
      shapes++;
    } else if (card.type === 'item') {
      items++;
    }
  }

  return { creatures, shapes, items, rares, total: deck.cardIds.length };
}

function getPreviewCreatures(deck: DeckDefinition): Card[] {
  const seen = new Set<string>();
  const result: Card[] = [];
  for (const id of deck.cardIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const card = getCardById(id);
    if (card && card.type === 'creature') {
      result.push(card);
      if (result.length >= 3) break;
    }
  }
  return result;
}

// ── Main component ──────────────────────────────────────────────

type RevealPhase = 'browsing' | 'opening' | 'revealed';

export default function DeckSelectScreen({ onSelect, onBuildDeck }: DeckSelectScreenProps) {
  const { selectedDeckId, setSelectedDeck, customDecks } = useCollectionStore();
  const [openingDeck, setOpeningDeck] = useState<DeckDefinition | null>(null);
  const [phase, setPhase] = useState<RevealPhase>('browsing');
  const [imgErrors, setImgErrors] = useState<Set<string>>(() => new Set());

  const handleBoxClick = useCallback((deck: DeckDefinition) => {
    setSelectedDeck(deck.id);
    setOpeningDeck(deck);
    setPhase('opening');
  }, [setSelectedDeck]);

  useEffect(() => {
    if (phase === 'opening') {
      const t = setTimeout(() => setPhase('revealed'), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleConfirm = useCallback(() => {
    if (openingDeck) {
      onSelect(openingDeck);
    }
  }, [openingDeck, onSelect]);

  const handleDismiss = useCallback(() => {
    setOpeningDeck(null);
    setPhase('browsing');
  }, []);

  const previewCards = useMemo(
    () => (openingDeck ? getPreviewCreatures(openingDeck) : []),
    [openingDeck],
  );

  return (
    <div className="cc-screen flex flex-col items-center px-4 py-4">
      <div className="relative z-10 mb-4 text-center">
        <motion.h1
          className="text-3xl sm:text-4xl font-black text-white tracking-tight"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
        >
          Choose Your Starter Deck
        </motion.h1>
        <motion.p
          className="text-white/35 text-sm mt-2 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Each box contains 36 cards. Pick your play style.
        </motion.p>
      </div>

      {/* ── Starter Deck Grid: 2 per row, compact product boxes ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl w-full px-6 mb-6 relative z-10">
        {ALL_STARTER_DECKS.map((deck, i) => {
          const meta = BOX_META[deck.id];
          if (!meta) return null;
          const includes = getDeckIncludes(deck);
          const hasImage = !imgErrors.has(deck.id);

          return (
            <motion.button
              key={deck.id}
              onClick={() => handleBoxClick(deck)}
              className="relative text-left group"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 180, damping: 18 }}
              whileHover={{ scale: 1.04, y: -8, rotateY: 2, rotateX: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
            >
              {/* Hover glow */}
              <div
                className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{ background: meta.glow }}
              />

              {/* Box body */}
              <div
                className={`relative rounded-2xl overflow-hidden deck-box-shadow deck-box-shimmer border-2 transition-all duration-300 ${
                  selectedDeckId === deck.id
                    ? 'border-blue-400'
                    : 'border-white/8 group-hover:border-white/20'
                }`}
              >
                {/* STARTER DECK badge */}
                <div className="absolute top-3 left-3 z-20">
                  <div
                    className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
                    }}
                  >
                    STARTER DECK
                  </div>
                </div>

                {/* BEST FOR BEGINNERS badge */}
                {meta.recommended && (
                  <div className="absolute top-3 right-3 z-20">
                    <div
                      className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))',
                        color: '#fff',
                        boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
                      }}
                    >
                      BEST FOR BEGINNERS
                    </div>
                  </div>
                )}

                {/* Hero art area */}
                <div className={`relative bg-gradient-to-br ${meta.gradient} overflow-hidden`}>
                  {/* Faction glow behind art */}
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      background: `radial-gradient(circle at 50% 60%, ${meta.glow} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Hero creature image */}
                  <div className="relative z-10 flex items-center justify-center py-4 sm:py-6">
                    {hasImage ? (
                      <img
                        src={deckBoxUrl(deck.id)}
                        alt={deck.name}
                        className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl"
                        onError={() => setImgErrors((prev) => new Set(prev).add(deck.id))}
                        draggable={false}
                      />
                    ) : (
                      <span className="text-7xl sm:text-8xl drop-shadow-2xl">{deck.icon}</span>
                    )}
                  </div>

                  {/* Bottom gradient fade into info panel */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent z-10" />
                </div>

                {/* Info panel */}
                <div
                  className="relative px-4 py-3"
                  style={{
                    background: 'linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(15,15,15,0.98) 100%)',
                  }}
                >
                  {/* Deck name + ability icon */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-lg">{meta.abilityIcon}</span>
                    <h2
                      className="text-lg sm:text-xl font-black text-white leading-tight"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
                    >
                      {deck.name}
                    </h2>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-white/45 font-semibold italic leading-snug mb-2">
                    {meta.tagline}
                  </p>

                  {/* "Includes:" callout */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                    <span>{includes.total} Cards</span>
                    <span className="text-white/15">|</span>
                    <span>{includes.creatures} Creatures</span>
                    <span className="text-white/15">|</span>
                    <span>{includes.items} Item{includes.items !== 1 ? 's' : ''}</span>
                    {includes.rares > 0 && (
                      <>
                        <span className="text-white/15">|</span>
                        <span
                          className="text-blue-300/80"
                          style={{ textShadow: '0 0 6px rgba(59,130,246,0.3)' }}
                        >
                          {includes.rares} Rare
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Selected checkmark */}
                {selectedDeckId === deck.id && (
                  <motion.div
                    className="absolute top-14 right-3 z-20"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        boxShadow: '0 0 15px rgba(59,130,246,0.5)',
                        color: '#fff',
                      }}
                    >
                      &#10003;
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Custom Decks (smaller, separated) ───────────────────── */}
      {customDecks.length > 0 && (
        <div className="w-full max-w-4xl px-6 mb-4 relative z-10">
          <div className="border-t border-white/5 pt-4 mb-3">
            <h3 className="text-xs font-bold text-white/25 uppercase tracking-widest">
              Custom Decks
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {customDecks.map((deck) => (
              <motion.button
                key={deck.id}
                onClick={() => handleBoxClick(deck)}
                className={`p-4 rounded-xl bg-white/5 border text-left transition-all hover:bg-white/8 ${
                  selectedDeckId === deck.id
                    ? 'border-blue-400/50'
                    : 'border-white/8'
                }`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl block mb-1">🛠️</span>
                <h3 className="text-sm font-bold text-white">{deck.name}</h3>
                <p className="text-[10px] text-white/30 mt-0.5">{deck.cardIds.length} cards</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Build Custom Deck button */}
      {onBuildDeck && (
        <motion.button
          onClick={onBuildDeck}
          className="relative mb-10 group z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="cc-btn-secondary px-6 py-3 text-sm">
            + Build Custom Deck
          </div>
        </motion.button>
      )}

      {/* ── Box Opening Overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {openingDeck && (phase === 'opening' || phase === 'revealed') && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dark backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/85"
              onClick={phase === 'revealed' ? handleConfirm : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ backdropFilter: 'blur(8px)' }}
            />

            {/* Opening phase: box lifts + shimmer flash */}
            {phase === 'opening' && (
              <motion.div
                className="relative z-10"
                initial={{ scale: 1, y: 0 }}
                animate={{ scale: 1.15, y: -30 }}
                transition={{ type: 'spring', stiffness: 120, damping: 12 }}
              >
                {/* Shimmer flash */}
                <motion.div
                  className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                  initial={{ opacity: 0, scaleX: 0.3 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 1.2] }}
                  transition={{ duration: 0.6, times: [0, 0.3, 1] }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  }}
                />

                {/* The box */}
                <div
                  className={`w-64 sm:w-80 rounded-2xl overflow-hidden deck-box-shadow border-2`}
                  style={{ borderColor: BOX_META[openingDeck.id]?.borderAccent || '#444' }}
                >
                  <div className={`bg-gradient-to-br ${BOX_META[openingDeck.id]?.gradient || 'from-gray-700 to-gray-900'} p-8 flex items-center justify-center`}>
                    {!imgErrors.has(openingDeck.id) ? (
                      <img
                        src={deckBoxUrl(openingDeck.id)}
                        alt={openingDeck.name}
                        className="w-48 h-48 object-contain drop-shadow-2xl"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-8xl">{openingDeck.icon}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Revealed phase: card fan + confirmation */}
            {phase === 'revealed' && (
              <motion.div
                className="relative z-10 flex flex-col items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow pulse behind cards */}
                <motion.div
                  className="absolute w-72 h-72 rounded-full -top-10 opacity-40 blur-3xl"
                  style={{ background: BOX_META[openingDeck.id]?.glow || 'rgba(255,255,255,0.2)' }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Card fan */}
                <div className="relative w-72 h-44 sm:w-96 sm:h-56">
                  {previewCards.map((card, idx) => {
                    const total = previewCards.length;
                    const mid = (total - 1) / 2;
                    const angle = (idx - mid) * 12;
                    const xOff = (idx - mid) * 60;
                    return (
                      <motion.div
                        key={card.id}
                        className="absolute left-1/2 bottom-0"
                        style={{
                          transformOrigin: 'bottom center',
                          zIndex: idx,
                        }}
                        initial={{ opacity: 0, y: 80, rotate: 0, x: '-50%' }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          rotate: angle,
                          x: `calc(-50% + ${xOff}px)`,
                        }}
                        transition={{
                          delay: 0.1 + idx * 0.12,
                          type: 'spring',
                          stiffness: 150,
                          damping: 14,
                        }}
                      >
                        <GameCard card={card} small />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Deck name + confirmation */}
                <motion.div
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2
                    className="text-3xl font-black text-white mb-1"
                    style={{ textShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                  >
                    {openingDeck.name}
                  </h2>
                  <p className="text-white/40 text-sm font-medium mb-4">
                    Deck Selected!
                  </p>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleConfirm}
                      className="cc-btn-primary px-8 py-3 text-base cc-shimmer overflow-hidden relative"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10">Confirm</span>
                    </motion.button>
                    <motion.button
                      onClick={handleDismiss}
                      className="cc-btn-secondary px-6 py-3 text-sm"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Pick Another
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
