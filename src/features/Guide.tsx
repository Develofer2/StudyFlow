import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpenCheck, ChevronDown, Lightbulb, RotateCcw, Search, ShieldAlert, TriangleAlert } from 'lucide-react'
import { setPrefs, usePrefs } from '@/data/store'
import { Button, Card, Chip, PageHeader, cx, useToast } from '@/components/ui'
import { go, useRoute } from '@/app/router'
import { DAILY_POINT_CAP, GROWTH_RULES } from '@/domain/growth'

type Item = { q: string; a: ReactNode }
interface Topic { id: string; title: string; blurb: string; items: Item[]; warn?: string[] }

const TOPICS: Topic[] = [
  { id: 'start', title: 'Start here', blurb: 'The five-minute version.', items: [
    { q: 'What is StudyFlow?', a: 'A study companion that runs entirely in your browser. You plan tasks, run focus timers, review flashcards, take quizzes and keep notes. Studying earns points and badges that you can spend on a buddy, forest trees, themes and avatar clothes.' },
    { q: 'What should I do first?', a: <ol className="list-decimal space-y-1 pl-5"><li>Add a subject (for example Biology) on the Subjects page.</li><li>Add one task with a due date.</li><li>Open Focus and start a block. Even 10 minutes counts.</li><li>Come back to Progress to see your tree, points and badges grow.</li></ol> },
    { q: 'Simple mode or Full mode?', a: 'Simple mode shows a short menu (Home, Focus, Tasks, Study, Progress) and tucks the rest under More. Full mode lists every page. Switch any time in Settings; nothing is lost either way.' },
    { q: 'Where is everything?', a: 'On a phone, the bottom bar has four shortcuts and More. On a tablet you get an icon rail. On a desktop you get the full sidebar. This Guide is under More, and every page shows a dismissible tip with a Learn more link.' },
  ] },
  { id: 'focus', title: 'Focus timer and focus lock', blurb: 'How sessions are counted and what the lock does.', items: [
    { q: 'What counts as focus time?', a: 'Only the time the timer is actually running in a focus phase. Paused time and breaks are never counted. If you finish early with Stop, the minutes you did are kept. If you press Discard, the whole session is thrown away and earns nothing.' },
    { q: 'What is the focus lock?', a: 'While a focus block is running or paused, distracting pages are closed so you stay on task. Study pages (tasks, notes, flashcards and so on) stay open. You choose which ones in Settings > Habits. Pause or stop and everything opens again; breaks are never locked.' },
    { q: 'Can the app stop me opening other browser tabs?', a: 'No. A web page cannot block your browser or other apps. What it can do is notice when you leave, change the tab title to nudge you back, and, if you choose, pause the timer. You pick Off, Warn or Pause in Settings > Habits.' },
    { q: 'Why did my timer jump or behave oddly after sleep?', a: 'The timer stores an end time, not a countdown, so it stays accurate when the tab is in the background or the laptop sleeps. If a block ended while you were away, it completes once when you return.' },
    { q: 'Sounds and notifications', a: 'Sounds are off until you enable them. Browser notifications are only requested after you turn reminders on, and some phones only allow them for installed apps.' },
  ], warn: ['Closing or reloading during a focus block asks for confirmation, but if the browser is force-closed the running session can only be restored on next open, not saved as a finished one.'] },
  { id: 'tasks', title: 'Tasks, planner and subjects', blurb: 'Plan the work you will focus on.', items: [
    { q: 'How do tasks work?', a: 'Give a task a subject, due date, priority and time estimate. Views: list, Today, Upcoming, Overdue, Completed, Kanban and calendar. The timer icon on a task starts a focus block for it, and the actual time is saved next to your estimate.' },
    { q: 'Overdue tasks', a: 'Overdue tasks are shown calmly. Start with the oldest, or move the due date. There are no penalties and no lost points.' },
    { q: 'Deleting versus archiving', a: 'Archive subjects and tasks to hide them while keeping their history in your stats. Deleting removes the record itself. Points you already earned are never removed.' },
  ], warn: ['Deleting a subject asks what to do with its tasks and notes. Read the choice; reassigning is safer than deleting.'] },
  { id: 'study', title: 'Flashcards, quizzes, notes and exams', blurb: 'The learning tools and how they remember for you.', items: [
    { q: 'How does spaced repetition work?', a: 'After each card you rate Again, Hard, Good or Easy. Cards you find hard come back soon, easy ones come back after longer gaps (up to a limit). That scheduling is why a few minutes daily beats long cramming sessions. You can also review cards that are not due yet; it will not break the schedule.' },
    { q: 'How are quizzes marked?', a: 'Multiple choice and true/false are marked against the answer key you set. Short answers are matched conservatively against your accepted answers, so add alternatives (for example "H2O" and "water"). Past attempts are stored on their own, so editing a quiz later does not change old scores.' },
    { q: 'Notes', a: 'Notes autosave on this device with a saved indicator. You can organise with folders, tags and favourites, and turn a note into cards or a quiz.' },
    { q: 'Exams and Exam Rescue', a: 'Add an exam date and a coverage checklist, and Exam Rescue builds an editable revision plan from your confidence, cards and quiz results. It is rule-based, so you can change every part of it.' },
  ], warn: ['Auto-generated cards (rule-based or AI) are drafts. Review and edit them before saving.'] },
  { id: 'rewards', title: 'Points, XP, badges, forest and avatar', blurb: 'What you earn, what it is for, and the exact limits.', items: [
    { q: 'How do I earn points?', a: <ul className="list-disc space-y-1 pl-5"><li>Completed focus session: 1 point per 2 focused minutes (a 25-minute session is about 12 points).</li><li>Finishing a task: 10 points.</li><li>Finishing a quiz: 15 points.</li><li>Reviewing 5 or more flashcards in a day: up to 30 points.</li><li>Badges give 15, 30 or 60 points, and sometimes an item.</li><li>Open the Points Wallet to see everything you earned and spent, like a bank statement.</li></ul> },
    { q: 'Are there limits?', a: <><p>Yes, on purpose. At most {DAILY_POINT_CAP} focus points can be earned per day, so long sessions cannot be farmed.</p><ul className="mt-2 list-disc space-y-1 pl-5">{GROWTH_RULES.map(r => <li key={r}>{r}</li>)}</ul></> },
    { q: 'What is XP and what are levels?', a: 'XP is separate from points. It only goes up, it is never spent, and it sets your level and title. Points are the spendable currency.' },
    { q: 'What do I spend points on?', a: 'The Reward Shop (trees, buddy items, themes, extras) and avatar clothes and accessories. Many items are free from the start; paid ones show their price. Purchases are final.' },
    { q: 'Avatar: styles and body types', a: 'Choose Chibi (big head, big sparkly eyes) or Mochi (extra round and squishy with a tiny body), and a Male or Female body. These are free and can be changed any time. You can try on anything before you buy it; only items you confirm are paid for. In Tops, Bottoms and Shoes you can filter by Boys, Girls or Everything. Each side has several free cute, classic and cool pieces, and every item shows who it is for and its style.' },
    { q: 'Do I lose anything if I skip days?', a: 'No. Trees never die, streaks have an optional grace day, and the buddy never scolds. Turn gamification off in Settings if you prefer a plain tool.' },
    { q: 'Can points be faked?', a: 'Points and trees are derived from your saved sessions, tasks and quizzes, and each reward is recorded once. Editing the app cannot create focus time that did not happen.' },
  ], warn: ['Spending points cannot be undone and items are not refunded.', 'Clearing all data or restoring an older backup also resets points and purchases to match that data.'] },
  { id: 'ai', title: 'AI helpers', blurb: 'Optional. Everything works without AI.', items: [
    { q: 'Do I need AI?', a: 'No. Cards, quizzes, plans and notes all work with built-in rules. AI is an optional extra that only runs when you press an AI button; nothing runs in the background.' },
    { q: 'How do I turn it on?', a: 'In Settings > AI, add a provider (Gemini, OpenAI, Claude or any OpenAI-compatible service), paste your own key and press Test connection. Billing and limits are decided by that provider, not by StudyFlow.' },
    { q: 'What gets sent, and where?', a: 'Only the text or file you chose for that one request goes to the provider you picked, directly from your browser. Your key is never put in exports, backups or share cards.' },
    { q: 'Can I trust AI output?', a: 'Treat it as a draft. It can be wrong. AI quizzes and cards are labelled and need your confirmation before they are saved.' },
  ], warn: ['Never paste an API key anywhere public. If a key was ever shared in a chat or screenshot, rotate it with the provider.', 'Browser-direct calls expose your key to this device only. For shared deployments keep keys in a backend and use the Proxy URL setting.', 'Some providers block calls from browsers (CORS). The Test button will say so.'] },
  { id: 'privacy', title: 'Your data, backups and offline use', blurb: 'Where things live and how to keep them safe.', items: [
    { q: 'Where is my data stored?', a: 'In your browser\'s IndexedDB on this device only. There is no account and no cloud. The status chip at the top says "Local only" because that is true.' },
    { q: 'How do I back up or move to another device?', a: 'Settings > Data > Export gives a JSON file. On the new device choose Import, preview what will change, then pick Merge (keeps everything, adds from the backup) or Replace (deletes current data first).' },
    { q: 'Does it work offline?', a: 'Yes. After the first load it is cached and every feature except AI works with no connection. Edits made offline are saved on the device immediately.' },
    { q: 'Can I install it?', a: 'Yes, use your browser\'s Install or Add to Home Screen option. It then opens like an app.' },
    { q: 'Cloud sync, friends and push', a: 'Not configured. The app is built so a backend can be added later, but nothing syncs today and nothing is faked. The Data tab lists the setup steps.' },
  ], warn: ['Clearing site data or browsing history in your browser deletes StudyFlow data. Export a backup first.', 'Private or incognito windows forget everything when closed.', 'If the browser may evict storage, Settings > Data tells you whether storage is protected.'] },
  { id: 'help', title: 'Troubleshooting', blurb: 'Quick fixes for common confusions.', items: [
    { q: 'A page is greyed out or sent me back to Focus', a: 'The focus lock is on and that page is closed during focus. Pause or stop the timer, or choose which pages stay open in Settings > Habits.' },
    { q: 'My points did not go up', a: 'Only completed focus sessions pay points; stopped ones earn nothing, and short ones may plant no tree. Check the daily cap, and give it a moment, since rewards update after the session is saved.' },
    { q: 'The timer says I was away', a: 'You switched browser tabs during focus. Change the behaviour in Settings > Habits (Off, Warn or Pause).' },
    { q: 'AI says my key is invalid or blocked', a: 'Press Test connection for the exact reason. Check the key, the model name and your provider\'s limits, or try a Proxy URL if the provider blocks browsers.' },
    { q: 'Something looks broken', a: 'Reload once. If it persists, export a backup first, then try again in a fresh browser window before deleting any data.' },
  ] },
]

const GLOSSARY: [string, string][] = [
  ['Focus block', 'One timed stretch of study, usually followed by a short break.'], ['Pomodoro', 'A focus block plus break pattern, such as 25 minutes then 5.'], ['Points', 'Spendable currency earned by real study, capped per day.'],
  ['XP', 'Experience that raises your level. Never spent.'], ['Spaced repetition', 'Reviewing a card just before you would forget it, with growing gaps.'], ['Ledger', 'The permanent list of every point you earned or spent.'],
  ['Grace day', 'An optional day off that does not break your streak.'], ['Local only', 'Data stays on this device; nothing is uploaded.'], ['Draft', 'Generated content you review before it is saved.'],
]

export default function Guide() {
  const r = useRoute(), toast = useToast(), p = usePrefs()
  const [q, setQ] = useState(''), [open, setOpen] = useState<string | null>(r.params.get('topic') ?? 'start')
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const topic = r.params.get('topic')
  useEffect(() => { if (topic) { setOpen(topic); requestAnimationFrame(() => refs.current[topic]?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })) } }, [topic])
  const needle = q.trim().toLowerCase()
  const text = (n: ReactNode): string => typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join(' ') : n && typeof n === 'object' && 'props' in n ? text((n as { props: { children?: ReactNode } }).props.children) : ''
  const shown = useMemo(() => TOPICS.map(t => ({ ...t, items: needle ? t.items.filter(i => (i.q + ' ' + text(i.a)).toLowerCase().includes(needle)) : t.items })).filter(t => !needle || t.items.length), [needle])
  const dismissed = Object.keys(p.dismissedRecs).filter(k => k.startsWith('tip:')).length
  const resetTips = () => { void setPrefs(x => ({ ...x, dismissedRecs: Object.fromEntries(Object.entries(x.dismissedRecs).filter(([k]) => !k.startsWith('tip:'))) })); toast('Tips are back on every page') }
  return <div className="space-y-5">
    <PageHeader title="How StudyFlow works" sub="Plain answers about every part of the app: what it does, what it counts, and what to watch out for." />
    <Card className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Try this in 5 minutes</h2>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[['1', 'Add a subject', 'subjects'], ['2', 'Add one task', 'tasks'], ['3', 'Run a focus block', 'focus'], ['4', 'See your progress', 'progress']].map(([n, l, to]) =>
          <li key={n}><button onClick={() => go(to)} className="flex min-h-14 w-full items-center gap-3 rounded-card border hairline bg-surface2 p-3 text-left font-bold hover:brightness-95"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-brand-fg">{n}</span>{l}</button></li>)}
      </ol>
    </Card>
    <Card className="space-y-2 border-warn/50 bg-warn/10">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><ShieldAlert size={20} aria-hidden className="text-warn" />Three things to know now</h2>
      <ul className="list-disc space-y-1 pl-5 text-[15px]"><li><strong>Your data lives only in this browser.</strong> Clearing browser data deletes it. Export a backup in Settings &gt; Data.</li><li><strong>Purchases and discards are final.</strong> Points spent cannot be refunded, and a discarded focus session earns nothing.</li><li><strong>AI is optional and uses your own key.</strong> Never share the key, and check AI output before trusting it.</li></ul>
    </Card>
    <div className="relative"><Search size={18} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search the guide (try: points, lock, backup)" aria-label="Search the guide" className="min-h-11 w-full rounded-[calc(var(--radius)*.6)] border hairline bg-bg pl-10 pr-3 text-[15px]" /></div>
    <nav aria-label="Guide sections" className="flex flex-wrap gap-2">{TOPICS.map(t => <button key={t.id} onClick={() => { setQ(''); go('guide', { topic: t.id }) }} className={cx('min-h-9 rounded-full border px-3 text-sm font-bold', open === t.id ? 'border-transparent bg-brand text-brand-fg' : 'hairline bg-surface2')}>{t.title}</button>)}</nav>
    {shown.length === 0 && <Card><p className="text-muted">Nothing matched "{q}". Try a shorter word, or open a section above.</p></Card>}
    {shown.map(t => { const isOpen = !!needle || open === t.id; return <section key={t.id} ref={el => { refs.current[t.id] = el }} className="scroll-mt-4 rounded-card border hairline bg-surface">
      <h2><button aria-expanded={isOpen} onClick={() => setOpen(isOpen && !needle ? null : t.id)} className="flex min-h-14 w-full items-center justify-between gap-3 p-4 text-left sm:px-5"><span><span className="block font-display text-xl font-semibold">{t.title}</span><span className="block text-sm text-muted">{t.blurb}</span></span><ChevronDown size={20} aria-hidden className={cx('shrink-0 transition', isOpen && 'rotate-180')} /></button></h2>
      {isOpen && <div className="space-y-4 border-t hairline p-4 sm:p-5">
        <dl className="space-y-4">{t.items.map(i => <div key={i.q}><dt className="font-bold">{i.q}</dt><dd className="mt-1 text-[15px] leading-relaxed text-muted [&_strong]:text-ink">{i.a}</dd></div>)}</dl>
        {t.warn && !needle && <div className="rounded-lg border border-warn/50 bg-warn/10 p-3"><p className="mb-1 flex items-center gap-2 text-sm font-bold"><TriangleAlert size={16} aria-hidden className="text-warn" />Watch out</p><ul className="list-disc space-y-1 pl-5 text-sm">{t.warn.map(w => <li key={w}>{w}</li>)}</ul></div>}
      </div>}</section> })}
    <Card className="space-y-3"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><BookOpenCheck size={20} aria-hidden />Glossary</h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{GLOSSARY.map(([a, b]) => <div key={a}><dt className="font-bold">{a}</dt><dd className="text-sm text-muted">{b}</dd></div>)}</dl></Card>
    <Card className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 font-bold"><Lightbulb size={18} aria-hidden />Page tips</h2><p className="text-sm text-muted">Short tips appear at the top of each page until you hide them. {dismissed ? <Chip>{dismissed} hidden</Chip> : 'None hidden yet.'}</p></div>
      <Button onClick={resetTips} disabled={!dismissed}><RotateCcw size={16} />Show all tips again</Button></Card>
  </div>
}
