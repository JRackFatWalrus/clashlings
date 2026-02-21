'use client';

import { motion } from 'framer-motion';
import { TurnPhase } from '@/types';

interface TurnIndicatorProps {
  phase: TurnPhase;
  message: string;
  isPlayerTurn: boolean;
}

const PHASE_ICONS: Record<TurnPhase, string> = {
  draw: '🎴',
  shape: '🔷',
  play: '🐾',
  battle: '⚔️',
  blocking: '🛡️',
  done: '✅',
};

const PHASE_LABEL: Record<TurnPhase, string> = {
  draw: 'Draw Phase',
  shape: 'Shape Phase',
  play: 'Play Phase',
  battle: 'Battle Phase',
  blocking: 'Blocking Phase',
  done: 'Turn Complete',
};

export default function TurnIndicator({ phase, message, isPlayerTurn }: TurnIndicatorProps) {
  const accentColor = isPlayerTurn ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.5)';

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-lg"
      style={{
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={`${phase}-${isPlayerTurn}`}
    >
      <motion.span
        className="text-xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      >
        {PHASE_ICONS[phase]}
      </motion.span>
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.15em]"
            style={{ color: isPlayerTurn ? 'var(--cc-primary)' : 'var(--cc-danger)' }}
          >
            {isPlayerTurn ? 'Your Turn' : 'AI Turn'}
          </span>
          <span className="text-[10px] font-bold text-white/40">
            {PHASE_LABEL[phase]}
          </span>
        </div>
        <span className="text-sm font-bold text-white/85">{message}</span>
      </div>
    </motion.div>
  );
}
