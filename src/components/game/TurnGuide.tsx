'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TurnPhase } from '@/types';

interface TurnGuideProps {
  phase: TurnPhase;
  isPlayerTurn: boolean;
  isBlocking: boolean;
  hasCreaturesInHand: boolean;
  hasShapesInHand: boolean;
  hasCreaturesOnField: boolean;
  selectedAttackerCount: number;
}

interface GuideEntry {
  text: string;
  emoji: string;
  step: number;
  cta: string;
}

const GUIDE_MESSAGES: Record<string, GuideEntry> = {
  draw:            { text: 'Start your turn',      emoji: '🃏', step: 1, cta: 'Tap to Draw!' },
  shape_has:       { text: 'Play a shape for mana', emoji: '🔷', step: 2, cta: 'Play a Shape!' },
  shape_none:      { text: 'No shapes — skip ahead', emoji: '⏭️', step: 2, cta: 'Skip' },
  play_has:        { text: 'Summon a creature',     emoji: '🐾', step: 3, cta: 'Play a Creature!' },
  play_none:       { text: 'Nothing to summon',     emoji: '⚔️', step: 3, cta: 'Go to Battle!' },
  battle_has:      { text: 'Pick your attackers',   emoji: '⚔️', step: 4, cta: 'Tap Creatures!' },
  battle_selected: { text: 'Ready to fight!',       emoji: '💥', step: 4, cta: 'Attack!' },
  battle_none:     { text: 'No attackers available', emoji: '⏭️', step: 4, cta: 'End Turn' },
  blocking:        { text: 'Defend your creatures',  emoji: '🛡️', step: 0, cta: 'Assign Blockers!' },
  ai_turn:         { text: 'Opponent is thinking',   emoji: '⏳', step: 0, cta: 'Wait...' },
};

function getGuideKey(props: TurnGuideProps): string {
  if (!props.isPlayerTurn && !props.isBlocking) return 'ai_turn';
  if (props.isBlocking) return 'blocking';

  switch (props.phase) {
    case 'draw': return 'draw';
    case 'shape': return props.hasShapesInHand ? 'shape_has' : 'shape_none';
    case 'play': return props.hasCreaturesInHand ? 'play_has' : 'play_none';
    case 'battle':
      if (!props.hasCreaturesOnField) return 'battle_none';
      if (props.selectedAttackerCount > 0) return 'battle_selected';
      return 'battle_has';
    default: return 'ai_turn';
  }
}

export default function TurnGuide(props: TurnGuideProps) {
  const key = getGuideKey(props);
  const guide = GUIDE_MESSAGES[key];
  if (!guide) return null;

  const isAction = key === 'draw' || key === 'battle_selected' || key === 'blocking';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl"
        style={{
          background: isAction
            ? 'linear-gradient(135deg, rgba(250,204,21,0.18), rgba(245,158,11,0.12))'
            : 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          border: isAction
            ? '2px solid rgba(250,204,21,0.35)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isAction
            ? '0 0 24px rgba(250,204,21,0.12), 0 4px 16px rgba(0,0,0,0.3)'
            : '0 2px 10px rgba(0,0,0,0.2)',
        }}
        initial={{ y: -12, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -12, opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.25 }}
      >
        {guide.step > 0 && (
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shrink-0"
            style={{
              background: 'rgba(250,204,21,0.2)',
              color: 'rgba(250,204,21,0.9)',
              border: '2px solid rgba(250,204,21,0.3)',
            }}
          >
            {guide.step}
          </span>
        )}

        <span className="text-lg leading-none">{guide.emoji}</span>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-white/70 leading-tight">
            {guide.text}
          </span>
          <span
            className="text-base font-black uppercase tracking-wide leading-tight"
            style={{ color: isAction ? 'rgba(250,204,21,0.95)' : 'rgba(255,255,255,0.5)' }}
          >
            {guide.cta}
          </span>
        </div>

        {isAction && (
          <motion.span
            className="text-yellow-300 text-lg ml-1"
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          >
            ▼
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
