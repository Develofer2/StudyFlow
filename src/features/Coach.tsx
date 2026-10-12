import { useState } from 'react'
import { PageHeader, Segmented } from '@/components/ui'
import { BreakdownTool, CardsTool, ExplainTool, FocusTool, MistakeTool, PlanTool, QuizTool, ReflectionTool, SummaryTool } from './coach/Tools'

const TOOLS = [
  { value: 'explain', label: 'Explain', C: ExplainTool }, { value: 'summary', label: 'Summarise', C: SummaryTool }, { value: 'cards', label: 'Flashcards', C: CardsTool },
  { value: 'quiz', label: 'Quiz', C: QuizTool }, { value: 'plan', label: 'Revision plan', C: PlanTool }, { value: 'mistake', label: 'Quiz mistake', C: MistakeTool },
  { value: 'breakdown', label: 'Assignment', C: BreakdownTool }, { value: 'focus', label: 'Focus idea', C: FocusTool }, { value: 'reflect', label: 'Weekly reflection', C: ReflectionTool },
] as const
type Id = (typeof TOOLS)[number]['value']

export default function Coach() {
  const [tool, setTool] = useState<Id>('explain')
  const T = TOOLS.find(t => t.value === tool)!.C
  return <div className="mx-auto max-w-3xl space-y-4 overflow-x-hidden">
    <PageHeader title="Study Coach" sub="Helpers that work without AI, with optional AI drafts you review before anything is saved." />
    <Segmented label="Coach tool" value={tool} onChange={setTool} options={TOOLS.map(t => ({ value: t.value, label: t.label }))} />
    <T key={tool} />
  </div>
}
