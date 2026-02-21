'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CardInstance, TurnPhase, CreatureCard, Shape } from '@/types';
import GameCard from '@/components/cards/GameCard';
import { canPlayCreature } from '@/lib/game-engine';
import { ShapeCard } from '@/types';

interface PlayerHandProps {
  hand: CardInstance[];
  phase: TurnPhase;
  shapeZone: ShapeCard[];
  usedShapes: Record<Shape, number>;
  onCardClick: (uid: string) => void;
}

export default function PlayerHand({
  hand,
  phase,
  shapeZone,
  usedShapes,
  onCardClick,
}: PlayerHandProps) {
  return (
    <div className="cc-panel flex gap-2 justify-center items-end flex-wrap px-4 py-2 mx-2 mb-1 rounded-2xl"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <AnimatePresence>
        {hand.map((inst, i) => {
          const isShape = inst.card.type === 'shape';
          const isCreature = inst.card.type === 'creature';
          const isItem = inst.card.type === 'item';
          const playable =
            (phase === 'shape' && isShape) ||
            (phase === 'play' && isItem) ||
            (phase === 'play' &&
              isCreature &&
              canPlayCreature(inst.card as CreatureCard, shapeZone, usedShapes));

          return (
            <motion.div
              key={inst.uid}
              initial={{ y: 100, opacity: 0, rotate: -10 }}
              animate={{
                y: 0,
                opacity: 1,
                rotate: 0,
              }}
              exit={{ y: 100, opacity: 0, scale: 0.5 }}
              transition={{ delay: i * 0.05 }}
            >
              <GameCard
                card={inst.card}
                glowing={playable}
                onClick={() => onCardClick(inst.uid)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {hand.length === 0 && (
        <span className="text-white/30 text-sm">Hand is empty</span>
      )}
    </div>
  );
}
