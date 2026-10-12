import PageTip from '@/components/Tip'
import Logo from '@/components/Logo'
import { AUTHOR, AUTHOR_URL, COPYRIGHT } from '@/domain/legal'
import { useTouchFx } from '@/hooks/useTouchFx'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { CloudOff, Ellipsis, HardDrive, Lock, Timer, WifiOff } from 'lucide-react'
import { usePrefs, useTimerSnapshot, useCollection, onStorageError } from '@/data/store'
import { activeFocusMs, remainingMs } from '@/domain/timer'
import { cx, Dialog, useToast } from '@/components/ui'
import { useOnline } from '@/services/platform'
import { go, useRoute } from './router'
import { canVisit } from '@/domain/focusLock'
import { useFocusGuards, useFocusLock, unlockSession } from '@/hooks/useFocusLock'
import { MOBILE_MAIN, NAV, TITLES } from './nav'
import { BADGES, computeXp } from '@/domain/achievements'
import { useStats } from '@/hooks/useStats'
import { put } from '@/data/store'
import type { Achievement } from '@/types'
import { getAll } from '@/data/store'
import { useBadgeEngine } from '@/features/achievements/useBadgeEngine'
import { useRewardSync } from '@/services/rewards'

const pages: Record<string, ReturnType<typeof lazy<ComponentType<any>>>> = {
  buddy: lazy(() => import('@/features/Buddy')), forest: lazy(() => import('@/features/Forest')), shop: lazy(() => import('@/features/Shop')), wallet: lazy(() => import('@/features/Wallet')), coach: lazy(() => import('@/features/Coach')), 'exam-rescue': lazy(() => import('@/features/ExamRescue')), journey: lazy(() => import('@/features/Journey')), avatar: lazy(() => import('@/features/Avatar')), legal: lazy(() => import('@/features/Legal')), guide: lazy(() => import('@/features/Guide')),
  home: lazy(() => import('@/features/Home')), focus: lazy(() => import('@/features/Focus')), subjects: lazy(() => import('@/features/Subjects')),
  tasks: lazy(() => import('@/features/Tasks')), flashcards: lazy(() => import('@/features/Flashcards')), quizzes: lazy(() => import('@/features/Quizzes')),
  notes: lazy(() => import('@/features/Notes')), analytics: lazy(() => import('@/features/Analytics')), achievements: lazy(() => import('@/features/Achievements')),
  themes: lazy(() => import('@/features/Themes')), settings: lazy(() => import('@/features/Settings')), study: lazy(() => import('@/features/Hubs').then(m => ({ default: m.StudyHub }))), progress: lazy(() => import('@/features/Hubs').then(m => ({ default: m.ProgressHub }))),
}
const fmt = (ms: number) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

function MiniTimer() {
  const t = useTimerSnapshot(); const [, set] = useState(0); const r = useRoute()
  useEffect(() => { if (t.status !== 'running') return; const i = setInterval(() => set(x => x + 1), 500); return () => clearInterval(i) }, [t.status])
  if (t.status === 'idle' || r.path === 'focus') return null
  return <button onClick={() => go('focus')} className="fixed right-3 top-3 z-30 flex min-h-11 items-center gap-2 rounded-full border hairline bg-surface px-4 text-sm font-bold shadow-lg lg:right-6 lg:top-5 safe-t" aria-label={`${t.phase === 'focus' ? 'Focus' : 'Break'} timer ${fmt(remainingMs(t, Date.now()))} ${t.status}. Open timer`}>
    <Timer size={16} className="text-brand" /><span className="font-mono tnum">{fmt(remainingMs(t, Date.now()))}</span><span className="text-muted">{t.status === 'paused' ? 'paused' : t.phase === 'focus' ? 'focus' : 'break'}</span></button>
}
function StatusChip() {
  const on = useOnline()
  return <button onClick={() => go('settings', { tab: 'data' })} title="Your data is stored on this device only. Cloud sync is not configured." className="inline-flex min-h-9 items-center gap-1.5 rounded-full border hairline bg-surface px-3 text-xs font-bold text-muted hover:text-ink">
    {on ? <HardDrive size={14} /> : <WifiOff size={14} />}{on ? 'Local only' : 'Offline · saved on device'}</button>
}
export default function Shell() {
  useTouchFx()
  const p = usePrefs(); const r = useRoute(); const toast = useToast(); const [more, setMore] = useState(false)
  const { locked, sessionId } = useFocusLock(); useFocusGuards(toast)
  useBadgeEngine(); useRewardSync()
  useEffect(() => onStorageError(m => toast(m, 'err')), [toast])
  const mode = NAV[p.navMode]; const path = pages[r.path] ? r.path : 'home'
  useEffect(() => { document.title = `${TITLES[path] ?? 'StudyFlow'} · StudyFlow`; window.scrollTo(0, 0) }, [path])
  // keep nav-mode and route consistent
  useEffect(() => { if (p.navMode === 'simple' && ['flashcards', 'quizzes', 'notes'].includes(path)) go('study', { tab: path === 'quizzes' ? 'quizzes' : path }); if (p.navMode === 'full' && path === 'study') go('flashcards'); if (p.navMode === 'full' && path === 'progress') go('analytics') }, [p.navMode, path])
  const Page = pages[path]
  const mobileMain = [...mode.main, ...mode.more].filter(n => MOBILE_MAIN[p.navMode].includes(n.id))
  const moreItems = [...mode.main, ...mode.more].filter(n => !MOBILE_MAIN[p.navMode].includes(n.id))
  const Item = ({ n, rail }: { n: (typeof mode.main)[number]; rail?: boolean }) => <button onClick={() => go(n.id)} disabled={!canVisit(locked, p.habits.focusOpen, n.id)} aria-current={path === n.id ? 'page' : undefined} title={!canVisit(locked, p.habits.focusOpen, n.id) ? 'Closed during focus' : n.label}
    className={cx('disabled:cursor-not-allowed disabled:opacity-40 flex min-h-11 w-full items-center gap-3 rounded-[calc(var(--radius)*.7)] px-3 text-[15px] font-bold transition', rail ? 'lg:justify-start justify-center' : '', path === n.id ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-surface2 hover:text-ink')}>
    <n.icon size={20} className="shrink-0" /><span className={rail ? 'hidden lg:inline' : ''}>{n.label}</span></button>
  return <div className="min-h-dvh">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[72px] flex-col border-r hairline bg-surface px-2.5 py-5 md:flex lg:w-64 lg:px-4" aria-label="Primary">
      <button onClick={() => go('home')} disabled={!canVisit(locked, p.habits.focusOpen, 'home')} className="disabled:opacity-40 mb-6 flex items-center gap-2.5 px-2 text-left"><Logo size={36} /><span className="hidden font-display text-2xl font-semibold lg:block">StudyFlow</span></button>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">{mode.main.map(n => <Item key={n.id} n={n} rail />)}<div className="my-2 border-t hairline" />{mode.more.map(n => <Item key={n.id} n={n} rail />)}</nav>
      <div className="hidden px-1 pt-3 lg:block"><StatusChip /></div></aside>
    <div className="md:pl-[72px] lg:pl-64">
      <div className="flex items-center justify-between px-4 pb-1 md:hidden mobile-top"><button onClick={() => go('home')} disabled={!canVisit(locked, p.habits.focusOpen, 'home')} className="flex items-center gap-2 disabled:opacity-40"><Logo size={32} /><span className="font-display text-xl font-semibold">StudyFlow</span></button><StatusChip /></div>
      {locked && <div role="status" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 pt-3 text-sm sm:px-6 lg:px-10"><span className="flex items-center gap-1.5 font-semibold text-muted"><Lock size={14} aria-hidden />Focus lock is on. Study tools stay open; other pages unlock when you pause or stop.</span><button onClick={() => unlockSession(sessionId)} className="min-h-9 rounded-full border hairline bg-surface2 px-3 font-bold hover:brightness-95">Unlock this session</button></div>}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-10 lg:px-10">
        <Suspense fallback={<div className="py-24 text-center text-muted" role="status">Loading…</div>}><div key={path} className="anim-rise"><PageTip id={path} /><Page /></div></Suspense>
        <footer className="mt-10 border-t hairline pt-4 text-center text-xs text-muted"><p>{COPYRIGHT} Made by <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">{AUTHOR}</a></p>
          <p className="mt-1">{(['privacy', 'terms', 'copyright', 'credits'] as const).map((t, i) => <span key={t}>{i > 0 && ' · '}<button onClick={() => go('legal', { tab: t })} className="inline-flex min-h-8 items-center px-1 font-bold underline underline-offset-2">{{ privacy: 'Privacy', terms: 'Terms', copyright: 'Copyright', credits: 'Credits' }[t]}</button></span>)}</p></footer></main></div>
    <MiniTimer />
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-30 border-t hairline bg-surface/95 backdrop-blur md:hidden safe-b"><ul className="mx-auto grid max-w-lg grid-cols-5">
      {mobileMain.map(n => <li key={n.id}><button onClick={() => go(n.id)} disabled={!canVisit(locked, p.habits.focusOpen, n.id)} aria-current={path === n.id ? 'page' : undefined} className={cx('disabled:opacity-40 flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold', path === n.id ? 'text-brand' : 'text-muted')}><n.icon size={22} />{n.label.split(' ')[0]}</button></li>)}
      <li><button onClick={() => setMore(true)} className={cx('disabled:opacity-40 flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold', moreItems.some(n => n.id === path) ? 'text-brand' : 'text-muted')}><Ellipsis size={22} />More</button></li></ul></nav>
    <Dialog open={more} onClose={() => setMore(false)} title="More"><div className="grid gap-1.5">{moreItems.map(n => <button key={n.id} disabled={!canVisit(locked, p.habits.focusOpen, n.id)} onClick={() => { setMore(false); go(n.id) }} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left font-bold hover:bg-surface2 disabled:opacity-40"><n.icon size={20} className="text-brand" />{n.label}</button>)}</div></Dialog>
  </div>
}
export { activeFocusMs, CloudOff, computeXp }
