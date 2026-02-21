'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_STARTER_DECKS } from '@/lib/deck-data';
import { getCardById } from '@/lib/card-data';
import { useCollectionStore } from '@/stores/collection-store';
import { useAuth } from '@/components/AuthProvider';
import { DeckDefinition, CreatureCard, Card, GameScreen } from '@/types';
import GameCard from '@/components/cards/GameCard';
import PackOpener from '@/components/cards/PackOpener';

interface ShopScreenProps {
  onSelectDeck: (deck: DeckDefinition) => void;
  onBuildDeck?: () => void;
  onNavigate: (screen: GameScreen) => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

function deckBoxUrl(deckId: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/card-art/set1/decks/${deckId}.png`;
}

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
    tagline: 'Rule the skies.',
    gradient: 'from-violet-700 via-purple-800 to-indigo-950',
    glow: 'rgba(139, 92, 246, 0.5)',
    abilityIcon: '🪽',
    borderAccent: '#9333ea',
  },
  'stomp-pack': {
    tagline: 'Crash through defenders.',
    gradient: 'from-red-700 via-rose-800 to-red-950',
    glow: 'rgba(239, 68, 68, 0.5)',
    abilityIcon: '🦶',
    borderAccent: '#dc2626',
  },
  'dash-pack': {
    tagline: 'Hit first, hit fast.',
    gradient: 'from-amber-600 via-orange-700 to-red-900',
    glow: 'rgba(245, 158, 11, 0.5)',
    abilityIcon: '⚡',
    borderAccent: '#d97706',
  },
  'shield-pack': {
    tagline: 'Unbreakable wall.',
    gradient: 'from-emerald-600 via-green-700 to-teal-950',
    glow: 'rgba(16, 185, 129, 0.5)',
    abilityIcon: '🛡️',
    borderAccent: '#059669',
    recommended: true,
  },
  'wild-pack': {
    tagline: 'Unpredictable power.',
    gradient: 'from-blue-600 via-cyan-700 to-sky-950',
    glow: 'rgba(6, 182, 212, 0.45)',
    abilityIcon: '💎',
    borderAccent: '#0891b2',
  },
};

function getDeckIncludes(deck: DeckDefinition) {
  let creatures = 0;
  let items = 0;
  let rares = 0;

  for (const id of deck.cardIds) {
    const card = getCardById(id);
    if (!card) continue;
    if (card.type === 'creature') {
      creatures++;
      const c = card as CreatureCard;
      if (c.rarity === 'rare' || c.rarity === 'mythic') rares++;
    } else if (card.type === 'item') {
      items++;
    }
  }

  return { creatures, items, rares, total: deck.cardIds.length };
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

type RevealPhase = 'browsing' | 'opening' | 'revealed';

export default function ShopScreen({ onSelectDeck, onBuildDeck, onNavigate }: ShopScreenProps) {
  const { selectedDeckId, setSelectedDeck, customDecks, addCards, incrementPacksOpened, packsOpened, pushCardsToDB } = useCollectionStore();
  const { user } = useAuth();
  const [openingDeck, setOpeningDeck] = useState<DeckDefinition | null>(null);
  const [phase, setPhase] = useState<RevealPhase>('browsing');
  const [imgErrors, setImgErrors] = useState<Set<string>>(() => new Set());
  const [openingPack, setOpeningPack] = useState(false);

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
    if (openingDeck) onSelectDeck(openingDeck);
  }, [openingDeck, onSelectDeck]);

  const handleDismiss = useCallback(() => {
    setOpeningDeck(null);
    setPhase('browsing');
  }, []);

  const previewCards = useMemo(
    () => (openingDeck ? getPreviewCreatures(openingDeck) : []),
    [openingDeck],
  );

  const handlePackDone = (cards: Card[]) => {
    addCards(cards);
    incrementPacksOpened();
    if (user) pushCardsToDB(user.id, cards);
    setOpeningPack(false);
  };

  if (openingPack) {
    return <PackOpener onDone={handlePackDone} />;
  }

  return (
    <div className="cc-screen flex flex-col items-center px-4 py-4">
      {/* Title */}
      <motion.div
        className="relative z-10 mb-5 text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="cc-heading text-3xl sm:text-4xl">Shop</h1>
        <p className="cc-subtext mt-1">Starter decks & booster packs</p>
      </motion.div>

      {/* ══════ BOOSTER PACKS SECTION ══════ */}
      <motion.div
        className="w-full max-w-3xl px-6 mb-6 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
          🎁 Booster Packs
        </h2>
        <div className="flex items-center gap-4">
          <motion.button
            onClick={() => setOpeningPack(true)}
            className="relative w-40 h-52 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 group cc-shimmer cc-elevation shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--cc-magic), #7c3aed)',
              border: '3px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 0 #6d28d9, 0 6px 16px rgba(124,58,237,0.4), inset 0 2px 0 rgba(255,255,255,0.25)',
            }}
            whileHover={{ scale: 1.05, y: -6 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-5xl relative z-10">🎁</span>
            <span className="text-base font-black text-white relative z-10">Booster Pack</span>
            <span className="text-[10px] text-white/60 font-semibold relative z-10">15 cards</span>
            <span
              className="absolute -bottom-0.5 px-4 py-1 rounded-full text-[10px] font-black text-white shadow-lg z-10"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
              }}
            >
              FREE
            </span>
          </motion.button>

          <div className="text-white/30 text-sm">
            {packsOpened > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider">
                {packsOpened} pack{packsOpened !== 1 ? 's' : ''} opened
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══════ STARTER DECKS SECTION ══════ */}
      <motion.div
        className="w-full max-w-3xl px-6 mb-4 relative z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">
          🃏 Starter Decks
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full px-6 mb-6 relative z-10">
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
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 180, damping: 18 }}
              whileHover={{ scale: 1.03, y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{ background: meta.glow }}
              />
              <div
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  selectedDeckId === deck.id
                    ? 'border-blue-400'
                    : 'border-white/8 group-hover:border-white/20'
                }`}
              >
                {meta.recommended && (
                  <div className="absolute top-2 right-2 z-20">
                    <div
                      className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))',
                        color: '#fff',
                      }}
                    >
                      BEGINNER
                    </div>
                  </div>
                )}

                <div className={`relative bg-gradient-to-br ${meta.gradient} overflow-hidden`}>
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      background: `radial-gradient(circle at 50% 60%, ${meta.glow} 0%, transparent 70%)`,
                    }}
                  />
                  <div className="relative z-10 flex items-center justify-center py-3 sm:py-5">
                    {hasImage ? (
                      <img
                        src={deckBoxUrl(deck.id)}
                        alt={deck.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl"
                        onError={() => setImgErrors((prev) => new Set(prev).add(deck.id))}
                        draggable={false}
                      />
                    ) : (
                      <span className="text-6xl sm:text-7xl drop-shadow-2xl">{deck.icon}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/70 to-transparent z-10" />
                </div>

                <div
                  className="relative px-3 py-2.5"
                  style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0.95), rgba(15,15,15,0.98))' }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base">{meta.abilityIcon}</span>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">{deck.name}</h3>
                  </div>
                  <p className="text-[10px] text-white/40 font-semibold italic leading-snug mb-1.5">{meta.tagline}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/35 uppercase tracking-wider">
                    <span>{includes.total} Cards</span>
                    <span className="text-white/15">|</span>
                    <span>{includes.creatures} Creatures</span>
                    {includes.rares > 0 && (
                      <>
                        <span className="text-white/15">|</span>
                        <span className="text-blue-300/80">{includes.rares} Rare</span>
                      </>
                    )}
                  </div>
                </div>

                {selectedDeckId === deck.id && (
                  <motion.div
                    className="absolute top-10 right-2 z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        boxShadow: '0 0 12px rgba(59,130,246,0.5)',
                        color: '#fff',
                      }}
                    >
                      ✓
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Decks */}
      {customDecks.length > 0 && (
        <div className="w-full max-w-3xl px-6 mb-4 relative z-10">
          <div className="border-t border-white/5 pt-3 mb-2">
            <h3 className="text-xs font-bold text-white/25 uppercase tracking-widest">Custom Decks</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customDecks.map((deck) => (
              <motion.button
                key={deck.id}
                onClick={() => handleBoxClick(deck)}
                className={`p-3 rounded-xl bg-white/5 border text-left transition-all hover:bg-white/8 ${
                  selectedDeckId === deck.id ? 'border-blue-400/50' : 'border-white/8'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl block mb-1">🛠️</span>
                <h3 className="text-sm font-bold text-white">{deck.name}</h3>
                <p className="text-[10px] text-white/30 mt-0.5">{deck.cardIds.length} cards</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {onBuildDeck && (
        <motion.button
          onClick={onBuildDeck}
          className="relative mb-8 group z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="cc-btn-secondary px-6 py-3 text-sm">
            + Build Custom Deck
          </div>
        </motion.button>
      )}

      {/* Deck Opening Overlay */}
      <AnimatePresence>
        {openingDeck && (phase === 'opening' || phase === 'revealed') && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/85"
              onClick={phase === 'revealed' ? handleConfirm : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ backdropFilter: 'blur(8px)' }}
            />

            {phase === 'opening' && (
              <motion.div
                className="relative z-10"
                initial={{ scale: 1, y: 0 }}
                animate={{ scale: 1.15, y: -30 }}
                transition={{ type: 'spring', stiffness: 120, damping: 12 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                  initial={{ opacity: 0, scaleX: 0.3 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1, 1.2] }}
                  transition={{ duration: 0.6, times: [0, 0.3, 1] }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  }}
                />
                <div
                  className="w-56 sm:w-72 rounded-2xl overflow-hidden border-2"
                  style={{ borderColor: BOX_META[openingDeck.id]?.borderAccent || '#444' }}
                >
                  <div className={`bg-gradient-to-br ${BOX_META[openingDeck.id]?.gradient || 'from-gray-700 to-gray-900'} p-6 flex items-center justify-center`}>
                    {!imgErrors.has(openingDeck.id) ? (
                      <img
                        src={deckBoxUrl(openingDeck.id)}
                        alt={openingDeck.name}
                        className="w-40 h-40 object-contain drop-shadow-2xl"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-8xl">{openingDeck.icon}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'revealed' && (
              <motion.div
                className="relative z-10 flex flex-col items-center gap-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute w-64 h-64 rounded-full -top-8 opacity-40 blur-3xl"
                  style={{ background: BOX_META[openingDeck.id]?.glow || 'rgba(255,255,255,0.2)' }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <div className="relative w-64 h-40 sm:w-80 sm:h-48">
                  {previewCards.map((card, idx) => {
                    const total = previewCards.length;
                    const mid = (total - 1) / 2;
                    const angle = (idx - mid) * 12;
                    const xOff = (idx - mid) * 55;
                    return (
                      <motion.div
                        key={card.id}
                        className="absolute left-1/2 bottom-0"
                        style={{ transformOrigin: 'bottom center', zIndex: idx }}
                        initial={{ opacity: 0, y: 80, rotate: 0, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, rotate: angle, x: `calc(-50% + ${xOff}px)` }}
                        transition={{ delay: 0.1 + idx * 0.12, type: 'spring', stiffness: 150, damping: 14 }}
                      >
                        <GameCard card={card} small />
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-2xl font-black text-white mb-1" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                    {openingDeck.name}
                  </h2>
                  <p className="text-white/40 text-sm font-medium mb-3">Deck Selected!</p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={handleConfirm}
                      className="cc-btn-primary px-7 py-2.5 text-sm cc-shimmer overflow-hidden relative"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10">Confirm</span>
                    </motion.button>
                    <motion.button
                      onClick={handleDismiss}
                      className="cc-btn-secondary px-5 py-2.5 text-sm"
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
