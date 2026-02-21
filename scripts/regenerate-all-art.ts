/**
 * Regenerate ALL card art with updated art direction.
 * Reads card definitions from the shared card-data source, generates via Gemini,
 * uploads to Supabase storage in versioned folder.
 *
 * Usage:
 *   npx tsx scripts/regenerate-all-art.ts               # regenerate all
 *   npx tsx scripts/regenerate-all-art.ts --limit 5      # first 5 only
 *   npx tsx scripts/regenerate-all-art.ts --card fly-eagle  # one card
 *   npx tsx scripts/regenerate-all-art.ts --card v-big-dragon --card v-fast-dragon  # multiple
 *   npx tsx scripts/regenerate-all-art.ts --faction star  # only star faction
 *   npx tsx scripts/regenerate-all-art.ts --dry-run      # preview prompts
 *   npx tsx scripts/regenerate-all-art.ts --skip 10      # skip first 10 (resume)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { ImageProvider } from '../src/lib/imageProvider';
import { buildPrompt, CardRow } from './prompt-builder';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const IMAGE_API_URL = process.env.IMAGE_API_URL ?? '';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY ?? '';
const BUCKET = 'card-art';
const SET_ID = 'set1';
const ART_FOLDER = 'v4';
const RATE_LIMIT_DELAY_MS = 2000;

function rarityFromStrength(s: number): string {
  if (s >= 9) return 'mythic';
  if (s >= 7) return 'rare';
  if (s >= 4) return 'uncommon';
  return 'common';
}

function costFromStrength(s: number): number {
  if (s >= 7) return 3;
  if (s >= 4) return 2;
  return 1;
}

type Shape = 'star' | 'square' | 'triangle' | 'circle' | 'diamond';
type Ability = 'fly' | 'big' | 'fast' | 'guard' | 'none';

const SHAPE_ABILITY: Record<Shape, Ability> = {
  star: 'fly', square: 'big', triangle: 'fast', circle: 'guard', diamond: 'none',
};

const FACTION_PREFIX: Record<Shape, string> = {
  star: 'fly', square: 'big', triangle: 'fast', circle: 'grd', diamond: 'dia',
};

const DIAMOND_ABILITY_CYCLE: Ability[] = ['fast', 'fly', 'big', 'guard'];

interface OrigDef {
  id: string;
  base_creature: string;
  shape_type: Shape;
  ability: Ability;
  strength: number;
  card_type: string;
}

const ORIGINALS: OrigDef[] = [
  // Flying (star)
  { id: 'fly-bug',     base_creature: 'bug',     shape_type: 'star', ability: 'fly', strength: 1,  card_type: 'creature' },
  { id: 'fly-bee',     base_creature: 'bee',     shape_type: 'star', ability: 'fly', strength: 2,  card_type: 'creature' },
  { id: 'fly-bat',     base_creature: 'bat',     shape_type: 'star', ability: 'fly', strength: 3,  card_type: 'creature' },
  { id: 'fly-jay',     base_creature: 'jay',     shape_type: 'star', ability: 'fly', strength: 4,  card_type: 'creature' },
  { id: 'fly-owl',     base_creature: 'owl',     shape_type: 'star', ability: 'fly', strength: 4,  card_type: 'creature' },
  { id: 'fly-crow',    base_creature: 'crow',    shape_type: 'star', ability: 'fly', strength: 5,  card_type: 'creature' },
  { id: 'fly-dove',    base_creature: 'dove',    shape_type: 'star', ability: 'fly', strength: 5,  card_type: 'creature' },
  { id: 'fly-hawk',    base_creature: 'hawk',    shape_type: 'star', ability: 'fly', strength: 6,  card_type: 'creature' },
  { id: 'fly-eagle',   base_creature: 'eagle',   shape_type: 'star', ability: 'fly', strength: 7,  card_type: 'creature' },
  { id: 'fly-swan',    base_creature: 'swan',    shape_type: 'star', ability: 'fly', strength: 8,  card_type: 'creature' },
  { id: 'fly-phoenix', base_creature: 'phoenix', shape_type: 'star', ability: 'fly', strength: 9,  card_type: 'creature' },
  { id: 'fly-dragon',  base_creature: 'dragon',  shape_type: 'star', ability: 'fly', strength: 10, card_type: 'creature' },
  // Big (square)
  { id: 'big-pig',      base_creature: 'pig',      shape_type: 'square', ability: 'big', strength: 1,  card_type: 'creature' },
  { id: 'big-ram',      base_creature: 'ram',      shape_type: 'square', ability: 'big', strength: 2,  card_type: 'creature' },
  { id: 'big-cow',      base_creature: 'cow',      shape_type: 'square', ability: 'big', strength: 3,  card_type: 'creature' },
  { id: 'big-yak',      base_creature: 'yak',      shape_type: 'square', ability: 'big', strength: 4,  card_type: 'creature' },
  { id: 'big-bear',     base_creature: 'bear',     shape_type: 'square', ability: 'big', strength: 5,  card_type: 'creature' },
  { id: 'big-moose',    base_creature: 'moose',    shape_type: 'square', ability: 'big', strength: 5,  card_type: 'creature' },
  { id: 'big-rhino',    base_creature: 'rhino',    shape_type: 'square', ability: 'big', strength: 6,  card_type: 'creature' },
  { id: 'big-hippo',    base_creature: 'hippo',    shape_type: 'square', ability: 'big', strength: 7,  card_type: 'creature' },
  { id: 'big-gorilla',  base_creature: 'gorilla',  shape_type: 'square', ability: 'big', strength: 8,  card_type: 'creature' },
  { id: 'big-elephant', base_creature: 'elephant', shape_type: 'square', ability: 'big', strength: 9,  card_type: 'creature' },
  { id: 'big-whale',    base_creature: 'whale',    shape_type: 'square', ability: 'big', strength: 10, card_type: 'creature' },
  // Fast (triangle)
  { id: 'fast-ant',     base_creature: 'ant',     shape_type: 'triangle', ability: 'fast', strength: 1,  card_type: 'creature' },
  { id: 'fast-mouse',   base_creature: 'mouse',   shape_type: 'triangle', ability: 'fast', strength: 2,  card_type: 'creature' },
  { id: 'fast-fox',     base_creature: 'fox',     shape_type: 'triangle', ability: 'fast', strength: 3,  card_type: 'creature' },
  { id: 'fast-hare',    base_creature: 'hare',    shape_type: 'triangle', ability: 'fast', strength: 4,  card_type: 'creature' },
  { id: 'fast-deer',    base_creature: 'deer',    shape_type: 'triangle', ability: 'fast', strength: 4,  card_type: 'creature' },
  { id: 'fast-horse',   base_creature: 'horse',   shape_type: 'triangle', ability: 'fast', strength: 5,  card_type: 'creature' },
  { id: 'fast-wolf',    base_creature: 'wolf',    shape_type: 'triangle', ability: 'fast', strength: 6,  card_type: 'creature' },
  { id: 'fast-puma',    base_creature: 'puma',    shape_type: 'triangle', ability: 'fast', strength: 7,  card_type: 'creature' },
  { id: 'fast-tiger',   base_creature: 'tiger',   shape_type: 'triangle', ability: 'fast', strength: 8,  card_type: 'creature' },
  { id: 'fast-cheetah', base_creature: 'cheetah', shape_type: 'triangle', ability: 'fast', strength: 9,  card_type: 'creature' },
  { id: 'fast-lion',    base_creature: 'lion',    shape_type: 'triangle', ability: 'fast', strength: 10, card_type: 'creature' },
  // Guard (circle)
  { id: 'grd-worm', base_creature: 'worm', shape_type: 'circle', ability: 'guard', strength: 1,  card_type: 'creature' },
  { id: 'grd-hen',  base_creature: 'hen',  shape_type: 'circle', ability: 'guard', strength: 2,  card_type: 'creature' },
  { id: 'grd-cat',  base_creature: 'cat',  shape_type: 'circle', ability: 'guard', strength: 3,  card_type: 'creature' },
  { id: 'grd-dog',  base_creature: 'dog',  shape_type: 'circle', ability: 'guard', strength: 4,  card_type: 'creature' },
  { id: 'grd-duck', base_creature: 'duck', shape_type: 'circle', ability: 'guard', strength: 4,  card_type: 'creature' },
  { id: 'grd-goat', base_creature: 'goat', shape_type: 'circle', ability: 'guard', strength: 5,  card_type: 'creature' },
  { id: 'grd-pony', base_creature: 'pony', shape_type: 'circle', ability: 'guard', strength: 6,  card_type: 'creature' },
  { id: 'grd-seal', base_creature: 'seal', shape_type: 'circle', ability: 'guard', strength: 7,  card_type: 'creature' },
  { id: 'grd-croc', base_creature: 'croc', shape_type: 'circle', ability: 'guard', strength: 8,  card_type: 'creature' },
  { id: 'grd-dino', base_creature: 'dino', shape_type: 'circle', ability: 'guard', strength: 9,  card_type: 'creature' },
  { id: 'grd-rex',  base_creature: 'rex',  shape_type: 'circle', ability: 'guard', strength: 10, card_type: 'creature' },
  // Diamond (wild)
  { id: 'dia-frog',    base_creature: 'frog',    shape_type: 'diamond', ability: 'fast',  strength: 2, card_type: 'creature' },
  { id: 'dia-fish',    base_creature: 'fish',    shape_type: 'diamond', ability: 'fly',   strength: 3, card_type: 'creature' },
  { id: 'dia-panda',   base_creature: 'panda',   shape_type: 'diamond', ability: 'big',   strength: 5, card_type: 'creature' },
  { id: 'dia-turtle',  base_creature: 'turtle',  shape_type: 'diamond', ability: 'guard', strength: 4, card_type: 'creature' },
  { id: 'dia-unicorn', base_creature: 'unicorn', shape_type: 'diamond', ability: 'fly',   strength: 7, card_type: 'creature' },
  { id: 'dia-griffin',  base_creature: 'griffin', shape_type: 'diamond', ability: 'fast',  strength: 8, card_type: 'creature' },
];

const SHAPE_CARDS: OrigDef[] = [
  { id: 'shape-circle',   base_creature: '', shape_type: 'circle',   ability: 'none', strength: 0, card_type: 'shape' },
  { id: 'shape-square',   base_creature: '', shape_type: 'square',   ability: 'none', strength: 0, card_type: 'shape' },
  { id: 'shape-triangle', base_creature: '', shape_type: 'triangle', ability: 'none', strength: 0, card_type: 'shape' },
  { id: 'shape-star',     base_creature: '', shape_type: 'star',     ability: 'none', strength: 0, card_type: 'shape' },
  { id: 'shape-diamond',  base_creature: '', shape_type: 'diamond',  ability: 'none', strength: 0, card_type: 'shape' },
];

function generateVariants(): OrigDef[] {
  const variants: OrigDef[] = [];
  const existing = new Set(ORIGINALS.map(c => `${c.shape_type}-${c.base_creature}`));
  const ALL_SHAPES: Shape[] = ['star', 'square', 'triangle', 'circle', 'diamond'];
  let diaIdx = 0;

  for (const orig of ORIGINALS) {
    for (const target of ALL_SHAPES) {
      const key = `${target}-${orig.base_creature}`;
      if (existing.has(key)) continue;

      let ability: Ability;
      if (target === 'diamond') {
        ability = DIAMOND_ABILITY_CYCLE[diaIdx % DIAMOND_ABILITY_CYCLE.length];
        diaIdx++;
      } else {
        ability = SHAPE_ABILITY[target];
      }

      const prefix = FACTION_PREFIX[target];
      variants.push({
        id: `v-${prefix}-${orig.base_creature}`,
        base_creature: orig.base_creature,
        shape_type: target,
        ability,
        strength: orig.strength,
        card_type: 'creature',
      });
      existing.add(key);
    }
  }

  return variants;
}

function toCardRow(def: OrigDef): CardRow {
  const name = def.card_type === 'shape'
    ? def.shape_type.charAt(0).toUpperCase() + def.shape_type.slice(1)
    : def.base_creature.charAt(0).toUpperCase() + def.base_creature.slice(1);
  return {
    id: def.id,
    name,
    base_creature: def.base_creature,
    shape_type: def.shape_type,
    ability: def.ability,
    strength: def.strength,
    card_type: def.card_type,
    rarity: def.strength > 0 ? rarityFromStrength(def.strength) : 'common',
  };
}

const ALL_DEFS: OrigDef[] = [...ORIGINALS, ...generateVariants(), ...SHAPE_CARDS];
const ALL_CARDS: CardRow[] = ALL_DEFS.map(toCardRow);

// ── CLI argument parsing ──────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

const skipIdx = args.indexOf('--skip');
const skip = skipIdx !== -1 ? parseInt(args[skipIdx + 1], 10) : 0;

const factionIdx = args.indexOf('--faction');
const factionFilter = factionIdx !== -1 ? args[factionIdx + 1] : null;

const cardIds: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--card' && args[i + 1]) {
    cardIds.push(args[i + 1]);
    i++;
  }
}

async function main() {
  if (!dryRun && (!IMAGE_API_URL || !IMAGE_API_KEY)) {
    console.error('Missing IMAGE_API_URL or IMAGE_API_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const imageProvider = dryRun
    ? null
    : new ImageProvider({ apiUrl: IMAGE_API_URL, apiKey: IMAGE_API_KEY });

  let cards: CardRow[];

  if (cardIds.length > 0) {
    cards = ALL_CARDS.filter(c => cardIds.includes(c.id));
    if (cards.length === 0) {
      console.error(`No cards found matching IDs: ${cardIds.join(', ')}`);
      console.error('Available IDs (sample):', ALL_CARDS.slice(0, 10).map(c => c.id).join(', '));
      process.exit(1);
    }
  } else if (factionFilter) {
    cards = ALL_CARDS.filter(c => c.shape_type === factionFilter).slice(skip);
  } else {
    cards = ALL_CARDS.slice(skip);
  }

  const toProcess = cards.slice(0, Math.min(cards.length, limit));

  console.log(`\nRegenerating art for ${toProcess.length} cards (skip=${skip}, faction=${factionFilter || 'all'})`);
  console.log(`Storage path: ${SET_ID}/${ART_FOLDER}/{id}.png\n`);
  if (dryRun) console.log('(DRY RUN)\n');

  let success = 0;
  let failed = 0;

  for (const card of toProcess) {
    const prompt = buildPrompt(card, 'painterly-v4');
    const storagePath = `${SET_ID}/${ART_FOLDER}/${card.id}.png`;

    console.log(`[${success + failed + 1}/${toProcess.length}] ${card.id} — ${card.name} (${card.rarity})`);

    if (dryRun) {
      console.log(`  Prompt: ${prompt.slice(0, 250)}...`);
      console.log(`  Path: ${storagePath}\n`);
      success++;
      continue;
    }

    try {
      const imageBuffer = await imageProvider!.generateImage(prompt);
      console.log(`  Generated ${(imageBuffer.length / 1024).toFixed(0)}KB`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

      console.log(`  Uploaded ${storagePath}\n`);
      success++;

      if (success + failed < toProcess.length) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}\n`);
      failed++;
      if (msg.includes('429') || msg.includes('rate')) {
        console.log('  Waiting 10s for rate limit...');
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  }

  const total = factionFilter
    ? ALL_CARDS.filter(c => c.shape_type === factionFilter).length
    : ALL_CARDS.length;
  console.log(`\nDone: ${success} success, ${failed} failed, ${total - skip - toProcess.length} remaining\n`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
