'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardInstance, CreatureCard } from '@/types';
import GameCard from '@/components/cards/GameCard';

interface BattlefieldProps {
  creatures: CardInstance[];
  selectedAttackers?: string[];
  aiAttackers?: string[];
  playerBlockAssignments?: Record<string, string>;
  selectedBlocker?: string | null;
  onCreatureClick?: (uid: string) => void;
  onCardHover?: (card: Card | null) => void;
  isPlayerSide: boolean;
  isBlockingPhase?: boolean;
  aiCreatures?: CardInstance[];
}

const ABILITY_SLOT_COLORS: Record<string, string> = {
  fly: 'rgba(56,189,248,0.3)',
  guard: 'rgba(34,197,94,0.3)',
  fast: 'rgba(251,146,60,0.3)',
  big: 'rgba(239,68,68,0.3)',
  none: 'rgba(168,85,247,0.25)',
};

export default function Battlefield({
  creatures,
  selectedAttackers = [],
  aiAttackers = [],
  playerBlockAssignments = {},
  selectedBlocker = null,
  onCreatureClick,
  onCardHover,
  isPlayerSide,
  isBlockingPhase = false,
}: BattlefieldProps) {
  const blockerUids = new Set(Object.values(playerBlockAssignments));

  const selectedBlockerInst = selectedBlocker
    ? creatures.find((c) => c.uid === selectedBlocker) ?? null
    : null;
  const selectedBlockerAbility = selectedBlockerInst?.card.type === 'creature'
    ? (selectedBlockerInst.card as CreatureCard).ability
    : null;

  return (
    <div className="flex gap-2 overflow-x-auto items-center justify-center min-h-[275px] px-2 py-1 transition-all">
      <AnimatePresence>
        {creatures.map((inst) => {
          const isAiAttacker = aiAttackers.includes(inst.uid);
          const isAssignedBlocker = blockerUids.has(inst.uid);
          const isSelectedBlocker = selectedBlocker === inst.uid;
          const isCreature = inst.card.type === 'creature';
          const creature = isCreature ? (inst.card as CreatureCard) : null;
          const isGuard = creature?.ability === 'guard';

          let cantBlock = false;
          if (isBlockingPhase && !isPlayerSide && isAiAttacker && selectedBlockerAbility && selectedBlockerAbility !== 'fly') {
            if (creature?.ability === 'fly') cantBlock = true;
          }

          const slotColor = ABILITY_SLOT_COLORS[creature?.ability ?? 'none'];

          return (
            <motion.div
              key={inst.uid}
              initial={{ scale: 0, y: isPlayerSide ? 40 : -40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className="relative shrink-0 card-rim-light"
              onMouseEnter={() => onCardHover?.(inst.card)}
              onMouseLeave={() => onCardHover?.(null)}
            >
              <GameCard
                card={inst.card}
                selected={
                  selectedAttackers.includes(inst.uid) ||
                  isSelectedBlocker
                }
                tapped={inst.tapped}
                glowing={
                  (!isBlockingPhase && isPlayerSide && inst.canAttack && !inst.tapped) ||
                  (isBlockingPhase && isAiAttacker && !cantBlock) ||
                  (isBlockingPhase && isPlayerSide && !inst.tapped && !isAssignedBlocker)
                }
                scale="md"
                onClick={() => onCreatureClick?.(inst.uid)}
              />

              {/* Faction-keyed slot glow beneath card */}
              <div
                className="card-slot-glow"
                style={{ ['--slot-color' as string]: slotColor }}
              />

              {isGuard && !isBlockingPhase && (
                <div className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-20">
                  🛡️
                </div>
              )}

              {isBlockingPhase && isAiAttacker && (
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ⚔️ ATK
                </motion.div>
              )}

              {cantBlock && (
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-red-400 text-[9px] font-black px-2 py-1 rounded-lg shadow-lg z-30 whitespace-nowrap"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  🪽 CAN'T BLOCK
                </motion.div>
              )}

              {isBlockingPhase && isPlayerSide && isAssignedBlocker && (
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  🛡️ BLK
                </motion.div>
              )}

              {isBlockingPhase && isSelectedBlocker && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20"
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                >
                  TAP ATTACKER
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {creatures.length === 0 && (
        <span className="text-white/10 text-sm italic mx-auto">
          {isPlayerSide ? 'Play creatures here' : 'AI creatures'}
        </span>
      )}
    </div>
  );
}
