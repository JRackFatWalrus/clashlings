export type Shape = 'circle' | 'square' | 'triangle' | 'star' | 'diamond';
export type Ability = 'fast' | 'big' | 'fly' | 'guard' | 'none';
export type CardType = 'creature' | 'shape' | 'item';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic';
export type ItemEffect = 'shield' | 'heal' | 'boost' | 'swap';

export interface CreatureCard {
  id: string;
  type: 'creature';
  name: string;
  baseCreature: string;
  color: string;
  strength: number;
  cost: number;
  shape: Shape;
  ability: Ability;
  rarity: Rarity;
  art: string;
  imageUrl?: string | null;
  cutoutUrl?: string | null;
  sightWordLine?: string;
}

export interface ShapeCard {
  id: string;
  type: 'shape';
  name: string;
  shape: Shape;
  rarity: Rarity;
  art: string;
  imageUrl?: string | null;
  cutoutUrl?: string | null;
}

export interface ItemCard {
  id: string;
  type: 'item';
  name: string;
  effect: ItemEffect;
  description: string;
  rarity: Rarity;
  art: string;
  imageUrl?: string | null;
  cutoutUrl?: string | null;
}

export type Card = CreatureCard | ShapeCard | ItemCard;

export interface CardInstance {
  uid: string;
  card: Card;
  tapped: boolean;
  canAttack: boolean;
  strengthBoost?: number;
}

export interface DeckDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  cardIds: string[];
}

export type TurnPhase = 'draw' | 'shape' | 'play' | 'battle' | 'blocking' | 'done';

export interface PlayerState {
  hearts: number;
  hand: CardInstance[];
  battlefield: CardInstance[];
  shapeZone: ShapeCard[];
  usedShapes: Record<Shape, number>;
  deck: CardInstance[];
  discard: CardInstance[];
  shielded: boolean;
}

export interface GameState {
  player: PlayerState;
  ai: PlayerState;
  currentTurn: 'player' | 'ai';
  turnPhase: TurnPhase;
  turnNumber: number;
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  selectedAttackers: string[];
  aiBlockAssignments: Record<string, string>;
  aiAttackers: string[];
  playerBlockAssignments: Record<string, string>;
  selectedBlocker: string | null;
  combatLog: CombatEvent[];
  message: string;
  isAnimating: boolean;
}

export interface CombatEvent {
  attackerUid: string;
  blockerUid: string | null;
  attackerName: string;
  blockerName: string | null;
  result: 'attacker_wins' | 'blocker_wins' | 'tie' | 'unblocked';
  heartDamage: number;
}

export interface PackContents {
  cards: Card[];
}

export type GameScreen = 'home' | 'deck-select' | 'deck-builder' | 'play' | 'collection' | 'packs' | 'shop' | 'parent-zone';

export const SHAPE_COLORS: Record<Shape, string> = {
  circle: '#4CAF50',
  square: '#F44336',
  triangle: '#FF9800',
  star: '#9C27B0',
  diamond: '#2196F3',
};

export const SHAPE_LABELS: Record<Shape, string> = {
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  star: 'Star',
  diamond: 'Diamond',
};

export const ABILITY_LABELS: Record<Ability, string> = {
  fast: 'Fast',
  big: 'Big',
  fly: 'Fly',
  guard: 'Guard',
  none: '',
};

export const ABILITY_ICONS: Record<Ability, string> = {
  fast: '⚡',
  big: '🦶',
  fly: '🪽',
  guard: '🛡️',
  none: '',
};

export const ABILITY_DESCRIPTIONS: Record<Ability, string> = {
  fast: 'Attacks immediately! Wins ties.',
  big: 'Tramples through for heart damage.',
  fly: 'Only Fly can block Fly.',
  guard: 'Enemies must attack Guard first.',
  none: '',
};

export interface FactionConfig {
  name: string;
  icon: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  bgTint: string;
  keyword: string;
}

export const FACTION_CONFIG: Record<Shape, FactionConfig> = {
  circle: {
    name: 'Grove Guardians',
    icon: '🛡️',
    accentColor: '#4CAF50',
    gradientFrom: '#2E7D32',
    gradientTo: '#81C784',
    bgTint: 'rgba(76, 175, 80, 0.12)',
    keyword: 'GUARD',
  },
  square: {
    name: 'Stone Legion',
    icon: '🏔️',
    accentColor: '#F44336',
    gradientFrom: '#C62828',
    gradientTo: '#EF9A9A',
    bgTint: 'rgba(244, 67, 54, 0.12)',
    keyword: 'BIG',
  },
  triangle: {
    name: 'Blaze Runners',
    icon: '🔥',
    accentColor: '#FF9800',
    gradientFrom: '#E65100',
    gradientTo: '#FFB74D',
    bgTint: 'rgba(255, 152, 0, 0.12)',
    keyword: 'FAST',
  },
  star: {
    name: 'Sky Court',
    icon: '🪽',
    accentColor: '#9C27B0',
    gradientFrom: '#6A1B9A',
    gradientTo: '#CE93D8',
    bgTint: 'rgba(156, 39, 176, 0.12)',
    keyword: 'FLY',
  },
  diamond: {
    name: 'Prismatic Pack',
    icon: '💎',
    accentColor: '#2196F3',
    gradientFrom: '#1565C0',
    gradientTo: '#90CAF9',
    bgTint: 'rgba(33, 150, 243, 0.12)',
    keyword: 'WILD',
  },
};

export interface RarityConfig {
  label: string;
  sheenClass: string;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: { label: 'Common', sheenClass: '' },
  uncommon: { label: 'Uncommon', sheenClass: 'rarity-sheen-uncommon' },
  rare: { label: 'Rare', sheenClass: 'rarity-sheen-rare' },
  mythic: { label: 'Mythic', sheenClass: 'rarity-sheen-mythic' },
};

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'mythic'];

export const FACTION_COLORS: Record<Shape, string> = {
  circle: 'Green',
  square: 'Red',
  triangle: 'Gold',
  star: 'Blue',
  diamond: 'Prismatic',
};

export const ITEM_EFFECT_CONFIG: Record<ItemEffect, { icon: string; color: string }> = {
  shield: { icon: '🛡️', color: '#60A5FA' },
  heal: { icon: '❤️', color: '#F87171' },
  boost: { icon: '⚡', color: '#FBBF24' },
  swap: { icon: '🔄', color: '#34D399' },
};
