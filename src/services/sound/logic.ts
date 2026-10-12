import type { SoundPrefs, TimerSnapshot } from '@/types'

export const SOUNDS = [
  { id: 'white', label: 'White noise' }, { id: 'brown', label: 'Brown noise' }, { id: 'rain', label: 'Rain' },
  { id: 'fire', label: 'Fireplace' }, { id: 'forest', label: 'Forest' }, { id: 'ocean', label: 'Ocean' },
  { id: 'wind', label: 'Gentle wind' }, { id: 'library', label: 'Library' },
] as const
export type SoundId = (typeof SOUNDS)[number]['id']
export const SOUND_IDS: string[] = SOUNDS.map(s => s.id)

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))
/** Enabled ids only, unknown ids dropped. */
export const activeIds = (mix: Record<string, boolean>) => SOUND_IDS.filter(id => mix[id])

/** Per-sound gain: master volume (squared for a perceptual curve) shared by sqrt(n) so a bigger mix is not louder. Muted = silence. */
export function mixVolumes(ids: string[], master: number, muted: boolean): Record<string, number> {
  const out: Record<string, number> = {}
  const g = muted || !ids.length ? 0 : (clamp01(master) ** 2) / Math.sqrt(ids.length)
  for (const id of ids) out[id] = g
  return out
}

export const FADE_MS = 30000
/** Sleep timer: full volume until the last fade window, then linear to 0. `done` once the total elapsed. */
export function sleepFade(totalMs: number, elapsedMs: number, fadeMs = FADE_MS) {
  if (totalMs <= 0) return { gain: 1, done: false, remainingMs: 0 }
  const remainingMs = Math.max(0, totalMs - elapsedMs)
  const fade = Math.min(fadeMs, totalMs)
  return { gain: remainingMs >= fade ? 1 : remainingMs / fade, done: remainingMs <= 0, remainingMs }
}
export function fmtCountdown(ms: number) {
  const s = Math.ceil(ms / 1000), m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export type AutoAction = { kind: 'none' } | { kind: 'stop' } | { kind: 'play'; ids: string[]; as: 'focus' | 'break' }
/** Decides what auto-transitions should do. Never plays without a prior user gesture. Pause/idle stops only audio that auto started (engine checks). */
export function autoAction(sound: SoundPrefs, t: Pick<TimerSnapshot, 'phase' | 'status'>, gesture: boolean): AutoAction {
  if (sound.auto === 'off' || !gesture) return { kind: 'none' }
  if (t.status !== 'running') return { kind: 'stop' }
  if (t.phase === 'focus') { const ids = activeIds(sound.mix); return ids.length ? { kind: 'play', ids, as: 'focus' } : { kind: 'none' } }
  if (sound.auto === 'focus-and-break' && SOUND_IDS.includes(sound.breakSound)) return { kind: 'play', ids: [sound.breakSound], as: 'break' }
  return { kind: 'stop' }
}
