import type { Deck, Flashcard, StudyNote, StudyTask, Subject } from '@/types'
import { getAll, put, putMany, remove, removeMany } from '@/data/store'
import { review, newCardState, type Rating } from '@/domain/srs'
import { addDays, nowIso, uid } from '@/domain/time'

export async function reviewCard(card: Flashcard, rating: Rating) {
  const next = review(card, rating, new Date())
  await put('cards', { ...card, ...next })
  await put('reviews', { cardId: card.id, rating, at: nowIso() })
}
export const newCard = (deckId: string, front: string, back: string, source: Flashcard['source'] = 'manual'): Partial<Flashcard> =>
  ({ id: uid(), deckId, front: front.trim(), back: back.trim(), tags: [], favorite: false, source, ...newCardState() })

export async function toggleTask(t: StudyTask) {
  const done = t.status !== 'done'
  await put('tasks', { ...t, status: done ? 'done' : 'todo', completedAt: done ? nowIso() : undefined, subtasks: done ? t.subtasks.map(s => ({ ...s, completed: true })) : t.subtasks })
}
export async function archiveSubject(s: Subject) { await put('subjects', { ...s, archivedAt: s.archivedAt ? undefined : nowIso() }) }
/** Deleting a subject never destroys content: items are moved to "no subject" (or another subject). */
export async function deleteSubject(id: string, moveTo?: string) {
  for (const k of ['tasks', 'notes', 'decks', 'quizzes', 'exams', 'sessions'] as const)
    for (const r of getAll(k).filter(r => r.subjectId === id)) await put(k, { ...r, subjectId: moveTo }, k === 'sessions')
  await remove('subjects', id)
}
export async function deleteDeck(id: string) { await removeMany('cards', getAll<Flashcard>('cards').filter(c => c.deckId === id).map(c => c.id)); await remove('decks', id) }

export async function loadDemo() {
  if (getAll('subjects').some(s => s.isDemo)) return
  const today = new Date().toISOString().slice(0, 10)
  const sid = uid(), did = uid()
  await put('subjects', { id: sid, name: 'Biology (demo)', color: '#5b8f6b', icon: 'leaf', examDates: [], isDemo: true } as Partial<Subject>)
  await putMany('tasks', [
    { title: 'Read chapter 4: Cell structure', subjectId: sid, priority: 'medium', status: 'todo', tags: [], subtasks: [], dueAt: addDays(today, 1), estimatedMinutes: 40, isDemo: true },
    { title: 'Lab report outline', subjectId: sid, priority: 'high', status: 'todo', tags: [], subtasks: [], dueAt: addDays(today, 3), estimatedMinutes: 60, isDemo: true },
  ] as Partial<StudyTask>[])
  await put('decks', { id: did, title: 'Cell biology (demo)', subjectId: sid, color: '#5b8f6b', isDemo: true } as Partial<Deck>)
  const cards: [string, string][] = [['What does the mitochondrion do?', 'Produces most of the cell’s ATP (energy).'], ['What is the function of ribosomes?', 'They build proteins from amino acids.'], ['Which organelle contains the cell’s DNA?', 'The nucleus.']]
  for (const [f, b] of cards) await put('cards', { ...newCard(did, f, b), isDemo: true } as Partial<Flashcard>)
  await put('notes', { title: 'Cell structure (demo)', content: '# Cell structure\n\n- **Nucleus**: holds DNA\n- **Mitochondria**: make ATP\n- **Ribosomes**: build proteins', subjectId: sid, tags: ['biology'], favorite: false, isDemo: true } as Partial<StudyNote>)
}
export async function removeDemo() {
  const demoDecks = getAll('decks').filter(d => d.isDemo).map(d => d.id)
  await removeMany('cards', getAll<Flashcard>('cards').filter(c => c.isDemo || demoDecks.includes(c.deckId)).map(c => c.id))
  for (const k of ['tasks', 'notes', 'decks', 'subjects', 'quizzes', 'exams'] as const) await removeMany(k, getAll(k).filter(r => r.isDemo).map(r => r.id))
}
