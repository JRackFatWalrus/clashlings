import { Card, Rarity } from '@/types';
import { ALL_CREATURES, SHAPE_CARDS, ITEM_CARDS, getCardById } from './card-data';
import { ALL_STARTER_DECKS } from './deck-data';
import { shuffle } from './game-engine';

function drawUnique(pool: Card[], count: number, used: Set<string>): Card[] {
  const result: Card[] = [];
  for (const card of pool) {
    if (result.length >= count) break;
    if (!used.has(card.id)) {
      result.push(card);
      used.add(card.id);
    }
  }
  return result;
}

function rollWildRarity(): Rarity {
  const roll = Math.random();
  if (roll < 0.05) return 'mythic';
  if (roll < 0.30) return 'rare';
  return 'uncommon';
}

export function generateBoosterPack(): Card[] {
  const commons   = shuffle(ALL_CREATURES.filter(c => c.rarity === 'common'));
  const uncommons = shuffle(ALL_CREATURES.filter(c => c.rarity === 'uncommon'));
  const rares     = shuffle(ALL_CREATURES.filter(c => c.rarity === 'rare'));
  const mythics   = shuffle(ALL_CREATURES.filter(c => c.rarity === 'mythic'));

  const used = new Set<string>();
  const pack: Card[] = [];

  // --- 5 shape cards (always common) ---
  const shapes = shuffle([...SHAPE_CARDS]);
  for (let i = 0; i < 5; i++) {
    pack.push(shapes[i % shapes.length]);
  }

  // --- Guaranteed rare slot (1/8 chance to upgrade to mythic) ---
  const guaranteedIsMythic = Math.random() < 0.125 && mythics.length > 0;
  const guaranteedPool = guaranteedIsMythic ? mythics : rares;
  const guaranteed = drawUnique(guaranteedPool, 1, used);
  if (guaranteed.length === 0) {
    pack.push(...drawUnique(rares.length > 0 ? rares : uncommons, 1, used));
  } else {
    pack.push(...guaranteed);
  }

  // --- Wild slot (70% uncommon, 25% rare, 5% mythic) ---
  const wildRarity = rollWildRarity();
  const wildPool = wildRarity === 'mythic' ? mythics
    : wildRarity === 'rare' ? rares
    : uncommons;
  const wildCards = drawUnique(shuffle([...wildPool]), 1, used);
  if (wildCards.length === 0) {
    pack.push(...drawUnique(shuffle([...uncommons]), 1, used));
  } else {
    pack.push(...wildCards);
  }

  // --- 2 uncommon slots (item cards can replace one, ~20% chance) ---
  const includeItem = Math.random() < 0.2 && ITEM_CARDS.length > 0;
  if (includeItem) {
    const uncommonItems = shuffle(ITEM_CARDS.filter(c => c.rarity === 'uncommon'));
    if (uncommonItems.length > 0) {
      pack.push(uncommonItems[0]);
      pack.push(...drawUnique(shuffle([...uncommons]), 1, used));
    } else {
      pack.push(...drawUnique(shuffle([...uncommons]), 2, used));
    }
  } else {
    pack.push(...drawUnique(shuffle([...uncommons]), 2, used));
  }

  // --- 6 common creature slots ---
  pack.push(...drawUnique(shuffle([...commons]), 6, used));

  // --- Validation ---
  validatePack(pack);

  return shuffle(pack);
}

function validatePack(pack: Card[]): void {
  const counts: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
  for (const card of pack) {
    counts[card.rarity ?? 'common']++;
  }
  const rareOrBetter = counts.rare + counts.mythic;

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[Pack] ${pack.length} cards — C:${counts.common} U:${counts.uncommon} R:${counts.rare} M:${counts.mythic}`
    );
  }

  if (pack.length !== 15) {
    console.warn(`[Pack] Expected 15 cards, got ${pack.length}`);
  }
  if (rareOrBetter === 0) {
    console.warn('[Pack] No Rare+ card in pack!');
  }
  if (rareOrBetter > 2) {
    console.warn(`[Pack] Too many Rare+ cards: ${rareOrBetter}`);
  }
}

export function generateStarterDeckCards(deckId: string): Card[] {
  const deck = ALL_STARTER_DECKS.find((d) => d.id === deckId);
  if (!deck) return [];

  const cards: Card[] = [];
  for (const id of deck.cardIds) {
    const card = getCardById(id);
    if (card) cards.push(card);
  }
  return cards;
}
