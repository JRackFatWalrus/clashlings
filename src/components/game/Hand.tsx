'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardInstance, TurnPhase, CreatureCard, Shape, ShapeCard } from '@/types';
import GameCard from '@/components/cards/GameCard';
import { canPlayCreature } from '@/lib/game-engine';

interface HandProps {
  hand: CardInstance[];
  phase: TurnPhase;
  shapeZone: ShapeCard[];
  usedShapes: Record<Shape, number>;
  onCardClick: (uid: string) => void;
  onCardHover?: (card: Card | null) => void;
}

const MAX_SPREAD_DEG = 14;
const MAX_CARD_OFFSET_X = 125;
const NEIGHBOR_SHIFT = 22;

function fanTransform(index: number, count: number) {
  if (count <= 1) return { x: 0, y: 0, rotate: 0 };

  const spread = Math.min(MAX_SPREAD_DEG, count * 2.2);
  const step = spread / (count - 1);
  const angle = -spread / 2 + index * step;

  const xStep = Math.min(MAX_CARD_OFFSET_X, 420 / count);
  const x = (index - (count - 1) / 2) * xStep;

  const y = Math.abs(angle) * 0.4;

  return { x, y, rotate: angle };
}

export default function Hand({
  hand,
  phase,
  shapeZone,
  usedShapes,
  onCardClick,
  onCardHover,
}: HandProps) {
  const count = hand.length;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="hand-container">
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

          const { x, y, rotate } = fanTransform(i, count);
          const isHovered = hoveredIdx === i;

          let neighborShiftX = 0;
          if (hoveredIdx !== null && !isHovered) {
            if (i === hoveredIdx - 1) neighborShiftX = -NEIGHBOR_SHIFT;
            if (i === hoveredIdx + 1) neighborShiftX = NEIGHBOR_SHIFT;
          }

          return (
            <motion.div
              key={inst.uid}
              className={`hand-card ${isHovered ? 'hand-card--hover' : ''}`}
              style={{ zIndex: isHovered ? 50 : i + 1 }}
              initial={{ y: 120, opacity: 0, scale: 0.6 }}
              animate={{
                x: x + neighborShiftX,
                y: isHovered ? y - 60 : y,
                rotate: isHovered ? 0 : rotate,
                opacity: 1,
                scale: isHovered ? 1.22 : 1,
              }}
              exit={{ y: 120, opacity: 0, scale: 0.5 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 22,
                delay: isHovered ? 0 : i * 0.03,
              }}
              onHoverStart={() => {
                setHoveredIdx(i);
                onCardHover?.(inst.card);
              }}
              onHoverEnd={() => {
                setHoveredIdx(null);
                onCardHover?.(null);
              }}
            >
              <GameCard
                card={inst.card}
                glowing={playable}
                scale="md"
                onClick={() => onCardClick(inst.uid)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {hand.length === 0 && (
        <span className="text-white/15 text-sm italic absolute left-1/2 -translate-x-1/2 bottom-4">
          Hand is empty
        </span>
      )}
    </div>
  );
}
