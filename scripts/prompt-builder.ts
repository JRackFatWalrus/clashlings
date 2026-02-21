/**
 * Builds art prompts for Creature Clash card art generation.
 *
 * Art direction: "2D Painterly Fantasy" — vibrant illustrated environments,
 * cinematic lighting, soft brushwork. Target age 5-7. Collectible card game feel.
 */

export interface CardRow {
  id: string;
  name: string;
  base_creature: string;
  shape_type: string;
  ability: string;
  strength: number;
  card_type: string;
  rarity: string;
}

const MASTER_ART_STYLE = [
  'stylized vibrant fantasy illustration',
  'soft painterly brushwork with visible brush texture',
  'cinematic lighting with strong rim light',
  'expressive character in mid-action pose',
  'detailed magical environment background with atmospheric depth',
  'foreground character sharply focused with slightly blurred background',
  'high contrast lighting and rich saturated colors',
  'kid-friendly but epic and collectible',
  'collectible card game illustration style',
  'high resolution',
].join(', ');

const NEGATIVE_PROMPT = [
  'no text', 'no letters', 'no numbers', 'no watermark', 'no logo',
  'no 3D render', 'no polished 3D style', 'no Pixar style', 'no CGI look',
  'no plush toy', 'no felt texture', 'no nursery style', 'no sticker style',
  'no baby cartoon proportions', 'no flat shading', 'no flat vector look',
  'no blank gradient background', 'no studio background', 'no solid color background',
  'no dark horror', 'no gritty realism', 'no realistic fur',
  'no sharp teeth', 'no weapons', 'no messy background', 'no clutter',
  'no hands', 'no UI elements',
].join(', ');

const FACTION_ENVIRONMENTS: Record<string, string> = {
  circle: 'ancient enchanted forest with mossy stone ruins, glowing mushrooms, and dappled green light filtering through a thick canopy',
  square: 'volcanic mountain landscape with craggy lava cliffs, glowing magma rivers, and smoldering crimson-lit caverns',
  triangle: 'vast open savanna plains with dramatic golden sunset sky, windswept canyons, and distant lightning storm on the horizon',
  star: 'floating sky islands among aurora-lit clouds, crystalline celestial towers, and shimmering starfield atmosphere',
  diamond: 'prismatic crystal caverns with glowing waterfalls, refracting rainbow light beams, and shimmering arcane energy nexus',
};

const FACTION_TOKENS: Record<string, { wearable: string; accent: string; energy: string }> = {
  circle: {
    wearable: 'wearing a reinforced leafy green collar with a glowing emerald shield emblem',
    accent: 'primary accent color: vibrant emerald green',
    energy: 'faint green protective energy aura around body',
  },
  square: {
    wearable: 'wearing a sturdy armored belt with glowing red-brown shoulder guards',
    accent: 'primary accent color: bold earthy crimson-brown',
    energy: 'subtle ground-crack impact energy beneath feet',
  },
  triangle: {
    wearable: 'wearing a flowing orange-red speed scarf with motion streak trails',
    accent: 'primary accent color: electric sunset orange',
    energy: 'wind speed streaks and motion blur trailing behind',
  },
  star: {
    wearable: 'wearing a glowing crystal crown with swirling purple energy wisps',
    accent: 'primary accent color: electric violet-purple',
    energy: 'glowing magical sparkle particles and faint stardust trail',
  },
  diamond: {
    wearable: 'wearing sleek glowing goggles with a prismatic crystal badge',
    accent: 'primary accent color: brilliant crystalline cyan-blue with prismatic hints',
    energy: 'subtle prismatic light refraction and crystal spark effects',
  },
};

const ABILITY_POSES: Record<string, string> = {
  fly: 'mid-flight with wings fully spread, diving or soaring through the air with glowing motion blur on wingtips',
  big: 'mid-charge with powerful stomping stance, ground impact energy, massive and imposing forward lean',
  fast: 'explosive mid-dash or mid-leap, dynamic speed pose with motion blur streaks trailing behind',
  guard: 'braced defensive stance with wide protective posture, energy shield shimmer, determined bodyguard look',
  none: 'confident action-ready stance, alert and focused, slight forward lean as if about to spring into action',
};

const RARITY_VISUALS: Record<string, string> = {
  common: 'natural ambient lighting with soft environmental glow',
  uncommon: 'bright rim lighting with floating sparkle particles and faint magical aura in the environment',
  rare: 'dramatic cinematic rim lighting with strong glowing aura, radiating energy streaks, intense atmospheric highlights',
  mythic: 'epic dramatic lighting with blazing aura, powerful energy burst radiating from character, starburst rays and floating energy orbs in the environment',
};

function strengthDescriptor(strength: number): string {
  if (strength <= 2) return 'small scrappy';
  if (strength <= 4) return 'agile determined';
  if (strength <= 6) return 'strong confident';
  if (strength <= 8) return 'powerful imposing';
  return 'legendary';
}

const CREATURE_FLAVOR: Record<string, string> = {
  bug: 'fairy-like flying insect creature with iridescent wings darting through shafts of light',
  bee: 'armored bee warrior with sharp crystalline wings buzzing above flowering battleground',
  bat: 'sleek shadow bat with glowing violet wing membranes swooping through twilight skies',
  jay: 'swift blue jay with razor-sharp feathers streaking across a stormy sky',
  owl: 'wise mystic owl with glowing ancient eye markings perched among moonlit branches',
  crow: 'dark sleek crow with electric blue feather edges soaring above misty treetops',
  dove: 'radiant white dove with luminous golden-white wing glow ascending through clouds',
  hawk: 'fierce predator hawk with piercing eyes diving from a mountain peak',
  eagle: 'majestic golden eagle with massive wingspan soaring above cloud-wrapped peaks',
  swan: 'elegant powerful swan with crystalline ice-blue plumage gliding across a frozen lake',
  phoenix: 'blazing phoenix engulfed in violet-blue magical flames rising from volcanic ash',
  dragon: 'mighty dragon with shimmering scales breathing crackling energy above a mountain fortress',
  pig: 'tough little pig with a determined fighter expression charging across muddy terrain',
  ram: 'charging ram with glowing horns smashing through rocky cliffs',
  cow: 'sturdy armored cow with a powerful build stomping across cracked earth',
  yak: 'massive shaggy yak with glowing horn tips trudging through a blizzard mountain pass',
  bear: 'powerful grizzly bear mid-roar standing atop a fallen tree in a misty forest',
  moose: 'towering moose with enormous glowing antlers crashing through dense woodland',
  rhino: 'charging armored rhino with energy crackling along its horn across dusty plains',
  hippo: 'massive hippo emerging from a jungle river with tremendous jaw power and spray',
  gorilla: 'mighty silverback gorilla beating chest on a rocky outcrop with shockwave energy',
  elephant: 'colossal elephant trumpeting amid crumbling ancient temple ruins',
  whale: 'enormous cosmic whale breaching through ocean waves under a starlit sky',
  ant: 'tiny but fierce ant warrior dashing through a towering grass jungle',
  mouse: 'zippy mouse with electric speed trails racing through a moonlit burrow tunnel',
  fox: 'cunning fox mid-leap over a mossy log in an autumn twilight forest',
  hare: 'explosive jackrabbit launching across golden prairie grass at sunset',
  deer: 'swift deer in a graceful high-speed bound through a misty glade',
  horse: 'powerful stallion in full gallop across a thunderstorm-lit open plain',
  wolf: 'fierce wolf mid-pounce under crackling moonlight atop a snowy ridge',
  puma: 'sleek puma in a powerful leaping strike from a jungle cliff ledge',
  tiger: 'mighty tiger in an explosive charge through tall bamboo forest',
  cheetah: 'blazing-fast cheetah at maximum speed across sun-baked savanna flats',
  lion: 'legendary lion king mid-roar with mane blazing on a rocky summit at sunrise',
  worm: 'tough little armored worm coiled protectively among glowing mushroom roots',
  hen: 'feisty guardian hen with puffed-up protective stance on a mossy garden wall',
  cat: 'alert battle cat in a low defensive crouch atop ancient stone steps',
  dog: 'loyal guardian dog standing firm on a forest path with protective stance',
  duck: 'tough armored duck in a wide defensive stance at the edge of a reedy pond',
  goat: 'stubborn mountain goat braced on a windswept cliff with immovable determination',
  pony: 'brave war pony rearing up on a hilltop meadow with flowing mane',
  seal: 'powerful guardian seal with water barrier on an icy arctic shore',
  croc: 'massive armored crocodile with impenetrable scales lurking in swamp waters',
  dino: 'ancient armored dinosaur with glowing crystal plates in a primordial jungle',
  rex: 'colossal tyrannosaurus with devastating power aura in a volcanic wasteland',
  frog: 'acrobatic poison dart frog mid-leap across lily pads in a glowing rain forest',
  fish: 'sleek powerful fish diving through crystal-clear underwater ruins',
  panda: 'mighty bamboo warrior panda standing among misty mountain bamboo groves',
  turtle: 'armored fortress turtle with glowing crystal shell on a rocky shore',
  unicorn: 'majestic battle unicorn soaring with blazing horn through aurora-lit clouds',
  griffin: 'legendary griffin in a powerful diving attack from a celestial tower peak',
};

export function buildPrompt(card: CardRow, _styleVersion: string): string {
  const faction = FACTION_TOKENS[card.shape_type] ?? FACTION_TOKENS['circle'];
  const abilityPose = ABILITY_POSES[card.ability] ?? ABILITY_POSES['none'];
  const rarityVisual = RARITY_VISUALS[card.rarity] ?? RARITY_VISUALS['common'];
  const environment = FACTION_ENVIRONMENTS[card.shape_type] ?? FACTION_ENVIRONMENTS['circle'];

  if (card.card_type === 'shape') {
    const shapeName = card.name.toLowerCase();
    return [
      `Bright magical floating ${shapeName} shape entity, glowing with radiant energy`,
      'crackling light aura around edges with subtle particle sparks',
      'clean sharp geometric form with depth and dimension',
      `set against a ${environment}`,
      'strong rim lighting and high contrast shading',
      faction.accent,
      MASTER_ART_STYLE,
      rarityVisual,
      'feels powerful and magical, competitive but kid-friendly',
      NEGATIVE_PROMPT,
    ].filter(Boolean).join(', ');
  }

  const baseCreature = card.base_creature || card.name.split(' ').pop()?.toLowerCase() || card.name.toLowerCase();
  const flavor = CREATURE_FLAVOR[baseCreature] || `${baseCreature} creature in an epic fantasy landscape`;

  return [
    `A ${strengthDescriptor(card.strength)} ${flavor}`,
    abilityPose,
    `set in a ${environment}`,
    faction.wearable,
    faction.energy,
    faction.accent,
    MASTER_ART_STYLE,
    rarityVisual,
    `illustration for a competitive children's trading card game`,
    NEGATIVE_PROMPT,
  ].filter(Boolean).join(', ');
}
