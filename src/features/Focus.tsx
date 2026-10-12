import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Maximize2, Minimize2, Pause, Play, SkipForward, Square, Volume2, VolumeX, X } from 'lucide-react'
import { Button, Card, Chip, ConfirmDialog, Field, Input, PageHeader, Select, cx, useToast } from '@/components/ui'
import { getAll, put, setPrefs, setTimer, useCollection, usePrefs, useTimerSnapshot } from '@/data/store'
import { BUILT_IN_PRESETS } from '@/data/defaults'
import { remainingMs, validatePreset } from '@/domain/timer'
import { fmtDuration } from '@/domain/time'
import { useStats } from '@/hooks/useStats'
import { useRoute } from '@/app/router'
import * as timer from '@/services/timerService'
import type { FocusPreset, StudyTask, Subject } from '@/types'
import TimerDisplay, { CycleDots, fmtClock } from './focus/Display'
import PresetPanel from './focus/PresetPanel'
import CompletionDialog from './focus/CompletionDialog'
import Stage from './focus/Stage'
import BreakActivities from './focus/BreakActivities'

const PHASE = { idle: 'Ready', focus: 'Focus', short_break: 'Short break', long_break: 'Long break' } as const

function useNow(active: boolean) {
  const [n, setN] = useState(Date.now())
  useEffect(() => {
    setN(Date.now()); if (!active) return
    const id = setInterval(() => setN(Date.now()), 250); const vis = () => setN(Date.now())
    document.addEventListener('visibilitychange', vis); return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [active])
  return n
}

export default function Focus() {
  const toast = useToast(); const snap = useTimerSnapshot(); const prefs = usePrefs(); const { params } = useRoute(); const stats = useStats()
  const presets = useCollection<FocusPreset>('presets'); const subjects = useCollection<Subject>('subjects'); const tasks = useCollection<StudyTask>('tasks')
  const completion = useSyncExternalStore(timer.subscribeCompletion, timer.getCompletion)
  const preset = presets.find(p => p.id === (snap.status === 'idle' ? prefs.activePresetId : snap.presetId ?? prefs.activePresetId)) ?? presets[0] ?? BUILT_IN_PRESETS[0]
  const idle = snap.status === 'idle', running = snap.status === 'running'

  const [subjectId, setSubjectId] = useState(snap.subjectId ?? ''); const [taskId, setTaskId] = useState(snap.taskId ?? ''); const [intention, setIntention] = useState(snap.intention ?? '')
  const [confirm, setConfirm] = useState<'stop' | 'discard' | null>(null); const [full, setFull] = useState(false)
  const box = useRef<HTMLDivElement>(null); const [dismissedBreak, setDismissedBreak] = useState<string | null>(null)

  const qTask = params.get('task'), qSubject = params.get('subject'), qMin = params.get('minutes')
  useEffect(() => {
    if (!idle) return
    if (qTask) { const t = getAll<StudyTask>('tasks').find(x => x.id === qTask); if (t) { setTaskId(t.id); setSubjectId(t.subjectId ?? ''); if (!intention) setIntention(t.title) } }
    else if (qSubject && getAll<Subject>('subjects').some(s => s.id === qSubject)) { setSubjectId(qSubject); setTaskId('') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qTask, qSubject])
  useEffect(() => {
    const m = Number(qMin); if (!qMin || !idle || !Number.isInteger(m)) return
    const all = getAll<FocusPreset>('presets'); const hit = all.find(p => p.workMinutes === m)
    if (hit) { void setPrefs({ activePresetId: hit.id }); return }
    const base = { name: `${m} min focus`, workMinutes: m, shortBreakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 }
    if (Object.keys(validatePreset(base)).length) { toast('That focus length is out of range (1 to 180 minutes).', 'err'); return }
    void put<Partial<FocusPreset>>('presets', { ...base, autoStartBreaks: false, autoStartWork: false, soundEnabled: true, builtIn: false }).then(r => setPrefs({ activePresetId: r.id! })).then(() => toast(`Added a ${m}-minute preset.`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qMin])

  const now = useNow(running)
  const rem = idle ? preset.workMinutes * 60000 : remainingMs(snap, now)
  const planned = idle ? rem : snap.plannedMs
  const clock = fmtClock(rem)
  const phase = snap.phase

  useEffect(() => {
    const base = document.title
    if (running) document.title = `${clock} · ${PHASE[phase]} · StudyFlow`
    return () => { document.title = base }
  }, [running, clock, phase])
  useEffect(() => { const f = () => setFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f) }, [])

  const begin = useCallback(async () => {
    try {
      await setTimer({ ...snap, subjectId: subjectId || undefined, taskId: taskId || undefined, intention: undefined })
      await timer.start('focus', { subjectId: subjectId || undefined, taskId: taskId || undefined, intention: intention.trim() || undefined, presetId: preset.id })
    } catch { toast('Could not start the timer.', 'err') }
  }, [snap, subjectId, taskId, intention, preset.id, toast])
  const toggle = useCallback(() => { if (completion) return; if (snap.status === 'idle') void begin(); else if (snap.status === 'running') void timer.pause(); else void timer.resume() }, [snap.status, begin, completion])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input,textarea,select,button,a,summary,[contenteditable],[role=dialog],[role=radio],[role=switch]')) return
      e.preventDefault(); toggle()
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [toggle])

  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void box.current?.requestFullscreen?.().catch(() => toast('Fullscreen is not available here.', 'info')) }
  const stop = async () => { await timer.finish('interrupted'); toast(phase === 'focus' ? 'Session saved. The time so far still counts.' : 'Break ended.') }
  const discard = async () => { await timer.finish('cancelled'); toast('Session discarded.', 'info') }

  const openTasks = tasks.filter(t => t.status !== 'done' && !t.archivedAt && (!subjectId || t.subjectId === subjectId))
  const activeSubjects = subjects.filter(s => !s.archivedAt || s.id === subjectId)
  const curSubject = subjects.find(s => s.id === (snap.subjectId ?? subjectId)); const curTask = tasks.find(t => t.id === (snap.taskId ?? taskId))
  const status = idle ? 'Timer ready.' : `${PHASE[phase]} ${running ? 'running' : 'paused'}.`
  const sub = idle ? preset.name : (curTask?.title ?? curSubject?.name ?? preset.name)
  const sound = preset.soundEnabled

  return (
    <div>
      <PageHeader title="Focus" sub={stats.todaySeconds ? `${fmtDuration(stats.todaySeconds)} focused today. Keep it gentle.` : 'One calm block of attention at a time.'}
        action={<div className="flex gap-1"><Button variant="ghost" aria-label={sound ? 'Mute chime' : 'Unmute chime'} aria-pressed={sound} onClick={() => { void put('presets', { ...preset, soundEnabled: !sound }); if (!sound) void import('@/services/platform').then(m => m.chime()) }}>{sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</Button>
          <Button variant="ghost" aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFull}>{full ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</Button></div>} />
      <div role="status" aria-live="polite" className="sr-only">{status}</div>
      <div ref={box} className={cx(full && 'flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg p-6')}>
        <div className={cx('mx-auto grid w-full gap-5', !full && 'max-w-3xl')}>
          <Card className="space-y-3 py-4 text-center">
            <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Focus preset">
              {presets.map(p => <button key={p.id} role="radio" aria-checked={p.id === preset.id} disabled={!idle} onClick={() => setPrefs({ activePresetId: p.id })}
                className={cx('min-h-11 rounded-full border px-4 text-sm font-bold transition disabled:opacity-60', p.id === preset.id ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface2 hover:brightness-95')}>
                {p.name} <span className="font-mono tnum opacity-80">{p.workMinutes}m</span></button>)}</div>
            <Stage progress={idle || !planned ? 0 : 1 - rem / planned} running={running} clock={clock} big={full} preparing={idle && !!(subjectId || taskId || intention.trim())} />
            <TimerDisplay style={prefs.timerStyle} clock={clock} progress={idle || !planned ? 0 : 1 - rem / planned} label={PHASE[phase]} sub={sub} big={full} />
            <CycleDots total={preset.sessionsBeforeLongBreak} done={snap.completedFocusSessions} active={phase === 'focus'} />
            <div className={'flex flex-wrap justify-center gap-2 pb-2'}>
              {idle ? <Button variant="primary" size="lg" onClick={begin}><Play size={22} />Start focus</Button> : <>
                <Button variant="primary" size="lg" onClick={toggle}>{running ? <><Pause size={22} />Pause</> : <><Play size={22} />Resume</>}</Button>
                {phase !== 'focus' && <Button size="lg" onClick={() => timer.finish('skip')}><SkipForward size={20} />Skip break</Button>}
                <Button size="lg" onClick={() => setConfirm('stop')}><Square size={18} />{phase === 'focus' ? 'Stop' : 'End break'}</Button>
                {phase === 'focus' && <Button size="lg" variant="ghost" onClick={() => setConfirm('discard')}><X size={18} />Discard</Button>}</>}
            </div>
            <p className="hidden text-xs text-muted md:block">Press <kbd className="rounded border hairline bg-surface2 px-1.5 font-mono">Space</kbd> to start or pause.</p>
          </Card>
          {phase !== 'focus' && phase !== 'idle' && prefs.habits.breakActivities && dismissedBreak !== (snap.sessionId ?? phase) && <BreakActivities phase={phase} onDismiss={() => setDismissedBreak(snap.sessionId ?? phase)} />}
          {!full && <>
            <Card className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject">{id => <Select id={id} disabled={!idle} value={idle ? subjectId : snap.subjectId ?? ''} onChange={e => { setSubjectId(e.target.value); if (taskId && tasks.find(t => t.id === taskId)?.subjectId !== e.target.value) setTaskId('') }}>
                <option value="">No subject</option>{activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>
              <Field label="Task (optional)">{id => <Select id={id} disabled={!idle} value={idle ? taskId : snap.taskId ?? ''} onChange={e => { setTaskId(e.target.value); const t = tasks.find(x => x.id === e.target.value); if (t?.subjectId) setSubjectId(t.subjectId) }}>
                <option value="">No task</option>{openTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</Select>}</Field>
              <div className="sm:col-span-2"><Field label="Intention (optional)">{id => <Input id={id} disabled={!idle} maxLength={120} placeholder="By the end I will have..." value={idle ? intention : snap.intention ?? ''} onChange={e => setIntention(e.target.value)} />}</Field></div>
            </Card>
            <PresetPanel presets={presets} active={preset} prefs={prefs} locked={!idle} />
            <Card className="space-y-1 opacity-80" aria-disabled="true"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-bold">Online study rooms</h2><Chip>Not available</Chip></div>
              <p className="text-sm text-muted">Study rooms need a configured backend, and none is set up in this app. Nothing about your studying is shared or sent anywhere. Co-study above uses a virtual buddy only.</p></Card>
          </>}
        </div>
      </div>
      <ConfirmDialog open={confirm === 'stop'} onClose={() => setConfirm(null)} onConfirm={stop} title={phase === 'focus' ? 'Stop this session?' : 'End this break?'} confirmLabel={phase === 'focus' ? 'Stop and save' : 'End break'}
        body={phase === 'focus' ? 'The time you have focused so far still counts and is saved to your history. You can start again whenever you like.' : 'The timer goes back to ready.'} />
      <ConfirmDialog open={confirm === 'discard'} onClose={() => setConfirm(null)} onConfirm={discard} danger title="Discard this session?" confirmLabel="Discard" body="Nothing from this session will count towards your totals. Use Stop instead to keep the time so far." />
      <CompletionDialog c={completion} />
    </div>)
}
