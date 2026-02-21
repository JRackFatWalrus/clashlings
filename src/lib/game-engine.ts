import { v4 as uuid } from 'uuid';
import {
  Card,
  CardInstance,
  CombatEvent,
  CreatureCard,
  DeckDefinition,
  GameState,
  ItemCard,
  PlayerState,
  ShapeCard,
  Shape,
} from '@/types';
import { getCardById } from './card-data';

// ── Helpers ────────────────────────────────────────────────────

export function createCardInstance(card: Card): CardInstance {
  return { uid: uuid(), card, tapped: false, canAttack: false };
}

export function buildDeckInstances(def: DeckDefinition): CardInstance[] {
  const cards: CardInstance[] = [];
  for (const id of def.cardIds) {
    const card = getCardById(id);
    if (card) {
      cards.push(createCardInstance(card));
    } else if (process.env.NODE_ENV === 'development') {
      console.warn(`[game-engine] buildDeckInstances: card "${id}" not found in card data`);
    }
  }
  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Initial state ──────────────────────────────────────────────

export const EMPTY_USED_SHAPES: Record<Shape, number> = {
  circle: 0,
  square: 0,
  triangle: 0,
  star: 0,
  diamond: 0,
};

function emptyPlayer(): PlayerState {
  return {
    hearts: 10,
    hand: [],
    battlefield: [],
    shapeZone: [],
    usedShapes: { ...EMPTY_USED_SHAPES },
    deck: [],
    discard: [],
    shielded: false,
  };
}

export function initGame(
  playerDeck: DeckDefinition,
  aiDeck: DeckDefinition
): GameState {
  const pDeck = buildDeckInstances(playerDeck);
  const aDeck = buildDeckInstances(aiDeck);

  const player: PlayerState = {
    ...emptyPlayer(),
    deck: pDeck.slice(5),
    hand: pDeck.slice(0, 5),
  };

  const ai: PlayerState = {
    ...emptyPlayer(),
    deck: aDeck.slice(5),
    hand: aDeck.slice(0, 5),
  };

  return {
    player,
    ai,
    currentTurn: 'player',
    turnPhase: 'draw',
    turnNumber: 1,
    gameOver: false,
    winner: null,
    selectedAttackers: [],
    aiBlockAssignments: {},
    aiAttackers: [],
    playerBlockAssignments: {},
    selectedBlocker: null,
    combatLog: [],
    message: 'Your turn! Draw a card.',
    isAnimating: false,
  };
}

// ── Shape resource counting ────────────────────────────────────

export function countShapes(zone: ShapeCard[]): Record<Shape, number> {
  const counts: Record<Shape, number> = {
    circle: 0,
    square: 0,
    triangle: 0,
    star: 0,
    diamond: 0,
  };
  for (const s of zone) counts[s.shape]++;
  return counts;
}

export function getAvailableShapeCount(
  zone: ShapeCard[],
  shape: Shape,
  usedShapes: Record<Shape, number>,
): number {
  const counts = countShapes(zone);
  const specificLeft = Math.max(0, counts[shape] - (usedShapes[shape] || 0));
  const diamondsLeft = Math.max(0, counts.diamond - (usedShapes.diamond || 0));
  return specificLeft + (shape !== 'diamond' ? diamondsLeft : 0);
}

export function canPlayCreature(
  creature: CreatureCard,
  shapeZone: ShapeCard[],
  usedShapes: Record<Shape, number>,
): boolean {
  return getAvailableShapeCount(shapeZone, creature.shape, usedShapes) >= creature.cost;
}

// ── Fly blocking check ─────────────────────────────────────────

export function canCreatureBlock(
  blocker: CreatureCard,
  attacker: CreatureCard
): boolean {
  if (attacker.ability === 'fly' && blocker.ability !== 'fly') return false;
  return true;
}

// ── Guard helpers ──────────────────────────────────────────────

function getGuardCreatures(battlefield: CardInstance[]): CardInstance[] {
  return battlefield.filter(
    (c) => c.card.type === 'creature' && (c.card as CreatureCard).ability === 'guard' && !c.tapped
  );
}

function getEffectiveStrength(inst: CardInstance): number {
  if (inst.card.type !== 'creature') return 0;
  return (inst.card as CreatureCard).strength + (inst.strengthBoost ?? 0);
}

// ── Draw ───────────────────────────────────────────────────────

export function drawCard(state: GameState, who: 'player' | 'ai'): GameState {
  const s = { ...state };
  const p = { ...s[who] };
  if (p.deck.length === 0) return s;
  const [drawn, ...rest] = p.deck;
  p.hand = [...p.hand, drawn];
  p.deck = rest;
  s[who] = p;
  return s;
}

// ── Play shape ─────────────────────────────────────────────────

export function playShape(
  state: GameState,
  who: 'player' | 'ai',
  cardUid: string
): GameState {
  const s = { ...state };
  const p = { ...s[who] };
  const idx = p.hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return s;
  const inst = p.hand[idx];
  if (inst.card.type !== 'shape') return s;
  p.hand = p.hand.filter((_, i) => i !== idx);
  p.shapeZone = [...p.shapeZone, inst.card as ShapeCard];
  s[who] = p;
  return s;
}

// ── Play creature ──────────────────────────────────────────────

export function playCreature(
  state: GameState,
  who: 'player' | 'ai',
  cardUid: string
): GameState {
  const s = { ...state };
  const p = { ...s[who] };
  const idx = p.hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return s;
  const inst = p.hand[idx];
  if (inst.card.type !== 'creature') return s;
  const creature = inst.card as CreatureCard;
  if (!canPlayCreature(creature, p.shapeZone, p.usedShapes)) return s;

  p.hand = p.hand.filter((_, i) => i !== idx);
  p.usedShapes = spendShapes(p.shapeZone, p.usedShapes, creature.shape, creature.cost);

  const played: CardInstance = {
    ...inst,
    canAttack: creature.ability === 'fast',
    tapped: false,
  };
  p.battlefield = [...p.battlefield, played];
  s[who] = p;
  return s;
}

// ── Play item ──────────────────────────────────────────────────

export function playItem(
  state: GameState,
  who: 'player' | 'ai',
  cardUid: string,
  targetUid?: string,
): GameState {
  const s = { ...state };
  const p = { ...s[who] };
  const idx = p.hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return s;
  const inst = p.hand[idx];
  if (inst.card.type !== 'item') return s;

  const item = inst.card as ItemCard;
  p.hand = p.hand.filter((_, i) => i !== idx);
  p.discard = [...p.discard, inst];

  switch (item.effect) {
    case 'shield':
      p.shielded = true;
      break;
    case 'heal':
      p.hearts = Math.min(10, p.hearts + 1);
      break;
    case 'boost':
      if (targetUid) {
        p.battlefield = p.battlefield.map((c) =>
          c.uid === targetUid
            ? { ...c, strengthBoost: (c.strengthBoost ?? 0) + 2 }
            : c
        );
      }
      break;
    case 'swap':
      if (targetUid) {
        const target = p.battlefield.find((c) => c.uid === targetUid);
        if (target) {
          p.battlefield = p.battlefield.filter((c) => c.uid !== targetUid);
          const returned: CardInstance = {
            ...target,
            tapped: false,
            canAttack: false,
            strengthBoost: undefined,
          };
          p.hand = [...p.hand, returned];
        }
      }
      break;
  }

  s[who] = p;
  return s;
}

function spendShapes(
  zone: ShapeCard[],
  usedShapes: Record<Shape, number>,
  shape: Shape,
  cost: number,
): Record<Shape, number> {
  const updated = { ...usedShapes };
  const counts = countShapes(zone);
  let remaining = cost;

  const specificAvailable = Math.max(0, counts[shape] - (updated[shape] || 0));
  const fromSpecific = Math.min(remaining, specificAvailable);
  updated[shape] = (updated[shape] || 0) + fromSpecific;
  remaining -= fromSpecific;

  if (remaining > 0 && shape !== 'diamond') {
    const diamondAvailable = Math.max(0, counts.diamond - (updated.diamond || 0));
    const fromDiamond = Math.min(remaining, diamondAvailable);
    updated.diamond = (updated.diamond || 0) + fromDiamond;
  }

  return updated;
}

// ── Combat resolution ──────────────────────────────────────────

export function resolveCombat(
  state: GameState,
  attackerUids: string[],
  blockAssignments: Record<string, string>
): GameState {
  const s = { ...state };
  const attacker = { ...s.player };
  const defender = { ...s.ai };
  const log: CombatEvent[] = [];
  const deadAttackers: string[] = [];
  const deadBlockers: string[] = [];
  const guardPool = getGuardCreatures(defender.battlefield);
  let guardIdx = 0;

  for (const aUid of attackerUids) {
    const aInst = attacker.battlefield.find((c) => c.uid === aUid);
    if (!aInst || aInst.card.type !== 'creature') continue;
    const aCard = aInst.card as CreatureCard;

    const bUid = blockAssignments[aUid];
    if (bUid) {
      const bInst = defender.battlefield.find((c) => c.uid === bUid);
      if (!bInst || bInst.card.type !== 'creature') continue;

      const event = resolveCreatureFight(aInst, aUid, bInst, bUid);
      log.push(event);

      if (event.result === 'attacker_wins') {
        deadBlockers.push(bUid);
        if (event.heartDamage > 0) defender.hearts -= event.heartDamage;
      } else if (event.result === 'blocker_wins') {
        deadAttackers.push(aUid);
      } else {
        deadAttackers.push(aUid);
        deadBlockers.push(bUid);
      }
    } else {
      // Unblocked: check guard creatures intercept (guard absorbs unblocked damage)
      const availableGuard = guardPool.find(
        (g) => guardIdx <= guardPool.indexOf(g) && !deadBlockers.includes(g.uid)
      );
      if (availableGuard && aCard.ability !== 'fly') {
        guardIdx = guardPool.indexOf(availableGuard) + 1;
        const event = resolveCreatureFight(aInst, aUid, availableGuard, availableGuard.uid);
        log.push(event);
        if (event.result === 'attacker_wins') {
          deadBlockers.push(availableGuard.uid);
          if (event.heartDamage > 0) defender.hearts -= event.heartDamage;
        } else if (event.result === 'blocker_wins') {
          deadAttackers.push(aUid);
        } else {
          deadAttackers.push(aUid);
          deadBlockers.push(availableGuard.uid);
        }
      } else {
        if (defender.shielded) {
          defender.shielded = false;
          log.push({
            attackerUid: aUid,
            blockerUid: null,
            attackerName: aCard.name,
            blockerName: 'Shield',
            result: 'blocker_wins',
            heartDamage: 0,
          });
        } else {
          defender.hearts -= 1;
          log.push({
            attackerUid: aUid,
            blockerUid: null,
            attackerName: aCard.name,
            blockerName: null,
            result: 'unblocked',
            heartDamage: 1,
          });
        }
      }
    }
  }

  attacker.battlefield = attacker.battlefield
    .filter((c) => !deadAttackers.includes(c.uid))
    .map((c) => ({ ...c, tapped: attackerUids.includes(c.uid) ? true : c.tapped }));

  defender.battlefield = defender.battlefield.filter(
    (c) => !deadBlockers.includes(c.uid)
  );

  s.player = attacker;
  s.ai = defender;
  s.combatLog = log;

  if (defender.hearts <= 0) {
    s.gameOver = true;
    s.winner = 'player';
    s.message = 'You win! Great job!';
  }

  return s;
}

export function resolveAiCombat(
  state: GameState,
  attackerUids: string[],
  blockAssignments: Record<string, string>
): GameState {
  const s = { ...state };
  const attacker = { ...s.ai };
  const defender = { ...s.player };
  const log: CombatEvent[] = [];
  const deadAttackers: string[] = [];
  const deadBlockers: string[] = [];
  const guardPool = getGuardCreatures(defender.battlefield);
  let guardIdx = 0;

  for (const aUid of attackerUids) {
    const aInst = attacker.battlefield.find((c) => c.uid === aUid);
    if (!aInst || aInst.card.type !== 'creature') continue;
    const aCard = aInst.card as CreatureCard;

    const bUid = blockAssignments[aUid];
    if (bUid) {
      const bInst = defender.battlefield.find((c) => c.uid === bUid);
      if (!bInst || bInst.card.type !== 'creature') continue;

      const event = resolveCreatureFight(aInst, aUid, bInst, bUid);
      log.push(event);

      if (event.result === 'attacker_wins') {
        deadBlockers.push(bUid);
        if (event.heartDamage > 0) defender.hearts -= event.heartDamage;
      } else if (event.result === 'blocker_wins') {
        deadAttackers.push(aUid);
      } else {
        deadAttackers.push(aUid);
        deadBlockers.push(bUid);
      }
    } else {
      const availableGuard = guardPool.find(
        (g) => guardIdx <= guardPool.indexOf(g) && !deadBlockers.includes(g.uid)
      );
      if (availableGuard && aCard.ability !== 'fly') {
        guardIdx = guardPool.indexOf(availableGuard) + 1;
        const event = resolveCreatureFight(aInst, aUid, availableGuard, availableGuard.uid);
        log.push(event);
        if (event.result === 'attacker_wins') {
          deadBlockers.push(availableGuard.uid);
          if (event.heartDamage > 0) defender.hearts -= event.heartDamage;
        } else if (event.result === 'blocker_wins') {
          deadAttackers.push(aUid);
        } else {
          deadAttackers.push(aUid);
          deadBlockers.push(availableGuard.uid);
        }
      } else {
        if (defender.shielded) {
          defender.shielded = false;
          log.push({
            attackerUid: aUid,
            blockerUid: null,
            attackerName: aCard.name,
            blockerName: 'Shield',
            result: 'blocker_wins',
            heartDamage: 0,
          });
        } else {
          defender.hearts -= 1;
          log.push({
            attackerUid: aUid,
            blockerUid: null,
            attackerName: aCard.name,
            blockerName: null,
            result: 'unblocked',
            heartDamage: 1,
          });
        }
      }
    }
  }

  attacker.battlefield = attacker.battlefield
    .filter((c) => !deadAttackers.includes(c.uid))
    .map((c) => ({ ...c, tapped: attackerUids.includes(c.uid) ? true : c.tapped }));

  defender.battlefield = defender.battlefield.filter(
    (c) => !deadBlockers.includes(c.uid)
  );

  s.ai = attacker;
  s.player = defender;
  s.combatLog = [...s.combatLog, ...log];

  if (defender.hearts <= 0) {
    s.gameOver = true;
    s.winner = 'ai';
    s.message = 'Good try! Play again?';
  }

  return s;
}

function resolveCreatureFight(
  attackerInst: CardInstance,
  attackerUid: string,
  blockerInst: CardInstance,
  blockerUid: string
): CombatEvent {
  const attacker = attackerInst.card as CreatureCard;
  const blocker = blockerInst.card as CreatureCard;
  const aStr = getEffectiveStrength(attackerInst);
  const bStr = getEffectiveStrength(blockerInst);

  let result: CombatEvent['result'];
  let heartDamage = 0;

  if (aStr > bStr) {
    result = 'attacker_wins';
    if (attacker.ability === 'big') heartDamage = 1;
  } else if (aStr < bStr) {
    result = 'blocker_wins';
  } else {
    if (attacker.ability === 'fast') {
      result = 'attacker_wins';
    } else if (blocker.ability === 'fast') {
      result = 'blocker_wins';
    } else {
      result = 'tie';
    }
  }

  return {
    attackerUid,
    blockerUid,
    attackerName: attacker.name,
    blockerName: blocker.name,
    result,
    heartDamage,
  };
}

// ── Turn management ────────────────────────────────────────────

export function untapAll(state: GameState, who: 'player' | 'ai'): GameState {
  const s = { ...state };
  const p = { ...s[who] };
  p.battlefield = p.battlefield.map((c) => ({
    ...c,
    tapped: false,
    canAttack: true,
    strengthBoost: undefined,
  }));
  p.usedShapes = { ...EMPTY_USED_SHAPES };
  s[who] = p;
  return s;
}

export function advancePhase(state: GameState): GameState {
  const phases: GameState['turnPhase'][] = [
    'draw',
    'shape',
    'play',
    'battle',
    'done',
  ];
  const idx = phases.indexOf(state.turnPhase);
  const next = phases[idx + 1] || 'done';

  const messages: Record<string, string> = {
    draw: 'Draw a card!',
    shape: 'Play a shape card!',
    play: 'Play your creatures!',
    battle: 'Choose attackers!',
    done: 'AI is thinking...',
  };

  return { ...state, turnPhase: next, message: messages[next] || '' };
}
