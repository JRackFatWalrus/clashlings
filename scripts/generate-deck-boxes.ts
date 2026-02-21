/**
 * Deck box cover art generation pipeline.
 *
 * Generates 5 hero art images for starter deck product boxes
 * and uploads them to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/generate-deck-boxes.ts              # generate all
 *   npx tsx scripts/generate-deck-boxes.ts --dry-run    # preview prompts only
 *   npx tsx scripts/generate-deck-boxes.ts --deck sky-pack  # single deck
 *
 * Required env vars (or .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   IMAGE_API_URL
 *   IMAGE_API_KEY
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { ImageProvider } from '../src/lib/imageProvider';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const IMAGE_API_URL = process.env.IMAGE_API_URL ?? '';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY ?? '';
const BUCKET = 'card-art';
const RATE_LIMIT_DELAY_MS = 3000;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deckIdx = args.indexOf('--deck');
const singleDeck = deckIdx !== -1 ? args[deckIdx + 1] : null;

const STYLE_LOCK = [
  'adorable plush 3D render',
  'soft plush felt texture with subtle stitching',
  'toy-like rounded edges',
  'Pixar-style three-point studio lighting with soft shadows',
  'child-friendly safe for toddlers',
].join(', ');

const NEGATIVE = [
  'no text', 'no letters', 'no numbers', 'no watermark', 'no logo',
  'no realistic fur', 'no horror', 'no sharp teeth', 'no weapons',
  'no messy background', 'no clutter', 'no hands', 'no UI elements',
].join(', ');

interface DeckBoxSpec {
  id: string;
  mascot: string;
  wearable: string;
  accent: string;
  pose: string;
  bgGlow: string;
  factionSymbol: string;
}

const DECK_BOXES: DeckBoxSpec[] = [
  {
    id: 'sky-pack',
    mascot: 'majestic eagle',
    wearable: 'wearing a tiny sparkle crown with a magical purple aura',
    accent: 'soft mystical purple and indigo color palette',
    pose: 'with wings spread wide open, floating heroically above clouds',
    bgGlow: 'dramatic purple and violet glow radiating outward',
    factionSymbol: 'large faint star shape watermark in the background',
  },
  {
    id: 'stomp-pack',
    mascot: 'powerful elephant',
    wearable: 'wearing a chunky brown belt with small shoulder pads',
    accent: 'warm earthy red-brown and crimson color palette',
    pose: 'in a powerful stomping pose, looking massive and mighty',
    bgGlow: 'dramatic red and orange glow radiating outward',
    factionSymbol: 'large faint square shape watermark in the background',
  },
  {
    id: 'dash-pack',
    mascot: 'sleek cheetah',
    wearable: 'wearing a flowing orange scarf with speed streak motif',
    accent: 'warm sunset orange and amber color palette',
    pose: 'in a dynamic dashing pose with motion blur speed lines',
    bgGlow: 'dramatic orange and golden glow radiating outward',
    factionSymbol: 'large faint triangle shape watermark in the background',
  },
  {
    id: 'shield-pack',
    mascot: 'sturdy turtle with a large shell',
    wearable: 'wearing a leafy green collar with a soft green halo',
    accent: 'soft forest green and emerald color palette',
    pose: 'in a defensive stance with shell glowing protectively',
    bgGlow: 'dramatic green and teal glow radiating outward',
    factionSymbol: 'large faint circle shape watermark in the background',
  },
  {
    id: 'wild-pack',
    mascot: 'magical unicorn',
    wearable: 'wearing sky goggles with a crystal badge, multicolor shimmer',
    accent: 'cool crystalline blue with rainbow multicolor hints',
    pose: 'rearing up heroically with a sparkling rainbow mane',
    bgGlow: 'dramatic multicolor rainbow glow radiating outward',
    factionSymbol: 'large faint diamond shape watermark in the background',
  },
];

function buildBoxPrompt(spec: DeckBoxSpec): string {
  return [
    `A large heroic ${spec.mascot} as the centerpiece of a children's trading card game starter deck box cover`,
    spec.wearable,
    spec.pose,
    spec.accent,
    spec.factionSymbol,
    spec.bgGlow,
    'epic hero portrait composition filling the frame',
    'dramatic cinematic lighting from below',
    'bold and exciting energy',
    STYLE_LOCK,
    'portrait style hero shot',
    'vibrant saturated colors',
    NEGATIVE,
  ].join(', ');
}

function validateEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!dryRun) {
    if (!IMAGE_API_URL) missing.push('IMAGE_API_URL');
    if (!IMAGE_API_KEY) missing.push('IMAGE_API_KEY');
  }
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function main() {
  validateEnv();

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const imageProvider = dryRun
    ? null
    : new ImageProvider({ apiUrl: IMAGE_API_URL, apiKey: IMAGE_API_KEY });

  const toProcess = singleDeck
    ? DECK_BOXES.filter((d) => d.id === singleDeck)
    : DECK_BOXES;

  if (toProcess.length === 0) {
    console.error(`Deck "${singleDeck}" not found.`);
    process.exit(1);
  }

  console.log(`\nGenerating ${toProcess.length} deck box covers\n`);
  if (dryRun) console.log('(DRY RUN)\n');

  let success = 0;
  let failed = 0;

  for (const spec of toProcess) {
    const prompt = buildBoxPrompt(spec);
    const storagePath = `set1/decks/${spec.id}.png`;

    console.log(`[${success + failed + 1}/${toProcess.length}] ${spec.id}`);
    console.log(`  Prompt: ${prompt.slice(0, 140)}...`);

    if (dryRun) {
      console.log(`  Storage: ${storagePath}`);
      console.log(`  (dry run)\n`);
      success++;
      continue;
    }

    try {
      const imageBuffer = await imageProvider!.generateImage(prompt);
      console.log(`  Generated ${(imageBuffer.length / 1024).toFixed(1)}KB image`);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      console.log(`  Uploaded -> ${urlData.publicUrl}\n`);
      success++;

      if (success + failed < toProcess.length) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}\n`);
      failed++;
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed:  ${failed}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
