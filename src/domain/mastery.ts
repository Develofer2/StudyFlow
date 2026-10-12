import type { ExamTopic, Flashcard, PlanItem, Quiz, QuizAttempt, ReviewLog } from '@/types'
import { isMastered } from './srs'

export const MIN_SAMPLE = 5
export interface MasteryData { cards: Flashcard[]; reviews: ReviewLog[]; quizzes: Quiz[]; attempts: QuizAttempt[] }
export type MasteryLevel = 'not-enough-data' | 'needs-work' | 'developing' | 'strong'
export interface TopicMastery {
  topicId: string
  cards: { total: number; reviewed: number; mastered: number; pct: number | null; lapses: number; recallPct: number | null; recallN: number }
  quiz: { answered: number; correct: number; pct: number | null }
  sample: number
  /** Based ONLY on demonstrated cards/quiz results with enough samples; never on minutes. */
  level: MasteryLevel
  /** Minutes of done plan items for this topic (effort, not evidence). */
  minutesStudied: number
}
const norm = (s: string) => s.trim().toLowerCase()

/** Quiz answers attributable to a topic: questions whose topicTags/prompt mention the topic title; if none match, all questions of a quiz linked to this topic alone. */
export function topicQuizAnswers(topic: ExamTopic, allTopics: ExamTopic[], d: Pick<MasteryData, 'quizzes' | 'attempts'>) {
  const out: { quizId: string; attemptId: string; at: string; correct: boolean }[] = []
  const t = norm(topic.title)
  for (const qid of topic.quizIds ?? []) {
    const quiz = d.quizzes.find(q => q.id === qid); if (!quiz) continue
    const hit = quiz.questions.filter(q => t && (q.topicTags.some(g => norm(g) === t) || norm(q.prompt).includes(t))).map(q => q.id)
    const sole = allTopics.filter(x => x.quizIds?.includes(qid)).length <= 1
    const ids = hit.length ? new Set(hit) : sole ? new Set(quiz.questions.map(q => q.id)) : new Set<string>()
    for (const a of d.attempts) if (a.quizId === qid) for (const ans of a.answers) if (ids.has(ans.questionId)) out.push({ quizId: qid, attemptId: a.id, at: a.completedAt ?? a.startedAt, correct: ans.correct })
  }
  return out
}
export const topicCards = (topic: ExamTopic, cards: Flashcard[]) => cards.filter(c => topic.deckIds?.includes(c.deckId))

export function topicMastery(topic: ExamTopic, allTopics: ExamTopic[], d: MasteryData, plan: PlanItem[] = []): TopicMastery {
  const cs = topicCards(topic, d.cards), reviewed = cs.filter(c => c.repetitions > 0 || !!c.lastReviewedAt)
  const mastered = cs.filter(isMastered).length, ids = new Set(cs.map(c => c.id))
  const logs = d.reviews.filter(r => ids.has(r.cardId)), good = logs.filter(r => r.rating === 'good' || r.rating === 'easy').length
  const qa = topicQuizAnswers(topic, allTopics, d), qc = qa.filter(a => a.correct).length
  const cardOk = reviewed.length >= MIN_SAMPLE, quizOk = qa.length >= MIN_SAMPLE
  const parts: { pct: number; n: number }[] = []
  if (cardOk) parts.push({ pct: mastered / cs.length, n: reviewed.length })
  if (quizOk) parts.push({ pct: qc / qa.length, n: qa.length })
  const n = parts.reduce((a, p) => a + p.n, 0), score = n ? parts.reduce((a, p) => a + p.pct * p.n, 0) / n : 0
  return {
    topicId: topic.id,
    cards: { total: cs.length, reviewed: reviewed.length, mastered, pct: cs.length ? Math.round((mastered / cs.length) * 100) : null, lapses: cs.reduce((a, c) => a + c.lapseCount, 0), recallPct: logs.length ? Math.round((good / logs.length) * 100) : null, recallN: logs.length },
    quiz: { answered: qa.length, correct: qc, pct: qa.length ? Math.round((qc / qa.length) * 100) : null },
    sample: reviewed.length + qa.length,
    level: !parts.length ? 'not-enough-data' : score >= 0.8 ? 'strong' : score >= 0.5 ? 'developing' : 'needs-work',
    minutesStudied: plan.filter(p => p.topicId === topic.id && p.done).reduce((a, p) => a + p.minutes, 0),
  }
}
export const masteryMap = (topics: ExamTopic[], d: MasteryData, plan: PlanItem[] = []) => topics.map(t => topicMastery(t, topics, d, plan))
