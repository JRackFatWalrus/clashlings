import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, DeckDefinition } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface CollectionEntry {
  cardId: string;
  quantity: number;
}

interface CollectionStore {
  collection: CollectionEntry[];
  selectedDeckId: string | null;
  packsOpened: number;
  gamesPlayed: number;
  gamesWon: number;
  customDecks: DeckDefinition[];
  syncing: boolean;

  addCards: (cards: Card[]) => void;
  setSelectedDeck: (deckId: string) => void;
  incrementPacksOpened: () => void;
  recordGame: (won: boolean) => void;
  getQuantity: (cardId: string) => number;
  saveCustomDeck: (deck: DeckDefinition) => void;
  deleteCustomDeck: (deckId: string) => void;
  syncFromDB: (userId: string) => Promise<void>;
  pushCardsToDB: (userId: string, cards: Card[]) => Promise<void>;
  pushDeckToDB: (userId: string, deck: DeckDefinition) => Promise<void>;
  deleteDeckFromDB: (userId: string, deckId: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collection: [],
      selectedDeckId: null,
      packsOpened: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      customDecks: [],
      syncing: false,

      addCards: (cards) => {
        set((s) => {
          const coll = [...s.collection];
          for (const card of cards) {
            const existing = coll.find((c) => c.cardId === card.id);
            if (existing) {
              existing.quantity++;
            } else {
              coll.push({ cardId: card.id, quantity: 1 });
            }
          }
          return { collection: coll };
        });
      },

      setSelectedDeck: (deckId) => set({ selectedDeckId: deckId }),

      incrementPacksOpened: () =>
        set((s) => ({ packsOpened: s.packsOpened + 1 })),

      recordGame: (won) =>
        set((s) => ({
          gamesPlayed: s.gamesPlayed + 1,
          gamesWon: won ? s.gamesWon + 1 : s.gamesWon,
        })),

      getQuantity: (cardId) => {
        return get().collection.find((c) => c.cardId === cardId)?.quantity || 0;
      },

      saveCustomDeck: (deck) => {
        set((s) => {
          const existing = s.customDecks.findIndex((d) => d.id === deck.id);
          if (existing >= 0) {
            const updated = [...s.customDecks];
            updated[existing] = deck;
            return { customDecks: updated };
          }
          return { customDecks: [...s.customDecks, deck] };
        });
      },

      deleteCustomDeck: (deckId) => {
        set((s) => ({
          customDecks: s.customDecks.filter((d) => d.id !== deckId),
          selectedDeckId: s.selectedDeckId === deckId ? null : s.selectedDeckId,
        }));
      },

      syncFromDB: async (userId: string) => {
        set({ syncing: true });
        try {
          const supabase = createClient();

          const { data: dbCards } = await supabase
            .from('user_cards')
            .select('card_id, quantity')
            .eq('user_id', userId);

          if (dbCards && dbCards.length > 0) {
            const local = get().collection;
            const merged = [...local];
            for (const row of dbCards) {
              const idx = merged.findIndex((c) => c.cardId === row.card_id);
              if (idx >= 0) {
                merged[idx] = {
                  cardId: row.card_id,
                  quantity: Math.max(merged[idx].quantity, row.quantity),
                };
              } else {
                merged.push({ cardId: row.card_id, quantity: row.quantity });
              }
            }
            set({ collection: merged });
          }

          const { data: dbDecks } = await supabase
            .from('user_decks')
            .select('id, name, card_ids')
            .eq('user_id', userId);

          if (dbDecks && dbDecks.length > 0) {
            const localDecks = get().customDecks;
            const mergedDecks = [...localDecks];
            for (const row of dbDecks) {
              const exists = mergedDecks.findIndex((d) => d.id === row.id);
              const deck: DeckDefinition = {
                id: row.id,
                name: row.name,
                description: '',
                icon: '📦',
                cardIds: (row.card_ids as string[]) || [],
              };
              if (exists >= 0) {
                mergedDecks[exists] = deck;
              } else {
                mergedDecks.push(deck);
              }
            }
            set({ customDecks: mergedDecks });
          }
        } catch (err) {
          console.error('Collection sync failed:', err);
        } finally {
          set({ syncing: false });
        }
      },

      pushCardsToDB: async (userId: string, cards: Card[]) => {
        try {
          const supabase = createClient();
          const counts: Record<string, number> = {};
          for (const c of cards) {
            counts[c.id] = (counts[c.id] || 0) + 1;
          }

          for (const [cardId, qty] of Object.entries(counts)) {
            await supabase.rpc('upsert_user_card', {
              p_user_id: userId,
              p_card_id: cardId,
              p_qty: qty,
            }).then(({ error }) => {
              if (error) {
                // Fallback: try upsert directly
                supabase
                  .from('user_cards')
                  .upsert(
                    { user_id: userId, card_id: cardId, quantity: qty },
                    { onConflict: 'user_id,card_id' },
                  )
                  .then(() => {});
              }
            });
          }
        } catch (err) {
          console.error('Push cards to DB failed:', err);
        }
      },

      pushDeckToDB: async (userId: string, deck: DeckDefinition) => {
        try {
          const supabase = createClient();
          await supabase.from('user_decks').upsert(
            {
              id: deck.id,
              user_id: userId,
              name: deck.name,
              card_ids: deck.cardIds,
            },
            { onConflict: 'id' },
          );
        } catch (err) {
          console.error('Push deck to DB failed:', err);
        }
      },

      deleteDeckFromDB: async (userId: string, deckId: string) => {
        try {
          const supabase = createClient();
          await supabase
            .from('user_decks')
            .delete()
            .eq('id', deckId)
            .eq('user_id', userId);
        } catch (err) {
          console.error('Delete deck from DB failed:', err);
        }
      },
    }),
    { name: 'creature-clash-collection' }
  )
);
