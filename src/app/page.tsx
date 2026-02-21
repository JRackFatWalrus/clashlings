'use client';

import { useState } from 'react';
import { DeckDefinition, GameScreen } from '@/types';
import { useGameStore } from '@/stores/game-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useAuth } from '@/components/AuthProvider';
import { ALL_STARTER_DECKS } from '@/lib/deck-data';
import NavBar from '@/components/ui/NavBar';
import HomeScreen from '@/components/screens/HomeScreen';
import DeckSelectScreen from '@/components/screens/DeckSelectScreen';
import DeckBuilderScreen from '@/components/screens/DeckBuilderScreen';
import PackScreen from '@/components/screens/PackScreen';
import ShopScreen from '@/components/screens/ShopScreen';
import CollectionScreen from '@/components/screens/CollectionScreen';
import ParentZoneScreen from '@/components/screens/ParentZoneScreen';
import LoginScreen from '@/components/screens/LoginScreen';
import GameBoard from '@/components/game/GameBoard';

const FULLSCREEN_SCREENS: GameScreen[] = ['play'];
const BACK_SCREENS: Record<string, GameScreen> = {
  'deck-builder': 'shop',
  'deck-select': 'shop',
  'parent-zone': 'home',
};

export default function App() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState<GameScreen>('home');
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const recordGame = useCollectionStore((s) => s.recordGame);
  const winner = useGameStore((s) => s.winner);
  const { selectedDeckId, customDecks, saveCustomDeck } = useCollectionStore();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: 'linear-gradient(180deg, #0e1f3d 0%, #132a50 100%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl animate-bounce">🐾</span>
          <span className="text-white/40 text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const handlePlay = () => {
    const deckId = selectedDeckId || 'wild-pack';
    const allDecks = [...ALL_STARTER_DECKS, ...customDecks];
    const deck = allDecks.find((d) => d.id === deckId) || ALL_STARTER_DECKS[4];
    startGame(deck);
    setScreen('play');
  };

  const handleDeckSelect = (deck: DeckDefinition) => {
    setScreen('home');
  };

  const handleExitGame = () => {
    if (winner !== null) {
      recordGame(winner === 'player');
    }
    resetGame();
    setScreen('home');
  };

  const handleSaveDeck = (deck: DeckDefinition) => {
    saveCustomDeck(deck);
    setScreen('deck-select');
  };

  const isFullscreen = FULLSCREEN_SCREENS.includes(screen);
  const backTarget = BACK_SCREENS[screen];

  if (isFullscreen) {
    return <GameBoard onExit={handleExitGame} />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onPlay={handlePlay} />;
      case 'deck-select':
        return (
          <DeckSelectScreen
            onSelect={handleDeckSelect}
            onBuildDeck={() => setScreen('deck-builder')}
          />
        );
      case 'deck-builder':
        return (
          <DeckBuilderScreen
            onBack={() => setScreen('deck-select')}
            onSave={handleSaveDeck}
          />
        );
      case 'shop':
        return (
          <ShopScreen
            onSelectDeck={handleDeckSelect}
            onBuildDeck={() => setScreen('deck-builder')}
            onNavigate={setScreen}
          />
        );
      case 'packs':
        return <PackScreen />;
      case 'collection':
        return <CollectionScreen />;
      case 'parent-zone':
        return <ParentZoneScreen />;
      default:
        return <HomeScreen onPlay={handlePlay} />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar
        current={screen}
        onNavigate={setScreen}
        showBack={!!backTarget}
        onBack={backTarget ? () => setScreen(backTarget) : undefined}
      />
      <div className="flex-1 overflow-y-auto">
        {renderScreen()}
      </div>
    </div>
  );
}
