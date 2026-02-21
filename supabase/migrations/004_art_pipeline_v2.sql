-- Art pipeline v2: cutout support, thumbnails, art versioning

ALTER TABLE cards ADD COLUMN IF NOT EXISTS cutout_path TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS thumb_path TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS art_version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_cards_cutout_null ON cards(id) WHERE cutout_path IS NULL AND image_path IS NOT NULL;
