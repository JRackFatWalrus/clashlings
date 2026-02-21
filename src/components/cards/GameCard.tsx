'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CreatureCard,
  ShapeCard,
  ItemCard,
  Rarity,
  Ability,
  FACTION_CONFIG,
  RARITY_CONFIG,
  ABILITY_ICONS,
  ABILITY_LABELS,
  ITEM_EFFECT_CONFIG,
} from '@/types';
import ShapeIcon from '@/components/ui/ShapeIcon';
import { useUIScale, getScaledSizes } from '@/lib/ui-scale';
import { getFallbackImageUrl } from '@/lib/card-data';

// ── Size tier system ──────────────────────────────────────────
export type CardScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inspect';

interface SizeCfg {
  w: string;
  h: string;
  wPx: number;
  hPx: number;
  name: string;
  strength: string;
  shapeIcon: number;
  watermark: number;
  artHint: string;
  emojiSize: string;
  showTextBox: boolean;
  textBoxFont: string;
  abilityFont: string;
  topPad: string;
  bottomPad: string;
}

function buildSizeMap(preset: 'kid' | 'normal' | 'compact'): Record<CardScale, SizeCfg> {
  const s = getScaledSizes(preset);
  return {
    xs:      { w: `w-[${s.cardW.xs}px]`,  h: `h-[${s.cardH.xs}px]`,  wPx: s.cardW.xs,  hPx: s.cardH.xs,  name: 'text-[9px]',   strength: 'w-6 h-6 text-xs',       shapeIcon: 9,   watermark: 30,  artHint: `${s.cardW.xs}px`,   emojiSize: 'text-2xl',  showTextBox: false, textBoxFont: '',             abilityFont: '',              topPad: 'px-1 py-0.5',   bottomPad: 'px-1 py-0.5' },
    sm:      { w: `w-[${s.cardW.sm}px]`,  h: `h-[${s.cardH.sm}px]`,  wPx: s.cardW.sm,  hPx: s.cardH.sm,  name: 'text-sm',      strength: 'w-8 h-8 text-base',     shapeIcon: 14,  watermark: 65,  artHint: `${s.cardW.sm}px`,   emojiSize: 'text-4xl',  showTextBox: true,  textBoxFont: 'text-xs',      abilityFont: 'text-sm',       topPad: 'px-2 py-1',     bottomPad: 'px-2 py-1' },
    md:      { w: `w-[${s.cardW.md}px]`,  h: `h-[${s.cardH.md}px]`,  wPx: s.cardW.md,  hPx: s.cardH.md,  name: 'text-base',    strength: 'w-10 h-10 text-xl',     shapeIcon: 16,  watermark: 80,  artHint: `${s.cardW.md}px`,   emojiSize: 'text-5xl',  showTextBox: true,  textBoxFont: 'text-sm',      abilityFont: 'text-base',     topPad: 'px-2.5 py-1',   bottomPad: 'px-2.5 py-1.5' },
    lg:      { w: `w-[${s.cardW.lg}px]`,  h: `h-[${s.cardH.lg}px]`,  wPx: s.cardW.lg,  hPx: s.cardH.lg,  name: 'text-lg',      strength: 'w-12 h-12 text-2xl',    shapeIcon: 20,  watermark: 100, artHint: `${s.cardW.lg}px`,   emojiSize: 'text-5xl',  showTextBox: true,  textBoxFont: 'text-base',    abilityFont: 'text-lg',       topPad: 'px-3 py-1.5',   bottomPad: 'px-3 py-2' },
    xl:      { w: `w-[${s.cardW.xl}px]`,  h: `h-[${s.cardH.xl}px]`,  wPx: s.cardW.xl,  hPx: s.cardH.xl,  name: 'text-xl',      strength: 'w-14 h-14 text-3xl',    shapeIcon: 24,  watermark: 120, artHint: `${s.cardW.xl}px`,   emojiSize: 'text-6xl',  showTextBox: true,  textBoxFont: 'text-lg',      abilityFont: 'text-xl',       topPad: 'px-3.5 py-2',   bottomPad: 'px-3.5 py-2.5' },
    inspect: { w: 'w-auto',               h: 'h-[70vh]',             wPx: 0,           hPx: 0,           name: 'text-2xl',     strength: 'w-16 h-16 text-4xl',    shapeIcon: 28,  watermark: 150, artHint: '400px',             emojiSize: 'text-8xl',  showTextBox: true,  textBoxFont: 'text-xl',      abilityFont: 'text-2xl',      topPad: 'px-5 py-3',     bottomPad: 'px-5 py-3' },
  };
}

const ABILITY_RULES: Record<Ability, string> = {
  fast: 'Hits first in a fight.',
  fly: 'Can fly over blockers.',
  big: 'Extra damage pushes through.',
  guard: 'Must be attacked first.',
  none: '',
};

const SIGHT_WORDS: Record<Ability, string> = {
  fast: 'I hit first!',
  fly: 'I can fly!',
  big: 'I am big!',
  guard: 'Attack me first!',
  none: 'I am ready!',
};

interface GameCardProps {
  card: Card;
  faceDown?: boolean;
  selected?: boolean;
  glowing?: boolean;
  tapped?: boolean;
  /** @deprecated Use `scale` instead */
  small?: boolean;
  /** @deprecated Use `scale` instead */
  large?: boolean;
  scale?: CardScale;
  onClick?: () => void;
}

const CREATURE_EMOJIS: Record<string, string> = {
  bug: '🐛', bee: '🐝', bat: '🦇', jay: '🐦', owl: '🦉',
  crow: '🐦‍⬛', dove: '🕊️', hawk: '🦅', eagle: '🦅', swan: '🦢',
  phoenix: '🔥', dragon: '🐉', pig: '🐷', ram: '🐏', cow: '🐄',
  yak: '🦬', bear: '🐻', moose: '🫎', rhino: '🦏', hippo: '🦛',
  gorilla: '🦍', elephant: '🐘', whale: '🐋', ant: '🐜', mouse: '🐭',
  fox: '🦊', hare: '🐰', deer: '🦌', horse: '🐴', wolf: '🐺',
  puma: '🐆', tiger: '🐯', cheetah: '🐆', lion: '🦁', worm: '🪱',
  hen: '🐔', cat: '🐱', dog: '🐶', duck: '🦆', goat: '🐐',
  pony: '🐴', seal: '🦭', croc: '🐊', dino: '🦕', rex: '🦖',
  frog: '🐸', fish: '🐟', panda: '🐼', turtle: '🐢',
  unicorn: '🦄', griffin: '🦅',
};

const RARITY_GEM_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#60a5fa',
  rare: '#c9a227',
  mythic: '#a855f7',
};

export default function GameCard({
  card,
  faceDown = false,
  selected = false,
  glowing = false,
  tapped = false,
  small = false,
  large = false,
  scale,
  onClick,
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const uiPreset = useUIScale((s) => s.preset);
  const sizeMap = useMemo(() => buildSizeMap(uiPreset), [uiPreset]);

  const resolvedScale: CardScale = scale
    ? scale
    : large ? 'xl'
    : small ? 'sm'
    : 'md';

  const sz = sizeMap[resolvedScale];
  const isXs = resolvedScale === 'xs';
  const isInspect = resolvedScale === 'inspect';

  const isCreature = card.type === 'creature';
  const isShape = card.type === 'shape';
  const isItem = card.type === 'item';

  const creature = isCreature ? (card as CreatureCard) : null;
  const shape = isShape ? (card as ShapeCard) : null;
  const item = isItem ? (card as ItemCard) : null;

  const cardShape = isCreature
    ? creature!.shape
    : isShape
      ? shape!.shape
      : 'diamond';

  const faction = FACTION_CONFIG[cardShape];
  const rarity: Rarity = card.rarity ?? 'common';
  const rarityConfig = RARITY_CONFIG[rarity];

  const primaryImage = card.cutoutUrl ?? card.imageUrl;
  const fallbackImage = useFallback ? getFallbackImageUrl(card) : null;
  const displayImage = useFallback ? fallbackImage : primaryImage;
  const hasImage = !!displayImage && !imgError;

  const handleImgError = () => {
    if (!useFallback && primaryImage) {
      setUseFallback(true);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GameCard] Primary image failed for ${card.id}, trying fallback`);
      }
    } else {
      setImgError(true);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GameCard] All images failed for ${card.id}: ${primaryImage}`);
      }
    }
  };

  const cardDimStyle: React.CSSProperties = isInspect
    ? { height: '70vh', aspectRatio: '5 / 7' }
    : { width: sz.wPx, height: sz.hPx };

  // ── Face-down ────────────────────────────────────────────
  if (faceDown) {
    return (
      <motion.div
        className="rounded-xl border-4 border-blue-400 shadow-lg overflow-hidden cursor-default relative"
        style={{
          ...cardDimStyle,
          background: 'linear-gradient(135deg, #1a1040 0%, #2d1660 50%, #1a1040 100%)',
          boxShadow: '0 6px 0 #4c1d95, 0 10px 30px rgba(124,58,237,0.4), inset 0 2px 0 rgba(255,255,255,0.15)',
        }}
        whileHover={{ scale: 1.05 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/card-back.png"
          alt="Card back"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
          }}
        />
      </motion.div>
    );
  }

  // ── Item card ────────────────────────────────────────────
  if (isItem && item) {
    const effectCfg = ITEM_EFFECT_CONFIG[item.effect];
    return (
      <motion.div
        onClick={onClick}
        className={`
          rounded-xl border-4 flex flex-col overflow-hidden cursor-pointer select-none relative
          ${rarityConfig.sheenClass}
          ${selected ? 'ring-4 ring-blue-300 ring-offset-2 ring-offset-transparent' : ''}
          ${glowing ? 'card-playable-glow' : ''}
        `}
        style={{
          ...cardDimStyle,
          borderColor: effectCfg.color,
          backgroundColor: '#152040',
          boxShadow: `inset 0 2px 6px rgba(255,255,255,0.12), inset 0 -2px 6px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5)`,
        }}
        whileHover={{ scale: 1.08, y: -8, rotateZ: 0.5 }}
        whileTap={{ scale: 0.95 }}
        layout
      >
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-xl"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.04) 100%)',
          }}
        />

        <div
          className={`flex items-center justify-center ${sz.topPad} shrink-0`}
          style={{
            background: `linear-gradient(135deg, ${effectCfg.color}44, ${effectCfg.color}22)`,
          }}
        >
          <span className={`${isXs ? 'text-[7px]' : 'text-[10px]'} font-black text-white/80 uppercase tracking-wider`}>
            ITEM
          </span>
        </div>

        <div
          className="flex-1 flex flex-col items-center justify-center gap-1 relative overflow-hidden"
          style={{ backgroundColor: `${effectCfg.color}11` }}
        >
          <span className={sz.emojiSize}>
            {effectCfg.icon}
          </span>
          {!isXs && (
            <span className={`${sz.textBoxFont} text-white/60 text-center px-2 leading-tight`}>
              {item.description}
            </span>
          )}
        </div>

        <div
          className={`flex items-center justify-center ${sz.bottomPad} shrink-0`}
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,0.6), ${effectCfg.color}44)`,
          }}
        >
          <span
            className={`${sz.name} font-bold text-white`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {item.name}
          </span>
        </div>
      </motion.div>
    );
  }

  // ── Creature + Shape card ────────────────────────────────
  return (
    <motion.div
      onClick={onClick}
      className={`
        rounded-xl border-4 flex flex-col overflow-hidden cursor-pointer select-none relative
        ${rarityConfig.sheenClass}
        ${selected ? 'ring-4 ring-blue-300 ring-offset-2 ring-offset-transparent' : ''}
        ${glowing ? 'card-playable-glow' : ''}
        ${tapped ? 'opacity-60 rotate-6' : ''}
      `}
      style={{
        ...cardDimStyle,
        borderColor: rarity === 'mythic' ? '#9333ea' : rarity === 'rare' ? '#c9a227' : faction.accentColor,
        backgroundColor: '#152040',
        boxShadow: [
          'inset 0 1px 3px rgba(255,255,255,0.15)',
          'inset 0 -2px 4px rgba(0,0,0,0.5)',
          '0 4px 12px rgba(0,0,0,0.6)',
          '0 1px 3px rgba(0,0,0,0.4)',
          rarity === 'mythic' ? '0 0 18px rgba(168,85,247,0.4), 0 0 30px rgba(168,85,247,0.15)' : '',
          rarity === 'rare' ? '0 0 12px rgba(201,162,39,0.3)' : '',
          rarity === 'uncommon' ? '0 0 8px rgba(192,192,192,0.15)' : '',
        ].filter(Boolean).join(', '),
        outline: rarity === 'uncommon' ? '1px solid rgba(192,192,192,0.3)' : rarity === 'rare' ? '1px solid rgba(201,162,39,0.25)' : 'none',
        outlineOffset: '-5px',
      }}
      whileHover={{ scale: 1.08, y: -8, rotateZ: 0.5 }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      {/* Bevel highlight: bright top edge, dark bottom edge */}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-xl"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 8%, transparent 30%, transparent 75%, rgba(0,0,0,0.08) 92%, rgba(0,0,0,0.15) 100%)`,
        }}
      />
      {/* Micro noise texture */}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-xl"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {isCreature && creature && (
        <>
          {/* ── TOP: Name (left) + Cost (right) ── */}
          <div
            className={`flex items-center justify-between ${sz.topPad} shrink-0`}
            style={{
              background: `linear-gradient(135deg, ${faction.gradientFrom}cc, ${faction.gradientTo}88)`,
            }}
          >
            <div className="flex-1 min-w-0 mr-1 overflow-hidden">
              <span
                className="font-black text-white leading-tight block truncate"
                style={{
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  fontSize: isXs ? '8px' : 'clamp(10px, 1.4vw, 18px)',
                }}
              >
                {creature.name}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {creature.cost <= 4 ? (
                Array.from({ length: creature.cost }).map((_, i) => (
                  <ShapeIcon key={i} shape={creature.shape} size={sz.shapeIcon} />
                ))
              ) : (
                <>
                  <span
                    className="font-black text-white"
                    style={{
                      fontSize: isXs ? '9px' : 'clamp(11px, 1.2vw, 16px)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    }}
                  >
                    {creature.cost}
                  </span>
                  <ShapeIcon shape={creature.shape} size={sz.shapeIcon} />
                </>
              )}
            </div>
          </div>

          {/* ── ART window (~50%) ── */}
          <div
            style={{
              flex: '1 1 0%',
              display: 'grid',
              overflow: 'hidden',
              minHeight: 0,
              backgroundColor: faction.bgTint,
              boxShadow: `inset 0 3px 10px rgba(0,0,0,0.5), inset 0 -3px 10px rgba(0,0,0,0.3)`,
              borderTop: `2px solid ${faction.accentColor}33`,
              borderBottom: `2px solid ${faction.accentColor}33`,
            }}
          >
            {hasImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={displayImage!}
                alt={creature.name}
                onError={handleImgError}
                draggable={false}
                style={{
                  gridArea: '1 / 1',
                  width: '100%',
                  height: '100%',
                  minHeight: 0,
                  minWidth: 0,
                  objectFit: 'cover',
                  objectPosition: 'center 30%',
                }}
              />
            ) : (
              <div style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className={`${sz.emojiSize} drop-shadow-lg`}>
                  {CREATURE_EMOJIS[creature.baseCreature] || '🐾'}
                </span>
              </div>
            )}
          </div>

          {/* ── TEXT BOX: always visible on sm+ ── */}
          {!isXs && (
            <div
              className="flex flex-col items-center justify-center py-1.5 shrink-0"
              style={{
                background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.55) 30%, ${faction.accentColor}12 100%)`,
                borderTop: `2px solid ${faction.accentColor}66`,
                margin: '0 4px',
                padding: '6px 8px',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderTopColor: `${faction.accentColor}66`,
                borderTopWidth: '2px',
                borderRadius: 4,
              }}
            >
              {creature.ability !== 'none' ? (
                <>
                  <span
                    className="font-black uppercase tracking-wider leading-tight"
                    style={{
                      color: faction.accentColor,
                      textShadow: `0 0 8px ${faction.accentColor}60`,
                      fontSize: 'clamp(11px, 1.3vw, 18px)',
                    }}
                  >
                    {ABILITY_ICONS[creature.ability]} {ABILITY_LABELS[creature.ability]}
                  </span>
                  <span
                    className="text-white/60 leading-snug text-center mt-0.5"
                    style={{ fontSize: 'clamp(10px, 1.1vw, 15px)' }}
                  >
                    {ABILITY_RULES[creature.ability]}
                  </span>
                </>
              ) : (
                <span
                  className="text-white/40 leading-snug text-center italic"
                  style={{ fontSize: 'clamp(10px, 1.1vw, 14px)' }}
                >
                  No special ability.
                </span>
              )}
              {(creature.sightWordLine || SIGHT_WORDS[creature.ability]) && (
                <span
                  className="italic text-white/90 leading-tight text-center mt-1"
                  style={{
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    fontSize: 'clamp(10px, 1.2vw, 16px)',
                  }}
                >
                  &ldquo;{creature.sightWordLine || SIGHT_WORDS[creature.ability]}&rdquo;
                </span>
              )}
            </div>
          )}

          {/* ── FOOTER: Rarity gem (left) + Power plate (right) ── */}
          <div
            className={`flex items-center justify-between ${sz.bottomPad} shrink-0`}
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.5), ${faction.accentColor}33)`,
            }}
          >
            {/* Rarity gem (always visible, sized per tier) */}
            <span
              className={`shrink-0 ${rarity === 'mythic' ? 'rarity-gem-pulse' : ''}`}
              style={{
                width: isXs ? 8
                  : rarity === 'mythic' ? 'clamp(16px, 1.6vw, 22px)'
                  : rarity === 'rare' ? 'clamp(14px, 1.4vw, 20px)'
                  : rarity === 'uncommon' ? 'clamp(12px, 1.2vw, 18px)'
                  : 'clamp(10px, 1vw, 14px)',
                height: isXs ? 10
                  : rarity === 'mythic' ? 'clamp(20px, 2vw, 28px)'
                  : rarity === 'rare' ? 'clamp(17px, 1.7vw, 24px)'
                  : rarity === 'uncommon' ? 'clamp(14px, 1.4vw, 21px)'
                  : 'clamp(12px, 1.2vw, 16px)',
                backgroundColor: RARITY_GEM_COLORS[rarity],
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'inline-block',
                filter: rarity === 'mythic' ? 'brightness(1.3) drop-shadow(0 0 6px rgba(168,85,247,0.7))'
                  : rarity === 'rare' ? 'brightness(1.2) drop-shadow(0 0 4px rgba(201,162,39,0.6))'
                  : rarity === 'uncommon' ? 'drop-shadow(0 0 3px rgba(96,165,250,0.4))'
                  : 'none',
              }}
            />

            {/* Power stat plate */}
            <span
              className="font-black flex items-center justify-center shrink-0"
              style={{
                backgroundColor: faction.accentColor,
                color: '#fff',
                borderRadius: 8,
                padding: isXs ? '1px 6px' : 'clamp(3px, 0.5vw, 6px) clamp(8px, 1.2vw, 18px)',
                fontSize: isXs ? '11px' : 'clamp(14px, 1.6vw, 26px)',
                boxShadow: `0 2px 6px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 0 10px ${faction.accentColor}40`,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                border: `1px solid rgba(255,255,255,0.18)`,
                lineHeight: 1.2,
              }}
            >
              {creature.strength}
            </span>
          </div>
        </>
      )}

      {isShape && shape && (
        <>
          {/* ── Shape top bar ── */}
          <div
            className={`flex items-center justify-center ${sz.topPad} shrink-0`}
            style={{
              background: `linear-gradient(135deg, ${faction.gradientFrom}aa, ${faction.gradientTo}55)`,
            }}
          >
            <span className={`${isXs ? 'text-[7px]' : sz.textBoxFont || 'text-[10px]'} font-semibold text-white/80 tracking-wider`}>
              {faction.name}
            </span>
          </div>

          {/* ── Shape art ── */}
          <div
            style={{
              flex: '1 1 0%',
              display: 'grid',
              overflow: 'hidden',
              minHeight: 0,
              backgroundColor: faction.bgTint,
            }}
          >
            {hasImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={displayImage!}
                alt={shape.name}
                onError={handleImgError}
                draggable={false}
                style={{
                  gridArea: '1 / 1',
                  width: '100%',
                  height: '100%',
                  minHeight: 0,
                  minWidth: 0,
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            ) : (
              <div style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShapeIcon shape={shape.shape} size={sz.watermark} />
              </div>
            )}
          </div>

          {/* ── Shape bottom bar ── */}
          <div
            className={`flex items-center justify-center ${sz.bottomPad} shrink-0`}
            style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.6), ${faction.accentColor}44)`,
            }}
          >
            <span
              className={`${sz.name} font-bold text-white`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {shape.name}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
}
