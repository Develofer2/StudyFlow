import { lazy, Suspense, useEffect, useState } from 'react'
import { Bell, ExternalLink, Info, Palette, Timer, User, Volume2 } from 'lucide-react'
import type { FocusPreset, Prefs } from '@/types'
import { setPrefs, put, useCollection, usePrefs } from '@/data/store'
import { Button, Field, Input, PageHeader, Segmented, Select, Switch, useToast, cx } from '@/components/ui'
import { go, useRoute } from '@/app/router'
import { chime, notificationStatus, requestNotifications } from '@/services/platform'
import { NumField, Section } from './settings/common'

const AiTab = lazy(() => import('./settings/AiTab')), DataTab = lazy(() => import('./settings/DataTab')), HabitsTab = lazy(() => import('./settings/HabitsTab'))
const TABS = [{ v: 'profile', l: 'Profile' }, { v: 'focus', l: 'Focus' }, { v: 'appearance', l: 'Appearance' }, { v: 'reminders', l: 'Reminders' }, { v: 'habits', l: 'Habits' }, { v: 'ai', l: 'AI' }, { v: 'data', l: 'Data & sync' }, { v: 'about', l: 'About' }] as const
type Tab = (typeof TABS)[number]['v']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VERSION = '1.0.0'

function Profile() {
  const p = usePrefs(); const [name, setName] = useState(p.displayName)
  const zones: string[] = (Intl as any).supportedValuesOf?.('timeZone') ?? []
  const zs = zones.includes(p.timezone) ? zones : [p.timezone, ...zones]
  return <Section title="Profile" sub="Used for greetings, your day boundaries and goals.">
    <Field label="Display name" hint="Optional. Only shown on this device, and on share cards if you choose.">{id => <Input id={id} value={name} maxLength={40} autoComplete="given-name" onChange={e => { setName(e.target.value); void setPrefs({ displayName: e.target.value }) }} />}</Field>
    <Field label="Time zone" hint="Decides when a study day starts and ends.">{id => <Select id={id} value={p.timezone} onChange={e => void setPrefs({ timezone: e.target.value })}>{zs.map(z => <option key={z}>{z}</option>)}</Select>}</Field>
    <div><p className="mb-1.5 text-sm font-bold">Week starts on</p><Segmented label="Week starts on" value={String(p.weekStartsOn)} onChange={v => void setPrefs({ weekStartsOn: Number(v) as 0 | 1 })} options={[{ value: '1', label: 'Monday' }, { value: '0', label: 'Sunday' }]} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><NumField label="Daily goal" unit="minutes" value={p.dailyGoalMinutes} min={5} max={720} onCommit={v => v && void setPrefs({ dailyGoalMinutes: v })} />
      <NumField label="Weekly goal" unit="minutes" optional value={p.weeklyGoalMinutes} min={15} max={5040} hint="Optional." onCommit={v => void setPrefs({ weeklyGoalMinutes: v })} /></div>
  </Section>
}

function Focus() {
  const p = usePrefs(), presets = useCollection<FocusPreset>('presets'), toast = useToast()
  const cur = presets.find(x => x.id === p.activePresetId) ?? presets[0]
  return <Section title="Focus" sub="Defaults for the timer. Detailed presets are edited on the Focus page.">
    <Field label="Default preset">{id => <Select id={id} value={cur?.id ?? ''} onChange={e => void setPrefs({ activePresetId: e.target.value })}>{presets.map(x => <option key={x.id} value={x.id}>{x.name} ({x.workMinutes}/{x.shortBreakMinutes} min)</option>)}</Select>}</Field>
    {cur && <Switch label="Sound when a session ends" hint={`Applies to "${cur.name}".`} checked={cur.soundEnabled} onChange={v => void put('presets', { ...cur, soundEnabled: v }).catch(() => toast('Could not save', 'err'))} />}
    <Button size="sm" onClick={chime}><Volume2 size={16} />Play test sound</Button>
  </Section>
}

function Appearance() {
  const p = usePrefs()
  return <div className="space-y-5"><Section title="Appearance">
    <Button onClick={() => go('themes')}><Palette size={18} />Open Themes<ExternalLink size={14} /></Button>
    <div><p className="mb-1.5 text-sm font-bold">Navigation</p><Segmented<Prefs['navMode']> label="Navigation mode" value={p.navMode} onChange={v => void setPrefs({ navMode: v })} options={[{ value: 'simple', label: 'Simple' }, { value: 'full', label: 'Full' }]} />
      <p className="mt-2 text-sm text-muted">{p.navMode === 'simple' ? 'Simple groups things into five tabs: Home, Focus, Tasks, Study and Progress.' : 'Full shows every area in the menu: Subjects, Flashcards, Quizzes, Notes, Analytics and Achievements.'}</p></div></Section>
    <Section title="Motivation"><Switch label="Levels, badges and challenges" hint="Optional encouragement. Off hides them everywhere." checked={p.gamification} onChange={v => void setPrefs({ gamification: v })} />
      <Switch label="Grace day for streaks" hint="Missing a single day will not break your streak." checked={p.graceDay} onChange={v => void setPrefs({ graceDay: v })} /></Section></div>
}

function Reminders() {
  const p = usePrefs(), r = p.reminders, toast = useToast(); const [status, setStatus] = useState(notificationStatus())
  const set = (a: Partial<typeof r>) => void setPrefs({ reminders: { ...r, ...a } })
  const enable = async () => { const s = await requestNotifications(); setStatus(s); toast(s === 'granted' ? 'Browser notifications enabled' : s === 'unsupported' ? 'This browser does not support notifications' : 'Notifications were not allowed', s === 'granted' ? 'ok' : 'info') }
  const label = { granted: 'Allowed', denied: 'Blocked in your browser settings', default: 'Not asked yet', unsupported: 'Not supported here' }[status]
  return <div className="space-y-5"><Section title="Reminders" sub="Gentle nudges while StudyFlow is open. These work even without browser notifications.">
    <Switch label="Reminders" checked={r.enabled} onChange={v => set({ enabled: v })} />
    <div className={cx('space-y-3', !r.enabled && 'pointer-events-none opacity-50')} aria-disabled={!r.enabled}>
      <Switch label="Daily study reminder" checked={r.daily} onChange={v => set({ daily: v })} />
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Reminder time">{id => <Input id={id} type="time" value={r.time} onChange={e => e.target.value && set({ time: e.target.value })} />}</Field>
        <Field label="Quiet from">{id => <Input id={id} type="time" value={r.quietStart} onChange={e => e.target.value && set({ quietStart: e.target.value })} />}</Field>
        <Field label="Quiet until">{id => <Input id={id} type="time" value={r.quietEnd} onChange={e => e.target.value && set({ quietEnd: e.target.value })} />}</Field></div>
      <div role="group" aria-label="Reminder days"><p className="mb-1.5 text-sm font-bold">Days</p><div className="flex flex-wrap gap-1.5">{DAYS.map((d, i) => { const on = r.days.includes(i); return <button key={d} aria-pressed={on} onClick={() => set({ days: on ? r.days.filter(x => x !== i) : [...r.days, i].sort() })}
        className={cx('min-h-11 min-w-12 rounded-full border px-3 text-sm font-bold', on ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface')}>{d}</button> })}</div></div>
      <Switch label="Upcoming deadlines" checked={r.deadlines} onChange={v => set({ deadlines: v })} /><Switch label="Flashcards due" checked={r.flashcards} onChange={v => set({ flashcards: v })} /></div></Section>
    <Section title="Browser notifications" sub="Optional. Only asked when you press the button.">
      <p className="flex items-center gap-2 text-sm"><Bell size={16} className="text-brand" />Status: <strong>{label}</strong></p>
      {status !== 'granted' && status !== 'unsupported' && status !== 'denied' && <Button variant="primary" onClick={enable}>Enable browser notifications</Button>}
      {status === 'denied' && <p className="text-sm text-muted">To allow them, change this site&apos;s notification permission in your browser settings.</p>}
      <p className="text-sm text-muted">On iPhone and iPad, notifications only work after you add StudyFlow to your Home Screen (Share, then Add to Home Screen) and open it from there. Notifications only appear while the app is open or running in the background; in-app reminders are shown either way.</p></Section></div>
}

function About() {
  const keys: [string, string][] = [['Space', 'Start, pause or resume the timer (Focus page)'], ['Space', 'Reveal the answer (flashcard study)'], ['1 2 3 4', 'Rate a flashcard: Again, Hard, Good, Easy'], ['Esc', 'Close a dialog'], ['Tab', 'Move between controls']]
  return <div className="space-y-5"><Section title={`StudyFlow ${VERSION}`} sub="An offline-first study companion: focus timer, tasks, flashcards, quizzes, notes and progress.">
    <p className="flex gap-2 text-sm text-muted"><Info size={18} className="mt-0.5 shrink-0 text-brand" /><span>Works offline once loaded. To install it, use your browser&apos;s &quot;Install app&quot; or &quot;Add to Home Screen&quot; option.</span></p>
    <p className="text-sm text-muted">© 2026 develofer2. All rights reserved. <a href="https://github.com/develofer2" target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-2">github.com/develofer2</a></p>
    <div className="flex flex-wrap gap-2">{(['privacy', 'terms', 'data', 'ai', 'copyright', 'credits'] as const).map(t => <button key={t} onClick={() => go('legal', { tab: t })} className="min-h-10 rounded-full border hairline bg-surface2 px-4 text-sm font-bold capitalize">{t === 'ai' ? 'AI & third parties' : t === 'data' ? 'Data & storage' : t}</button>)}</div></Section>
    <Section title="Keyboard shortcuts"><dl className="grid gap-2 text-sm sm:grid-cols-2">{keys.map(([k, d], i) => <div key={i} className="flex items-center gap-3"><dt><kbd className="rounded-md border hairline bg-surface2 px-2 py-0.5 font-mono text-xs font-bold">{k}</kbd></dt><dd className="text-muted">{d}</dd></div>)}</dl></Section>
    <Section title="Privacy"><ul className="list-disc space-y-1 pl-5 text-sm text-muted"><li>Your data is stored only in this browser on this device. There are no accounts and no analytics.</li><li>The only network feature is optional AI, which sends the text or file you choose, plus your own API key, to Google.</li><li>Back up often with Data &amp; sync, Export.</li></ul></Section>
    <Section title="Limitations"><ul className="list-disc space-y-1 pl-5 text-sm text-muted"><li>No cloud sync: data does not move between devices except by export and import.</li><li>Clearing browser data without a backup erases everything.</li><li>Reminders appear only while the app is open or running in the background.</li><li>Spaced repetition uses a simplified scheduling method, not a clinically validated one.</li><li>AI output can be wrong. Check it against your material.</li></ul></Section></div>
}

export default function Settings() {
  const r = useRoute(); const t = (TABS.find(x => x.v === r.params.get('tab'))?.v ?? 'profile') as Tab
  useEffect(() => { window.scrollTo(0, 0) }, [t])
  const icons: Partial<Record<Tab, React.ReactNode>> = { profile: <User size={15} />, focus: <Timer size={15} />, appearance: <Palette size={15} />, reminders: <Bell size={15} /> }
  return <div className="space-y-5"><PageHeader title="Settings" sub="Everything is saved on this device as you change it." />
    <Segmented<Tab> label="Settings sections" value={t} onChange={v => go('settings', { tab: v })} options={TABS.map(x => ({ value: x.v, label: <span className="flex items-center gap-1.5">{icons[x.v]}{x.l}</span> }))} />
    <div className="max-w-3xl"><Suspense fallback={<p className="py-10 text-center text-muted" role="status">Loading…</p>}>
      {t === 'profile' ? <Profile /> : t === 'focus' ? <Focus /> : t === 'appearance' ? <Appearance /> : t === 'reminders' ? <Reminders /> : t === 'habits' ? <HabitsTab /> : t === 'ai' ? <AiTab /> : t === 'data' ? <DataTab /> : <About />}</Suspense></div></div>
}
