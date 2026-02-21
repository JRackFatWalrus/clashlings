'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CombatEvent } from '@/types';

interface CombatLogProps {
  events: CombatEvent[];
}

function eventText(e: CombatEvent): string {
  if (e.result === 'unblocked') {
    return `${e.attackerName} attacks! -1 ❤️`;
  }
  if (e.result === 'attacker_wins') {
    const extra = e.heartDamage > 0 ? ' +Trample!' : '';
    return `${e.attackerName} beats ${e.blockerName}!${extra}`;
  }
  if (e.result === 'blocker_wins') {
    return `${e.blockerName} blocks ${e.attackerName}!`;
  }
  return `${e.attackerName} & ${e.blockerName} tie!`;
}

export default function CombatLog({ events }: CombatLogProps) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto px-4">
      <AnimatePresence>
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-xs font-bold text-amber-300 bg-black/40 px-3 py-1 rounded-lg"
          >
            {eventText(e)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
