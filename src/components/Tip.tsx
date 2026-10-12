import { CircleHelp, Lightbulb, TriangleAlert, X } from 'lucide-react'
import { setPrefs, usePrefs } from '@/data/store'
import { go } from '@/app/router'
import { cx } from '@/components/ui'

export interface TipDef { text: string; warn?: boolean; topic?: string }

export const TIPS: Record<string, TipDef> = {
  home: { text: 'This is your daily dashboard: today\'s focus goal, what is due, and one suggested next step. Start with the big Focus button if you are unsure.', topic: 'start' },
  focus: { text: 'Press Start to begin a timed block. Only active focus time counts. Pausing is fine, but Discard throws the session away and earns nothing. Space starts and pauses.', topic: 'focus' },
  tasks: { text: 'Add a task with a due date and an estimate, then press its timer icon to study it. Finished tasks earn small rewards; deleting a task does not remove points you already earned.', topic: 'tasks' },
  subjects: { text: 'Subjects group your tasks, notes, cards and focus time. Archive a subject instead of deleting it to keep its history in your stats.', topic: 'tasks' },
  study: { text: 'Cards, quizzes and notes live here. Reviewing cards a little every day beats one long cram, because the app spaces them out for you.', topic: 'study' },
  flashcards: { text: 'Rate each card honestly: Again, Hard, Good or Easy. Your rating decides when you see it next. Answering Easy too often makes you forget things sooner.', topic: 'study' },
  quizzes: { text: 'Quiz answers are only as right as the answer key you wrote. AI-made quizzes are drafts, so check each answer before relying on a score.', warn: true, topic: 'ai' },
  notes: { text: 'Notes save automatically on this device. Nothing is uploaded unless you press an AI button on a note.', topic: 'privacy' },
  progress: { text: 'Your history, badges, forest and avatar collection. Everything here is calculated from sessions and tasks you really did, so numbers cannot be faked.', topic: 'rewards' },
  analytics: { text: 'Charts are computed on this device from your records. Pick a range at the top. A quiet week shows as zeros, not as a failure.', topic: 'rewards' },
  achievements: { text: 'Each badge shows its exact condition and your progress. Rewards are given once and are never taken back.', topic: 'rewards' },
  forest: { text: 'A focus session of at least a few minutes plants a tree that grows with the minutes you really focus. Trees never die, even if you take days off.', topic: 'rewards' },
  shop: { text: 'Spending points is final: bought items cannot be refunded. Points come only from real study, up to a daily cap, so there is nothing to buy with money.', warn: true, topic: 'rewards' },
  wallet: { text: 'Like a bank statement: every point earned from study and every point spent in the shop, with your running balance. Nothing here can be edited, because it is calculated from what you really did.', topic: 'rewards' },
  avatar: { text: 'Try items on freely before buying; only items you pay for are spent. Your style (Chibi or Mochi) and body type are free to switch at any time.', topic: 'rewards' },
  buddy: { text: 'Your buddy reacts to what you do and never nags. Renaming or changing its look is free and does not affect your points.', topic: 'rewards' },
  coach: { text: 'The coach works with no AI by default. AI drafts are only created when you press an AI button, and nothing is saved until you confirm.', topic: 'ai' },
  'exam-rescue': { text: 'This builds an editable plan from the confidence you enter. It is a starting point, not a guarantee. Adjust it to the time you really have.', topic: 'study' },
  journey: { text: 'A timeline of what you did. You can hide it entirely; hiding does not delete anything.', topic: 'privacy' },
  themes: { text: 'Pick whatever is comfortable for your eyes. Themes change colours only, never your data.', topic: 'start' },
  settings: { text: 'Everything saves as you change it. Back up your data in the Data tab before clearing your browser or switching devices, because nothing is stored in the cloud.', warn: true, topic: 'privacy' },
}

export default function PageTip({ id }: { id: string }) {
  const p = usePrefs(), tip = TIPS[id]
  if (!tip || !p.onboarded || p.dismissedRecs[`tip:${id}`]) return null
  const Icon = tip.warn ? TriangleAlert : Lightbulb
  const dismiss = () => void setPrefs(x => ({ ...x, dismissedRecs: { ...x.dismissedRecs, [`tip:${id}`]: new Date().toISOString() } }))
  return <aside role="note" className={cx('mb-4 flex items-start gap-3 rounded-card border p-3 text-sm sm:text-[15px]', tip.warn ? 'border-warn/50 bg-warn/10' : 'hairline bg-surface2')}>
    <Icon size={18} aria-hidden className={cx('mt-0.5 shrink-0', tip.warn ? 'text-warn' : 'text-brand')} />
    <p className="min-w-0 flex-1"><span className="font-bold">{tip.warn ? 'Good to know: ' : 'Tip: '}</span>{tip.text}{' '}
      <button onClick={() => go('guide', tip.topic ? { topic: tip.topic } : undefined)} className="inline-flex items-center gap-1 font-bold text-brand underline underline-offset-2"><CircleHelp size={14} aria-hidden />Learn more</button></p>
    <button onClick={dismiss} aria-label="Hide this tip" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink"><X size={16} /></button>
  </aside>
}
