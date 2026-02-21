/**
 * Generate a playmat background image for the Creature Clash game board.
 * Saves to public/ui/playmat_v1.png and uploads to Supabase storage.
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

const PLAYMAT_PROMPT = `A premium children's trading card game play mat, viewed from directly above (top-down bird's eye view).

The surface is a deep teal-blue felt material with subtle woven texture grain, like a high-quality game store playmat.

Layout (top to bottom):
- Top zone: slightly darker, cooler blue-teal area for the opponent's side, with a faint red-tinged border glow at the very top edge
- Center: a luminous horizontal energy divider line across the full width, glowing with soft cyan and white light, subtle plasma energy effect
- Bottom zone: slightly brighter, warmer blue area for the player's side, with a faint blue-tinted border glow at the bottom edge

Corner decorations: small ornate shield emblems in each corner with geometric diamond and triangle patterns, glowing softly in electric blue and violet, matching a TCG crest style.

Subtle radial spotlight illumination in the center of the mat creating depth.

16:9 landscape aspect ratio. Clean, symmetrical composition.

Style: plush 3D rendered, soft studio lighting, toy-like premium aesthetic, Pixar-quality materials.
Color palette: deep navy (#0e1f3d), teal (#14b8a6), electric blue (#3b82f6), touches of violet (#a855f7).

No text, no letters, no numbers, no watermark, no logo.
No cards, no creatures, no characters, no hands, no game pieces.
No brown, no gold, no warm tones.
Clean edges suitable for a UI background.`;

async function generatePlaymat(): Promise<Buffer> {
  const separator = IMAGE_API_URL.includes('?') ? '&' : '?';
  const url = `${IMAGE_API_URL}${separator}key=${IMAGE_API_KEY}`;

  console.log('Generating playmat image...');

  const body = {
    contents: [{ parts: [{ text: `Generate an image: ${PLAYMAT_PROMPT}` }] }],
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

  const imageBuffer = await generatePlaymat();
  console.log(`Generated image: ${imageBuffer.length} bytes`);

  const uiDir = path.join(process.cwd(), 'public', 'ui');
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }
  const localPath = path.join(uiDir, 'playmat_v1.png');
  fs.writeFileSync(localPath, imageBuffer);
  console.log(`Saved to ${localPath}`);

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error } = await supabase.storage
        .from('card-art')
        .upload('shared/playmat_v1.png', imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });
      if (error) {
        console.warn('Supabase upload warning:', error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('card-art')
          .getPublicUrl('shared/playmat_v1.png');
        console.log(`Uploaded to Supabase: ${urlData.publicUrl}`);
      }
    } catch (err) {
      console.warn('Supabase upload failed (non-fatal):', err);
    }
  }

  console.log('\nDone! Playmat saved to public/ui/playmat_v1.png');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
