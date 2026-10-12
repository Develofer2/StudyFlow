import { AiError } from '@/services/ai/gemini'

export const DECK_COLORS = ['#b5532f', '#5b8f6b', '#4a6fa5', '#8a5ea8', '#b08a2e', '#4f8f95']

export function aiErrorText(e: unknown): string {
  if (e instanceof AiError) {
    switch (e.kind) {
      case 'quota': return 'AI is resting — try again in a minute. Your manual tools still work.'
      case 'offline': return 'AI needs internet. Your manual tools still work offline.'
      case 'nokey': return e.message
      case 'invalid': return e.message
      default: return e.message
    }
  }
  return 'Something went wrong while talking to the AI. Please try again.'
}
