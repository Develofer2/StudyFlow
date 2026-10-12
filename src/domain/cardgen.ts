/** Deterministic, rule-based card drafts. It only matches a few explicit sentence patterns and is NOT comparable to a language model. */
export interface Draft { front: string; back: string; score: number }
const clean = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/^[-*•\d.)\s]+/, '')
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export function generateCards(text: string, max = 30): Draft[] {
  const out: Draft[] = []
  const seen = new Set<string>()
  const add = (front: string, back: string) => {
    front = clean(front); back = clean(back).replace(/[.]+$/, '')
    if (front.length < 4 || back.length < 3 || back.length > 300 || seen.has(front.toLowerCase())) return
    seen.add(front.toLowerCase())
    out.push({ front, back: cap(back), score: back.length > 20 && back.length < 160 ? 2 : 1 })
  }
  const lines = text.split(/\n+/)
  for (const line of lines) {
    const m = line.match(/^\s*[-*•]?\s*([^:–—]{2,60}?)\s*[:–—]\s+(.{3,})$/)
    if (m && m[1].split(' ').length <= 8) add(`What is ${m[1].trim()}?`, m[2])
  }
  const sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/)
  for (const raw of sentences) {
    const s = clean(raw).replace(/[.!?]+$/, '')
    let m
    if ((m = s.match(/^(.{2,70}?) (?:is|are) defined as (.{5,})$/i))) add(`How is ${m[1]} defined?`, m[2])
    else if ((m = s.match(/^(.{2,70}?) consists? of (.{5,})$/i))) add(`What does ${m[1]} consist of?`, m[2])
    else if ((m = s.match(/^the purpose of (.{2,70}?) is (?:to )?(.{5,})$/i))) add(`What is the purpose of ${m[1]}?`, m[2])
    else if ((m = s.match(/^(.{2,70}?) (?:is|are) used (?:for|to) (.{5,})$/i))) add(`What is ${m[1]} used for?`, m[2])
    else if ((m = s.match(/^(.{2,50}?) (?:is|are) (?:a|an|the) (.{8,})$/i)) && m[1].split(' ').length <= 6 && !/^(it|this|that|there|he|she|they)$/i.test(m[1])) add(`What is ${m[1]}?`, `${/^(a|an|the)\b/i.test(m[2]) ? '' : ''}${m[2]}`)
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max)
}
