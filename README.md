# Creature Clash - Toddler TCG

A browser-based trading card game designed for toddlers entering preschool. Learn numbers, shapes, sight words, and basic comparison while battling cute animal creatures against an AI opponent.

## Game Rules

- **Goal**: Reduce the AI's hearts to 0 (each player starts with 10)
- **Cards**: Cute animals with a strength number (1-10) and abilities
- **Shapes**: Play shape cards (like mana in MTG) to summon creatures
- **Combat**: Higher number wins! Unblocked attacks deal 1 heart damage

### Abilities
| Ability | Icon | Effect |
|---------|------|--------|
| Fast | ⚡ | Wins ties in combat |
| Big | 🦶 | Deals 1 extra heart damage when winning combat |
| Fly | 🪽 | Can only be blocked by other Fly creatures |
| None | — | No special ability |

### Turn Flow
1. **Draw** a card
2. **Play a shape** card from your hand
3. **Play creatures** that match your shapes
4. **Attack** with your creatures
5. **End turn** — AI takes its turn

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + **Framer Motion** for animations
- **Zustand** for state management
- **Supabase** for auth & database
- **Vercel** for hosting

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

```bash
npx vercel
```

## Starter Decks

- **Sky Pack** 🦅 — Flying creatures (stars)
- **Stomp Pack** 🐘 — Big creatures (squares)
- **Dash Pack** 🐆 — Fast creatures (triangles)
- **Wild Pack** 🦄 — Mixed creatures (all shapes)
