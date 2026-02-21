/**
 * Offline card-art generation pipeline.
 *
 * Usage:
 *   npx tsx scripts/generate-card-art.ts            # generate all missing
 *   npx tsx scripts/generate-card-art.ts --limit 5   # generate up to 5
 *   npx tsx scripts/generate-card-art.ts --card fly-eagle  # generate one card
 *   npx tsx scripts/generate-card-art.ts --dry-run   # preview prompts only
 *
 * Required env vars (or .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (not the anon key — needs write access)
 *   IMAGE_API_URL
 *   IMAGE_API_KEY
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { ImageProvider } from '../src/lib/imageProvider';
import { buildPrompt } from './prompt-builder';

// ── Config ──────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const IMAGE_API_URL = process.env.IMAGE_API_URL ?? '';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY ?? '';
const BUCKET = 'card-art';
const RATE_LIMIT_DELAY_MS = 1500; // pause between calls to stay under rate limits

// ── Arg parsing ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const forceAll = args.includes('--force');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const cardIdx = args.indexOf('--card');
const singleCard = cardIdx !== -1 ? args[cardIdx + 1] : null;

// ── Validation ──────────────────────────────────────────────────
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
    console.error('Set them in .env.local or export them before running.');
    process.exit(1);
  }
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
  validateEnv();

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const imageProvider = dryRun
    ? null
    : new ImageProvider({ apiUrl: IMAGE_API_URL, apiKey: IMAGE_API_KEY });

  // Fetch cards that need art (or all cards if --force)
  let query = supabase
    .from('cards')
    .select('id, name, shape_type, ability, strength, cost, card_type, rarity, set_id')
    .order('id');

  if (!forceAll) {
    query = query.is('image_path', null);
  }

  if (singleCard) {
    query = query.eq('id', singleCard);
  }

  const { data: cards, error } = await query;
  if (error) {
    console.error('Failed to query cards:', error.message);
    process.exit(1);
  }
  if (!cards || cards.length === 0) {
    console.log('All cards already have art. Nothing to generate.');
    return;
  }

  // Fetch set info for style_version
  const setIds = [...new Set(cards.map((c) => c.set_id))];
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, style_version')
    .in('id', setIds);
  if (setsError) {
    console.error('Failed to query sets:', setsError.message);
    process.exit(1);
  }
  const styleMap = new Map(sets!.map((s) => [s.id, s.style_version]));

  const toProcess = cards.slice(0, Math.min(cards.length, limit));
  console.log(`\n🎨 Generating art for ${toProcess.length} of ${cards.length} cards\n`);
  if (dryRun) console.log('(DRY RUN — no API calls or uploads)\n');

  let success = 0;
  let failed = 0;

  for (const card of toProcess) {
    const styleVersion = styleMap.get(card.set_id) ?? 'plush-3d-v1';
    const cardRow = { ...card, base_creature: card.name.split(' ').pop()?.toLowerCase() ?? card.name.toLowerCase() };
    const prompt = buildPrompt(cardRow, styleVersion);
    const storagePath = `${card.set_id}/cards/${card.id}.png`;

    console.log(`[${success + failed + 1}/${toProcess.length}] ${card.id} — ${card.name}`);
    console.log(`  Prompt: ${prompt.slice(0, 120)}...`);

    if (dryRun) {
      console.log(`  Storage: ${storagePath}`);
      console.log(`  ✅ (dry run)\n`);
      success++;
      continue;
    }

    try {
      const imageBuffer = await imageProvider!.generateImage(prompt);
      console.log(`  Generated ${(imageBuffer.length / 1024).toFixed(1)}KB image`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      // Update the card row
      const { error: updateError } = await supabase
        .from('cards')
        .update({
          image_path: urlData.publicUrl,
          prompt,
        })
        .eq('id', card.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      console.log(`  ✅ Uploaded → ${storagePath}\n`);
      success++;

      // Rate limit pause between API calls
      if (success + failed < toProcess.length) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Failed: ${msg}\n`);
      failed++;
    }
  }

  console.log(`\n─── Done ───`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️  Remaining: ${cards.length - toProcess.length}\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
