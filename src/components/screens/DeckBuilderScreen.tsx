'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DeckDefinition,
  CreatureCard,
  ABILITY_LABELS,
  ABILITY_ICONS,
  FACTION_CONFIG,
} from '@/types';
import { ALL_CREATURES, SHAPE_CARDS, ITEM_CARDS, getCardById } from '@/lib/card-data';
import { useCollectionStore } from '@/stores/collection-store';
import GameCard from '@/components/cards/GameCard';

interface DeckBuilderScreenProps {
  onBack: () => void;
  onSave: (deck: DeckDefinition) => void;
  editDeck?: DeckDefinition | null;
}

const MIN_CARDS = 30;
const MAX_COPIES = 2;
const MIN_SHAPES = 10;

export default function DeckBuilderScreen({ onBack, onSave, editDeck }: DeckBuilderScreenProps) {
  const { collection, getQuantity } = useCollectionStore();

  const [deckName, setDeckName] = useState(editDeck?.name || 'My Deck');
  const [deckCards, setDeckCards] = useState<string[]>(editDeck?.cardIds || []);

  const allCards = useMemo(() => [...ALL_CREATURES, ...SHAPE_CARDS, ...ITEM_CARDS], []);

  const ownedCardIds = useMemo(() => {
    const set = new Set<string>();
    for (const entry of collection) {
      if (entry.quantity > 0) set.add(entry.cardId);
    }
    return set;
  }, [collection]);

  const countInDeck = (cardId: string) => deckCards.filter((id) => id === cardId).length;

  const addCard = (cardId: string) => {
    const card = getCardById(cardId);
    if (!card) return;

    if (card.type === 'creature' || card.type === 'item') {
      if (countInDeck(cardId) >= MAX_COPIES) return;
    }

    const ownedQty = getQuantity(cardId);
    if (card.type !== 'shape' && countInDeck(cardId) >= ownedQty) return;

    setDeckCards((prev) => [...prev, cardId]);
  };

  const removeCard = (cardId: string) => {
    const idx = deckCards.indexOf(cardId);
    if (idx >= 0) {
      setDeckCards((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const shapeCount = deckCards.filter((id) => id.startsWith('shape-')).length;
  const creatureCount = deckCards.filter((id) => {
    const card = getCardById(id);
    return card?.type === 'creature';
  }).length;
  const itemCount = deckCards.filter((id) => {
    const card = getCardById(id);
    return card?.type === 'item';
  }).length;

  const isValid = deckCards.length >= MIN_CARDS && shapeCount >= MIN_SHAPES;

  const avgStrength = useMemo(() => {
    const creatures = deckCards
      .map((id) => getCardById(id))
      .filter((c) => c?.type === 'creature') as CreatureCard[];
    if (creatures.length === 0) return 0;
    return (creatures.reduce((sum, c) => sum + c.strength, 0) / creatures.length).toFixed(1);
  }, [deckCards]);

  const abilityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of deckCards) {
      const card = getCardById(id);
      if (card?.type === 'creature') {
        const c = card as CreatureCard;
        counts[c.ability] = (counts[c.ability] || 0) + 1;
      }
    }
    return counts;
  }, [deckCards]);

  const handleSave = () => {
    if (!isValid) return;
    const id = editDeck?.id || `custom-${Date.now()}`;
    onSave({
      id,
      name: deckName,
      description: `Custom deck with ${creatureCount} creatures`,
      icon: '🛠️',
      cardIds: deckCards,
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0e1f3d 0%, #132a50 50%, #0e1f3d 100%)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <button onClick={onBack} className="cc-btn-secondary text-xs px-3 py-1.5">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <input
            className="text-white font-bold text-lg px-3 py-1 rounded-lg text-center w-40"
            style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)' }}
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            maxLength={20}
          />
          <motion.button
            onClick={handleSave}
            className={isValid ? 'cc-btn-reward px-5 py-2' : 'px-5 py-2 rounded-xl font-black text-white/40 opacity-50 cursor-not-allowed'}
            style={!isValid ? { background: 'rgba(255,255,255,0.05)' } : undefined}
            whileHover={isValid ? { scale: 1.05 } : {}}
            whileTap={isValid ? { scale: 0.95 } : {}}
            disabled={!isValid}
          >
            Save Deck
          </motion.button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="cc-panel flex items-center gap-4 px-4 py-2 mx-2 mb-1 shrink-0 text-xs font-bold text-white/70 overflow-x-auto" style={{ borderRadius: '0.75rem' }}>
        <span className={deckCards.length >= MIN_CARDS ? 'text-green-400' : 'text-red-400'}>
          Cards: {deckCards.length}/{MIN_CARDS}+
        </span>
        <span className={shapeCount >= MIN_SHAPES ? 'text-green-400' : 'text-red-400'}>
          Shapes: {shapeCount}/{MIN_SHAPES}+
        </span>
        <span>Creatures: {creatureCount}</span>
        <span>Items: {itemCount}</span>
        <span>Avg STR: {avgStrength}</span>
        {Object.entries(abilityBreakdown).map(([ability, count]) => (
          <span key={ability}>
            {ABILITY_ICONS[ability as keyof typeof ABILITY_ICONS]} {count}
          </span>
        ))}
      </div>

      {/* Main area: card pool + deck preview */}
      <div className="flex flex-1 min-h-0 gap-2 px-2 pb-2">
        {/* Card pool (left) */}
        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-sm font-black text-white/50 uppercase tracking-wider mb-2 sticky top-0 py-1 z-10" style={{ background: 'rgba(14,31,61,0.95)', backdropFilter: 'blur(8px)' }}>
            Available Cards
          </h3>

          {/* Shapes */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-white/40 mb-1">Shape Cards (unlimited)</h4>
            <div className="flex flex-wrap gap-2">
              {SHAPE_CARDS.map((card) => (
                <motion.div
                  key={card.id}
                  className="relative cursor-pointer"
                  onClick={() => addCard(card.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GameCard card={card} small />
                  <span className="absolute -top-1 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow z-20 bg-blue-500">
                    {countInDeck(card.id)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Creatures by faction */}
          {(['circle', 'square', 'triangle', 'star', 'diamond'] as const).map((shape) => {
            const faction = FACTION_CONFIG[shape];
            const factionCreatures = ALL_CREATURES.filter((c) => c.shape === shape);
            if (factionCreatures.length === 0) return null;
            return (
              <div key={shape} className="mb-4">
                <h4 className="text-xs font-bold text-white/50 mb-1">
                  {faction.icon} {faction.name} ({faction.keyword})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {factionCreatures.map((card) => {
                    const owned = ownedCardIds.has(card.id);
                    const inDeck = countInDeck(card.id);
                    const maxed = inDeck >= MAX_COPIES || (!owned && inDeck > 0);
                    return (
                      <motion.div
                        key={card.id}
                        className={`relative cursor-pointer ${!owned ? 'opacity-30 grayscale' : ''} ${maxed ? 'opacity-50' : ''}`}
                        onClick={() => owned && addCard(card.id)}
                        whileHover={owned ? { scale: 1.05 } : {}}
                      >
                        <GameCard card={card} small />
                        {inDeck > 0 && (
                          <span className="absolute -top-1 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow z-20 bg-blue-500">
                            {inDeck}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Items */}
          {ITEM_CARDS.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-white/50 mb-1">Item Cards</h4>
              <div className="flex flex-wrap gap-2">
                {ITEM_CARDS.map((card) => {
                  const owned = ownedCardIds.has(card.id);
                  const inDeck = countInDeck(card.id);
                  return (
                    <motion.div
                      key={card.id}
                      className={`relative cursor-pointer ${!owned ? 'opacity-30 grayscale' : ''}`}
                      onClick={() => owned && addCard(card.id)}
                      whileHover={owned ? { scale: 1.05 } : {}}
                    >
                      <GameCard card={card} small />
                      {inDeck > 0 && (
                        <span className="absolute -top-1 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow z-20 bg-blue-500">
                          {inDeck}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Deck preview (right) */}
        <div className="w-64 shrink-0 overflow-y-auto cc-panel rounded-2xl p-3">
          <h3 className="text-sm font-black text-white/50 uppercase tracking-wider mb-2">
            Your Deck ({deckCards.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {deckCards.map((cardId, i) => {
                const card = getCardById(cardId);
                if (!card) return null;
                return (
                  <motion.div
                    key={`${cardId}-${i}`}
                    className="relative cursor-pointer"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    onClick={() => removeCard(cardId)}
                    whileHover={{ scale: 1.1 }}
                    title="Click to remove"
                  >
                    <GameCard card={card} small />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {deckCards.length === 0 && (
            <p className="text-white/20 text-xs italic text-center mt-8">
              Click cards on the left to add them
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
