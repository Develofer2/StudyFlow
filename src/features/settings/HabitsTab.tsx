import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Card, Field, Input, Segmented, Switch, cx } from '@/components/ui'
import { setPrefs, useCollection, usePrefs } from '@/data/store'
import { FOCUS_PAGES } from '@/domain/focusLock'
import { habitSummary, returnMessage } from '@/domain/habits'
import { dayKey } from '@/domain/time'
import type { HabitPrefs, StudySession } from '@/types'
import { NumField, Section } from './common'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const Stat = ({ label, value }: { label: string; value: string }) => <div className="rounded-card border hairline bg-surface2 p-3"><div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div><div className="font-display text-xl font-semibold">{value}</div></div>

export default function HabitsTab() {
  const p = usePrefs(), h = p.habits, sessions = useCollection<StudySession>('sessions')
  const [rest, setRest] = useState('')
  const set = (x: Partial<HabitPrefs>) => setPrefs(s => ({ ...s, habits: { ...s.habits, ...x } }))
  const sum = habitSummary(sessions, h, p.timezone, p.weekStartsOn)
  const order = p.weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  const today = dayKey(Date.now(), p.timezone)
  const addRest = () => { if (/^\d{4}-\d{2}-\d{2}$/.test(rest) && !h.restDays.includes(rest)) { set({ restDays: [...h.restDays, rest].sort() }); setRest('') } }
  return <div className="space-y-4">
    <Card className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Your consistency</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Current streak" value={`${sum.streak.current} d`} /><Stat label="Longest streak" value={`${sum.streak.longest} d`} />
        <Stat label="This week" value={`${sum.weekSessions}/${h.weeklySessionsTarget} sessions`} /><Stat label="Today" value={`${sum.todayMinutes}/${h.minDailyMinutes} min`} />
        <Stat label="Best day" value={sum.bests.bestDay ? `${sum.bests.bestDay.minutes} min` : 'None yet'} /><Stat label="Best week" value={sum.bests.bestWeek ? `${sum.bests.bestWeek.minutes} min` : 'None yet'} />
        <Stat label="Grace days left" value={`${sum.streak.graceLeftThisWeek} this week`} />
      </div>
      <p className="text-sm text-muted">Rest days and days you do not study are neutral: they never break or add to a streak. A grace day quietly covers a missed study day.</p>
      {sum.daysAway !== null && sum.daysAway >= 2 && <p role="status" className="rounded-card bg-surface2 p-3 text-sm">{returnMessage(sum.daysAway)}</p>}
    </Card>
    <Section title="Targets" sub="Set these to what is realistic for you. They only shape your own progress view.">
      <NumField label="Daily minimum" unit="minutes" value={h.minDailyMinutes} min={1} max={600} onCommit={v => v !== undefined && set({ minDailyMinutes: v })} hint="A day counts toward your streak at this much focus time." />
      <NumField label="Weekly sessions target" unit="sessions" value={h.weeklySessionsTarget} min={1} max={70} onCommit={v => v !== undefined && set({ weeklySessionsTarget: v })} />
      <div className="space-y-1.5"><span id="sd" className="block text-sm font-bold">Study days</span>
        <div role="group" aria-labelledby="sd" className="flex flex-wrap gap-1.5">{order.map(d => { const on = h.studyDays.includes(d)
          return <button key={d} type="button" aria-pressed={on} onClick={() => set({ studyDays: on ? h.studyDays.filter(x => x !== d) : [...h.studyDays, d].sort() })} className={cx('min-h-11 min-w-11 rounded-full border hairline px-3 text-sm font-bold', on ? 'bg-brand text-brand-fg' : 'bg-surface2')}>{DAYS[d]}</button> })}</div></div>
      <div className="space-y-1.5"><span className="block text-sm font-bold">Grace days per week</span>
        <Segmented label="Grace days per week" value={String(h.graceDaysPerWeek) as '0'} onChange={v => set({ graceDaysPerWeek: Number(v) })} options={['0', '1', '2', '3'].map(v => ({ value: v as '0', label: v }))} /></div>
    </Section>
    <Section title="Planned rest days" sub={`Dates are in your timezone (${p.timezone}). Rest is part of learning.`}>
      <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><Field label="Add a rest day">{id => <Input id={id} type="date" value={rest} min={today} onChange={e => setRest(e.target.value)} />}</Field></div><Button onClick={addRest} disabled={!rest}>Add</Button></div>
      {h.restDays.length ? <ul className="flex flex-wrap gap-2">{h.restDays.map(d => <li key={d} className="inline-flex min-h-11 items-center gap-1 rounded-full border hairline bg-surface2 pl-3 text-sm font-bold">{d}
        <button type="button" aria-label={`Remove rest day ${d}`} onClick={() => set({ restDays: h.restDays.filter(x => x !== d) })} className="grid size-11 place-items-center rounded-full"><X size={16} aria-hidden /></button></li>)}</ul> : <p className="text-sm text-muted">No rest days planned.</p>}
    </Section>
    <Section title="Stay focused" sub="Applies only while a focus session is running. Pausing or stopping always lets you leave.">
      <Switch checked={h.focusLock} onChange={v => set({ focusLock: v })} label="Lock the app during focus" hint="Only the pages you keep open below can be used while the timer runs." />
      {h.focusLock && <div className="space-y-1.5"><span id="fo" className="block text-sm font-bold">Pages that stay open during focus</span>
        <div role="group" aria-labelledby="fo" className="flex flex-wrap gap-1.5">{FOCUS_PAGES.map(pg => { const open = h.focusOpen.includes(pg.id)
          return <button key={pg.id} type="button" aria-pressed={open} onClick={() => set({ focusOpen: open ? h.focusOpen.filter(x => x !== pg.id) : [...h.focusOpen, pg.id] })} className={cx('min-h-11 rounded-full border hairline px-3 text-sm font-bold', open ? 'bg-brand text-brand-fg' : 'bg-surface2')}>{pg.label}</button> })}</div></div>}
      <div className="space-y-2"><div className="text-sm font-bold">When you switch browser tabs</div>
        <Segmented label="Browser tab switch" value={h.tabWarning} onChange={v => set({ tabWarning: v })} options={[{ value: 'off', label: 'Do nothing' }, { value: 'warn', label: 'Welcome-back note' }, { value: 'pause', label: 'Pause timer' }]} /></div>
    </Section>
    <Section title="Gentle features">
      <Switch checked={h.breakActivities} onChange={v => set({ breakActivities: v })} label="Break ideas" hint="Offer optional stretch, water, eye-rest, breathing and reflection prompts during breaks." />
      <Switch checked={p.gamification} onChange={v => setPrefs({ gamification: v })} label="Points, badges and rewards" hint="Turning this off hides points, badges and reward screens across the app. Your focus time, streaks and notes are unaffected." />
    </Section>
  </div>
}
