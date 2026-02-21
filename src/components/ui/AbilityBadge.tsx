'use client';

import { Ability, ABILITY_ICONS, ABILITY_LABELS } from '@/types';

interface AbilityBadgeProps {
  ability: Ability;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const iconSizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

const padSizes = {
  sm: 'px-1 py-0.5',
  md: 'px-1.5 py-0.5',
  lg: 'px-2 py-1',
};

const labelSizes = {
  sm: 'text-[8px]',
  md: 'text-[10px]',
  lg: 'text-xs',
};

const bgColors: Record<Ability, string> = {
  fast: 'bg-amber-400',
  big: 'bg-red-500',
  fly: 'bg-sky-400',
  guard: 'bg-emerald-500',
  none: '',
};

export default function AbilityBadge({ ability, size = 'md', showLabel = false }: AbilityBadgeProps) {
  if (ability === 'none') return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold text-white shadow-md ${bgColors[ability]} ${padSizes[size]}`}
      title={ABILITY_LABELS[ability]}
    >
      <span className={iconSizes[size]}>{ABILITY_ICONS[ability]}</span>
      {showLabel && (
        <span className={`${labelSizes[size]} font-extrabold uppercase tracking-wider`}>
          {ABILITY_LABELS[ability]}
        </span>
      )}
    </span>
  );
}
