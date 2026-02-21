'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/game-store';
import { useAudio } from '@/hooks/use-audio';
import { Card, ItemCard } from '@/types';
import HeartBar from '@/components/ui/HeartBar';
import ShapeZone from '@/components/game/ShapeZone';
import Battlefield from '@/components/game/Battlefield';
import Hand from '@/components/game/Hand';
import PlaymatBackground from '@/components/game/PlaymatBackground';
import TurnIndicator from '@/components/game/TurnIndicator';
import TurnGuide from '@/components/game/TurnGuide';
import CombatLog from '@/components/game/CombatLog';
import GameCard from '@/components/cards/GameCard';

interface GameBoardProps {
  onExit: () => void;
}

function DustParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 1.5,
      duration: 18 + Math.random() * 24,
      delay: Math.random() * 18,
    }))
  , []);

  return (
    <div className="cc-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="cc-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function GameBoard({ onExit }: GameBoardProps) {
  const state = useGameStore();
  const { playSound } = useAudio();
  const isBlocking = state.turnPhase === 'blocking';
  const [combatZoom, setCombatZoom] = useState(false);
  const [pendingItem, setPendingItem] = useState<string | null>(null);

  const isPlayerTurn = state.currentTurn === 'player';
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  const handleCardHover = useCallback((card: Card | null) => {
    setInspectedCard(card);
  }, []);

  const handleHandCardClick = (uid: string) => {
    if (state.isAnimating || state.gameOver || isBlocking) return;

    const inst = state.player.hand.find((c) => c.uid === uid);
    if (!inst) return;

    if (state.turnPhase === 'shape' && inst.card.type === 'shape') {
      playSound('play');
      state.doPlayShape(uid);
    } else if (state.turnPhase === 'play' && inst.card.type === 'creature') {
      playSound('play');
      state.doPlayCreature(uid);
    } else if (state.turnPhase === 'play' && inst.card.type === 'item') {
      const item = inst.card as ItemCard;
      if (item.effect === 'boost' || item.effect === 'swap') {
        if (state.player.battlefield.length === 0) {
          state.setMessage('No creatures on field to target!');
          return;
        }
        setPendingItem(uid);
        state.setMessage(`Select a creature on your field for ${item.name}!`);
      } else {
        playSound('play');
        state.doPlayItem(uid);
        setPendingItem(null);
      }
    } else {
      playSound('tap');
    }
  };

  const handlePlayerBattlefieldClick = (uid: string) => {
    if (state.isAnimating || state.gameOver) return;

    if (pendingItem) {
      playSound('play');
      state.doPlayItem(pendingItem, uid);
      setPendingItem(null);
      return;
    }

    if (isBlocking) {
      playSound('tap');
      state.selectBlocker(uid);
      return;
    }

    if (state.turnPhase === 'battle') {
      playSound('tap');
      state.toggleAttacker(uid);
    }
  };

  const handleAiBattlefieldClick = (uid: string) => {
    if (state.isAnimating || state.gameOver) return;

    if (isBlocking && state.selectedBlocker) {
      playSound('play');
      state.assignBlockToAttacker(uid);
    }
  };

  const handlePhaseAction = () => {
    if (state.isAnimating || state.gameOver) return;
    setPendingItem(null);

    switch (state.turnPhase) {
      case 'draw':
        playSound('draw');
        state.doDraw();
        break;
      case 'shape':
        playSound('tap');
        state.skipPhase();
        break;
      case 'play':
        playSound('tap');
        state.skipPhase();
        break;
      case 'battle':
        if (state.selectedAttackers.length > 0) {
          playSound('attack');
          setCombatZoom(true);
          state.doBattle();
          setTimeout(() => {
            setCombatZoom(false);
            const current = useGameStore.getState();
            if (current.gameOver) {
              playSound(current.winner === 'player' ? 'win' : 'lose');
            }
            state.endTurn();
          }, 800);
        } else {
          playSound('tap');
          state.endTurn();
        }
        break;
      case 'blocking':
        playSound('attack');
        setCombatZoom(true);
        state.confirmBlocks();
        setTimeout(() => {
          setCombatZoom(false);
          const current = useGameStore.getState();
          if (current.gameOver) {
            playSound(current.winner === 'player' ? 'win' : 'lose');
          }
        }, 800);
        break;
      default:
        break;
    }
  };

  const phaseButtonLabel = (): string => {
    switch (state.turnPhase) {
      case 'draw':
        return 'Draw!';
      case 'shape':
        return 'Skip Shape';
      case 'play':
        return 'Go to Battle!';
      case 'battle':
        return state.selectedAttackers.length > 0
          ? 'Attack!'
          : 'End Turn';
      case 'blocking': {
        const blockCount = Object.keys(state.playerBlockAssignments).length;
        if (blockCount > 0) {
          return `Defend! (${blockCount} blocked)`;
        }
        return 'Take the Hits!';
      }
      default:
        return 'Waiting...';
    }
  };

  const showActionButton =
    !state.gameOver &&
    (isPlayerTurn || isBlocking) &&
    !state.isAnimating;

  const hasCreaturesInHand = state.player.hand.some(h => h.card.type === 'creature');
  const hasShapesInHand = state.player.hand.some(h => h.card.type === 'shape');

  const playerZoneClass = `board-zone ${
    isPlayerTurn && state.turnPhase === 'battle'
      ? 'board-zone--active'
      : 'board-zone--player'
  }`;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden relative">

      {/* ═══ LAYER 0: Playmat background image + lighting overlays ═══ */}
      <PlaymatBackground />

      {/* ═══ LAYER 1: Ambient particles (subtle) ═══ */}
      <DustParticles />

      {/* ═══ LAYER 2-4: All interactive content ═══ */}
      <motion.div
        className="flex flex-col h-full relative z-[2]"
        animate={{ scale: combatZoom ? 1.015 : 1 }}
        transition={{ duration: 0.3 }}
      >

        {/* ── LAYER 4: Top HUD (UI chrome) ── */}
        <div className="flex items-center justify-between px-3 pt-1 shrink-0 relative z-[10]">
          <div className="hud-panel">
            <HeartBar current={state.ai.hearts} label="AI" />
          </div>
          <div className="flex items-center gap-2">
            {state.ai.shielded && (
              <span className="hud-badge text-blue-200">SHIELDED</span>
            )}
            <button onClick={onExit} className="hud-btn text-xs">
              Quit
            </button>
          </div>
        </div>

        {/* ── AI Hand (face-down) ── */}
        <div className="flex gap-1 justify-center py-0.5 px-3 overflow-x-auto shrink-0 relative z-[5]">
          {state.ai.hand.map((inst) => (
            <GameCard key={inst.uid} card={inst.card} faceDown scale="xs" />
          ))}
        </div>

        {/* ═══ LAYER 2-3: Table Frame (playmat arena) ═══ */}
        <div className="table-frame mx-1 relative z-[3]">
          <div className="flex gap-1 px-1 h-full">
            {/* Left: AI shapes */}
            <ShapeZone shapes={state.ai.shapeZone} label="AI" />

            {/* Center: battlefields + UI */}
            <div className="flex-1 flex flex-col gap-0.5 justify-center overflow-y-auto py-1">
              {/* AI zone */}
              <div className="board-zone board-zone--ai relative">
                <span className="zone-label zone-label--top">⚔️ Opponent Field</span>
                <Battlefield
                  creatures={state.ai.battlefield}
                  aiAttackers={state.aiAttackers}
                  isPlayerSide={false}
                  isBlockingPhase={isBlocking}
                  onCreatureClick={handleAiBattlefieldClick}
                  onCardHover={handleCardHover}
                />
              </div>

              {/* Divider + center UI */}
              <div className="board-divider" />
              <div className="flex flex-col items-center gap-1 py-0.5 relative z-[8]">
                <TurnIndicator
                  phase={state.turnPhase}
                  message={state.message}
                  isPlayerTurn={isPlayerTurn}
                />
                <TurnGuide
                  phase={state.turnPhase}
                  isPlayerTurn={isPlayerTurn}
                  isBlocking={isBlocking}
                  hasCreaturesInHand={hasCreaturesInHand}
                  hasShapesInHand={hasShapesInHand}
                  hasCreaturesOnField={state.player.battlefield.length > 0}
                  selectedAttackerCount={state.selectedAttackers.length}
                />
                <CombatLog events={state.combatLog} />
              </div>
              <div className="board-divider" />

              {/* Player zone */}
              <div className={`${playerZoneClass} relative`}>
                <span className="zone-label zone-label--top">🛡️ Your Field</span>
                <Battlefield
                  creatures={state.player.battlefield}
                  selectedAttackers={state.selectedAttackers}
                  playerBlockAssignments={state.playerBlockAssignments}
                  selectedBlocker={state.selectedBlocker}
                  onCreatureClick={handlePlayerBattlefieldClick}
                  isPlayerSide
                  isBlockingPhase={isBlocking}
                  onCardHover={handleCardHover}
                />
              </div>
            </div>

            {/* Right: Player shapes */}
            <ShapeZone shapes={state.player.shapeZone} label="You" />
          </div>
        </div>

        {/* ═══ LAYER 3: Player Hand (fan curve, docked to bottom) ═══ */}
        {!isBlocking && (
          <Hand
            hand={state.player.hand}
            phase={state.turnPhase}
            shapeZone={state.player.shapeZone}
            usedShapes={state.player.usedShapes}
            onCardClick={handleHandCardClick}
            onCardHover={handleCardHover}
          />
        )}

        {/* ── LAYER 4: Bottom HUD (UI chrome) ── */}
        <div className="flex items-center justify-between px-3 pb-1 pt-0.5 shrink-0 relative z-[10]">
          <div className="flex items-center gap-2">
            <div className="hud-panel">
              <HeartBar current={state.player.hearts} label="You" />
            </div>
            {state.player.shielded && (
              <span className="hud-badge text-blue-200">SHIELDED</span>
            )}
          </div>
          {showActionButton && (
            <motion.button
              onClick={handlePhaseAction}
              className={`hud-action-btn ${
                state.turnPhase === 'draw' ? 'guidance-pulse' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {phaseButtonLabel()}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ═══ INSPECT PANEL: Arena-style card preview ═══ */}
      <AnimatePresence>
        {inspectedCard && (
          <motion.div
            className="fixed right-4 top-1/2 z-30 pointer-events-none"
            initial={{ opacity: 0, x: 40, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: 40, y: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div
              className="relative rounded-2xl p-1"
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

      {/* ═══ LAYER 5: Modal overlays ═══ */}
      <AnimatePresence>
        {pendingItem && (
          <motion.div
            className="absolute top-12 left-1/2 -translate-x-1/2 z-40 hud-panel px-5 py-2.5"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <span className="text-sm font-bold text-white">Tap a creature on your field!</span>
            <button
              onClick={() => setPendingItem(null)}
              className="ml-3 text-sm underline opacity-70"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBlocking && !state.isAnimating && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40"
          >
            <motion.button
              onClick={handlePhaseAction}
              className="hud-action-btn hud-action-btn--danger cc-shimmer overflow-hidden relative"
              style={{ boxShadow: '0 0 30px rgba(239,68,68,0.3), 0 8px 20px rgba(0,0,0,0.4)' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <span className="relative z-10">
                {Object.keys(state.playerBlockAssignments).length > 0
                  ? `DEFEND! (${Object.keys(state.playerBlockAssignments).length} blocked)`
                  : 'TAKE THE HITS!'}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center gap-6 p-10 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(19,42,80,0.95), rgba(26,53,102,0.95))',
                border: '1px solid rgba(59,130,246,0.25)',
                boxShadow: '0 0 40px rgba(59,130,246,0.1), 0 20px 60px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <span className="text-7xl">
                {state.winner === 'player' ? '🏆' : '🌟'}
              </span>
              <h2 className="cc-heading text-4xl">
                {state.winner === 'player' ? 'You Win!' : 'Good Try!'}
              </h2>
              <p className="text-lg" style={{ color: 'var(--cc-text-muted)' }}>
                {state.winner === 'player'
                  ? 'Amazing battle! You are a champion!'
                  : 'Every game makes you stronger!'}
              </p>
              <div className="flex gap-4">
                <button onClick={onExit} className="hud-btn px-6 py-3">
                  Home
                </button>
                <button onClick={onExit} className="hud-action-btn px-6 py-3">
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
