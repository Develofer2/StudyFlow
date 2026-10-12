import type { BuddyPrefs } from '@/types'
type Style = BuddyPrefs['style']
/** Original, unattributed encouragements. Rule-based, never pressure to push on when tired. */
const Q: Record<Style, string[]> = {
  cheerful: ['Small steps still count. You are doing it!', 'Every minute you spend here is a gift to future you.', 'You showed up, and that is the hardest part.', 'Progress, not perfection. Keep going!', 'Look at you building a habit!', 'Your effort today makes tomorrow easier.', 'One page at a time, you are getting there.', 'I believe in you, truly.'],
  calm: ['Slow and steady carries you far.', 'Let each thought settle before the next.', 'You do not need to rush to move forward.', 'Quiet effort adds up.', 'Breathe. Notice that you are already doing it.', 'Focus is a muscle, and you are training it gently.', 'Be patient with yourself. This takes time.', 'Just this one thing, just for now.'],
  playful: ['Brain cells are doing a little dance right now.', 'Plot twist: you are getting smarter.', 'Future you just sent a thank-you note.', 'Studying: because wizards need practice too.', 'Another minute, another XP of wisdom.', 'You are basically a learning machine, a cute one.', 'Do not tell anyone, but you are crushing it.', 'Knowledge loading... please enjoy the progress bar.'],
  minimal: ['Keep going.', 'One step at a time.', 'You are doing well.', 'Steady focus.', 'Effort adds up.', 'Stay with it.', 'Progress counts.', 'Just begin, then continue.'],
}
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
export const pickQuote = (style: Style, seed: string) => { const pool = Q[style]; return pool[hash(`${style}|${seed}`) % pool.length] }
export const QUOTE_POOLS = Q
export const QUOTE_EVERY_MS = 4 * 60_000
