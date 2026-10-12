import { z } from 'zod'
import { getPrefs } from '@/data/store'
import { generateJson } from './client'
import { isUsable, resolveActive } from './profiles'
/** Stable entry point used by the Buddy and Study Coach. Resolves the hub profile for the feature. */
export interface ChatMsg { role: 'user' | 'assistant'; content: string }
export async function aiChat(_feature: 'chat' | 'plan' | 'explain', messages: ChatMsg[], system: string): Promise<{ text: string; cached: boolean }> {
  const r = await generateJson({ feature: _feature, prompt: system, text: messages.map(m => `${m.role}: ${m.content}`).join('\n'), schema: { type: 'OBJECT', properties: { reply: { type: 'STRING' } }, required: ['reply'] }, validate: z.object({ reply: z.string() }) })
  return { text: r.data.reply, cached: r.cached }
}
/** True when AI is switched on and the default profile is configured (key present, or a keyless compatible endpoint, or a proxy). */
export async function aiAvailable(): Promise<boolean> {
  if (!getPrefs().ai.enabled) return false
  return isUsable(await resolveActive('chat'))
}
