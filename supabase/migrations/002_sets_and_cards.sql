-- Card sets and card catalog for art pipeline

CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  style_version TEXT NOT NULL DEFAULT 'plush-3d-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape_type TEXT NOT NULL CHECK (shape_type IN ('circle', 'square', 'triangle', 'star', 'diamond')),
  ability TEXT NOT NULL CHECK (ability IN ('fast', 'big', 'fly', 'none')),
  strength INT NOT NULL CHECK (strength BETWEEN 0 AND 10),
  cost INT NOT NULL CHECK (cost BETWEEN 0 AND 5),
  card_type TEXT NOT NULL DEFAULT 'creature' CHECK (card_type IN ('creature', 'shape')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  prompt TEXT,
  image_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cards_set_id ON cards(set_id);
CREATE INDEX idx_cards_image_path_null ON cards(id) WHERE image_path IS NULL;

-- Sets and cards are public read, admin write
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sets are publicly readable" ON sets FOR SELECT USING (true);
CREATE POLICY "Cards are publicly readable" ON cards FOR SELECT USING (true);

-- Seed the initial set
INSERT INTO sets (id, name, description, style_version) VALUES
  ('set1', 'Creature Clash: Origins', 'The first set of Creature Clash cards', 'plush-3d-v1')
ON CONFLICT (id) DO NOTHING;

-- Seed all creature cards
INSERT INTO cards (id, set_id, name, shape_type, ability, strength, cost, card_type, rarity) VALUES
  -- Flying (Star)
  ('fly-bug',     'set1', 'Bug',     'star',     'fly',  1,  1, 'creature', 'common'),
  ('fly-bee',     'set1', 'Bee',     'star',     'fly',  2,  1, 'creature', 'common'),
  ('fly-bat',     'set1', 'Bat',     'star',     'fly',  3,  1, 'creature', 'common'),
  ('fly-jay',     'set1', 'Jay',     'star',     'fly',  4,  2, 'creature', 'uncommon'),
  ('fly-owl',     'set1', 'Owl',     'star',     'fly',  4,  2, 'creature', 'uncommon'),
  ('fly-crow',    'set1', 'Crow',    'star',     'fly',  5,  2, 'creature', 'uncommon'),
  ('fly-dove',    'set1', 'Dove',    'star',     'fly',  5,  2, 'creature', 'uncommon'),
  ('fly-hawk',    'set1', 'Hawk',    'star',     'fly',  6,  2, 'creature', 'rare'),
  ('fly-eagle',   'set1', 'Eagle',   'star',     'fly',  7,  3, 'creature', 'rare'),
  ('fly-swan',    'set1', 'Swan',    'star',     'fly',  8,  3, 'creature', 'rare'),
  ('fly-phoenix', 'set1', 'Phoenix', 'star',     'fly',  9,  3, 'creature', 'legendary'),
  ('fly-dragon',  'set1', 'Dragon',  'star',     'fly',  10, 3, 'creature', 'legendary'),
  -- Big (Square)
  ('big-pig',      'set1', 'Pig',      'square', 'big',  1,  1, 'creature', 'common'),
  ('big-ram',      'set1', 'Ram',      'square', 'big',  2,  1, 'creature', 'common'),
  ('big-cow',      'set1', 'Cow',      'square', 'big',  3,  1, 'creature', 'common'),
  ('big-yak',      'set1', 'Yak',      'square', 'big',  4,  2, 'creature', 'uncommon'),
  ('big-bear',     'set1', 'Bear',     'square', 'big',  5,  2, 'creature', 'uncommon'),
  ('big-moose',    'set1', 'Moose',    'square', 'big',  5,  2, 'creature', 'uncommon'),
  ('big-rhino',    'set1', 'Rhino',    'square', 'big',  6,  2, 'creature', 'rare'),
  ('big-hippo',    'set1', 'Hippo',    'square', 'big',  7,  3, 'creature', 'rare'),
  ('big-gorilla',  'set1', 'Gorilla',  'square', 'big',  8,  3, 'creature', 'rare'),
  ('big-elephant', 'set1', 'Elephant', 'square', 'big',  9,  3, 'creature', 'legendary'),
  ('big-whale',    'set1', 'Whale',    'square', 'big',  10, 3, 'creature', 'legendary'),
  -- Fast (Triangle)
  ('fast-ant',     'set1', 'Ant',     'triangle', 'fast', 1,  1, 'creature', 'common'),
  ('fast-mouse',   'set1', 'Mouse',   'triangle', 'fast', 2,  1, 'creature', 'common'),
  ('fast-fox',     'set1', 'Fox',     'triangle', 'fast', 3,  1, 'creature', 'common'),
  ('fast-hare',    'set1', 'Hare',    'triangle', 'fast', 4,  2, 'creature', 'uncommon'),
  ('fast-deer',    'set1', 'Deer',    'triangle', 'fast', 4,  2, 'creature', 'uncommon'),
  ('fast-horse',   'set1', 'Horse',   'triangle', 'fast', 5,  2, 'creature', 'uncommon'),
  ('fast-wolf',    'set1', 'Wolf',    'triangle', 'fast', 6,  2, 'creature', 'rare'),
  ('fast-puma',    'set1', 'Puma',    'triangle', 'fast', 7,  3, 'creature', 'rare'),
  ('fast-tiger',   'set1', 'Tiger',   'triangle', 'fast', 8,  3, 'creature', 'rare'),
  ('fast-cheetah', 'set1', 'Cheetah', 'triangle', 'fast', 9,  3, 'creature', 'legendary'),
  ('fast-lion',    'set1', 'Lion',    'triangle', 'fast', 10, 3, 'creature', 'legendary'),
  -- Vanilla (Circle)
  ('van-worm', 'set1', 'Worm', 'circle', 'none', 1,  1, 'creature', 'common'),
  ('van-hen',  'set1', 'Hen',  'circle', 'none', 2,  1, 'creature', 'common'),
  ('van-cat',  'set1', 'Cat',  'circle', 'none', 3,  1, 'creature', 'common'),
  ('van-dog',  'set1', 'Dog',  'circle', 'none', 4,  2, 'creature', 'uncommon'),
  ('van-duck', 'set1', 'Duck', 'circle', 'none', 4,  2, 'creature', 'uncommon'),
  ('van-goat', 'set1', 'Goat', 'circle', 'none', 5,  2, 'creature', 'uncommon'),
  ('van-pony', 'set1', 'Pony', 'circle', 'none', 6,  2, 'creature', 'rare'),
  ('van-seal', 'set1', 'Seal', 'circle', 'none', 7,  3, 'creature', 'rare'),
  ('van-croc', 'set1', 'Croc', 'circle', 'none', 8,  3, 'creature', 'rare'),
  ('van-dino', 'set1', 'Dino', 'circle', 'none', 9,  3, 'creature', 'legendary'),
  ('van-rex',  'set1', 'Rex',  'circle', 'none', 10, 3, 'creature', 'legendary'),
  -- Diamond (Wild)
  ('dia-frog',    'set1', 'Frog',    'diamond', 'fast', 2,  1, 'creature', 'uncommon'),
  ('dia-fish',    'set1', 'Fish',    'diamond', 'fly',  3,  1, 'creature', 'uncommon'),
  ('dia-panda',   'set1', 'Panda',   'diamond', 'big',  5,  2, 'creature', 'rare'),
  ('dia-unicorn', 'set1', 'Unicorn', 'diamond', 'fly',  7,  3, 'creature', 'legendary'),
  ('dia-griffin',  'set1', 'Griffin', 'diamond', 'fast', 8,  3, 'creature', 'legendary'),
  -- Shape cards
  ('shape-circle',   'set1', 'Circle',   'circle',   'none', 0, 0, 'shape', 'common'),
  ('shape-square',   'set1', 'Square',   'square',   'none', 0, 0, 'shape', 'common'),
  ('shape-triangle', 'set1', 'Triangle', 'triangle', 'none', 0, 0, 'shape', 'common'),
  ('shape-star',     'set1', 'Star',     'star',     'none', 0, 0, 'shape', 'common'),
  ('shape-diamond',  'set1', 'Diamond',  'diamond',  'none', 0, 0, 'shape', 'common')
ON CONFLICT (id) DO NOTHING;
