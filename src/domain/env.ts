export const ENV_IDS = ['minimal-desk', 'night-sky', 'rainy-library', 'forest-cabin', 'ocean-retreat', 'japanese-garden', 'cozy-bedroom', 'coffee-shop', 'snowy-window', 'greenhouse', 'space-station', 'magic-archive'] as const
export type EnvId = (typeof ENV_IDS)[number]
export const DEFAULT_ENV: EnvId = 'minimal-desk'
export interface EnvInfo { aria: string; anchor: { x: number; y: number } } // anchor: % of scene box (feet position)
export const ENV_INFO: Record<EnvId, EnvInfo> = {
  'minimal-desk': { aria: 'Minimalist desk scene, a tidy wooden desk with a lamp, plant and mug beside a window; daylight slowly grows as the session passes', anchor: { x: 72, y: 80 } },
  'night-sky': { aria: 'Night sky scene, stars twinkling over quiet hills with a moon; the horizon slowly brightens toward dawn', anchor: { x: 24, y: 90 } },
  'rainy-library': { aria: 'Rainy library scene, rain on a tall arched window between bookshelves, with a candle on the desk that slowly burns down', anchor: { x: 70, y: 80 } },
  'forest-cabin': { aria: 'Forest cabin scene, a warm wooden room with a window onto pines and fireflies; the sun slowly rises outside', anchor: { x: 24, y: 88 } },
  'ocean-retreat': { aria: 'Ocean retreat scene, slow waves at dusk on a quiet beach; the sun sinks and the tide creeps in as time passes', anchor: { x: 74, y: 90 } },
  'japanese-garden': { aria: 'Japanese garden scene, a maple tree with falling leaves, a still pond and stones; the sun slowly crosses the sky', anchor: { x: 72, y: 88 } },
  'cozy-bedroom': { aria: 'Cozy bedroom scene, a lamp, blanket and bookshelf with a night window; the wall clock hand slowly turns', anchor: { x: 68, y: 83 } },
  'coffee-shop': { aria: 'Coffee shop scene, steaming cups, pendant lights and a rainy street window; the window light slowly warms', anchor: { x: 72, y: 82 } },
  'snowy-window': { aria: 'Snowy window scene, snow falling past a frosty window; snow slowly builds up on the sill', anchor: { x: 72, y: 82 } },
  'greenhouse': { aria: 'Botanical greenhouse scene, glass panes, leafy plants and soft light rays; the plants slowly grow and bloom', anchor: { x: 72, y: 90 } },
  'space-station': { aria: 'Space station scene, stars and a planet through a viewport above a console with blinking lights; the planet slowly rises', anchor: { x: 72, y: 84 } },
  'magic-archive': { aria: 'Magical archive scene, floating books and candles among tall shelves; the candles slowly burn down', anchor: { x: 72, y: 90 } },
}
export const isEnvId = (id: string): id is EnvId => (ENV_IDS as readonly string[]).includes(id)
export const envInfo = (id: string): EnvInfo => ENV_INFO[isEnvId(id) ? id : DEFAULT_ENV]
export const isOwnedEnv = (id: string, owned: Set<string>) => isEnvId(id) && owned.has(id)
export interface ProgressVisual { level: number; eased: number; stage: 0 | 1 | 2 | 3 }
/** Maps phase progress (0..1) to calm visual values; NaN and out-of-range are clamped. */
export function envProgressVisual(progress: number): ProgressVisual {
  const level = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  return { level, eased: level * level * (3 - 2 * level), stage: Math.min(3, Math.floor(level * 4)) as 0 | 1 | 2 | 3 }
}
/** Ambient motion plays only while a phase runs, the tab is visible and no reduced/static preference applies. */
export const shouldAnimate = (o: { running: boolean; reduced: boolean; staticBackground: boolean; hidden: boolean }) => o.running && !o.reduced && !o.staticBackground && !o.hidden
