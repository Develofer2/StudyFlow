import { z } from 'zod'
import { AiError, MAX_FILE_BYTES, generateJson, type AiPart, type CallOpts } from './client'

export { AiError, MAX_FILE_BYTES, MAX_TEXT_CHARS, aiUsageToday, generateJson, type AiPart, type CallOpts } from './client'

export async function fileToPart(file: File): Promise<AiPart> {
  if (file.size > MAX_FILE_BYTES && !file.type.startsWith('image/')) throw new AiError('limit', 'That file is over 10 MB. Try a shorter PDF or a photo of the page.')
  if (file.type.startsWith('image/')) return downscale(file)
  if (file.type === 'application/pdf') { if (file.size > MAX_FILE_BYTES) throw new AiError('limit', 'That PDF is over 10 MB. Split it or photograph the pages you need.'); return { mime: 'application/pdf', data: await b64(file) } }
  throw new AiError('limit', 'Supported files: photos/screenshots (JPG, PNG, WebP), PDF, or plain text.')
}
const b64 = (f: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = () => rej(r.error); r.readAsDataURL(f) })
async function downscale(file: File): Promise<AiPart> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/jpeg', 0.82))
  return { mime: 'image/jpeg', data: await b64(blob) }
}

const S = { STR: { type: 'STRING' }, NUM: { type: 'INTEGER' } }
const CARD_PROMPT = 'You help a student study. Using ONLY the provided material, write clear flashcards (front = question or term, back = concise answer). Do not invent facts that are not in the material. Maximum {n} cards.'
const cardsZ = z.object({ cards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).max(40) })
export const aiCards = (input: { text?: string; parts?: AiPart[]; max?: number }, o: CallOpts = {}) => generateJson({ feature: 'cards', ...o,
  prompt: CARD_PROMPT.replace('{n}', String(input.max ?? 15)), text: input.text, parts: input.parts, validate: cardsZ,
  schema: { type: 'OBJECT', properties: { cards: { type: 'ARRAY', items: { type: 'OBJECT', properties: { front: S.STR, back: S.STR }, required: ['front', 'back'] } } }, required: ['cards'] } })

const quizZ = z.object({ questions: z.array(z.object({ type: z.enum(['multiple_choice', 'true_false', 'short_answer']), prompt: z.string(), options: z.array(z.string()).optional(), correctOptionIndex: z.number().int().optional(), acceptedAnswers: z.array(z.string()).optional(), explanation: z.string().optional() })).max(20) })
export const aiQuiz = (input: { text?: string; parts?: AiPart[]; count?: number }, o: CallOpts = {}) => generateJson({ feature: 'quiz', ...o,
  prompt: `You help a student practise. From ONLY the provided material write up to ${input.count ?? 8} quiz questions. Mix multiple_choice (4 options, correctOptionIndex 0-3), true_false (options ["True","False"], correctOptionIndex 0 or 1) and short_answer (acceptedAnswers with 1-3 short variants). Add a one-sentence explanation. Do not invent facts.`,
  text: input.text, parts: input.parts, validate: quizZ,
  schema: { type: 'OBJECT', properties: { questions: { type: 'ARRAY', items: { type: 'OBJECT', properties: { type: { type: 'STRING', enum: ['multiple_choice', 'true_false', 'short_answer'] }, prompt: S.STR, options: { type: 'ARRAY', items: S.STR }, correctOptionIndex: S.NUM, acceptedAnswers: { type: 'ARRAY', items: S.STR }, explanation: S.STR }, required: ['type', 'prompt'] } } }, required: ['questions'] } })

const sumZ = z.object({ summary: z.array(z.string()).min(1), keyTerms: z.array(z.string()).optional() })
export const aiSummary = (input: { text?: string; parts?: AiPart[] }, o: CallOpts = {}) => generateJson({ feature: 'summary', ...o,
  prompt: 'Summarise the student material as 5-10 short bullet points in simple language, plus up to 8 key terms. Use only the material.', text: input.text, parts: input.parts, validate: sumZ,
  schema: { type: 'OBJECT', properties: { summary: { type: 'ARRAY', items: S.STR }, keyTerms: { type: 'ARRAY', items: S.STR } }, required: ['summary'] } })

const expZ = z.object({ explanation: z.string(), example: z.string().optional(), mnemonic: z.string().optional() })
export const aiExplain = (text: string, o: CallOpts = {}) => generateJson({ feature: 'explain', ...o,
  prompt: 'Explain this study item to a student in simple, friendly language: a short explanation, one concrete example, and an optional memory trick. If it looks factually doubtful, say so.', text, validate: expZ,
  schema: { type: 'OBJECT', properties: { explanation: S.STR, example: S.STR, mnemonic: S.STR }, required: ['explanation'] } })

export const aiPlanText = (text: string, o: CallOpts = {}) => generateJson({ feature: 'plan', ...o,
  prompt: 'Rewrite this revision plan as a short, encouraging overview (max 90 words). Keep every date and number exactly as given.', text, validate: z.object({ overview: z.string() }),
  schema: { type: 'OBJECT', properties: { overview: S.STR }, required: ['overview'] } })

/* ---------- Study Coach helpers (text in, small structured draft out) ---------- */
const tipZ = z.object({ text: z.string().min(1) })
const tipSchema = { type: 'OBJECT', properties: { text: S.STR }, required: ['text'] }
export const aiMistake = (text: string, o: CallOpts = {}) => generateJson({ feature: 'explain', ...o,
  prompt: 'A student got this quiz question wrong. Explain in simple words why the correct answer is right and what may have gone wrong with the student answer. Use only the question and answers given. Max 120 words.', text, validate: tipZ, schema: tipSchema })
export const aiFocusTip = (text: string, o: CallOpts = {}) => generateJson({ feature: 'plan', ...o,
  prompt: 'Suggest ONE focus session for a student (what to study and for how many minutes, plus a one-line reason). Use only the stats given and do not invent data. Max 60 words.', text, validate: tipZ, schema: tipSchema })
export const aiReflection = (text: string, o: CallOpts = {}) => generateJson({ feature: 'plan', ...o,
  prompt: 'Write a short, kind weekly reflection for a student from ONLY the stats given: one thing that went well, one gentle suggestion for next week. No guilt, no invented numbers. Max 110 words.', text, validate: tipZ, schema: tipSchema })
const breakZ = z.object({ tasks: z.array(z.object({ title: z.string().min(1), minutes: z.number().int().optional() })).min(1).max(15) })
export const aiBreakdown = (text: string, o: CallOpts = {}) => generateJson({ feature: 'plan', ...o,
  prompt: 'Break this student assignment into 3-10 concrete, ordered tasks. Each task has a short title and an estimated number of minutes (integer). Use only what the assignment says.', text, validate: breakZ,
  schema: { type: 'OBJECT', properties: { tasks: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: S.STR, minutes: S.NUM }, required: ['title'] } } }, required: ['tasks'] } })

/* ---------- AI Study Notes (form -> text note) ---------- */
export type NotePurpose = 'learn' | 'revise' | 'summarise' | 'homework'
export type NoteDetail = 'brief' | 'standard' | 'deep'
export type NoteLength = 'short' | 'medium' | 'long'
export interface StudyNoteRequest {
  title?: string; subject?: string; purpose: NotePurpose; detail: NoteDetail; length: NoteLength; language: string; extra?: string
  text?: string; parts?: AiPart[]
}
export const studyNoteZ = z.object({
  title: z.string().min(1),
  sections: z.array(z.object({ heading: z.string(), points: z.array(z.string()).min(1), example: z.string().optional() })).min(1).max(20),
  keyTerms: z.array(z.object({ term: z.string(), meaning: z.string() })).max(30).default([]),
  questions: z.array(z.string()).max(15).default([]),
})
export type StudyNoteData = z.infer<typeof studyNoteZ>

const PURPOSE_TEXT: Record<NotePurpose, string> = {
  learn: 'The student is learning this for the first time: explain clearly in simple steps, define terms, add examples.',
  revise: 'The student is revising for an exam: focus on what is most testable, compact bullet points, formulas and definitions, plus self-test questions.',
  summarise: 'The student wants a faithful summary of a reading: capture the main argument and supporting points, nothing more.',
  homework: 'The student needs help understanding homework material: explain the ideas and method, but do not just give final answers to set questions.',
}
const DETAIL_TEXT: Record<NoteDetail, string> = { brief: 'Keep each point to one short line.', standard: 'Use clear, complete points.', deep: 'Go into depth with reasoning and nuance.' }
const LENGTH_TEXT: Record<NoteLength, string> = { short: 'About 3 sections.', medium: 'About 5 sections.', long: 'Up to 8 sections.' }

export function buildNotePrompt(r: StudyNoteRequest) {
  return ['You write study notes for a student as plain structured text. Use ONLY the provided material and instructions; do not invent facts. If something is unclear or unreadable, say so inside a point rather than guessing.',
    PURPOSE_TEXT[r.purpose], DETAIL_TEXT[r.detail], LENGTH_TEXT[r.length],
    `Write in ${r.language || 'English'}.`,
    r.title ? `Working title: ${r.title}.` : 'Suggest a short title.',
    r.subject ? `Subject: ${r.subject}.` : '',
    r.extra ? `Extra instructions from the student: ${r.extra.slice(0, 600)}` : '',
    'Give sections (heading + points + optional example), keyTerms (term + meaning) and up to 5 self-check questions.'].filter(Boolean).join('\n')
}

export const aiStudyNote = (r: StudyNoteRequest, o: CallOpts = {}) => generateJson({ feature: 'summary', ...o,
  prompt: buildNotePrompt(r), text: r.text, parts: r.parts, validate: studyNoteZ,
  schema: { type: 'OBJECT', properties: {
    title: S.STR,
    sections: { type: 'ARRAY', items: { type: 'OBJECT', properties: { heading: S.STR, points: { type: 'ARRAY', items: S.STR }, example: S.STR }, required: ['heading', 'points'] } },
    keyTerms: { type: 'ARRAY', items: { type: 'OBJECT', properties: { term: S.STR, meaning: S.STR }, required: ['term', 'meaning'] } },
    questions: { type: 'ARRAY', items: S.STR } }, required: ['title', 'sections'] } })

/** Local markdown rendering of the validated note. Pure and unit-tested. */
export function noteToMarkdown(n: StudyNoteData, titleOverride?: string): string {
  const out: string[] = [`# ${(titleOverride || n.title).trim()}`, '']
  for (const s of n.sections) {
    out.push(`## ${s.heading.trim()}`, ...s.points.map(p => `- ${p.trim()}`))
    if (s.example?.trim()) out.push('', `> Example: ${s.example.trim()}`)
    out.push('')
  }
  if (n.keyTerms.length) out.push('## Key terms', ...n.keyTerms.map(k => `- **${k.term.trim()}**: ${k.meaning.trim()}`), '')
  if (n.questions.length) out.push('## Check yourself', ...n.questions.map((q, i) => `${i + 1}. ${q.trim()}`), '')
  return out.join('\n').trimEnd() + '\n'
}
