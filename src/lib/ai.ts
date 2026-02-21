import { GameState, CreatureCard } from '@/types';
import {
  drawCard,
  playShape,
  playCreature,
  canPlayCreature,
  canCreatureBlock,
  resolveAiCombat,
  untapAll,
} from './game-engine';

export function runAiTurnPhase1(state: GameState): GameState {
  let s: GameState = { ...state, currentTurn: 'ai' };

  s = untapAll(s, 'ai');

  s = drawCard(s, 'ai');
  if (s.gameOver) return s;

  const shapeInHand = s.ai.hand.find((c) => c.card.type === 'shape');
  if (shapeInHand) {
    s = playShape(s, 'ai', shapeInHand.uid);
  }

  const creatureHand = s.ai.hand
    .filter((c) => c.card.type === 'creature')
    .sort((a, b) => {
      const ac = (a.card as CreatureCard).cost;
      const bc = (b.card as CreatureCard).cost;
      return bc - ac;
    });

  for (const inst of creatureHand) {
    const creature = inst.card as CreatureCard;
    if (canPlayCreature(creature, s.ai.shapeZone, s.ai.usedShapes)) {
      s = playCreature(s, 'ai', inst.uid);
    }
  }

  const attackers = s.ai.battlefield.filter((c) => c.canAttack && !c.tapped);
  s.aiAttackers = attackers.map((c) => c.uid);

  return s;
}

export function runAiTurnPhase2(
  state: GameState,
  playerBlocks: Record<string, string>
): GameState {
  let s: GameState = { ...state };

  if (s.aiAttackers.length > 0) {
    s = resolveAiCombat(s, s.aiAttackers, playerBlocks);
  }

  if (!s.gameOver) {
    s.currentTurn = 'player';
    s.turnPhase = 'draw';
    s.turnNumber += 1;
    s.message = 'Your turn! Draw a card.';
  }

  s.aiAttackers = [];
  s.playerBlockAssignments = {};
  s.selectedBlocker = null;

  return s;
}

export function computeAiBlocksForPlayer(
  attackerUids: string[],
  state: GameState
): Record<string, string> {
  const blocks: Record<string, string> = {};
  const availableBlockers = state.ai.battlefield
    .filter((c) => !c.tapped && c.card.type === 'creature')
    .map((c) => ({ ...c }));

  const usedBlockers = new Set<string>();

  for (const aUid of attackerUids) {
    const attacker = state.player.battlefield.find((c) => c.uid === aUid);
    if (!attacker || attacker.card.type !== 'creature') continue;
    const aCard = attacker.card as CreatureCard;

    const eligible = availableBlockers.filter((b) => {
      if (usedBlockers.has(b.uid)) return false;
      const bCard = b.card as CreatureCard;
      return canCreatureBlock(bCard, aCard);
    });

    const winner = eligible.find((b) => {
      const bCard = b.card as CreatureCard;
      if (bCard.strength > aCard.strength) return true;
      if (bCard.strength === aCard.strength && bCard.ability === 'fast')
        return true;
      return false;
    });

    if (winner) {
      blocks[aUid] = winner.uid;
      usedBlockers.add(winner.uid);
    }
  }

  return blocks;
}
