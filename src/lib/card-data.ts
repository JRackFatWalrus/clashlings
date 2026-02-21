import { Card, CreatureCard, ShapeCard, ItemCard, Rarity, Shape, Ability, FACTION_COLORS } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const ART_VERSION = 'v4';

function cardImageUrl(id: string): string | null {
  return SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/card-art/set1/${ART_VERSION}/${id}.png`
    : null;
}

function rarityFromStrength(strength: number): Rarity {
  if (strength >= 9) return 'mythic';
  if (strength >= 7) return 'rare';
  if (strength >= 4) return 'uncommon';
  return 'common';
}

function costFromStrength(strength: number): number {
  if (strength >= 7) return 3;
  if (strength >= 4) return 2;
  return 1;
}

const SHAPE_ABILITY: Record<Shape, Ability> = {
  star: 'fly',
  square: 'big',
  triangle: 'fast',
  circle: 'guard',
  diamond: 'none',
};

const FACTION_PREFIX: Record<Shape, string> = {
  star: 'fly',
  square: 'big',
  triangle: 'fast',
  circle: 'grd',
  diamond: 'dia',
};

const creature = (
  id: string,
  baseCreature: string,
  strength: number,
  cost: number,
  shape: Shape,
  ability: Ability,
): CreatureCard => ({
  id,
  type: 'creature',
  name: `${FACTION_COLORS[shape]} ${baseCreature.charAt(0).toUpperCase() + baseCreature.slice(1)}`,
  baseCreature,
  color: FACTION_COLORS[shape],
  strength,
  cost,
  shape,
  ability,
  rarity: rarityFromStrength(strength),
  art: `/cards/${id}.png`,
  imageUrl: cardImageUrl(id),
});

// ── Original creatures (IDs are IMMUTABLE) ────────────────────

export const FLYING_CREATURES: CreatureCard[] = [
  creature('fly-bug',     'bug',     1, 1, 'star', 'fly'),
  creature('fly-bee',     'bee',     2, 1, 'star', 'fly'),
  creature('fly-bat',     'bat',     3, 1, 'star', 'fly'),
  creature('fly-jay',     'jay',     4, 2, 'star', 'fly'),
  creature('fly-owl',     'owl',     4, 2, 'star', 'fly'),
  creature('fly-crow',    'crow',    5, 2, 'star', 'fly'),
  creature('fly-dove',    'dove',    5, 2, 'star', 'fly'),
  creature('fly-hawk',    'hawk',    6, 2, 'star', 'fly'),
  creature('fly-eagle',   'eagle',   7, 3, 'star', 'fly'),
  creature('fly-swan',    'swan',    8, 3, 'star', 'fly'),
  creature('fly-phoenix', 'phoenix', 9, 3, 'star', 'fly'),
  creature('fly-dragon',  'dragon', 10, 3, 'star', 'fly'),
];

export const BIG_CREATURES: CreatureCard[] = [
  creature('big-pig',      'pig',      1, 1, 'square', 'big'),
  creature('big-ram',      'ram',      2, 1, 'square', 'big'),
  creature('big-cow',      'cow',      3, 1, 'square', 'big'),
  creature('big-yak',      'yak',      4, 2, 'square', 'big'),
  creature('big-bear',     'bear',     5, 2, 'square', 'big'),
  creature('big-moose',    'moose',    5, 2, 'square', 'big'),
  creature('big-rhino',    'rhino',    6, 2, 'square', 'big'),
  creature('big-hippo',    'hippo',    7, 3, 'square', 'big'),
  creature('big-gorilla',  'gorilla',  8, 3, 'square', 'big'),
  creature('big-elephant', 'elephant', 9, 3, 'square', 'big'),
  creature('big-whale',    'whale',   10, 3, 'square', 'big'),
];

export const FAST_CREATURES: CreatureCard[] = [
  creature('fast-ant',     'ant',     1, 1, 'triangle', 'fast'),
  creature('fast-mouse',   'mouse',   2, 1, 'triangle', 'fast'),
  creature('fast-fox',     'fox',     3, 1, 'triangle', 'fast'),
  creature('fast-hare',    'hare',    4, 2, 'triangle', 'fast'),
  creature('fast-deer',    'deer',    4, 2, 'triangle', 'fast'),
  creature('fast-horse',   'horse',   5, 2, 'triangle', 'fast'),
  creature('fast-wolf',    'wolf',    6, 2, 'triangle', 'fast'),
  creature('fast-puma',    'puma',    7, 3, 'triangle', 'fast'),
  creature('fast-tiger',   'tiger',   8, 3, 'triangle', 'fast'),
  creature('fast-cheetah', 'cheetah', 9, 3, 'triangle', 'fast'),
  creature('fast-lion',    'lion',   10, 3, 'triangle', 'fast'),
];

export const GUARD_CREATURES: CreatureCard[] = [
  creature('grd-worm', 'worm', 1, 1, 'circle', 'guard'),
  creature('grd-hen',  'hen',  2, 1, 'circle', 'guard'),
  creature('grd-cat',  'cat',  3, 1, 'circle', 'guard'),
  creature('grd-dog',  'dog',  4, 2, 'circle', 'guard'),
  creature('grd-duck', 'duck', 4, 2, 'circle', 'guard'),
  creature('grd-goat', 'goat', 5, 2, 'circle', 'guard'),
  creature('grd-pony', 'pony', 6, 2, 'circle', 'guard'),
  creature('grd-seal', 'seal', 7, 3, 'circle', 'guard'),
  creature('grd-croc', 'croc', 8, 3, 'circle', 'guard'),
  creature('grd-dino', 'dino', 9, 3, 'circle', 'guard'),
  creature('grd-rex',  'rex', 10, 3, 'circle', 'guard'),
];

export const DIAMOND_CREATURES: CreatureCard[] = [
  creature('dia-frog',    'frog',    2, 1, 'diamond', 'fast'),
  creature('dia-fish',    'fish',    3, 1, 'diamond', 'fly'),
  creature('dia-panda',   'panda',   5, 2, 'diamond', 'big'),
  creature('dia-turtle',  'turtle',  4, 2, 'diamond', 'guard'),
  creature('dia-unicorn', 'unicorn', 7, 3, 'diamond', 'fly'),
  creature('dia-griffin',  'griffin', 8, 3, 'diamond', 'fast'),
];

const ORIGINAL_CREATURES: CreatureCard[] = [
  ...FLYING_CREATURES,
  ...BIG_CREATURES,
  ...FAST_CREATURES,
  ...GUARD_CREATURES,
  ...DIAMOND_CREATURES,
];

// ── Variant generator ─────────────────────────────────────────

const ALL_SHAPES: Shape[] = ['star', 'square', 'triangle', 'circle', 'diamond'];

const DIAMOND_ABILITY_CYCLE: Ability[] = ['fast', 'fly', 'big', 'guard'];

function createVariant(
  baseCreature: string,
  strength: number,
  targetShape: Shape,
  targetAbility: Ability,
): CreatureCard {
  const prefix = FACTION_PREFIX[targetShape];
  const id = `v-${prefix}-${baseCreature}`;
  return creature(id, baseCreature, strength, costFromStrength(strength), targetShape, targetAbility);
}

function generateAllVariants(): CreatureCard[] {
  const variants: CreatureCard[] = [];
  const existingKeys = new Set(ORIGINAL_CREATURES.map(c => `${c.shape}-${c.baseCreature}`));

  let diamondIdx = 0;

  for (const orig of ORIGINAL_CREATURES) {
    for (const targetShape of ALL_SHAPES) {
      const key = `${targetShape}-${orig.baseCreature}`;
      if (existingKeys.has(key)) continue;

      let ability: Ability;
      if (targetShape === 'diamond') {
        ability = DIAMOND_ABILITY_CYCLE[diamondIdx % DIAMOND_ABILITY_CYCLE.length];
        diamondIdx++;
      } else {
        ability = SHAPE_ABILITY[targetShape];
      }

      variants.push(createVariant(orig.baseCreature, orig.strength, targetShape, ability));
      existingKeys.add(key);
    }
  }

  return variants;
}

const VARIANT_CREATURES: CreatureCard[] = generateAllVariants();

export const ALL_CREATURES: CreatureCard[] = [
  ...ORIGINAL_CREATURES,
  ...VARIANT_CREATURES,
];

// ── Item cards ────────────────────────────────────────────────

export const ITEM_CARDS: ItemCard[] = [
  {
    id: 'item-shield',
    type: 'item',
    name: 'Shield',
    effect: 'shield',
    description: 'Block 1 damage next attack',
    rarity: 'uncommon',
    art: '/cards/item-shield.png',
    imageUrl: cardImageUrl('item-shield'),
  },
  {
    id: 'item-heal',
    type: 'item',
    name: 'Heal',
    effect: 'heal',
    description: 'Gain 1 heart',
    rarity: 'uncommon',
    art: '/cards/item-heal.png',
    imageUrl: cardImageUrl('item-heal'),
  },
  {
    id: 'item-boost',
    type: 'item',
    name: 'Boost',
    effect: 'boost',
    description: '+2 power this turn',
    rarity: 'rare',
    art: '/cards/item-boost.png',
    imageUrl: cardImageUrl('item-boost'),
  },
  {
    id: 'item-swap',
    type: 'item',
    name: 'Swap',
    effect: 'swap',
    description: 'Return a creature to hand',
    rarity: 'rare',
    art: '/cards/item-swap.png',
    imageUrl: cardImageUrl('item-swap'),
  },
];

// ── Shape cards ───────────────────────────────────────────────

const shapeCard = (shape: ShapeCard['shape']): ShapeCard => ({
  id: `shape-${shape}`,
  type: 'shape',
  name: shape.charAt(0).toUpperCase() + shape.slice(1),
  shape,
  rarity: 'common',
  art: `/cards/shape-${shape}.png`,
  imageUrl: cardImageUrl(`shape-${shape}`),
});

export const SHAPE_CARDS: ShapeCard[] = [
  shapeCard('circle'),
  shapeCard('square'),
  shapeCard('triangle'),
  shapeCard('star'),
  shapeCard('diamond'),
];

// ── Exports ───────────────────────────────────────────────────

export const ALL_CARDS: Card[] = [...ALL_CREATURES, ...SHAPE_CARDS, ...ITEM_CARDS];

const CARD_MAP = new Map<string, Card>(ALL_CARDS.map((c) => [c.id, c]));
const CREATURE_MAP = new Map<string, CreatureCard>(ALL_CREATURES.map((c) => [c.id, c]));

export function getCardById(id: string): Card | undefined {
  const card = CARD_MAP.get(id);
  if (!card && process.env.NODE_ENV === 'development') {
    console.warn(`[card-data] getCardById: no card found for id="${id}"`);
  }
  return card;
}

export function getCreatureById(id: string): CreatureCard | undefined {
  return CREATURE_MAP.get(id);
}

/**
 * Given a card, return a fallback imageUrl derived from the base creature
 * of the same species in its original faction. Useful when variant art
 * doesn't exist in storage.
 */
export function getFallbackImageUrl(card: Card): string | null {
  if (card.type !== 'creature') return card.imageUrl ?? null;
  const creature = card as CreatureCard;
  const original = ALL_CREATURES.find(
    (c) => c.baseCreature === creature.baseCreature && !c.id.startsWith('v-'),
  );
  return original?.imageUrl ?? creature.imageUrl ?? null;
}
