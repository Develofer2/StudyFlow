import type { QuizQuestion } from '@/types'
export const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()

export function validateQuestion(q: QuizQuestion): string | null {
  if (!q.prompt.trim()) return 'Add a question.'
  if (q.type === 'multiple_choice') {
    const opts = (q.options ?? []).filter(o => o.trim())
    if (opts.length < 2) return 'Add at least two options.'
    if (q.correctOptionIndex == null || q.correctOptionIndex < 0 || q.correctOptionIndex >= (q.options ?? []).length || !(q.options ?? [])[q.correctOptionIndex]?.trim()) return 'Mark the correct answer.'
  } else if (q.type === 'true_false') { if (q.correctOptionIndex !== 0 && q.correctOptionIndex !== 1) return 'Choose True or False as the answer.' }
  else if (!(q.acceptedAnswers ?? []).some(a => a.trim())) return 'Add at least one accepted answer.'
  return null
}
/** Returns true/false, or null when the question has no usable answer key (never graded as verified). */
export function grade(q: QuizQuestion, answer: string): boolean | null {
  if (validateQuestion(q)) return null
  if (q.type === 'short_answer') return (q.acceptedAnswers ?? []).some(a => norm(a) && norm(a) === norm(answer))
  return String(q.correctOptionIndex) === answer
}
export function scoreQuiz(questions: QuizQuestion[], answers: Record<string, string>) {
  let score = 0, max = 0
  const results = questions.map(q => {
    max += q.points
    const ok = grade(q, answers[q.id] ?? '')
    if (ok) score += q.points
    return { questionId: q.id, answer: answers[q.id] ?? '', correct: ok === true }
  })
  return { score, maxScore: max, answers: results }
}
