/**
 * Generate a universal card back image for Creature Clash TCG.jr
 * Uses the Gemini API (Nano Banana key) to create a premium card back design.
 * Saves to public/textures/card-back.png and uploads to Supabase storage.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const IMAGE_API_URL = process.env.IMAGE_API_URL!;
const IMAGE_API_KEY = process.env.IMAGE_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CARD_BACK_PROMPT = `Design a premium trading card game card back for a children's strategy card game called "Creature Clash". 

The design should feature:
- A bold, centered shield or crest emblem with stylized creature silhouettes (a dragon wing, a bear paw, a bird in flight) integrated into the design
- The emblem should have a glowing energy effect, electric blue and violet tones
- Geometric pattern border with repeating diamond and triangle shapes (these are the game's faction symbols)
- Deep navy blue background with subtle radial energy lines emanating from the center
- Small stars and sparkle effects scattered around the emblem
- The overall feel should be "premium children's trading card game" - bold, exciting, collectible
- Plush 3D rendered style with soft lighting and subtle depth shadows
- Color palette: deep navy (#0e1f3d), electric blue (#3b82f6), violet (#a855f7), teal (#14b8a6) accents
- No text, no letters, no numbers, no watermark, no logo text
- No realistic textures, keep it stylized and toy-like
- Vertical card orientation (portrait), clean edges
- The design should look like the back of a real collectible card - symmetrical, patterned, premium`;

async function generateCardBack(): Promise<Buffer> {
  const separator = IMAGE_API_URL.includes('?') ? '&' : '?';
  const url = `${IMAGE_API_URL}${separator}key=${IMAGE_API_KEY}`;

  console.log('Generating card back image...');

  const body = {
    contents: [{ parts: [{ text: `Generate an image: ${CARD_BACK_PROMPT}` }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();

  if (data.candidates && Array.isArray(data.candidates)) {
    for (const candidate of data.candidates) {
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part?.inlineData?.data) {
            return Buffer.from(part.inlineData.data, 'base64');
          }
        }
      }
    }
  }

  throw new Error(`No image in response: ${JSON.stringify(data).slice(0, 400)}`);
}

async function main() {
  if (!IMAGE_API_URL || !IMAGE_API_KEY) {
    console.error('Missing IMAGE_API_URL or IMAGE_API_KEY in .env.local');
    process.exit(1);
  }

  const imageBuffer = await generateCardBack();
  console.log(`Generated image: ${imageBuffer.length} bytes`);

  // Save locally
  const texturesDir = path.join(process.cwd(), 'public', 'textures');
  if (!fs.existsSync(texturesDir)) {
    fs.mkdirSync(texturesDir, { recursive: true });
  }
  const localPath = path.join(texturesDir, 'card-back.png');
  fs.writeFileSync(localPath, imageBuffer);
  console.log(`Saved to ${localPath}`);

  // Upload to Supabase storage
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      const { error } = await supabase.storage
        .from('card-art')
        .upload('shared/card-back.png', imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase upload warning:', error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('card-art')
          .getPublicUrl('shared/card-back.png');
        console.log(`Uploaded to Supabase: ${urlData.publicUrl}`);
      }
    } catch (err) {
      console.warn('Supabase upload failed (non-fatal):', err);
    }
  }

  console.log('\nDone! Card back saved to public/textures/card-back.png');
  console.log('Update GameCard.tsx faceDown to use: /textures/card-back.png');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
