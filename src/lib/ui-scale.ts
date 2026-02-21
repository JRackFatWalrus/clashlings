import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIScalePreset = 'kid' | 'normal' | 'compact';

const SCALE_MULTIPLIERS: Record<UIScalePreset, number> = {
  kid: 1.15,
  normal: 1.0,
  compact: 0.85,
};

interface ScaledSizes {
  cardW: Record<string, number>;
  cardH: Record<string, number>;
}

const BASE_CARD_SIZES = {
  xs:  { w: 76,  h: 106 },
  sm:  { w: 155, h: 220 },
  md:  { w: 185, h: 262 },
  lg:  { w: 220, h: 310 },
  xl:  { w: 260, h: 368 },
};

export function getScaledSizes(preset: UIScalePreset): ScaledSizes {
  const m = SCALE_MULTIPLIERS[preset];
  const cardW: Record<string, number> = {};
  const cardH: Record<string, number> = {};
  for (const [tier, base] of Object.entries(BASE_CARD_SIZES)) {
    cardW[tier] = Math.round(base.w * m);
    cardH[tier] = Math.round(base.h * m);
  }
  return { cardW, cardH };
}

export function getFontScale(preset: UIScalePreset): number {
  return SCALE_MULTIPLIERS[preset];
}

interface UIScaleStore {
  preset: UIScalePreset;
  setPreset: (p: UIScalePreset) => void;
}

export const useUIScale = create<UIScaleStore>()(
  persist(
    (set) => ({
      preset: 'kid',
      setPreset: (preset) => set({ preset }),
    }),
    { name: 'cc-ui-scale' },
  ),
);
