import { create } from 'zustand';
import { GameState, DeckDefinition, CreatureCard, ItemCard, TurnPhase } from '@/types';
import {
  initGame,
  drawCard,
  playShape,
  playCreature,
  playItem,
  resolveCombat,
  untapAll,
  canPlayCreature,
  canCreatureBlock,
} from '@/lib/game-engine';
import { computeAiBlocksForPlayer, runAiTurnPhase1, runAiTurnPhase2 } from '@/lib/ai';
import { ALL_STARTER_DECKS } from '@/lib/deck-data';

interface GameStore extends GameState {
  startGame: (playerDeck: DeckDefinition, aiDeck?: DeckDefinition) => void;
  doDraw: () => void;
  doPlayShape: (uid: string) => void;
  doPlayCreature: (uid: string) => void;
  doPlayItem: (uid: string, targetUid?: string) => void;
  toggleAttacker: (uid: string) => void;
  doBattle: () => void;
  endTurn: () => void;
  skipPhase: () => void;
  resetGame: () => void;
  setMessage: (msg: string) => void;
  setAnimating: (v: boolean) => void;
  setPhase: (p: TurnPhase) => void;

  selectBlocker: (uid: string) => void;
  assignBlockToAttacker: (aiAttackerUid: string) => void;
  removeBlock: (aiAttackerUid: string) => void;
  confirmBlocks: () => void;
}

function randomDeck(): DeckDefinition {
  return ALL_STARTER_DECKS[Math.floor(Math.random() * ALL_STARTER_DECKS.length)];
}

const emptyUsed = { circle: 0, square: 0, triangle: 0, star: 0, diamond: 0 };

const INITIAL: GameState = {
  player: { hearts: 10, hand: [], battlefield: [], shapeZone: [], usedShapes: { ...emptyUsed }, deck: [], discard: [], shielded: false },
  ai: { hearts: 10, hand: [], battlefield: [], shapeZone: [], usedShapes: { ...emptyUsed }, deck: [], discard: [], shielded: false },
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
  message: '',
  isAnimating: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL,

  startGame: (playerDeck, aiDeck) => {
    const ai = aiDeck || randomDeck();
    const state = initGame(playerDeck, ai);
    set({ ...state });
  },

  doDraw: () => {
    const s = get();
    if (s.turnPhase !== 'draw' || s.currentTurn !== 'player') return;
    let next = drawCard({ ...s } as GameState, 'player');
    next = untapAll(next, 'player');
    set({ ...next, turnPhase: 'shape', message: 'Play a shape card!' });
  },

  doPlayShape: (uid) => {
    const s = get();
    if (s.turnPhase !== 'shape' || s.currentTurn !== 'player') return;
    const next = playShape({ ...s } as GameState, 'player', uid);
    set({ ...next, turnPhase: 'play', message: 'Play your creatures!' });
  },

  doPlayCreature: (uid) => {
    const s = get();
    if (s.turnPhase !== 'play' || s.currentTurn !== 'player') return;
    const inst = s.player.hand.find((c) => c.uid === uid);
    if (!inst || inst.card.type !== 'creature') return;
    const creature = inst.card as CreatureCard;
    if (!canPlayCreature(creature, s.player.shapeZone, s.player.usedShapes)) {
      set({ message: 'Not enough shapes!' });
      return;
    }
    const next = playCreature({ ...s } as GameState, 'player', uid);
    set({ ...next, message: 'Play more creatures or go to battle!' });
  },

  doPlayItem: (uid, targetUid) => {
    const s = get();
    if (s.turnPhase !== 'play' || s.currentTurn !== 'player') return;
    const inst = s.player.hand.find((c) => c.uid === uid);
    if (!inst || inst.card.type !== 'item') return;
    const item = inst.card as ItemCard;

    if ((item.effect === 'boost' || item.effect === 'swap') && !targetUid) {
      set({ message: 'Select a creature on your field first!' });
      return;
    }

    const next = playItem({ ...s } as GameState, 'player', uid, targetUid);
    const effectMsg: Record<string, string> = {
      shield: 'Shield activated! Blocks 1 damage.',
      heal: 'Healed 1 heart!',
      boost: 'Creature boosted +2 power!',
      swap: 'Creature returned to hand!',
    };
    set({ ...next, message: effectMsg[item.effect] || 'Item played!' });
  },

  toggleAttacker: (uid) => {
    const s = get();
    if (s.turnPhase !== 'battle') return;
    const inst = s.player.battlefield.find((c) => c.uid === uid);
    if (!inst || !inst.canAttack || inst.tapped) return;

    const selected = s.selectedAttackers.includes(uid)
      ? s.selectedAttackers.filter((id) => id !== uid)
      : [...s.selectedAttackers, uid];
    set({ selectedAttackers: selected });
  },

  doBattle: () => {
    const s = get();
    if (s.turnPhase !== 'battle') return;
    if (s.selectedAttackers.length === 0) return;

    const blocks = computeAiBlocksForPlayer(
      s.selectedAttackers,
      { ...s } as GameState
    );
    const next = resolveCombat(
      { ...s } as GameState,
      s.selectedAttackers,
      blocks
    );
    set({
      ...next,
      selectedAttackers: [],
      aiBlockAssignments: blocks,
    });
  },

  skipPhase: () => {
    const s = get();
    const flow: TurnPhase[] = ['draw', 'shape', 'play', 'battle', 'done'];
    const idx = flow.indexOf(s.turnPhase);
    if (idx < flow.length - 1) {
      const next = flow[idx + 1];
      const msgs: Record<string, string> = {
        draw: 'Draw a card!',
        shape: 'Play a shape card!',
        play: 'Play your creatures!',
        battle: 'Choose attackers!',
        done: '',
      };
      set({ turnPhase: next, message: msgs[next] || '' });
    }
  },

  endTurn: () => {
    const s = get();
    if (s.gameOver) return;
    set({ isAnimating: true, message: 'AI is thinking...', combatLog: [] });

    setTimeout(() => {
      const current = get();
      const afterAi = runAiTurnPhase1({ ...current } as GameState);

      if (afterAi.gameOver) {
        set({
          ...afterAi,
          selectedAttackers: [],
          aiBlockAssignments: {},
          aiAttackers: [],
          isAnimating: false,
        });
        return;
      }

      if (afterAi.aiAttackers.length > 0) {
        set({
          ...afterAi,
          turnPhase: 'blocking',
          currentTurn: 'player',
          playerBlockAssignments: {},
          selectedBlocker: null,
          isAnimating: false,
          message: 'AI is attacking! Tap your creature, then tap an attacker to block it!',
        });
      } else {
        const final = runAiTurnPhase2(afterAi, {});
        set({
          ...final,
          selectedAttackers: [],
          aiBlockAssignments: {},
          aiAttackers: [],
          isAnimating: false,
        });
      }
    }, 1200);
  },

  // ── Blocking phase actions ─────────────────────────────────

  selectBlocker: (uid) => {
    const s = get();
    if (s.turnPhase !== 'blocking') return;
    const inst = s.player.battlefield.find((c) => c.uid === uid);
    if (!inst || inst.tapped) return;

    const alreadyBlocking = Object.entries(s.playerBlockAssignments).find(
      ([, blockerUid]) => blockerUid === uid
    );
    if (alreadyBlocking) {
      const updated = { ...s.playerBlockAssignments };
      delete updated[alreadyBlocking[0]];
      set({ playerBlockAssignments: updated, selectedBlocker: null, message: 'Block removed! Tap another creature to block, or press Done.' });
      return;
    }

    if (s.selectedBlocker === uid) {
      set({ selectedBlocker: null, message: 'Deselected. Tap a creature to block with.' });
    } else {
      set({ selectedBlocker: uid, message: 'Now tap an AI attacker to block it!' });
    }
  },

  assignBlockToAttacker: (aiAttackerUid) => {
    const s = get();
    if (s.turnPhase !== 'blocking' || !s.selectedBlocker) return;
    if (!s.aiAttackers.includes(aiAttackerUid)) return;

    const blockerInst = s.player.battlefield.find((c) => c.uid === s.selectedBlocker);
    const attackerInst = s.ai.battlefield.find((c) => c.uid === aiAttackerUid);
    if (!blockerInst || !attackerInst) return;
    if (blockerInst.card.type !== 'creature' || attackerInst.card.type !== 'creature') return;

    const aCard = attackerInst.card as CreatureCard;
    const bCard = blockerInst.card as CreatureCard;
    if (!canCreatureBlock(bCard, aCard)) {
      set({ message: 'Only Fly creatures can block Fly attackers!', selectedBlocker: null });
      return;
    }

    const updated = { ...s.playerBlockAssignments };
    updated[aiAttackerUid] = s.selectedBlocker;

    set({
      playerBlockAssignments: updated,
      selectedBlocker: null,
      message: 'Blocked! Tap more creatures to block, or press Done.',
    });
  },

  removeBlock: (aiAttackerUid) => {
    const s = get();
    if (s.turnPhase !== 'blocking') return;
    const updated = { ...s.playerBlockAssignments };
    delete updated[aiAttackerUid];
    set({ playerBlockAssignments: updated });
  },

  confirmBlocks: () => {
    const s = get();
    if (s.turnPhase !== 'blocking') return;

    set({ isAnimating: true, message: 'Combat!' });

    setTimeout(() => {
      const current = get();
      const final = runAiTurnPhase2(
        { ...current } as GameState,
        current.playerBlockAssignments
      );
      set({
        ...final,
        selectedAttackers: [],
        aiBlockAssignments: {},
        playerBlockAssignments: {},
        selectedBlocker: null,
        isAnimating: false,
      });
    }, 600);
  },

  resetGame: () => set({ ...INITIAL }),

  setMessage: (msg) => set({ message: msg }),
  setAnimating: (v) => set({ isAnimating: v }),
  setPhase: (p) => set({ turnPhase: p }),
}));
