import { useEffect } from 'react'
import { usePrefs } from '@/data/store'
import { ToastProvider } from '@/components/ui'
import { applyTheme } from '@/services/platform'
import { initTimerRuntime } from '@/services/timerService'
import Shell from './Shell'
import Onboarding from '@/features/Onboarding'
import { useCursorTheme } from './useCursor'
import LiveCursor from './LiveCursor'
import Reminders from '@/features/Reminders'

export default function App() {
  const p = usePrefs()
  useCursorTheme()
  useEffect(() => { applyTheme() }, [p.themeId, p.appearance, p.accent, p.radius, p.fontScale, p.density, p.motion, p.glow, p.eveningWarm])
  useEffect(() => {
    initTimerRuntime()
    const mq = matchMedia('(prefers-color-scheme: dark)'); const h = () => applyTheme(); mq.addEventListener('change', h)
    const rm = matchMedia('(prefers-reduced-motion: reduce)'); document.documentElement.dataset.sysReduce = String(rm.matches)
    return () => mq.removeEventListener('change', h)
  }, [])
  return <ToastProvider><Shell /><LiveCursor />{!p.onboarded && <Onboarding />}<Reminders /></ToastProvider>
}
