/** Avatar parts. cost 0 = free from the start. Face, eyes and mouth are fixed; clothes and accessories are the customisable part. */
export type Slot = 'top' | 'bottom' | 'shoes' | 'hat' | 'face' | 'back' | 'held' | 'bg'
export type For = 'b' | 'g' | 'u'
export type Vibe = 'cute' | 'cool' | 'classic'
export interface Part { id: string; name: string; cost: number; g?: For; v?: Vibe }
export type TopDetail = 'plain' | 'stripes' | 'star' | 'heart' | 'hoodie' | 'jersey' | 'overalls' | 'robe' | 'armor' | 'suit' | 'coat' | 'varsity' | 'galaxy' | 'rainbow' | 'sailor' | 'pj' | 'dress' | 'polo' | 'bolt' | 'cat' | 'flower' | 'bow' | 'ruffle'
export interface Top extends Part { c: string; c2: string; d: TopDetail; long?: boolean }
export type BottomDetail = 'plain' | 'plaid' | 'stripe' | 'cuff' | 'skirt' | 'galaxy' | 'rainbow' | 'tutu' | 'hearts' | 'camo'
export interface Bottom extends Part { c: string; c2: string; d: BottomDetail; short?: boolean }
export interface Shoe extends Part { c: string; c2: string; tall?: boolean; kind?: 'shoe' | 'skate' | 'cloud' | 'slipper' | 'maryjane' | 'ballet' }

/** Cheaper rewards: roughly 45% of the old price, never below 5 unless free. */
export const cheap = (c: number) => (c <= 0 ? 0 : Math.max(5, Math.round((c * 0.45) / 5) * 5))
export const FOR_LABEL: Record<For, string> = { b: 'Boys', g: 'Girls', u: 'Everyone' }
export const VIBE_LABEL: Record<Vibe, string> = { cute: 'Cute', cool: 'Cool', classic: 'Classic' }
/** Does a clothing item suit this body type? Unisex items suit both. */
export const fits = (p: Part, body: 'masc' | 'femme') => !p.g || p.g === 'u' || p.g === (body === 'masc' ? 'b' : 'g')

const T = (g: For, v: Vibe, id: string, name: string, cost: number, c: string, c2: string, d: TopDetail, long = false): Top => ({ id, name, cost, c, c2, d, long, g, v })
const B = (g: For, v: Vibe, id: string, name: string, cost: number, c: string, c2: string, d: BottomDetail, short = false): Bottom => ({ id, name, cost, c, c2, d, short, g, v })
const S = (g: For, v: Vibe, id: string, name: string, cost: number, c: string, c2: string, tall = false, kind: Shoe['kind'] = 'shoe'): Shoe => ({ id, name, cost, c, c2, tall, kind, g, v })
const P = (id: string, name: string, cost: number): Part => ({ id, name, cost: cheap(cost) })

export const TOPS: Top[] = [
  // free: boys
  T('b', 'classic', 'polo-navy', 'Navy polo', 0, '#2f4f8f', '#fdfbf4', 'polo'), T('b', 'cool', 'bolt-tee', 'Lightning tee', 0, '#23283f', '#ffd54a', 'bolt'), T('b', 'classic', 'tee-red', 'Cherry tee', 0, '#e2574c', '#fff', 'plain'),
  // free: girls
  T('g', 'cute', 'heart-tee', 'Heart tee', 0, '#f7c5d8', '#e2457a', 'heart'), T('g', 'cute', 'sundress', 'Sundress', 0, '#ffd6e0', '#ff7ab8', 'dress'), T('g', 'cute', 'ruffle-pink', 'Frilly top', 0, '#ffe3ee', '#ff9ec4', 'ruffle'),
  T('g', 'classic', 'flower-tee', 'Daisy tee', 0, '#fff7d6', '#ff8fb8', 'flower'),
  // free: everyone
  T('u', 'classic', 'tee-blue', 'Sky tee', 0, '#5fa8f5', '#fff', 'plain'), T('u', 'classic', 'tee-green', 'Leaf tee', 0, '#5cbf7a', '#fff', 'plain'), T('u', 'classic', 'stripe-navy', 'Sailor stripes', 0, '#fdfbf4', '#27406b', 'stripes'),
  T('u', 'classic', 'hoodie-gray', 'Comfy hoodie', 0, '#8c93a3', '#6d7384', 'hoodie', true), T('u', 'cute', 'cat-tee', 'Kitty tee', 0, '#ffe9c8', '#f0a04b', 'cat'),
  // boys
  T('b', 'cool', 'bolt-red', 'Flash tee', 8, '#e2574c', '#fff3b0', 'bolt'), T('b', 'classic', 'polo-green', 'Forest polo', 8, '#3d8f5f', '#f4f4ea', 'polo'), T('b', 'cool', 'street-jacket', 'Street jacket', 15, '#23252e', '#e2574c', 'varsity', true),
  T('b', 'classic', 'jersey', 'Team jersey', 15, '#e9522f', '#ffffff', 'jersey'), T('b', 'classic', 'overalls', 'Denim overalls', 15, '#fff2a8', '#4a76b8', 'overalls'), T('b', 'cool', 'hoodie-black', 'Midnight hoodie', 12, '#2c2e38', '#454860', 'hoodie', true),
  T('b', 'cool', 'varsity', 'Varsity jacket', 20, '#2f5fd0', '#f1f1ea', 'varsity', true), T('b', 'cool', 'tux', 'Fancy tux', 30, '#23252e', '#ffffff', 'suit', true),
  // girls
  T('g', 'cute', 'bow-blouse', 'Bow blouse', 8, '#fff4f8', '#ff6fa8', 'bow'), T('g', 'cute', 'ruffle-mint', 'Mint frills', 8, '#d9f6ea', '#5cc7a0', 'ruffle'), T('g', 'cute', 'hoodie-pink', 'Pink hoodie', 12, '#f08ac0', '#d768a3', 'hoodie', true),
  T('g', 'cute', 'flower-sun', 'Sunny flowers', 10, '#ffe08a', '#ff7a59', 'flower'), T('g', 'cute', 'lilac-dress', 'Lilac dress', 12, '#cdb8ff', '#8a6cf0', 'dress'), T('g', 'cute', 'cherry-dress', 'Cherry dress', 15, '#ff6b6b', '#fff4f0', 'dress'),
  T('g', 'classic', 'sailor', 'Sailor uniform', 15, '#ffffff', '#2d4f8f', 'sailor'), T('g', 'cool', 'neon-bolt', 'Neon bolt tee', 10, '#2a1f45', '#ff5fc8', 'bolt'), T('g', 'cool', 'rebel-jacket', 'Rebel jacket', 18, '#22232c', '#ff5fa8', 'varsity', true),
  T('g', 'cute', 'kimono', 'Sakura robe', 25, '#f5a8c4', '#fff4f8', 'robe', true), T('g', 'cute', 'party-dress', 'Party dress', 30, '#8a6cf0', '#ffd54a', 'dress'), T('g', 'cute', 'star-dress', 'Starlight dress', 35, '#2f3a63', '#ffd54a', 'dress'),
  // everyone
  T('u', 'cute', 'pj-moon', 'Pyjama top', 8, '#7d8be8', '#ffe9a8', 'pj', true), T('u', 'cool', 'star-tee', 'Star tee', 10, '#2f3a63', '#ffd54a', 'star'), T('u', 'cute', 'rainbow-tee', 'Rainbow tee', 12, '#ff6b6b', '#fff', 'rainbow'),
  T('u', 'cute', 'hoodie-purple', 'Violet hoodie', 12, '#8a6cf0', '#6f52d6', 'hoodie', true), T('u', 'classic', 'chef-coat', 'Chef coat', 15, '#fbfbf8', '#c9ccd4', 'coat', true), T('u', 'classic', 'lab-coat', 'Lab coat', 18, '#f4f6fa', '#9fb3d1', 'coat', true),
  T('u', 'cool', 'galaxy-hoodie', 'Galaxy hoodie', 35, '#3b2a7a', '#d56bff', 'galaxy', true), T('u', 'cool', 'wizard-robe', 'Wizard robe', 40, '#5b3fb0', '#ffd54a', 'robe', true),
  T('u', 'cool', 'knight', 'Knight armour', 45, '#aab4c6', '#6f7a90', 'armor', true), T('u', 'cool', 'champion', 'Champion gold', 70, '#f2c230', '#fff2b3', 'armor', true),
]
export const BOTTOMS: Bottom[] = [
  // free
  B('b', 'classic', 'shorts-khaki', 'Khaki shorts', 0, '#cdb682', '#b49c68', 'plain', true), B('b', 'cool', 'cargo', 'Cargo pants', 0, '#6c8a4f', '#58733e', 'cuff'), B('b', 'cool', 'camo', 'Camo pants', 0, '#7a8a5a', '#4b5a35', 'camo'),
  B('g', 'cute', 'skirt-pink', 'Pleated skirt', 0, '#f08ac0', '#d768a3', 'skirt'), B('g', 'classic', 'skirt-navy', 'School skirt', 0, '#2d4f8f', '#f1f1ea', 'skirt'), B('g', 'classic', 'denim-skirt', 'Denim skirt', 0, '#6f98d2', '#4a76b8', 'skirt'),
  B('g', 'cute', 'shorts-pastel', 'Pastel shorts', 0, '#ffc9dd', '#ff9ec4', 'plain', true),
  B('u', 'cute', 'shorts-bubble', 'Bubble shorts', 0, '#9fd2ff', '#fff', 'stripe', true), B('u', 'classic', 'jeans', 'Blue jeans', 0, '#4a76b8', '#3a5f98', 'cuff'), B('u', 'classic', 'joggers', 'Joggers', 0, '#5b6070', '#8c93a3', 'stripe'),
  // boys
  B('b', 'cool', 'shorts-red', 'Red shorts', 6, '#e2574c', '#fff', 'stripe', true), B('b', 'cool', 'camo-dark', 'Night camo', 12, '#434a5c', '#262b3a', 'camo'), B('b', 'classic', 'plaid', 'Plaid trousers', 15, '#a8483a', '#f0d9a0', 'plaid'),
  B('b', 'cool', 'knight-legs', 'Armour legs', 35, '#aab4c6', '#6f7a90', 'cuff'),
  // girls
  B('g', 'cute', 'tutu', 'Sparkly tutu', 10, '#ffc2e0', '#fff0f8', 'tutu'), B('g', 'cute', 'skirt-lilac', 'Lilac skirt', 8, '#c9b3ff', '#a58cf0', 'skirt'), B('g', 'cute', 'heart-legs', 'Heart leggings', 12, '#ff9ec4', '#fff', 'hearts'),
  B('g', 'cute', 'skirt-plaid', 'Plaid skirt', 12, '#c4473a', '#f4e1b0', 'skirt'), B('g', 'cool', 'skirt-black', 'Punk skirt', 12, '#23252e', '#ff5fa8', 'skirt'), B('g', 'cool', 'neon-legs', 'Neon leggings', 15, '#2a1f45', '#ff5fc8', 'stripe'),
  // everyone
  B('u', 'cool', 'jeans-black', 'Black jeans', 6, '#2c2e38', '#1c1d25', 'cuff'), B('u', 'cute', 'pj-pants', 'Pyjama pants', 8, '#7d8be8', '#ffe9a8', 'plaid'), B('u', 'cute', 'rainbow-legs', 'Rainbow leggings', 18, '#ff6b6b', '#fff', 'rainbow'),
  B('u', 'cool', 'space-pants', 'Galaxy pants', 28, '#3b2a7a', '#d56bff', 'galaxy'),
]
export const SHOES: Shoe[] = [
  // free
  S('b', 'cool', 'hightop-red', 'Red high-tops', 0, '#e2574c', '#fff', true), S('b', 'classic', 'boots-brown', 'Trail boots', 0, '#7a4f2e', '#a8774a', true),
  S('g', 'cute', 'maryjane', 'Mary janes', 0, '#2c2e38', '#f7c5d8', false, 'maryjane'), S('g', 'cute', 'ballet', 'Ballet flats', 0, '#f7c5d8', '#e2457a', false, 'ballet'), S('g', 'cute', 'sneak-pink', 'Pink sneakers', 0, '#f7c5d8', '#fff'),
  S('u', 'classic', 'sneak-white', 'White sneakers', 0, '#fbfbf8', '#e2574c'), S('u', 'classic', 'sneak-black', 'Black sneakers', 0, '#2c2e38', '#f1f1ea'), S('u', 'cute', 'slippers', 'Bunny slippers', 0, '#f7d6e6', '#ffffff', false, 'slipper'),
  // boys
  S('b', 'cool', 'street-high', 'Street high-tops', 8, '#23252e', '#ffd54a', true), S('b', 'cool', 'neon-run', 'Neon runners', 10, '#3be0b0', '#23252e'), S('b', 'classic', 'sneak-navy', 'Navy sneakers', 0, '#2f4f8f', '#fff'),
  // girls
  S('g', 'cute', 'heart-sneak', 'Heart sneakers', 8, '#fff0f6', '#ff5f9e'), S('g', 'cute', 'pink-boots', 'Pink boots', 12, '#f5a8c4', '#fff', true), S('g', 'cute', 'maryjane-red', 'Cherry janes', 8, '#e2574c', '#fff', false, 'maryjane'),
  S('g', 'cool', 'rebel-boots', 'Rebel boots', 14, '#23252e', '#ff5fa8', true), S('g', 'cute', 'ballet-mint', 'Mint ballet flats', 8, '#bff0de', '#5cc7a0', false, 'ballet'),
  // everyone
  S('u', 'classic', 'rain-yellow', 'Rain boots', 12, '#f5c542', '#d9a824', true), S('u', 'cool', 'skates', 'Roller skates', 22, '#fbfbf8', '#8a6cf0', false, 'skate'), S('u', 'cute', 'cloud', 'Cloud sneakers', 28, '#bfe3ff', '#ffffff', false, 'cloud'),
  S('u', 'cool', 'gold-shoes', 'Gold sneakers', 35, '#f2c230', '#fff2b3'),
]

export const HATS: Part[] = [P('cap', 'Red cap', 0), P('beanie', 'Blue beanie', 0), P('headband', 'Sporty headband', 0), P('party', 'Party hat', 15), P('bow', 'Big bow', 15), P('chef', 'Chef hat', 25), P('cat-ears', 'Cat ears', 25),
  P('cowboy', 'Cowboy hat', 30), P('headphones', 'Headphones', 30), P('strawberry', 'Strawberry hat', 30), P('bunny-ears', 'Bunny ears', 35), P('fox-ears', 'Fox ears', 35), P('flowers', 'Flower crown', 35),
  P('devil', 'Little horns', 40), P('tophat', 'Top hat', 45), P('grad-cap', 'Grad cap', 50), P('pirate', 'Pirate hat', 55), P('wizard', 'Wizard hat', 60), P('viking', 'Viking helmet', 60),
  P('halo', 'Halo', 70), P('unicorn', 'Unicorn horn', 75), P('astro', 'Space helmet', 80), P('crown', 'Golden crown', 100)]
export const FACES: Part[] = [P('blush', 'Rosy cheeks', 0), P('freckles', 'Freckles', 0), P('whiskers', 'Cat whiskers', 15), P('glasses', 'Round glasses', 20), P('eyepatch', 'Eyepatch', 20), P('shades', 'Sunglasses', 25),
  P('glasses-3d', '3D glasses', 25), P('heart-glasses', 'Heart glasses', 30), P('star-glasses', 'Star glasses', 30), P('monocle', 'Monocle', 35), P('ninja', 'Ninja mask', 40), P('visor', 'Cool visor', 45)]
export const BACKS: Part[] = [P('backpack', 'Backpack', 0), P('tail-fox', 'Fox tail', 40), P('cape-red', 'Hero cape', 40), P('cape-purple', 'Royal cape', 50), P('guitar', 'Guitar', 55), P('wings-bat', 'Bat wings', 60),
  P('wings-angel', 'Angel wings', 70), P('wings-fairy', 'Fairy wings', 80), P('jetpack', 'Jetpack', 90)]
export const HELDS: Part[] = [P('book', 'Study book', 0), P('pencil', 'Pencil', 0), P('flower', 'Daisy', 10), P('balloon', 'Balloon', 15), P('cocoa', 'Hot cocoa', 15), P('boba', 'Bubble tea', 20), P('controller', 'Game controller', 25),
  P('lantern', 'Lantern', 30), P('umbrella', 'Umbrella', 35), P('wand', 'Magic wand', 40), P('sword', 'Toy sword', 50), P('trophy', 'Trophy', 60)]
export const BGS: Part[] = [P('mint', 'Mint', 0), P('peach', 'Peach', 0), P('sky', 'Daytime sky', 0), P('sunset', 'Sunset', 15), P('meadow', 'Meadow', 20), P('night', 'Starry night', 25), P('beach', 'Beach', 30),
  P('sakura', 'Sakura', 35), P('library', 'Cosy library', 40), P('space', 'Outer space', 40), P('neon', 'Neon city', 50), P('aurora', 'Aurora', 60)]

export const PARTS: Record<Slot, Part[]> = { top: TOPS, bottom: BOTTOMS, shoes: SHOES, hat: HATS, face: FACES, back: BACKS, held: HELDS, bg: BGS }
export const SLOT_LABEL: Record<Slot, string> = { top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', hat: 'Hats', face: 'Face', back: 'Back', held: 'In hand', bg: 'Backdrop' }
export const SLOTS: Slot[] = ['top', 'bottom', 'shoes', 'hat', 'face', 'back', 'held', 'bg']
export const partKey = (slot: Slot, id: string) => `av:${slot}:${id}`
export const ALL_PARTS: { slot: Slot; part: Part }[] = SLOTS.flatMap(slot => PARTS[slot].map(part => ({ slot, part })))

export const SKIN_TONES = ['#fbd5b5', '#f0b98d', '#d99a6c', '#b9784a', '#8d5a36', '#5e3a22']
export const HAIR_STYLES = [{ id: 'short', name: 'Short' }, { id: 'bob', name: 'Bob' }, { id: 'spiky', name: 'Spiky' }, { id: 'long', name: 'Long' }, { id: 'buns', name: 'Buns' }, { id: 'pony', name: 'Ponytail' }, { id: 'curly', name: 'Curly' }, { id: 'side', name: 'Side sweep' }, { id: 'wavy', name: 'Wavy' }, { id: 'undercut', name: 'Undercut' }, { id: 'afro', name: 'Afro' }, { id: 'braids', name: 'Braids' }, { id: 'none', name: 'None' }]
export const HAIR_COLORS = ['#2b2230', '#6b4226', '#e8c16a', '#c8602b', '#f08ac0', '#4f8cf0', '#8a5cf0', '#6fd3a5', '#e9e9f2']

export type BodyType = 'masc' | 'femme'
export type ArtStyle = 'chibi' | 'mochi'
export interface AvatarCfg { body: BodyType; style: ArtStyle; skin: string; hair: string; hairColor: string; top: string; bottom: string; shoes: string; hat: string; face: string; back: string; held: string; bg: string }
export const DEFAULT_AVATAR: AvatarCfg = { body: 'masc', style: 'chibi', skin: SKIN_TONES[1], hair: 'short', hairColor: HAIR_COLORS[1], top: 'tee-blue', bottom: 'jeans', shoes: 'sneak-white', hat: '', face: 'blush', back: '', held: '', bg: 'mint' }

export const isOwned = (owned: Set<string>, slot: Slot, id: string) => !id || owned.has(partKey(slot, id))
export const costOf = (slot: Slot, id: string) => PARTS[slot].find(p => p.id === id)?.cost ?? 0
const pick = <T,>(a: T[], r: () => number) => a[Math.floor(r() * a.length)]
/** Random look using only parts the student already owns. */
export function surprise(owned: Set<string>, cur: AvatarCfg, r: () => number = Math.random): AvatarCfg {
  const next: AvatarCfg = { ...cur, hair: pick(HAIR_STYLES, r).id, hairColor: pick(HAIR_COLORS, r) }
  for (const s of SLOTS) {
    const ok = PARTS[s].filter(p => owned.has(partKey(s, p.id)) && fits(p, cur.body))
    const optional = s === 'hat' || s === 'back' || s === 'held' || s === 'face'
    next[s] = optional && r() < 0.35 ? '' : ok.length ? pick(ok, r).id : cur[s]
  }
  return next
}
/** Keeps every equipped part valid after catalogue changes or odd stored data. */
export function sanitizeAvatar(a: Partial<AvatarCfg> | undefined): AvatarCfg {
  const o = { ...DEFAULT_AVATAR, ...(a ?? {}) }
  for (const s of SLOTS) if (o[s] && !PARTS[s].some(p => p.id === o[s])) o[s] = DEFAULT_AVATAR[s]
  if (o.body !== 'masc' && o.body !== 'femme') o.body = DEFAULT_AVATAR.body
  if (o.style !== 'chibi' && o.style !== 'mochi') o.style = DEFAULT_AVATAR.style
  if (!HAIR_STYLES.some(h => h.id === o.hair)) o.hair = DEFAULT_AVATAR.hair
  return o
}
