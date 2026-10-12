export interface Tokens { bg: string; surface: string; surface2: string; text: string; muted: string; border: string; primary: string; primaryFg: string; success: string; warning: string; danger: string }
export interface ThemeDef { id: string; name: string; blurb: string; h: number; s: number; ah: number; as: number; mode: 'light' | 'dark'; tags: string[]; contrast?: 'high' }
export const THEMES: ThemeDef[] = [
  { id: 'paper-ink', name: 'Paper & Ink', blurb: 'Warm paper, ink text. The calm default.', h: 38, s: 30, ah: 14, as: 62, mode: 'light', tags: ['warm', 'light'] },
  { id: 'midnight-focus', name: 'Midnight Focus', blurb: 'Deep slate with a soft cyan.', h: 216, s: 28, ah: 187, as: 58, mode: 'dark', tags: ['dark', 'cool'] },
  { id: 'obsidian', name: 'Obsidian', blurb: 'Neutral near-black, silver accents.', h: 220, s: 4, ah: 220, as: 6, mode: 'dark', tags: ['dark', 'neutral'] },
  { id: 'aurora-drift', name: 'Aurora Drift', blurb: 'Deep teal and northern-light mint.', h: 176, s: 34, ah: 152, as: 50, mode: 'dark', tags: ['dark', 'cool'] },
  { id: 'neon-bloom', name: 'Neon Bloom', blurb: 'Dark plum, a muted pink glow.', h: 300, s: 26, ah: 330, as: 62, mode: 'dark', tags: ['dark'] },
  { id: 'lavender-haze', name: 'Lavender Haze', blurb: 'Soft lavender and violet.', h: 262, s: 40, ah: 265, as: 48, mode: 'light', tags: ['light', 'cool'] },
  { id: 'sakura-dream', name: 'Sakura Dream', blurb: 'Blush pink, rose, warm cream.', h: 346, s: 42, ah: 340, as: 52, mode: 'light', tags: ['light', 'warm'] },
  { id: 'cloud-nine', name: 'Cloud Nine', blurb: 'Powder blue and pale gray.', h: 208, s: 36, ah: 212, as: 56, mode: 'light', tags: ['light', 'cool'] },
  { id: 'matcha-garden', name: 'Matcha Garden', blurb: 'Sage and matcha green.', h: 96, s: 26, ah: 108, as: 40, mode: 'light', tags: ['light', 'warm'] },
  { id: 'ocean-breeze', name: 'Ocean Breeze', blurb: 'Ocean blue, turquoise, sand.', h: 192, s: 34, ah: 196, as: 62, mode: 'light', tags: ['light', 'cool'] },
  { id: 'peach-blossom', name: 'Peach Blossom', blurb: 'Peach, coral, warm ivory.', h: 22, s: 54, ah: 10, as: 60, mode: 'light', tags: ['light', 'warm'] },
  { id: 'vanilla-latte', name: 'Vanilla Latte', blurb: 'Warm beige and coffee brown.', h: 32, s: 32, ah: 26, as: 44, mode: 'light', tags: ['light', 'warm'] },
  { id: 'sunset-study', name: 'Sunset Study', blurb: 'Amber and terracotta, low-blue light.', h: 24, s: 30, ah: 18, as: 58, mode: 'dark', tags: ['dark', 'warm'] },
  { id: 'lemon-sorbet', name: 'Lemon Sorbet', blurb: 'Buttery yellow, soft charcoal.', h: 50, s: 46, ah: 42, as: 70, mode: 'light', tags: ['light', 'warm'] },
  { id: 'rosewater', name: 'Rosewater', blurb: 'Muted rose and dusty mauve.', h: 350, s: 18, ah: 346, as: 34, mode: 'light', tags: ['light', 'warm'] },
  { id: 'forest-library', name: 'Forest Library', blurb: 'Deep forest, moss, parchment.', h: 140, s: 24, ah: 82, as: 38, mode: 'dark', tags: ['dark', 'warm'] },
  { id: 'monochrome-studio', name: 'Monochrome Studio', blurb: 'Grayscale, maximum clarity.', h: 0, s: 0, ah: 0, as: 0, mode: 'light', tags: ['light', 'contrast'], contrast: 'high' },
  { id: 'holographic-dream', name: 'Holographic Dream', blurb: 'Violet and blue iridescence.', h: 248, s: 30, ah: 232, as: 60, mode: 'dark', tags: ['dark', 'cool'] },
]
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s)}% ${l}%)`
export function tokensFor(t: ThemeDef, mode: 'light' | 'dark'): Tokens {
  const hi = !!t.contrast
  if (mode === 'light') return {
    bg: hsl(t.h, t.s * 0.55, hi ? 96 : 94), surface: hsl(t.h, t.s * 0.5, hi ? 99 : 97.5), surface2: hsl(t.h, t.s * 0.5, hi ? 91 : 90.5),
    text: hsl(t.h, t.s * 0.5, hi ? 7 : 14), muted: hsl(t.h, t.s * 0.25, hi ? 28 : 33), border: hsl(t.h, t.s * 0.35, hi ? 62 : 80),
    primary: hsl(t.ah, t.as, hi ? 16 : 33), primaryFg: hsl(t.ah, 30, 97), success: 'hsl(150 55% 26%)', warning: 'hsl(32 80% 28%)', danger: 'hsl(356 62% 40%)' }
  return {
    bg: hsl(t.h, t.s * 0.6, 11), surface: hsl(t.h, t.s * 0.55, 15), surface2: hsl(t.h, t.s * 0.5, 20), text: hsl(t.h, Math.min(t.s, 20) * 0.5, hi ? 94 : 88),
    muted: hsl(t.h, t.s * 0.25, 67), border: hsl(t.h, t.s * 0.4, 27), primary: hsl(t.ah, t.as * 0.85, 68), primaryFg: hsl(t.h, t.s * 0.6, 9),
    success: 'hsl(150 42% 62%)', warning: 'hsl(38 70% 65%)', danger: 'hsl(356 70% 72%)' }
}
// WCAG contrast
function toRgb(c: string): [number, number, number] {
  const m = c.match(/hsl\((\d+) (\d+)% ([\d.]+)%\)/)
  if (m) { const h = +m[1], s = +m[2] / 100, l = +m[3] / 100; const k = (n: number) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0) * 255, f(8) * 255, f(4) * 255] }
  const x = c.replace('#', ''); return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]
}
const lum = (c: string) => { const [r, g, b] = toRgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export function contrast(a: string, b: string) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
/** Custom accents are nudged lighter/darker until they reach 4.5:1 against the background. */
export function safeAccent(hex: string, bg: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex
  let [r, g, b] = toRgb(hex); const bgDark = lum(bg) < 0.4
  for (let i = 0; i < 40 && contrast(`#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`, bg) < 4.5; i++) {
    const f = bgDark ? 1.06 : 0.94; const add = bgDark ? 6 : 0
    r = Math.min(255, r * f + add); g = Math.min(255, g * f + add); b = Math.min(255, b * f + add)
  }
  return `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}
export const readableOn = (bg: string) => (contrast('#101010', bg) >= contrast('#f6f6f6', bg) ? '#101010' : '#f6f6f6')
