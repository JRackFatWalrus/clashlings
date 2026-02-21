import { DeckDefinition } from '@/types';

function repeat(id: string, n: number): string[] {
  return Array(n).fill(id);
}

// Deck philosophy: mostly commons/uncommons, 1 rare headline creature, no mythics.
// Each deck gets 15 shapes, 22 creatures (weighted to faction), 1 item, 2 off-faction support.

export const SKY_PACK: DeckDefinition = {
  id: 'sky-pack',
  name: 'Sky Pack',
  description: 'Soar above the battlefield. Only Fly creatures can block your attackers.',
  icon: '🪽',
  cardIds: [
    ...repeat('shape-star', 12),
    ...repeat('shape-diamond', 3),
    // Core fly: heavy commons/uncommons, 1 rare
    'fly-bug', 'fly-bug', 'fly-bee', 'fly-bee',
    'fly-bat', 'fly-bat',
    'fly-jay', 'fly-owl',
    'fly-crow', 'fly-dove',
    'fly-hawk', 'fly-hawk',
    'fly-eagle', // rare headline
    // Off-faction support (commons/uncommons)
    'fast-ant', 'fast-mouse', 'fast-fox',
    'grd-worm', 'grd-hen', 'grd-cat', 'grd-dog',
    'dia-fish',
    // Item
    'item-shield',
  ],
};

export const STOMP_PACK: DeckDefinition = {
  id: 'stomp-pack',
  name: 'Stomp Pack',
  description: 'Overwhelming power. Tramples through blockers for direct heart damage.',
  icon: '🦶',
  cardIds: [
    ...repeat('shape-square', 12),
    ...repeat('shape-diamond', 3),
    // Core big: heavy commons/uncommons, 1 rare
    'big-pig', 'big-pig', 'big-ram', 'big-ram',
    'big-cow', 'big-cow',
    'big-yak', 'big-bear',
    'big-moose', 'big-rhino',
    'big-hippo', 'big-hippo', // rare headline
    // Off-faction support
    'grd-worm', 'grd-hen', 'grd-cat', 'grd-dog',
    'fly-bug', 'fly-bee', 'fly-bat',
    'dia-panda',
    // Item
    'item-boost',
  ],
};

export const DASH_PACK: DeckDefinition = {
  id: 'dash-pack',
  name: 'Dash Pack',
  description: 'Speed kills. Attacks immediately and wins every tie in combat.',
  icon: '⚡',
  cardIds: [
    ...repeat('shape-triangle', 12),
    ...repeat('shape-diamond', 3),
    // Core fast: heavy commons/uncommons, 1 rare
    'fast-ant', 'fast-ant', 'fast-mouse', 'fast-mouse',
    'fast-fox', 'fast-fox',
    'fast-hare', 'fast-deer',
    'fast-horse', 'fast-wolf',
    'fast-puma', 'fast-puma', // rare headline
    // Off-faction support
    'fly-bug', 'fly-bee', 'fly-bat',
    'big-pig', 'big-ram', 'big-cow',
    'grd-worm',
    'dia-frog',
    // Item
    'item-boost',
  ],
};

export const SHIELD_PACK: DeckDefinition = {
  id: 'shield-pack',
  name: 'Shield Pack',
  description: 'An impenetrable wall. Enemies must attack your Guard creatures first.',
  icon: '🛡️',
  cardIds: [
    ...repeat('shape-circle', 12),
    ...repeat('shape-diamond', 3),
    // Core guard: heavy commons/uncommons, 1 rare
    'grd-worm', 'grd-worm', 'grd-hen', 'grd-hen',
    'grd-cat', 'grd-cat',
    'grd-dog', 'grd-duck',
    'grd-goat', 'grd-pony',
    'grd-seal', 'grd-seal', // rare headline
    // Off-faction support
    'fast-ant', 'fast-mouse', 'fast-fox',
    'big-pig', 'big-ram', 'big-cow',
    'fly-bug',
    'dia-turtle',
    // Item
    'item-heal',
  ],
};

export const WILD_PACK: DeckDefinition = {
  id: 'wild-pack',
  name: 'Wild Pack',
  description: 'Unpredictable and versatile. Every faction, every trick, no weakness.',
  icon: '🌟',
  cardIds: [
    ...repeat('shape-circle', 3),
    ...repeat('shape-square', 3),
    ...repeat('shape-triangle', 3),
    ...repeat('shape-star', 3),
    ...repeat('shape-diamond', 3),
    // One of each faction (commons/uncommons focus)
    'fly-bee', 'fly-bat', 'fly-jay', 'fly-crow', 'fly-hawk',
    'big-ram', 'big-cow', 'big-yak', 'big-bear', 'big-rhino',
    'fast-mouse', 'fast-fox', 'fast-hare', 'fast-horse',
    'grd-hen', 'grd-cat', 'grd-dog', 'grd-goat',
    'dia-frog', 'dia-turtle',
    // Items
    'item-shield', 'item-heal',
  ],
};

export const ALL_STARTER_DECKS: DeckDefinition[] = [
  SKY_PACK,
  STOMP_PACK,
  DASH_PACK,
  SHIELD_PACK,
  WILD_PACK,
];
