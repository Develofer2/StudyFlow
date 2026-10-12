import { useMemo, useState } from 'react'
import { Award, Lock, Sparkles, Target } from 'lucide-react'
import type { Achievement, ReviewLog } from '@/types'
import { useCollection, usePrefs, setPrefs } from '@/data/store'
import { Button, Card, Chip, EmptyState, PageHeader, Segmented, cx } from '@/components/ui'
import { useStats } from '@/hooks/useStats'
import { BADGES, BADGE_CATEGORIES, computeXp, levelFromXp, rewardLabel, type BadgeCategory } from '@/domain/achievements'
import { useBadgeCtx } from './achievements/useBadgeEngine'
import { addDays, dayKey, fmtDuration } from '@/domain/time'
import { useRoute } from '@/app/router'
import ShareCard from './ShareCard'

const Bar = ({ value, label }: { value: number; label: string }) => <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} className="h-2.5 overflow-hidden rounded-full bg-surface2">
  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(1, value) * 100}%` }} /></div>
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export default function Achievements() {
  const p = usePrefs(), s = useStats(), route = useRoute()
  const earned = useCollection<Achievement>('achievements'), reviews = useCollection<ReviewLog>('reviews')
  const ctx = useBadgeCtx(), [cat, setCat] = useState<BadgeCategory | 'all'>('all')
  const keys = earned.map(a => a.key)
  const xp = computeXp(ctx, keys), lv = levelFromXp(xp)
  const header = route.path === 'achievements' ? <PageHeader title="Achievements" sub="Badges, levels and weekly challenges. Earned from real study activity only." /> : null

  const challenges = useMemo(() => {
    const wEnd = addDays(s.weekStart, 6), inWeek = (iso?: string) => { if (!iso) return false; const k = dayKey(iso, p.timezone); return k >= s.weekStart && k <= wEnd }
    const goal = p.weeklyGoalMinutes ?? p.dailyGoalMinutes * 5
    let days = 0; for (let d = s.weekStart; d <= wEnd; d = addDays(d, 1)) if ((s.byDay.get(d) ?? 0) > 0) days++
    return [
      { id: 'goal', title: `Study ${fmtDuration(goal * 60)} this week`, note: p.weeklyGoalMinutes ? 'Your weekly goal' : 'Five days of your daily goal (set a weekly goal in Settings)', cur: s.weekSeconds / 60, max: goal, show: fmtDuration(s.weekSeconds) + ' / ' + fmtDuration(goal * 60) },
      { id: 'days', title: 'Study on 4 different days', note: 'Any amount of focus counts for a day', cur: days, max: 4, show: `${days} / 4 days` },
      { id: 'tasks', title: 'Finish 3 tasks', note: 'Tasks marked done this week', cur: s.tasks.filter(t => inWeek(t.completedAt)).length, max: 3, show: '' },
      { id: 'cards', title: 'Review 20 flashcards', note: 'Counted from your review history', cur: reviews.filter(r => inWeek(r.at)).length, max: 20, show: '' },
    ].map(c => ({ ...c, show: c.show || `${Math.min(c.cur, c.max)} / ${c.max}` }))
  }, [s, p.timezone, p.weeklyGoalMinutes, p.dailyGoalMinutes, reviews])

  if (!p.gamification) return <div className="space-y-5">{header}<EmptyState icon={<Sparkles />} title="Gamification is switched off" body="Levels, badges and challenges are optional. Turn them on if a little encouragement helps; you can switch them off again any time. Your analytics stay available either way." action={<Button variant="primary" onClick={() => void setPrefs({ gamification: true })}>Turn on achievements</Button>} /></div>

  return <div className="space-y-5">
    {header}
    <Card className="flex flex-wrap items-center gap-5"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand text-brand-fg"><span className="font-display text-3xl font-bold tnum" aria-hidden>{lv.level}</span></div>
      <div className="min-w-[200px] flex-1 space-y-2"><h2 className="font-display text-2xl font-semibold">Level {lv.level}</h2><Bar value={lv.into / lv.need} label="Progress to next level" />
        <p className="text-sm text-muted tnum">{lv.into} / {lv.need} XP to level {lv.level + 1} · {xp} XP total</p>
        <p className="text-xs text-muted">XP comes from your saved records: focus minutes (up to 30 per session), finished tasks, flashcard reviews, quiz attempts and badges. It cannot be inflated by repeating clicks.</p></div></Card>

    <section aria-labelledby="ch"><h2 id="ch" className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Target size={20} className="text-brand" />This week&apos;s challenges</h2>
      <div className="grid gap-3 sm:grid-cols-2">{challenges.map(c => { const done = c.cur >= c.max; return <Card key={c.id} className="space-y-2.5">
        <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{c.title}</p><p className="text-sm text-muted">{c.note}</p></div>{done && <Chip className="border-ok text-ok">Done</Chip>}</div>
        <Bar value={c.cur / c.max} label={c.title} /><p className="text-sm font-semibold tnum">{c.show}</p></Card> })}</div></section>

    <section aria-labelledby="bd"><h2 id="bd" className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Award size={20} className="text-brand" />Badges <span className="text-base font-normal text-muted tnum">{BADGES.filter(b => keys.includes(b.key)).length} / {BADGES.length}</span></h2>
      <div className="mb-3 max-w-full"><Segmented label="Badge category" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All' }, ...BADGE_CATEGORIES.map(c => ({ value: c, label: c }))]} /></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{BADGES.filter(b => cat === 'all' || b.category === cat).map(b => { const a = earned.find(x => x.key === b.key), pr = b.progress(ctx), name = a?.snapshot?.name ?? b.name, cond = a?.snapshot?.condition ?? b.condition, rw = a?.reward ?? rewardLabel(b.reward)
        return <li key={b.key} className={cx('flex gap-3 rounded-card border hairline p-4', a ? 'bg-surface' : 'bg-surface2/50')}>
        <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full', a ? 'bg-brand text-brand-fg' : 'bg-surface2 text-muted')}>{a ? <Award size={22} /> : <Lock size={20} />}</span>
        <div className="min-w-0 flex-1 space-y-1"><p className="font-bold">{name} <span className="sr-only">{a ? '(earned)' : '(locked)'}</span></p><p className="text-sm text-muted">{cond}</p>
          <p className="flex flex-wrap gap-1.5 text-xs"><Chip>{b.category}</Chip>{b.tier && <Chip className="capitalize">{b.tier}</Chip>}</p>
          {!a && <><Bar value={pr.value / pr.target} label={`${b.name} progress`} /><p className="text-xs text-muted tnum">{pr.target > 1 ? `${pr.value} / ${pr.target}` : 'Not yet earned'}</p></>}
          <p className={cx('text-xs font-bold', a ? 'text-ok' : 'text-muted')}>{a ? `Earned ${dateFmt(a.earnedAt)}` : 'Locked'} · +{b.xp} XP{rw ? ` · Reward: ${rw}` : ''}</p></div></li> })}</ul></section>

    <ShareCard />
  </div>
}
