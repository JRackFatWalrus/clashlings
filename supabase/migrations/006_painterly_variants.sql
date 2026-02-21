-- 006_painterly_variants.sql
-- Syncs the DB with the 2D Painterly Art Pivot + Color Variant System
-- Adds guard ability, mythic rarity, item card type, base_creature/color columns,
-- migrates van->grd IDs, renames creatures with color prefixes, inserts ~204 variants + 4 items

-- ============================================================
-- STEP 1: Fix check constraints
-- ============================================================

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_ability_check;
ALTER TABLE cards ADD CONSTRAINT cards_ability_check
  CHECK (ability IN ('fast', 'big', 'fly', 'guard', 'none'));

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_rarity_check;
ALTER TABLE cards ADD CONSTRAINT cards_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'mythic'));

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_card_type_check;
ALTER TABLE cards ADD CONSTRAINT cards_card_type_check
  CHECK (card_type IN ('creature', 'shape', 'item'));

-- ============================================================
-- STEP 2: Add new columns
-- ============================================================

ALTER TABLE cards ADD COLUMN IF NOT EXISTS base_creature TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS color TEXT;

-- ============================================================
-- STEP 3: Fix existing data
-- ============================================================

-- 3a: Fix rarity: legendary -> mythic
UPDATE cards SET rarity = 'mythic' WHERE rarity = 'legendary';

-- 3b: Fix rarity values to match code formula (strength-based)
--     str 1-3 = common, str 4-6 = uncommon, str 7-8 = rare, str 9-10 = mythic
UPDATE cards SET rarity = 'common'   WHERE card_type = 'creature' AND strength BETWEEN 1 AND 3;
UPDATE cards SET rarity = 'uncommon' WHERE card_type = 'creature' AND strength BETWEEN 4 AND 6;
UPDATE cards SET rarity = 'rare'     WHERE card_type = 'creature' AND strength BETWEEN 7 AND 8;
UPDATE cards SET rarity = 'mythic'   WHERE card_type = 'creature' AND strength BETWEEN 9 AND 10;

-- 3c: Delete old van-* circle creatures (will be replaced by grd-*)
DELETE FROM cards WHERE id IN (
  'van-worm', 'van-hen', 'van-cat', 'van-dog', 'van-duck',
  'van-goat', 'van-pony', 'van-seal', 'van-croc', 'van-dino', 'van-rex'
);

-- 3d: Insert grd-* circle/guard creatures as replacements
INSERT INTO cards (id, set_id, name, shape_type, ability, strength, cost, card_type, rarity, base_creature, color) VALUES
  ('grd-worm', 'set1', 'Green Worm',  'circle', 'guard', 1,  1, 'creature', 'common',   'worm', 'Green'),
  ('grd-hen',  'set1', 'Green Hen',   'circle', 'guard', 2,  1, 'creature', 'common',   'hen',  'Green'),
  ('grd-cat',  'set1', 'Green Cat',   'circle', 'guard', 3,  1, 'creature', 'common',   'cat',  'Green'),
  ('grd-dog',  'set1', 'Green Dog',   'circle', 'guard', 4,  2, 'creature', 'uncommon', 'dog',  'Green'),
  ('grd-duck', 'set1', 'Green Duck',  'circle', 'guard', 4,  2, 'creature', 'uncommon', 'duck', 'Green'),
  ('grd-goat', 'set1', 'Green Goat',  'circle', 'guard', 5,  2, 'creature', 'uncommon', 'goat', 'Green'),
  ('grd-pony', 'set1', 'Green Pony',  'circle', 'guard', 6,  2, 'creature', 'uncommon', 'pony', 'Green'),
  ('grd-seal', 'set1', 'Green Seal',  'circle', 'guard', 7,  3, 'creature', 'rare',     'seal', 'Green'),
  ('grd-croc', 'set1', 'Green Croc',  'circle', 'guard', 8,  3, 'creature', 'rare',     'croc', 'Green'),
  ('grd-dino', 'set1', 'Green Dino',  'circle', 'guard', 9,  3, 'creature', 'mythic',   'dino', 'Green'),
  ('grd-rex',  'set1', 'Green Rex',   'circle', 'guard', 10, 3, 'creature', 'mythic',   'rex',  'Green')
ON CONFLICT (id) DO NOTHING;

-- 3e: Insert missing dia-turtle
INSERT INTO cards (id, set_id, name, shape_type, ability, strength, cost, card_type, rarity, base_creature, color) VALUES
  ('dia-turtle', 'set1', 'Prismatic Turtle', 'diamond', 'guard', 4, 2, 'creature', 'uncommon', 'turtle', 'Prismatic')
ON CONFLICT (id) DO NOTHING;

-- 3f: Update display names + base_creature + color on Star faction
UPDATE cards SET name = 'Blue Bug',     base_creature = 'bug',     color = 'Blue' WHERE id = 'fly-bug';
UPDATE cards SET name = 'Blue Bee',     base_creature = 'bee',     color = 'Blue' WHERE id = 'fly-bee';
UPDATE cards SET name = 'Blue Bat',     base_creature = 'bat',     color = 'Blue' WHERE id = 'fly-bat';
UPDATE cards SET name = 'Blue Jay',     base_creature = 'jay',     color = 'Blue' WHERE id = 'fly-jay';
UPDATE cards SET name = 'Blue Owl',     base_creature = 'owl',     color = 'Blue' WHERE id = 'fly-owl';
UPDATE cards SET name = 'Blue Crow',    base_creature = 'crow',    color = 'Blue' WHERE id = 'fly-crow';
UPDATE cards SET name = 'Blue Dove',    base_creature = 'dove',    color = 'Blue' WHERE id = 'fly-dove';
UPDATE cards SET name = 'Blue Hawk',    base_creature = 'hawk',    color = 'Blue' WHERE id = 'fly-hawk';
UPDATE cards SET name = 'Blue Eagle',   base_creature = 'eagle',   color = 'Blue' WHERE id = 'fly-eagle';
UPDATE cards SET name = 'Blue Swan',    base_creature = 'swan',    color = 'Blue' WHERE id = 'fly-swan';
UPDATE cards SET name = 'Blue Phoenix', base_creature = 'phoenix', color = 'Blue' WHERE id = 'fly-phoenix';
UPDATE cards SET name = 'Blue Dragon',  base_creature = 'dragon',  color = 'Blue' WHERE id = 'fly-dragon';

-- 3g: Update display names + base_creature + color on Square faction
UPDATE cards SET name = 'Red Pig',      base_creature = 'pig',      color = 'Red' WHERE id = 'big-pig';
UPDATE cards SET name = 'Red Ram',      base_creature = 'ram',      color = 'Red' WHERE id = 'big-ram';
UPDATE cards SET name = 'Red Cow',      base_creature = 'cow',      color = 'Red' WHERE id = 'big-cow';
UPDATE cards SET name = 'Red Yak',      base_creature = 'yak',      color = 'Red' WHERE id = 'big-yak';
UPDATE cards SET name = 'Red Bear',     base_creature = 'bear',     color = 'Red' WHERE id = 'big-bear';
UPDATE cards SET name = 'Red Moose',    base_creature = 'moose',    color = 'Red' WHERE id = 'big-moose';
UPDATE cards SET name = 'Red Rhino',    base_creature = 'rhino',    color = 'Red' WHERE id = 'big-rhino';
UPDATE cards SET name = 'Red Hippo',    base_creature = 'hippo',    color = 'Red' WHERE id = 'big-hippo';
UPDATE cards SET name = 'Red Gorilla',  base_creature = 'gorilla',  color = 'Red' WHERE id = 'big-gorilla';
UPDATE cards SET name = 'Red Elephant', base_creature = 'elephant', color = 'Red' WHERE id = 'big-elephant';
UPDATE cards SET name = 'Red Whale',    base_creature = 'whale',    color = 'Red' WHERE id = 'big-whale';

-- 3h: Update display names + base_creature + color on Triangle faction
UPDATE cards SET name = 'Gold Ant',     base_creature = 'ant',     color = 'Gold' WHERE id = 'fast-ant';
UPDATE cards SET name = 'Gold Mouse',   base_creature = 'mouse',   color = 'Gold' WHERE id = 'fast-mouse';
UPDATE cards SET name = 'Gold Fox',     base_creature = 'fox',     color = 'Gold' WHERE id = 'fast-fox';
UPDATE cards SET name = 'Gold Hare',    base_creature = 'hare',    color = 'Gold' WHERE id = 'fast-hare';
UPDATE cards SET name = 'Gold Deer',    base_creature = 'deer',    color = 'Gold' WHERE id = 'fast-deer';
UPDATE cards SET name = 'Gold Horse',   base_creature = 'horse',   color = 'Gold' WHERE id = 'fast-horse';
UPDATE cards SET name = 'Gold Wolf',    base_creature = 'wolf',    color = 'Gold' WHERE id = 'fast-wolf';
UPDATE cards SET name = 'Gold Puma',    base_creature = 'puma',    color = 'Gold' WHERE id = 'fast-puma';
UPDATE cards SET name = 'Gold Tiger',   base_creature = 'tiger',   color = 'Gold' WHERE id = 'fast-tiger';
UPDATE cards SET name = 'Gold Cheetah', base_creature = 'cheetah', color = 'Gold' WHERE id = 'fast-cheetah';
UPDATE cards SET name = 'Gold Lion',    base_creature = 'lion',    color = 'Gold' WHERE id = 'fast-lion';

-- 3i: Update display names + base_creature + color on Diamond faction
UPDATE cards SET name = 'Prismatic Frog',    base_creature = 'frog',    color = 'Prismatic' WHERE id = 'dia-frog';
UPDATE cards SET name = 'Prismatic Fish',    base_creature = 'fish',    color = 'Prismatic' WHERE id = 'dia-fish';
UPDATE cards SET name = 'Prismatic Panda',   base_creature = 'panda',   color = 'Prismatic' WHERE id = 'dia-panda';
UPDATE cards SET name = 'Prismatic Turtle',  base_creature = 'turtle',  color = 'Prismatic' WHERE id = 'dia-turtle';
UPDATE cards SET name = 'Prismatic Unicorn', base_creature = 'unicorn', color = 'Prismatic' WHERE id = 'dia-unicorn';
UPDATE cards SET name = 'Prismatic Griffin', base_creature = 'griffin',  color = 'Prismatic' WHERE id = 'dia-griffin';

-- 3j: Update sets style_version
UPDATE sets SET style_version = 'painterly-v4' WHERE id = 'set1';

-- ============================================================
-- STEP 4: Insert ~204 variant creatures
-- ============================================================

INSERT INTO cards (id, set_id, name, shape_type, ability, strength, cost, card_type, rarity, base_creature, color) VALUES
  ('v-big-bug', 'set1', 'Red Bug', 'square', 'big', 1, 1, 'creature', 'common', 'bug', 'Red'),
  ('v-fast-bug', 'set1', 'Gold Bug', 'triangle', 'fast', 1, 1, 'creature', 'common', 'bug', 'Gold'),
  ('v-grd-bug', 'set1', 'Green Bug', 'circle', 'guard', 1, 1, 'creature', 'common', 'bug', 'Green'),
  ('v-dia-bug', 'set1', 'Prismatic Bug', 'diamond', 'fast', 1, 1, 'creature', 'common', 'bug', 'Prismatic'),
  ('v-big-bee', 'set1', 'Red Bee', 'square', 'big', 2, 1, 'creature', 'common', 'bee', 'Red'),
  ('v-fast-bee', 'set1', 'Gold Bee', 'triangle', 'fast', 2, 1, 'creature', 'common', 'bee', 'Gold'),
  ('v-grd-bee', 'set1', 'Green Bee', 'circle', 'guard', 2, 1, 'creature', 'common', 'bee', 'Green'),
  ('v-dia-bee', 'set1', 'Prismatic Bee', 'diamond', 'fly', 2, 1, 'creature', 'common', 'bee', 'Prismatic'),
  ('v-big-bat', 'set1', 'Red Bat', 'square', 'big', 3, 1, 'creature', 'common', 'bat', 'Red'),
  ('v-fast-bat', 'set1', 'Gold Bat', 'triangle', 'fast', 3, 1, 'creature', 'common', 'bat', 'Gold'),
  ('v-grd-bat', 'set1', 'Green Bat', 'circle', 'guard', 3, 1, 'creature', 'common', 'bat', 'Green'),
  ('v-dia-bat', 'set1', 'Prismatic Bat', 'diamond', 'big', 3, 1, 'creature', 'common', 'bat', 'Prismatic'),
  ('v-big-jay', 'set1', 'Red Jay', 'square', 'big', 4, 2, 'creature', 'uncommon', 'jay', 'Red'),
  ('v-fast-jay', 'set1', 'Gold Jay', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'jay', 'Gold'),
  ('v-grd-jay', 'set1', 'Green Jay', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'jay', 'Green'),
  ('v-dia-jay', 'set1', 'Prismatic Jay', 'diamond', 'guard', 4, 2, 'creature', 'uncommon', 'jay', 'Prismatic'),
  ('v-big-owl', 'set1', 'Red Owl', 'square', 'big', 4, 2, 'creature', 'uncommon', 'owl', 'Red'),
  ('v-fast-owl', 'set1', 'Gold Owl', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'owl', 'Gold'),
  ('v-grd-owl', 'set1', 'Green Owl', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'owl', 'Green'),
  ('v-dia-owl', 'set1', 'Prismatic Owl', 'diamond', 'fast', 4, 2, 'creature', 'uncommon', 'owl', 'Prismatic'),
  ('v-big-crow', 'set1', 'Red Crow', 'square', 'big', 5, 2, 'creature', 'uncommon', 'crow', 'Red'),
  ('v-fast-crow', 'set1', 'Gold Crow', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'crow', 'Gold'),
  ('v-grd-crow', 'set1', 'Green Crow', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'crow', 'Green'),
  ('v-dia-crow', 'set1', 'Prismatic Crow', 'diamond', 'fly', 5, 2, 'creature', 'uncommon', 'crow', 'Prismatic'),
  ('v-big-dove', 'set1', 'Red Dove', 'square', 'big', 5, 2, 'creature', 'uncommon', 'dove', 'Red'),
  ('v-fast-dove', 'set1', 'Gold Dove', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'dove', 'Gold'),
  ('v-grd-dove', 'set1', 'Green Dove', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'dove', 'Green'),
  ('v-dia-dove', 'set1', 'Prismatic Dove', 'diamond', 'big', 5, 2, 'creature', 'uncommon', 'dove', 'Prismatic'),
  ('v-big-hawk', 'set1', 'Red Hawk', 'square', 'big', 6, 2, 'creature', 'uncommon', 'hawk', 'Red'),
  ('v-fast-hawk', 'set1', 'Gold Hawk', 'triangle', 'fast', 6, 2, 'creature', 'uncommon', 'hawk', 'Gold'),
  ('v-grd-hawk', 'set1', 'Green Hawk', 'circle', 'guard', 6, 2, 'creature', 'uncommon', 'hawk', 'Green'),
  ('v-dia-hawk', 'set1', 'Prismatic Hawk', 'diamond', 'guard', 6, 2, 'creature', 'uncommon', 'hawk', 'Prismatic'),
  ('v-big-eagle', 'set1', 'Red Eagle', 'square', 'big', 7, 3, 'creature', 'rare', 'eagle', 'Red'),
  ('v-fast-eagle', 'set1', 'Gold Eagle', 'triangle', 'fast', 7, 3, 'creature', 'rare', 'eagle', 'Gold'),
  ('v-grd-eagle', 'set1', 'Green Eagle', 'circle', 'guard', 7, 3, 'creature', 'rare', 'eagle', 'Green'),
  ('v-dia-eagle', 'set1', 'Prismatic Eagle', 'diamond', 'fast', 7, 3, 'creature', 'rare', 'eagle', 'Prismatic'),
  ('v-big-swan', 'set1', 'Red Swan', 'square', 'big', 8, 3, 'creature', 'rare', 'swan', 'Red'),
  ('v-fast-swan', 'set1', 'Gold Swan', 'triangle', 'fast', 8, 3, 'creature', 'rare', 'swan', 'Gold'),
  ('v-grd-swan', 'set1', 'Green Swan', 'circle', 'guard', 8, 3, 'creature', 'rare', 'swan', 'Green'),
  ('v-dia-swan', 'set1', 'Prismatic Swan', 'diamond', 'fly', 8, 3, 'creature', 'rare', 'swan', 'Prismatic'),
  ('v-big-phoenix', 'set1', 'Red Phoenix', 'square', 'big', 9, 3, 'creature', 'mythic', 'phoenix', 'Red'),
  ('v-fast-phoenix', 'set1', 'Gold Phoenix', 'triangle', 'fast', 9, 3, 'creature', 'mythic', 'phoenix', 'Gold'),
  ('v-grd-phoenix', 'set1', 'Green Phoenix', 'circle', 'guard', 9, 3, 'creature', 'mythic', 'phoenix', 'Green'),
  ('v-dia-phoenix', 'set1', 'Prismatic Phoenix', 'diamond', 'big', 9, 3, 'creature', 'mythic', 'phoenix', 'Prismatic'),
  ('v-big-dragon', 'set1', 'Red Dragon', 'square', 'big', 10, 3, 'creature', 'mythic', 'dragon', 'Red'),
  ('v-fast-dragon', 'set1', 'Gold Dragon', 'triangle', 'fast', 10, 3, 'creature', 'mythic', 'dragon', 'Gold'),
  ('v-grd-dragon', 'set1', 'Green Dragon', 'circle', 'guard', 10, 3, 'creature', 'mythic', 'dragon', 'Green'),
  ('v-dia-dragon', 'set1', 'Prismatic Dragon', 'diamond', 'guard', 10, 3, 'creature', 'mythic', 'dragon', 'Prismatic'),
  ('v-fly-pig', 'set1', 'Blue Pig', 'star', 'fly', 1, 1, 'creature', 'common', 'pig', 'Blue'),
  ('v-fast-pig', 'set1', 'Gold Pig', 'triangle', 'fast', 1, 1, 'creature', 'common', 'pig', 'Gold'),
  ('v-grd-pig', 'set1', 'Green Pig', 'circle', 'guard', 1, 1, 'creature', 'common', 'pig', 'Green'),
  ('v-dia-pig', 'set1', 'Prismatic Pig', 'diamond', 'fast', 1, 1, 'creature', 'common', 'pig', 'Prismatic'),
  ('v-fly-ram', 'set1', 'Blue Ram', 'star', 'fly', 2, 1, 'creature', 'common', 'ram', 'Blue'),
  ('v-fast-ram', 'set1', 'Gold Ram', 'triangle', 'fast', 2, 1, 'creature', 'common', 'ram', 'Gold'),
  ('v-grd-ram', 'set1', 'Green Ram', 'circle', 'guard', 2, 1, 'creature', 'common', 'ram', 'Green'),
  ('v-dia-ram', 'set1', 'Prismatic Ram', 'diamond', 'fly', 2, 1, 'creature', 'common', 'ram', 'Prismatic'),
  ('v-fly-cow', 'set1', 'Blue Cow', 'star', 'fly', 3, 1, 'creature', 'common', 'cow', 'Blue'),
  ('v-fast-cow', 'set1', 'Gold Cow', 'triangle', 'fast', 3, 1, 'creature', 'common', 'cow', 'Gold'),
  ('v-grd-cow', 'set1', 'Green Cow', 'circle', 'guard', 3, 1, 'creature', 'common', 'cow', 'Green'),
  ('v-dia-cow', 'set1', 'Prismatic Cow', 'diamond', 'big', 3, 1, 'creature', 'common', 'cow', 'Prismatic'),
  ('v-fly-yak', 'set1', 'Blue Yak', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'yak', 'Blue'),
  ('v-fast-yak', 'set1', 'Gold Yak', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'yak', 'Gold'),
  ('v-grd-yak', 'set1', 'Green Yak', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'yak', 'Green'),
  ('v-dia-yak', 'set1', 'Prismatic Yak', 'diamond', 'guard', 4, 2, 'creature', 'uncommon', 'yak', 'Prismatic'),
  ('v-fly-bear', 'set1', 'Blue Bear', 'star', 'fly', 5, 2, 'creature', 'uncommon', 'bear', 'Blue'),
  ('v-fast-bear', 'set1', 'Gold Bear', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'bear', 'Gold'),
  ('v-grd-bear', 'set1', 'Green Bear', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'bear', 'Green'),
  ('v-dia-bear', 'set1', 'Prismatic Bear', 'diamond', 'fast', 5, 2, 'creature', 'uncommon', 'bear', 'Prismatic'),
  ('v-fly-moose', 'set1', 'Blue Moose', 'star', 'fly', 5, 2, 'creature', 'uncommon', 'moose', 'Blue'),
  ('v-fast-moose', 'set1', 'Gold Moose', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'moose', 'Gold'),
  ('v-grd-moose', 'set1', 'Green Moose', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'moose', 'Green'),
  ('v-dia-moose', 'set1', 'Prismatic Moose', 'diamond', 'fly', 5, 2, 'creature', 'uncommon', 'moose', 'Prismatic'),
  ('v-fly-rhino', 'set1', 'Blue Rhino', 'star', 'fly', 6, 2, 'creature', 'uncommon', 'rhino', 'Blue'),
  ('v-fast-rhino', 'set1', 'Gold Rhino', 'triangle', 'fast', 6, 2, 'creature', 'uncommon', 'rhino', 'Gold'),
  ('v-grd-rhino', 'set1', 'Green Rhino', 'circle', 'guard', 6, 2, 'creature', 'uncommon', 'rhino', 'Green'),
  ('v-dia-rhino', 'set1', 'Prismatic Rhino', 'diamond', 'big', 6, 2, 'creature', 'uncommon', 'rhino', 'Prismatic'),
  ('v-fly-hippo', 'set1', 'Blue Hippo', 'star', 'fly', 7, 3, 'creature', 'rare', 'hippo', 'Blue'),
  ('v-fast-hippo', 'set1', 'Gold Hippo', 'triangle', 'fast', 7, 3, 'creature', 'rare', 'hippo', 'Gold'),
  ('v-grd-hippo', 'set1', 'Green Hippo', 'circle', 'guard', 7, 3, 'creature', 'rare', 'hippo', 'Green'),
  ('v-dia-hippo', 'set1', 'Prismatic Hippo', 'diamond', 'guard', 7, 3, 'creature', 'rare', 'hippo', 'Prismatic'),
  ('v-fly-gorilla', 'set1', 'Blue Gorilla', 'star', 'fly', 8, 3, 'creature', 'rare', 'gorilla', 'Blue'),
  ('v-fast-gorilla', 'set1', 'Gold Gorilla', 'triangle', 'fast', 8, 3, 'creature', 'rare', 'gorilla', 'Gold'),
  ('v-grd-gorilla', 'set1', 'Green Gorilla', 'circle', 'guard', 8, 3, 'creature', 'rare', 'gorilla', 'Green'),
  ('v-dia-gorilla', 'set1', 'Prismatic Gorilla', 'diamond', 'fast', 8, 3, 'creature', 'rare', 'gorilla', 'Prismatic'),
  ('v-fly-elephant', 'set1', 'Blue Elephant', 'star', 'fly', 9, 3, 'creature', 'mythic', 'elephant', 'Blue'),
  ('v-fast-elephant', 'set1', 'Gold Elephant', 'triangle', 'fast', 9, 3, 'creature', 'mythic', 'elephant', 'Gold'),
  ('v-grd-elephant', 'set1', 'Green Elephant', 'circle', 'guard', 9, 3, 'creature', 'mythic', 'elephant', 'Green'),
  ('v-dia-elephant', 'set1', 'Prismatic Elephant', 'diamond', 'fly', 9, 3, 'creature', 'mythic', 'elephant', 'Prismatic'),
  ('v-fly-whale', 'set1', 'Blue Whale', 'star', 'fly', 10, 3, 'creature', 'mythic', 'whale', 'Blue'),
  ('v-fast-whale', 'set1', 'Gold Whale', 'triangle', 'fast', 10, 3, 'creature', 'mythic', 'whale', 'Gold'),
  ('v-grd-whale', 'set1', 'Green Whale', 'circle', 'guard', 10, 3, 'creature', 'mythic', 'whale', 'Green'),
  ('v-dia-whale', 'set1', 'Prismatic Whale', 'diamond', 'big', 10, 3, 'creature', 'mythic', 'whale', 'Prismatic'),
  ('v-fly-ant', 'set1', 'Blue Ant', 'star', 'fly', 1, 1, 'creature', 'common', 'ant', 'Blue'),
  ('v-big-ant', 'set1', 'Red Ant', 'square', 'big', 1, 1, 'creature', 'common', 'ant', 'Red'),
  ('v-grd-ant', 'set1', 'Green Ant', 'circle', 'guard', 1, 1, 'creature', 'common', 'ant', 'Green'),
  ('v-dia-ant', 'set1', 'Prismatic Ant', 'diamond', 'guard', 1, 1, 'creature', 'common', 'ant', 'Prismatic'),
  ('v-fly-mouse', 'set1', 'Blue Mouse', 'star', 'fly', 2, 1, 'creature', 'common', 'mouse', 'Blue'),
  ('v-big-mouse', 'set1', 'Red Mouse', 'square', 'big', 2, 1, 'creature', 'common', 'mouse', 'Red'),
  ('v-grd-mouse', 'set1', 'Green Mouse', 'circle', 'guard', 2, 1, 'creature', 'common', 'mouse', 'Green'),
  ('v-dia-mouse', 'set1', 'Prismatic Mouse', 'diamond', 'fast', 2, 1, 'creature', 'common', 'mouse', 'Prismatic'),
  ('v-fly-fox', 'set1', 'Blue Fox', 'star', 'fly', 3, 1, 'creature', 'common', 'fox', 'Blue'),
  ('v-big-fox', 'set1', 'Red Fox', 'square', 'big', 3, 1, 'creature', 'common', 'fox', 'Red'),
  ('v-grd-fox', 'set1', 'Green Fox', 'circle', 'guard', 3, 1, 'creature', 'common', 'fox', 'Green'),
  ('v-dia-fox', 'set1', 'Prismatic Fox', 'diamond', 'fly', 3, 1, 'creature', 'common', 'fox', 'Prismatic'),
  ('v-fly-hare', 'set1', 'Blue Hare', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'hare', 'Blue'),
  ('v-big-hare', 'set1', 'Red Hare', 'square', 'big', 4, 2, 'creature', 'uncommon', 'hare', 'Red'),
  ('v-grd-hare', 'set1', 'Green Hare', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'hare', 'Green'),
  ('v-dia-hare', 'set1', 'Prismatic Hare', 'diamond', 'big', 4, 2, 'creature', 'uncommon', 'hare', 'Prismatic'),
  ('v-fly-deer', 'set1', 'Blue Deer', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'deer', 'Blue'),
  ('v-big-deer', 'set1', 'Red Deer', 'square', 'big', 4, 2, 'creature', 'uncommon', 'deer', 'Red'),
  ('v-grd-deer', 'set1', 'Green Deer', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'deer', 'Green'),
  ('v-dia-deer', 'set1', 'Prismatic Deer', 'diamond', 'guard', 4, 2, 'creature', 'uncommon', 'deer', 'Prismatic'),
  ('v-fly-horse', 'set1', 'Blue Horse', 'star', 'fly', 5, 2, 'creature', 'uncommon', 'horse', 'Blue'),
  ('v-big-horse', 'set1', 'Red Horse', 'square', 'big', 5, 2, 'creature', 'uncommon', 'horse', 'Red'),
  ('v-grd-horse', 'set1', 'Green Horse', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'horse', 'Green'),
  ('v-dia-horse', 'set1', 'Prismatic Horse', 'diamond', 'fast', 5, 2, 'creature', 'uncommon', 'horse', 'Prismatic'),
  ('v-fly-wolf', 'set1', 'Blue Wolf', 'star', 'fly', 6, 2, 'creature', 'uncommon', 'wolf', 'Blue'),
  ('v-big-wolf', 'set1', 'Red Wolf', 'square', 'big', 6, 2, 'creature', 'uncommon', 'wolf', 'Red'),
  ('v-grd-wolf', 'set1', 'Green Wolf', 'circle', 'guard', 6, 2, 'creature', 'uncommon', 'wolf', 'Green'),
  ('v-dia-wolf', 'set1', 'Prismatic Wolf', 'diamond', 'fly', 6, 2, 'creature', 'uncommon', 'wolf', 'Prismatic'),
  ('v-fly-puma', 'set1', 'Blue Puma', 'star', 'fly', 7, 3, 'creature', 'rare', 'puma', 'Blue'),
  ('v-big-puma', 'set1', 'Red Puma', 'square', 'big', 7, 3, 'creature', 'rare', 'puma', 'Red'),
  ('v-grd-puma', 'set1', 'Green Puma', 'circle', 'guard', 7, 3, 'creature', 'rare', 'puma', 'Green'),
  ('v-dia-puma', 'set1', 'Prismatic Puma', 'diamond', 'big', 7, 3, 'creature', 'rare', 'puma', 'Prismatic'),
  ('v-fly-tiger', 'set1', 'Blue Tiger', 'star', 'fly', 8, 3, 'creature', 'rare', 'tiger', 'Blue'),
  ('v-big-tiger', 'set1', 'Red Tiger', 'square', 'big', 8, 3, 'creature', 'rare', 'tiger', 'Red'),
  ('v-grd-tiger', 'set1', 'Green Tiger', 'circle', 'guard', 8, 3, 'creature', 'rare', 'tiger', 'Green'),
  ('v-dia-tiger', 'set1', 'Prismatic Tiger', 'diamond', 'guard', 8, 3, 'creature', 'rare', 'tiger', 'Prismatic'),
  ('v-fly-cheetah', 'set1', 'Blue Cheetah', 'star', 'fly', 9, 3, 'creature', 'mythic', 'cheetah', 'Blue'),
  ('v-big-cheetah', 'set1', 'Red Cheetah', 'square', 'big', 9, 3, 'creature', 'mythic', 'cheetah', 'Red'),
  ('v-grd-cheetah', 'set1', 'Green Cheetah', 'circle', 'guard', 9, 3, 'creature', 'mythic', 'cheetah', 'Green'),
  ('v-dia-cheetah', 'set1', 'Prismatic Cheetah', 'diamond', 'fast', 9, 3, 'creature', 'mythic', 'cheetah', 'Prismatic'),
  ('v-fly-lion', 'set1', 'Blue Lion', 'star', 'fly', 10, 3, 'creature', 'mythic', 'lion', 'Blue'),
  ('v-big-lion', 'set1', 'Red Lion', 'square', 'big', 10, 3, 'creature', 'mythic', 'lion', 'Red'),
  ('v-grd-lion', 'set1', 'Green Lion', 'circle', 'guard', 10, 3, 'creature', 'mythic', 'lion', 'Green'),
  ('v-dia-lion', 'set1', 'Prismatic Lion', 'diamond', 'fly', 10, 3, 'creature', 'mythic', 'lion', 'Prismatic'),
  ('v-fly-worm', 'set1', 'Blue Worm', 'star', 'fly', 1, 1, 'creature', 'common', 'worm', 'Blue'),
  ('v-big-worm', 'set1', 'Red Worm', 'square', 'big', 1, 1, 'creature', 'common', 'worm', 'Red'),
  ('v-fast-worm', 'set1', 'Gold Worm', 'triangle', 'fast', 1, 1, 'creature', 'common', 'worm', 'Gold'),
  ('v-dia-worm', 'set1', 'Prismatic Worm', 'diamond', 'big', 1, 1, 'creature', 'common', 'worm', 'Prismatic'),
  ('v-fly-hen', 'set1', 'Blue Hen', 'star', 'fly', 2, 1, 'creature', 'common', 'hen', 'Blue'),
  ('v-big-hen', 'set1', 'Red Hen', 'square', 'big', 2, 1, 'creature', 'common', 'hen', 'Red'),
  ('v-fast-hen', 'set1', 'Gold Hen', 'triangle', 'fast', 2, 1, 'creature', 'common', 'hen', 'Gold'),
  ('v-dia-hen', 'set1', 'Prismatic Hen', 'diamond', 'guard', 2, 1, 'creature', 'common', 'hen', 'Prismatic'),
  ('v-fly-cat', 'set1', 'Blue Cat', 'star', 'fly', 3, 1, 'creature', 'common', 'cat', 'Blue'),
  ('v-big-cat', 'set1', 'Red Cat', 'square', 'big', 3, 1, 'creature', 'common', 'cat', 'Red'),
  ('v-fast-cat', 'set1', 'Gold Cat', 'triangle', 'fast', 3, 1, 'creature', 'common', 'cat', 'Gold'),
  ('v-dia-cat', 'set1', 'Prismatic Cat', 'diamond', 'fast', 3, 1, 'creature', 'common', 'cat', 'Prismatic'),
  ('v-fly-dog', 'set1', 'Blue Dog', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'dog', 'Blue'),
  ('v-big-dog', 'set1', 'Red Dog', 'square', 'big', 4, 2, 'creature', 'uncommon', 'dog', 'Red'),
  ('v-fast-dog', 'set1', 'Gold Dog', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'dog', 'Gold'),
  ('v-dia-dog', 'set1', 'Prismatic Dog', 'diamond', 'fly', 4, 2, 'creature', 'uncommon', 'dog', 'Prismatic'),
  ('v-fly-duck', 'set1', 'Blue Duck', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'duck', 'Blue'),
  ('v-big-duck', 'set1', 'Red Duck', 'square', 'big', 4, 2, 'creature', 'uncommon', 'duck', 'Red'),
  ('v-fast-duck', 'set1', 'Gold Duck', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'duck', 'Gold'),
  ('v-dia-duck', 'set1', 'Prismatic Duck', 'diamond', 'big', 4, 2, 'creature', 'uncommon', 'duck', 'Prismatic'),
  ('v-fly-goat', 'set1', 'Blue Goat', 'star', 'fly', 5, 2, 'creature', 'uncommon', 'goat', 'Blue'),
  ('v-big-goat', 'set1', 'Red Goat', 'square', 'big', 5, 2, 'creature', 'uncommon', 'goat', 'Red'),
  ('v-fast-goat', 'set1', 'Gold Goat', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'goat', 'Gold'),
  ('v-dia-goat', 'set1', 'Prismatic Goat', 'diamond', 'guard', 5, 2, 'creature', 'uncommon', 'goat', 'Prismatic'),
  ('v-fly-pony', 'set1', 'Blue Pony', 'star', 'fly', 6, 2, 'creature', 'uncommon', 'pony', 'Blue'),
  ('v-big-pony', 'set1', 'Red Pony', 'square', 'big', 6, 2, 'creature', 'uncommon', 'pony', 'Red'),
  ('v-fast-pony', 'set1', 'Gold Pony', 'triangle', 'fast', 6, 2, 'creature', 'uncommon', 'pony', 'Gold'),
  ('v-dia-pony', 'set1', 'Prismatic Pony', 'diamond', 'fast', 6, 2, 'creature', 'uncommon', 'pony', 'Prismatic'),
  ('v-fly-seal', 'set1', 'Blue Seal', 'star', 'fly', 7, 3, 'creature', 'rare', 'seal', 'Blue'),
  ('v-big-seal', 'set1', 'Red Seal', 'square', 'big', 7, 3, 'creature', 'rare', 'seal', 'Red'),
  ('v-fast-seal', 'set1', 'Gold Seal', 'triangle', 'fast', 7, 3, 'creature', 'rare', 'seal', 'Gold'),
  ('v-dia-seal', 'set1', 'Prismatic Seal', 'diamond', 'fly', 7, 3, 'creature', 'rare', 'seal', 'Prismatic'),
  ('v-fly-croc', 'set1', 'Blue Croc', 'star', 'fly', 8, 3, 'creature', 'rare', 'croc', 'Blue'),
  ('v-big-croc', 'set1', 'Red Croc', 'square', 'big', 8, 3, 'creature', 'rare', 'croc', 'Red'),
  ('v-fast-croc', 'set1', 'Gold Croc', 'triangle', 'fast', 8, 3, 'creature', 'rare', 'croc', 'Gold'),
  ('v-dia-croc', 'set1', 'Prismatic Croc', 'diamond', 'big', 8, 3, 'creature', 'rare', 'croc', 'Prismatic'),
  ('v-fly-dino', 'set1', 'Blue Dino', 'star', 'fly', 9, 3, 'creature', 'mythic', 'dino', 'Blue'),
  ('v-big-dino', 'set1', 'Red Dino', 'square', 'big', 9, 3, 'creature', 'mythic', 'dino', 'Red'),
  ('v-fast-dino', 'set1', 'Gold Dino', 'triangle', 'fast', 9, 3, 'creature', 'mythic', 'dino', 'Gold'),
  ('v-dia-dino', 'set1', 'Prismatic Dino', 'diamond', 'guard', 9, 3, 'creature', 'mythic', 'dino', 'Prismatic'),
  ('v-fly-rex', 'set1', 'Blue Rex', 'star', 'fly', 10, 3, 'creature', 'mythic', 'rex', 'Blue'),
  ('v-big-rex', 'set1', 'Red Rex', 'square', 'big', 10, 3, 'creature', 'mythic', 'rex', 'Red'),
  ('v-fast-rex', 'set1', 'Gold Rex', 'triangle', 'fast', 10, 3, 'creature', 'mythic', 'rex', 'Gold'),
  ('v-dia-rex', 'set1', 'Prismatic Rex', 'diamond', 'fast', 10, 3, 'creature', 'mythic', 'rex', 'Prismatic'),
  ('v-fly-frog', 'set1', 'Blue Frog', 'star', 'fly', 2, 1, 'creature', 'common', 'frog', 'Blue'),
  ('v-big-frog', 'set1', 'Red Frog', 'square', 'big', 2, 1, 'creature', 'common', 'frog', 'Red'),
  ('v-fast-frog', 'set1', 'Gold Frog', 'triangle', 'fast', 2, 1, 'creature', 'common', 'frog', 'Gold'),
  ('v-grd-frog', 'set1', 'Green Frog', 'circle', 'guard', 2, 1, 'creature', 'common', 'frog', 'Green'),
  ('v-fly-fish', 'set1', 'Blue Fish', 'star', 'fly', 3, 1, 'creature', 'common', 'fish', 'Blue'),
  ('v-big-fish', 'set1', 'Red Fish', 'square', 'big', 3, 1, 'creature', 'common', 'fish', 'Red'),
  ('v-fast-fish', 'set1', 'Gold Fish', 'triangle', 'fast', 3, 1, 'creature', 'common', 'fish', 'Gold'),
  ('v-grd-fish', 'set1', 'Green Fish', 'circle', 'guard', 3, 1, 'creature', 'common', 'fish', 'Green'),
  ('v-fly-panda', 'set1', 'Blue Panda', 'star', 'fly', 5, 2, 'creature', 'uncommon', 'panda', 'Blue'),
  ('v-big-panda', 'set1', 'Red Panda', 'square', 'big', 5, 2, 'creature', 'uncommon', 'panda', 'Red'),
  ('v-fast-panda', 'set1', 'Gold Panda', 'triangle', 'fast', 5, 2, 'creature', 'uncommon', 'panda', 'Gold'),
  ('v-grd-panda', 'set1', 'Green Panda', 'circle', 'guard', 5, 2, 'creature', 'uncommon', 'panda', 'Green'),
  ('v-fly-turtle', 'set1', 'Blue Turtle', 'star', 'fly', 4, 2, 'creature', 'uncommon', 'turtle', 'Blue'),
  ('v-big-turtle', 'set1', 'Red Turtle', 'square', 'big', 4, 2, 'creature', 'uncommon', 'turtle', 'Red'),
  ('v-fast-turtle', 'set1', 'Gold Turtle', 'triangle', 'fast', 4, 2, 'creature', 'uncommon', 'turtle', 'Gold'),
  ('v-grd-turtle', 'set1', 'Green Turtle', 'circle', 'guard', 4, 2, 'creature', 'uncommon', 'turtle', 'Green'),
  ('v-fly-unicorn', 'set1', 'Blue Unicorn', 'star', 'fly', 7, 3, 'creature', 'rare', 'unicorn', 'Blue'),
  ('v-big-unicorn', 'set1', 'Red Unicorn', 'square', 'big', 7, 3, 'creature', 'rare', 'unicorn', 'Red'),
  ('v-fast-unicorn', 'set1', 'Gold Unicorn', 'triangle', 'fast', 7, 3, 'creature', 'rare', 'unicorn', 'Gold'),
  ('v-grd-unicorn', 'set1', 'Green Unicorn', 'circle', 'guard', 7, 3, 'creature', 'rare', 'unicorn', 'Green'),
  ('v-fly-griffin', 'set1', 'Blue Griffin', 'star', 'fly', 8, 3, 'creature', 'rare', 'griffin', 'Blue'),
  ('v-big-griffin', 'set1', 'Red Griffin', 'square', 'big', 8, 3, 'creature', 'rare', 'griffin', 'Red'),
  ('v-fast-griffin', 'set1', 'Gold Griffin', 'triangle', 'fast', 8, 3, 'creature', 'rare', 'griffin', 'Gold'),
  ('v-grd-griffin', 'set1', 'Green Griffin', 'circle', 'guard', 8, 3, 'creature', 'rare', 'griffin', 'Green')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 5: Insert item cards
-- ============================================================

INSERT INTO cards (id, set_id, name, shape_type, ability, strength, cost, card_type, rarity, base_creature, color) VALUES
  ('item-shield', 'set1', 'Shield', 'diamond', 'none', 0, 1, 'item', 'uncommon', NULL, NULL),
  ('item-heal',   'set1', 'Heal',   'diamond', 'none', 0, 1, 'item', 'uncommon', NULL, NULL),
  ('item-boost',  'set1', 'Boost',  'diamond', 'none', 0, 1, 'item', 'uncommon', NULL, NULL),
  ('item-swap',   'set1', 'Swap',   'diamond', 'none', 0, 1, 'item', 'rare',     NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE: Total cards after migration:
--   51 original creatures (grd-* replacing van-*)
--   + 1 dia-turtle (was missing)
--   + 204 variant creatures
--   + 5 shape cards (unchanged)
--   + 4 item cards
--   = 265 total
-- ============================================================
