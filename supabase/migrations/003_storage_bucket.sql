-- Create the card-art storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-art',
  'card-art',
  true,
  5242880,  -- 5MB max per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access for card art
CREATE POLICY "Card art is publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-art');

-- Service role can upload (used by the generation script)
CREATE POLICY "Service role can upload card art"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'card-art');

CREATE POLICY "Service role can update card art"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'card-art');
