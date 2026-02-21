'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Card, Rarity } from '@/types';
import { generateBoosterPack } from '@/lib/pack-generator';
import { useAudio } from '@/hooks/use-audio';
import GameCard from './GameCard';

interface PackOpenerProps {
  onDone: (cards: Card[]) => void;
}

const CONFETTI_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#14b8a6', '#ec4899', '#f59e0b', '#60a5fa', '#c084fc', '#4ade80'];
const RARITY_ORDER: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, mythic: 3 };

const RARITY_GLOW_COLOR: Record<string, string> = {
  common: 'rgba(200,210,230,0.15)',
  uncommon: 'rgba(96,165,250,0.35)',
  rare: 'rgba(201,162,39,0.7)',
  mythic: 'rgba(168,85,247,0.8)',
};

const RARITY_RING_COLOR: Record<string, string> = {
  common: 'transparent',
  uncommon: 'rgba(96,165,250,0.3)',
  rare: 'rgba(201,162,39,0.5)',
  mythic: 'rgba(168,85,247,0.6)',
};

const RARITY_LABEL_BG: Record<string, string> = {
  common: 'rgba(150,160,180,0.4)',
  uncommon: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  rare: 'linear-gradient(135deg, #c9a227, #a88520)',
  mythic: 'linear-gradient(135deg, #a855f7, #7c3aed)',
};

type Phase = 'sealed' | 'spotlight' | 'grid';

export default function PackOpener({ onDone }: PackOpenerProps) {
  const { playSound } = useAudio();
  const screenControls = useAnimation();
  const flashRef = useRef<HTMLDivElement>(null);

  const sortedCards = useMemo(() => {
    const raw = generateBoosterPack();
    return [...raw].sort(
      (a, b) => (RARITY_ORDER[a.rarity ?? 'common'] ?? 0) - (RARITY_ORDER[b.rarity ?? 'common'] ?? 0)
    );
  }, []);

  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [phase, setPhase] = useState<Phase>('sealed');
  const [isRevealing, setIsRevealing] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  const confettiPieces = useMemo(
    () =>
      [...Array(40)].map((_, i) => ({
        left: `${Math.random() * 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 1.2,
        size: 5 + Math.random() * 10,
        rotate: Math.random() * 360,
      })),
    []
  );

  const sparkRing = useMemo(
    () =>
      [...Array(12)].map((_, i) => ({
        angle: (i / 12) * 360,
        delay: i * 0.03,
        size: 3 + Math.random() * 4,
      })),
    []
  );

  const currentCard = revealedIndex >= 0 && revealedIndex < sortedCards.length ? sortedCards[revealedIndex] : null;
  const currentRarity: Rarity = (currentCard?.rarity as Rarity) ?? 'common';
  const isRare = currentRarity === 'rare';
  const isMythic = currentRarity === 'mythic';
  const isRareOrBetter = isRare || isMythic;
  const allDone = revealedIndex >= sortedCards.length - 1;

  const triggerFlash = useCallback((color: string, duration: number) => {
    if (flashRef.current) {
      flashRef.current.style.background = color;
      flashRef.current.style.opacity = '1';
      setTimeout(() => {
        if (flashRef.current) flashRef.current.style.opacity = '0';
      }, duration);
    }
  }, []);

  const triggerShake = useCallback(async () => {
    await screenControls.start({
      x: [0, -6, 6, -4, 4, -2, 2, 0],
      transition: { duration: 0.4 },
    });
  }, [screenControls]);

  const openPack = useCallback(() => {
    playSound('packOpen');
    setPhase('spotlight');
  }, [playSound]);

  const handleReveal = useCallback(async () => {
    if (isRevealing) return;

    if (allDone && phase === 'spotlight') {
      setPhase('grid');
      return;
    }

    setIsRevealing(true);
    const nextIdx = revealedIndex + 1;
    const nextCard = sortedCards[nextIdx];
    const nextRarity: Rarity = (nextCard?.rarity as Rarity) ?? 'common';

    setRevealedIndex(nextIdx);

    if (nextRarity === 'mythic') {
      playSound('mythicPull');
      triggerFlash('rgba(168,85,247,0.5)', 400);
      await triggerShake();
    } else if (nextRarity === 'rare') {
      playSound('rarePull');
      triggerFlash('rgba(201,162,39,0.4)', 300);
      await triggerShake();
    } else if (nextRarity === 'uncommon') {
      playSound('cardFlip');
      triggerFlash('rgba(96,165,250,0.15)', 200);
    } else {
      playSound('cardFlip');
    }

    setTimeout(() => setIsRevealing(false), nextRarity === 'mythic' ? 600 : nextRarity === 'rare' ? 400 : 200);
  }, [isRevealing, allDone, phase, revealedIndex, sortedCards, playSound, triggerFlash, triggerShake]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'sealed') openPack();
        else if (phase === 'spotlight') handleReveal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, openPack, handleReveal]);

  const handleCollect = () => {
    playSound('win');
    onDone(sortedCards);
  };

  return (
    <motion.div
      animate={screenControls}
      className="flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.22) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 50% 80%, rgba(236,72,153,0.12) 0%, transparent 50%),' +
          'linear-gradient(180deg, #1a1040 0%, #2d1660 40%, #1a1040 100%)',
      }}
    >
      {/* Screen flash overlay */}
      <div
        ref={flashRef}
        className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
        style={{ opacity: 0, mixBlendMode: 'screen' }}
      />

      {/* Background dim on Rare+ reveal */}
      <AnimatePresence>
        {phase === 'spotlight' && isRareOrBetter && revealedIndex >= 0 && (
          <motion.div
            key={`dim-${revealedIndex}`}
            className="fixed inset-0 pointer-events-none z-[5]"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      <div className="starburst-bg" />

      {/* Ambient particles */}
      <div className="cc-particles">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="cc-particle"
            style={{
              left: `${8 + i * 12}%`,
              width: 3,
              height: 3,
              background: i % 2 === 0 ? 'rgba(168,85,247,0.3)' : 'rgba(236,72,153,0.25)',
              animationDuration: `${8 + i * 3}s`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>

      {/* Confetti burst on rare/mythic */}
      <AnimatePresence>
        {phase === 'spotlight' && isRareOrBetter && revealedIndex >= 0 && (
          <>
            {confettiPieces.map((piece, i) => (
              <motion.div
                key={`confetti-${revealedIndex}-${i}`}
                initial={{ y: -30, opacity: 1, rotate: piece.rotate, scale: 1 }}
                animate={{ y: '110vh', opacity: 0, rotate: piece.rotate + 720, scale: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: piece.left,
                  width: piece.size,
                  height: piece.size,
                  borderRadius: i % 3 === 0 ? '50%' : '2px',
                  background: piece.color,
                  zIndex: 40,
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ═══ SEALED PHASE ═══ */}
      {phase === 'sealed' && (
        <motion.div
          className="flex flex-col items-center justify-center flex-1 relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.h1
            className="cc-heading text-4xl sm:text-5xl mb-2"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Booster Pack!
          </motion.h1>
          <p className="cc-subtext mb-10 text-base">15 cards inside. What will you pull?</p>

          {/* Sealed pack visual */}
          <motion.div
            className="relative cursor-pointer mb-10"
            onClick={openPack}
            whileHover={{ scale: 1.06, y: -8 }}
            whileTap={{ scale: 0.95 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
          >
            {/* Glow behind pack */}
            <div
              className="absolute -inset-8 rounded-full blur-3xl opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5), rgba(236,72,153,0.3), transparent)' }}
            />
            <div
              className="relative w-48 h-64 sm:w-56 sm:h-72 rounded-2xl flex flex-col items-center justify-center gap-3 cc-shimmer overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
                border: '4px solid rgba(255,255,255,0.25)',
                boxShadow: '0 6px 0 #6d28d9, 0 10px 30px rgba(124,58,237,0.5), inset 0 2px 0 rgba(255,255,255,0.3)',
              }}
            >
              <span className="text-7xl">🎁</span>
              <span className="text-xl font-black text-white" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                OPEN PACK
              </span>
              <span className="text-xs font-bold text-white/60">Tap to open!</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ SPOTLIGHT PHASE ═══ */}
      {phase === 'spotlight' && (
        <div className="flex flex-col items-center justify-center flex-1 relative z-10 w-full">
          {/* Counter */}
          <motion.div
            className="flex items-center gap-3 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--cc-text-muted)' }}>
              {revealedIndex >= 0 ? `Card ${revealedIndex + 1} of ${sortedCards.length}` : 'Ready to reveal!'}
            </span>
          </motion.div>

          {/* Mini card strip - shows what's been revealed */}
          {revealedIndex >= 0 && (
            <div className="flex gap-1 mb-4 max-w-md overflow-hidden">
              {sortedCards.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= revealedIndex
                      ? RARITY_GLOW_COLOR[sortedCards[i].rarity ?? 'common']
                      : 'rgba(255,255,255,0.08)',
                    minWidth: 8,
                  }}
                />
              ))}
            </div>
          )}

          {/* Spotlight card area */}
          <div className="relative flex items-center justify-center mb-6" style={{ minHeight: 380 }}>
            {/* Rarity glow orb behind card */}
            <AnimatePresence>
              {currentCard && (
                <motion.div
                  key={`glow-${revealedIndex}`}
                  className="absolute rounded-full"
                  style={{
                    width: isMythic ? 400 : isRare ? 350 : 280,
                    height: isMythic ? 400 : isRare ? 350 : 280,
                    background: `radial-gradient(circle, ${RARITY_GLOW_COLOR[currentRarity]}, transparent 70%)`,
                    filter: `blur(${isMythic ? 40 : isRare ? 30 : 20}px)`,
                  }}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{
                    scale: isMythic ? [0.5, 1.3, 1.1] : isRare ? [0.5, 1.2, 1] : [0.6, 1, 0.95],
                    opacity: isMythic ? [0, 1, 0.8] : isRare ? [0, 0.9, 0.7] : [0, 0.5, 0.4],
                  }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            {/* Sparkle ring on rare/mythic */}
            <AnimatePresence>
              {currentCard && isRareOrBetter && (
                <>
                  {sparkRing.map((spark, i) => (
                    <motion.div
                      key={`spark-${revealedIndex}-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: spark.size,
                        height: spark.size,
                        background: isMythic ? '#c084fc' : '#e8c94a',
                        boxShadow: `0 0 6px ${isMythic ? '#a855f7' : '#c9a227'}`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                        x: Math.cos((spark.angle * Math.PI) / 180) * (isMythic ? 180 : 150),
                        y: Math.sin((spark.angle * Math.PI) / 180) * (isMythic ? 180 : 150),
                      }}
                      transition={{ duration: 0.8, delay: spark.delay + 0.1, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Expanding ring on rare/mythic */}
            <AnimatePresence>
              {currentCard && isRareOrBetter && (
                <motion.div
                  key={`ring-${revealedIndex}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 100,
                    height: 100,
                    border: `3px solid ${RARITY_RING_COLOR[currentRarity]}`,
                  }}
                  initial={{ scale: 0.3, opacity: 0.8 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>

            {/* The card */}
            <AnimatePresence mode="wait">
              {currentCard && (
                <motion.div
                  key={`card-${revealedIndex}`}
                  initial={{
                    scale: 0.2,
                    rotateY: 180,
                    opacity: 0,
                    y: 120,
                  }}
                  animate={{
                    scale: isMythic ? 1.05 : isRare ? 1.02 : 1,
                    rotateY: 0,
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{ scale: 0.5, opacity: 0, x: -200 }}
                  transition={{
                    type: 'spring',
                    stiffness: isMythic ? 120 : isRare ? 150 : 200,
                    damping: isMythic ? 8 : isRare ? 10 : 16,
                  }}
                  className="relative z-10"
                  style={{ perspective: 1000 }}
                >
                  {/* Mythic continuous glow pulse */}
                  {isMythic && (
                    <motion.div
                      className="absolute -inset-3 rounded-2xl pointer-events-none z-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(236,72,153,0.3), rgba(59,130,246,0.3))',
                        filter: 'blur(12px)',
                      }}
                      animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                  )}
                  {isRare && !isMythic && (
                    <motion.div
                      className="absolute -inset-2 rounded-2xl pointer-events-none z-0"
                      style={{
                        background: 'rgba(201,162,39,0.25)',
                        filter: 'blur(10px)',
                      }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    />
                  )}
                  <GameCard card={currentCard} scale="inspect" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pre-reveal: face-down card */}
            {revealedIndex < 0 && (
              <motion.div
                className="relative z-10 cursor-pointer"
                onClick={handleReveal}
                animate={{ y: [0, -8, 0], rotateZ: [0, 1, -1, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="absolute -inset-6 rounded-full blur-3xl opacity-30"
                  style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent)' }}
                />
                <GameCard card={sortedCards[0]} faceDown scale="inspect" />
              </motion.div>
            )}
          </div>

          {/* Rarity badge + card name */}
          <AnimatePresence>
            {currentCard && (
              <motion.div
                key={`info-${revealedIndex}`}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 text-center"
              >
                <motion.span
                  className="inline-block text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-white shadow-lg"
                  style={{
                    background: RARITY_LABEL_BG[currentRarity],
                    boxShadow: isRareOrBetter
                      ? `0 0 20px ${RARITY_GLOW_COLOR[currentRarity]}`
                      : 'none',
                    textShadow: isMythic
                      ? '0 0 12px rgba(168,85,247,0.8), 0 0 24px rgba(168,85,247,0.4)'
                      : isRare
                      ? '0 0 10px rgba(201,162,39,0.7), 0 0 20px rgba(201,162,39,0.3)'
                      : 'none',
                  }}
                  initial={isRareOrBetter ? { scale: 0.6, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                  animate={isRareOrBetter
                    ? { scale: [0.6, 1.3, 1.05], opacity: 1 }
                    : { scale: 1, opacity: 1 }
                  }
                  transition={isRareOrBetter
                    ? { duration: 0.5, ease: 'easeOut', times: [0, 0.6, 1] }
                    : { duration: 0.2 }
                  }
                >
                  {currentRarity}
                </motion.span>
                <motion.p
                  className="text-white font-black text-xl mt-2"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isMythic ? [0.8, 1.15, 1.05] : [0.8, 1.05, 1] }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {currentCard.name}
                </motion.p>
                {currentCard.type === 'creature' && 'strength' in currentCard && (
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--cc-text-muted)' }}>
                    Strength {(currentCard as { strength: number }).strength}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reveal button */}
          {!allDone ? (
            <motion.button
              onClick={handleReveal}
              disabled={isRevealing}
              className={`relative px-10 py-4 text-xl cc-shimmer overflow-hidden ${
                isRevealing ? 'opacity-60 cursor-wait' : ''
              } ${revealedIndex < 0 ? 'cc-btn-magic' : 'cc-btn-reward'}`}
              whileHover={!isRevealing ? { scale: 1.08, y: -2 } : {}}
              whileTap={!isRevealing ? { scale: 0.9 } : {}}
              animate={!isRevealing ? { scale: [1, 1.04, 1] } : {}}
              transition={{ scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' } }}
            >
              <span className="relative z-10">
                {revealedIndex < 0 ? 'Reveal!' : 'Next!'}
              </span>
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setPhase('grid')}
              className="cc-btn-primary relative px-10 py-4 text-xl cc-shimmer overflow-hidden"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">View All Cards!</span>
            </motion.button>
          )}
        </div>
      )}

      {/* ═══ GRID PHASE ═══ */}
      {phase === 'grid' && (
        <div className="flex flex-col items-center relative z-10 w-full py-6">
          <motion.h2
            className="cc-heading text-3xl sm:text-4xl mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Your Pack!
          </motion.h2>
          <p className="cc-subtext mb-6">{sortedCards.length} cards collected</p>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 max-w-4xl w-full px-2">
            {sortedCards.map((card, i) => (
              <motion.div
                key={`grid-${card.id}-${i}`}
                initial={{ scale: 0, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 250, damping: 18 }}
                whileHover={{ scale: 1.1, y: -8, zIndex: 20 }}
                className="relative"
                onMouseEnter={() => setInspectedCard(card)}
                onMouseLeave={() => setInspectedCard(null)}
              >
                <GameCard card={card} scale="sm" />
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleCollect}
            className="cc-btn-reward relative mt-8 px-10 py-4 text-xl cc-shimmer overflow-hidden"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Collect All!</span>
          </motion.button>
        </div>
      )}

      {/* Floating inspect panel */}
      <AnimatePresence>
        {inspectedCard && phase === 'grid' && (
          <motion.div
            className="fixed right-4 top-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0, x: 40, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: 40, y: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div
              className="rounded-2xl p-1"
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
    </motion.div>
  );
}
