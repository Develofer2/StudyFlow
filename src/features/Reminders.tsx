import { useEffect, useRef } from 'react'
import type { Flashcard, StudyTask } from '@/types'
import { getAll, getPrefs } from '@/data/store'
import { useToast } from '@/components/ui'
import { notify, notificationStatus } from '@/services/platform'
import { dayKey } from '@/domain/time'
import { isDue } from '@/domain/srs'

const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0) }
const KEY = 'studyflow:reminders-fired'

export default function Reminders() {
  const toast = useToast(); const toastRef = useRef(toast); toastRef.current = toast
  useEffect(() => {
    const load = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
    const check = () => {
      const p = getPrefs(), r = p.reminders; if (!r.enabled) return
      const now = new Date(), today = dayKey(now, p.timezone)
      const cur = Number(new Intl.DateTimeFormat('en-GB', { timeZone: p.timezone, hour: '2-digit', hour12: false }).format(now)) % 24 * 60 + Number(new Intl.DateTimeFormat('en-GB', { timeZone: p.timezone, minute: '2-digit' }).format(now))
      const qs = mins(r.quietStart), qe = mins(r.quietEnd)
      const quiet = qs === qe ? false : qs < qe ? cur >= qs && cur < qe : cur >= qs || cur < qe
      if (quiet) return
      const fired = load(); let dirty = false
      const fire = (k: string, title: string, body: string) => {
        if (fired[k] === today) return
        fired[k] = today; dirty = true
        if (notificationStatus() === 'granted') notify(title, body); else toastRef.current(`${title}: ${body}`, 'info')
      }
      const weekday = new Date(new Date().toLocaleString('en-US', { timeZone: p.timezone })).getDay()
      if (r.daily && r.days.includes(weekday) && cur >= mins(r.time)) fire('daily', 'Study time', 'A short session now keeps things moving.')
      if (r.deadlines) {
        const soon = getAll<StudyTask>('tasks').filter(t => t.status !== 'done' && !t.archivedAt && t.dueAt && new Date(t.dueAt).getTime() - Date.now() <= 864e5 && new Date(t.dueAt).getTime() > Date.now() - 864e5)
        if (soon.length) fire('deadlines', 'Due soon', soon.length === 1 ? `"${soon[0].title}" is due within 24 hours.` : `${soon.length} tasks are due within 24 hours.`)
      }
      if (r.flashcards) {
        const due = getAll<Flashcard>('cards').filter(c => isDue(c, now)).length
        if (due) fire('flashcards', 'Flashcards ready', `${due} card${due > 1 ? 's are' : ' is'} due for review.`)
      }
      if (dirty) { for (const k of Object.keys(fired)) if (fired[k] !== today) delete fired[k]; try { localStorage.setItem(KEY, JSON.stringify(fired)) } catch {} }
    }
    check(); const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])
  return null
}
