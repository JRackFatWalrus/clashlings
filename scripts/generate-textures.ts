/**
 * One-time board texture generation script.
 *
 * Generates playmat, panel glass, and sparkle overlay textures via the
 * image API, then saves them to public/textures/ for local use and
 * optionally uploads to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/generate-textures.ts
 *   npx tsx scripts/generate-textures.ts --dry-run
 *   npx tsx scripts/generate-textures.ts --upload   # also upload to Supabase
 *
 * Required env vars:
 *   IMAGE_API_URL
 *   IMAGE_API_KEY
 *
 * Optional (for --upload):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { ImageProvider } from '../src/lib/imageProvider';

const IMAGE_API_URL = process.env.IMAGE_API_URL ?? '';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const doUpload = args.includes('--upload');

const TEXTURES_DIR = path.join(process.cwd(), 'public', 'textures');
const BUCKET = 'card-art';

interface TextureSpec {
  filename: string;
  prompt: string;
  storagePath: string;
}

const TEXTURES: TextureSpec[] = [
  {
    filename: 'playmat_bg.png',
    prompt: [
      'seamless dark navy blue felt cloth texture',
      'subtle woven fabric pattern',
      'soft lighting',
      'very dark indigo-navy color',
      'matte finish',
      'no objects',
      'no text',
      'no patterns besides fabric weave',
      'high resolution texture map',
      'flat front-facing view',
    ].join(', '),
    storagePath: 'textures/playmat_bg.png',
  },
  {
    filename: 'panel_glass.png',
    prompt: [
      'frosted glass overlay texture',
      'semi-transparent white',
      'subtle blur effect',
      'clean minimal',
      'soft diffused light',
      'no objects',
      'no text',
      'very light and airy',
      'high resolution texture map',
      'flat front-facing view',
    ].join(', '),
    storagePath: 'textures/panel_glass.png',
  },
  {
    filename: 'sparkle_overlay.png',
    prompt: [
      'tiny floating sparkle particles on transparent black background',
      'small white and gold light dots',
      'magical fairy dust effect',
      'scattered randomly',
      'soft glow on each particle',
      'no other objects',
      'no text',
      'high resolution',
      'flat front-facing view',
    ].join(', '),
    storagePath: 'textures/sparkle_overlay.png',
  },
];

async function main() {
  if (!dryRun && (!IMAGE_API_URL || !IMAGE_API_KEY)) {
    console.error('Missing IMAGE_API_URL or IMAGE_API_KEY');
    process.exit(1);
  }

  if (doUpload && (!SUPABASE_URL || !SERVICE_KEY)) {
    console.error('Missing SUPABASE_URL or SERVICE_KEY for upload');
    process.exit(1);
  }

  if (!fs.existsSync(TEXTURES_DIR)) {
    fs.mkdirSync(TEXTURES_DIR, { recursive: true });
  }

  const provider = dryRun
    ? null
    : new ImageProvider({ apiUrl: IMAGE_API_URL, apiKey: IMAGE_API_KEY });

  const supabase = doUpload ? createClient(SUPABASE_URL, SERVICE_KEY) : null;

  console.log(`\nGenerating ${TEXTURES.length} board textures`);
  if (dryRun) console.log('(DRY RUN)\n');

  for (const tex of TEXTURES) {
    console.log(`\n  ${tex.filename}`);
    console.log(`  Prompt: ${tex.prompt.slice(0, 100)}...`);

    if (dryRun) {
      console.log(`  -> ${path.join(TEXTURES_DIR, tex.filename)}`);
      continue;
    }

    try {
      const buffer = await provider!.generateImage(tex.prompt);
      const outPath = path.join(TEXTURES_DIR, tex.filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`  Saved ${(buffer.length / 1024).toFixed(1)}KB -> ${outPath}`);

      if (doUpload && supabase) {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(tex.storagePath, buffer, {
            contentType: 'image/png',
            upsert: true,
          });
        if (error) {
          console.warn(`  Upload failed: ${error.message}`);
        } else {
          console.log(`  Uploaded -> ${tex.storagePath}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${msg}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
