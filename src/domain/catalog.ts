import type { BuddyKind } from '@/types'
import { ALL_PARTS, SLOT_LABEL, cheap, partKey } from './avatar'
/** Single source of truth for ids used across Buddy, Forest, Environments, Shop and Achievements. cost 0 = free from the start. */
export type ItemKind = 'buddy' | 'outfit' | 'species' | 'decoration' | 'environment' | 'timer-skin' | 'effect' | 'avatar'
export interface CatalogItem { id: string; kind: ItemKind; name: string; cost: number; slot?: 'hat' | 'neck' | 'held' | 'aura'; blurb: string; unlockBadge?: string }
const I = (id: string, kind: ItemKind, name: string, cost: number, blurb: string, extra: Partial<CatalogItem> = {}): CatalogItem => ({ id, kind, name, cost: cheap(cost), blurb, ...extra })

export const BUDDIES: { kind: BuddyKind; name: string; defaultName: string; trait: string; cost: number }[] = ([
  { kind: 'cat', name: 'Cat', defaultName: 'Mochi', trait: 'Calm and cosy', cost: 0 },
  { kind: 'owl', name: 'Owl', defaultName: 'Hoot', trait: 'Wise night reader', cost: 0 },
  { kind: 'frog', name: 'Frog', defaultName: 'Pip', trait: 'Cheerful and bouncy', cost: 0 },
  { kind: 'fox', name: 'Fox', defaultName: 'Ember', trait: 'Curious and quick', cost: 40 },
  { kind: 'rabbit', name: 'Rabbit', defaultName: 'Clover', trait: 'Gentle and steady', cost: 40 },
  { kind: 'penguin', name: 'Penguin', defaultName: 'Waddle', trait: 'Cool under pressure', cost: 60 },
  { kind: 'robot', name: 'Robot', defaultName: 'Bolt', trait: 'Logical and tidy', cost: 80 },
  { kind: 'ghost', name: 'Ghost', defaultName: 'Boo', trait: 'Quiet and kind', cost: 80 },
  { kind: 'dragon', name: 'Dragon', defaultName: 'Spark', trait: 'Brave and bold', cost: 120 },
  { kind: 'spirit', name: 'Forest spirit', defaultName: 'Moss', trait: 'Peaceful and wise', cost: 120 },
] as { kind: BuddyKind; name: string; defaultName: string; trait: string; cost: number }[]).map(b => ({ ...b, cost: cheap(b.cost) }))
export const SPECIES = [
  I('oak', 'species', 'Oak', 0, 'A sturdy classic.'), I('pine', 'species', 'Pine', 0, 'Evergreen and calm.'), I('birch', 'species', 'Birch', 0, 'Light and bright.'),
  I('maple', 'species', 'Maple', 30, 'Turns red in autumn.'), I('cherry', 'species', 'Cherry blossom', 50, 'Soft pink blooms.'), I('willow', 'species', 'Willow', 60, 'Gentle drooping branches.'),
  I('bamboo', 'species', 'Bamboo', 70, 'Tall and quick.'), I('palm', 'species', 'Palm', 70, 'Sunny shoreline tree.'), I('ginkgo', 'species', 'Ginkgo', 90, 'Golden fan leaves.'), I('baobab', 'species', 'Baobab', 140, 'A rare giant.', { unlockBadge: 'forest-grove' }),
]
export const DECORATIONS = [
  I('pond', 'decoration', 'Pond', 25, 'A small reflective pond.'), I('bench', 'decoration', 'Bench', 25, 'A place to rest.'), I('lantern', 'decoration', 'Lantern', 35, 'Warm evening light.'),
  I('flowers', 'decoration', 'Wildflowers', 20, 'Colour at ground level.'), I('mushrooms', 'decoration', 'Mushrooms', 30, 'A tiny fairy ring.'), I('fireflies', 'decoration', 'Fireflies', 60, 'Gentle glow at dusk.'),
  I('bridge', 'decoration', 'Stone bridge', 70, 'Crosses the pond.'), I('fence', 'decoration', 'Garden fence', 30, 'Tidy borders.'),
]
export const OUTFITS = [
  I('scarf', 'outfit', 'Cosy scarf', 20, 'Warm and soft.', { slot: 'neck' }), I('glasses', 'outfit', 'Round glasses', 25, 'Very studious.', { slot: 'held' }), I('beanie', 'outfit', 'Beanie', 30, 'Snug and simple.', { slot: 'hat' }),
  I('grad-cap', 'outfit', 'Graduation cap', 80, 'For the long game.', { slot: 'hat', unlockBadge: 'weekly-goal' }), I('bow', 'outfit', 'Bow tie', 30, 'Dapper.', { slot: 'neck' }),
  I('crown', 'outfit', 'Tiny crown', 100, 'Earned, not given.', { slot: 'hat' }), I('book', 'outfit', 'Study book', 15, 'Holds a book.', { slot: 'held' }), I('star-aura', 'outfit', 'Star aura', 90, 'A soft sparkle.', { slot: 'aura' }),
]
export const ENVIRONMENTS = [
  I('minimal-desk', 'environment', 'Minimalist desk', 0, 'Clean and distraction free.'), I('night-sky', 'environment', 'Night sky', 0, 'Stars and a quiet moon.'), I('rainy-library', 'environment', 'Rainy library', 0, 'Rain on tall windows.'),
  I('forest-cabin', 'environment', 'Forest cabin', 20, 'Pines and a warm window.'), I('ocean-retreat', 'environment', 'Ocean retreat', 20, 'Slow waves at dusk.'), I('japanese-garden', 'environment', 'Japanese garden', 30, 'Stone, moss and maple.'),
  I('cozy-bedroom', 'environment', 'Cozy bedroom', 30, 'Lamp, blanket, bookshelf.'), I('coffee-shop', 'environment', 'Coffee shop', 30, 'Steam and soft light.'), I('snowy-window', 'environment', 'Snowy window', 40, 'Snow falling outside.'),
  I('greenhouse', 'environment', 'Botanical greenhouse', 40, 'Glass, leaves and light.'), I('space-station', 'environment', 'Space station', 50, 'Stars through a viewport.'), I('magic-archive', 'environment', 'Magical archive', 60, 'Floating books and candles.'),
]
export const SKINS = [I('skin-ring', 'timer-skin', 'Classic ring', 0, 'The default.'), I('skin-leaf', 'timer-skin', 'Leaf ring', 25, 'A ring of leaves.'), I('skin-moon', 'timer-skin', 'Moon phase', 40, 'Fills like a moon.')]
export const EFFECTS = [I('fx-petals', 'effect', 'Petal celebration', 30, 'Petals when you finish.'), I('fx-stars', 'effect', 'Star celebration', 40, 'Stars when you finish.')]
export const AVATAR_ITEMS: CatalogItem[] = ALL_PARTS.map(({ slot, part }) => ({ id: partKey(slot, part.id), kind: 'avatar', name: part.name, cost: part.cost, blurb: SLOT_LABEL[slot] }))
export const ALL_ITEMS: CatalogItem[] = [...AVATAR_ITEMS, ...BUDDIES.map((b): CatalogItem => ({ id: 'buddy:' + b.kind, kind: 'buddy', name: b.name, cost: b.cost, blurb: b.trait })), ...SPECIES, ...DECORATIONS, ...OUTFITS, ...ENVIRONMENTS, ...SKINS, ...EFFECTS]
export const itemById = (id: string) => ALL_ITEMS.find(i => i.id === id)
export const buddyDefaultName = (k: BuddyKind) => BUDDIES.find(b => b.kind === k)!.defaultName
