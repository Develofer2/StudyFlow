import { lazy, Suspense } from 'react'
import { Segmented } from '@/components/ui'
import { go, useRoute } from '@/app/router'

const Flashcards = lazy(() => import('./Flashcards')), Quizzes = lazy(() => import('./Quizzes')), Notes = lazy(() => import('./Notes'))
const AvatarShowcase = lazy(() => import('./avatar/AvatarShowcase'))
const Analytics = lazy(() => import('./Analytics')), Achievements = lazy(() => import('./Achievements'))
const Loading = () => <div className="py-16 text-center text-muted" role="status">Loading…</div>

function Hub<T extends string>({ route, tabs, label, children }: { route: string; tabs: { value: T; label: string }[]; label: string; children: (t: T) => React.ReactNode }) {
  const r = useRoute(); const t = (tabs.find(x => x.value === r.params.get('tab'))?.value ?? tabs[0].value) as T
  return <div className="space-y-5"><Segmented label={label} value={t} onChange={v => go(route, { tab: v })} options={tabs} /><Suspense fallback={<Loading />}>{children(t)}</Suspense></div>
}
export function StudyHub() {
  return <Hub route="study" label="Study tools" tabs={[{ value: 'flashcards', label: 'Flashcards' }, { value: 'quizzes', label: 'Quizzes & Exams' }, { value: 'notes', label: 'Notes' }]}>
    {t => t === 'flashcards' ? <Flashcards /> : t === 'quizzes' ? <Quizzes /> : <Notes />}</Hub>
}
export function ProgressHub() {
  return <Hub route="progress" label="Progress" tabs={[{ value: 'analytics', label: 'Analytics' }, { value: 'achievements', label: 'Achievements' }, { value: 'avatar', label: 'Avatar' }]}>
    {t => t === 'analytics' ? <Analytics /> : t === 'avatar' ? <AvatarShowcase /> : <Achievements />}</Hub>
}
