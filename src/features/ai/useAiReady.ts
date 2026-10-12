import { useEffect, useState } from 'react'
import type { AiFeature } from '@/types'
import { usePrefs } from '@/data/store'
import { isUsable, resolveActive, type Active } from '@/services/ai/profiles'
import { onSecretChange } from '@/services/ai/secrets'

/** Whether AI can run for a feature right now, based on the hub profile that would be used. */
export function useAiReady(feature?: AiFeature) {
  const p = usePrefs()
  const [s, setS] = useState<{ loading: boolean; ready: boolean; active: Active | null }>({ loading: true, ready: false, active: null })
  const [tick, setTick] = useState(0)
  useEffect(() => onSecretChange(() => setTick(t => t + 1)), [])
  useEffect(() => {
    let on = true
    void resolveActive(feature).then(async a => { const ready = p.ai.enabled && (await isUsable(a)); if (on) setS({ loading: false, ready, active: a }) })
    return () => { on = false }
  }, [feature, p.ai.enabled, p.ai.proxyUrl, p.aiHub, tick])
  return { ...s, ai: p.ai, label: s.active?.profile.name ?? 'your AI provider' }
}
