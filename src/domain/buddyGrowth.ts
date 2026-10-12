/** XP comes from the reward ledger (1 xp per focused minute plus small task, quiz and review bonuses), so it survives buddy changes. */
export const MAX_LEVEL = 50
export const xpForLevel = (level: number) => 20 * (level - 1) * level
export function levelFor(xp: number) {
  const x = Math.max(0, Math.floor(xp)); let level = 1
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= x) level++
  const floor = xpForLevel(level), next = level >= MAX_LEVEL ? null : xpForLevel(level + 1)
  return { level, xp: x, floor, next, into: x - floor, span: next === null ? 0 : next - floor, toNext: next === null ? 0 : next - x, pct: next === null ? 1 : (x - floor) / (next - floor) }
}
export const LEVEL_TITLES = ['Newcomer', 'Reader', 'Note taker', 'Steady learner', 'Deep thinker', 'Scholar', 'Sage']
export const levelTitle = (level: number) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 5))]

export const MILESTONES = [
  { xp: 0, name: 'Hello, friend', blurb: 'Your buddy moved in.' }, { xp: 25, name: 'First steps', blurb: 'One short session together.' },
  { xp: 60, name: 'One hour together', blurb: 'An hour of study, side by side.' }, { xp: 300, name: 'Study pals', blurb: 'About five hours of effort.' },
  { xp: 600, name: 'Steady companion', blurb: 'About ten hours. Quietly impressive.' }, { xp: 1500, name: 'Deep reader', blurb: 'A serious pile of learning.' },
  { xp: 3000, name: 'Best friends', blurb: 'Fifty hours of company.' }, { xp: 6000, name: 'Legend of the library', blurb: 'A hundred hours and counting.' },
]
export function milestonesFor(xp: number) {
  const list = MILESTONES.map(m => ({ ...m, reached: xp >= m.xp })); const next = list.find(m => !m.reached) ?? null
  return { list, next, reachedCount: list.filter(m => m.reached).length }
}
