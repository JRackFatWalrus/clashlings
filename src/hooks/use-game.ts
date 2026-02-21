'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';

export function useGameLoop() {
  const { gameOver, winner, currentTurn } = useGameStore();

  useEffect(() => {
    if (gameOver && winner) {
      // Could trigger analytics or save game result here
    }
  }, [gameOver, winner]);

  return { isPlayerTurn: currentTurn === 'player', gameOver, winner };
}
