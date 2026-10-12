export type ID = string
export interface Base { id: ID; createdAt: string; updatedAt: string; isDemo?: boolean }

export interface Subject extends Base { name: string; description?: string; color: string; icon: string; academicTerm?: string; examDates: string[]; archivedAt?: string }
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export interface StudyTask extends Base {
  title: string; description?: string; subjectId?: ID; dueAt?: string; priority: TaskPriority; status: TaskStatus
  estimatedMinutes?: number; tags: string[]; subtasks: { id: string; title: string; completed: boolean }[]
  completedAt?: string; archivedAt?: string
}
export interface FocusPreset extends Base {
  name: string; workMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; sessionsBeforeLongBreak: number
  autoStartBreaks: boolean; autoStartWork: boolean; soundEnabled: boolean; builtIn?: boolean
}
export type SessionType = 'focus' | 'short_break' | 'long_break'
export type SessionStatus = 'completed' | 'interrupted' | 'cancelled'
export interface StudySession extends Base {
  subjectId?: ID; taskId?: ID; type: SessionType; status: SessionStatus; startedAt: string; endedAt?: string
  plannedSeconds: number; actualFocusSeconds: number; interruptionCount: number; rating?: number; notes?: string; intention?: string
}
export interface StudyNote extends Base { title: string; content: string; subjectId?: ID; folder?: string; tags: string[]; favorite: boolean; archivedAt?: string }
export interface Deck extends Base { title: string; description?: string; subjectId?: ID; color: string }
export interface Flashcard extends Base {
  deckId: ID; front: string; back: string; tags: string[]; favorite: boolean; repetitions: number; intervalDays: number
  easeFactor: number; dueAt?: string; lastReviewedAt?: string; lapseCount: number; source?: 'manual' | 'rules' | 'ai'
}
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
export interface QuizQuestion {
  id: string; type: QuestionType; prompt: string; options?: string[]; correctOptionIndex?: number
  acceptedAnswers?: string[]; explanation?: string; points: number; topicTags: string[]
}
export interface Quiz extends Base { title: string; subjectId?: ID; questions: QuizQuestion[]; timeLimitSeconds?: number; source?: 'manual' | 'ai' }
export interface QuizAttempt extends Base {
  quizId: ID; quizTitle: string; startedAt: string; completedAt?: string; score: number; maxScore: number
  answers: { questionId: string; answer: string; correct: boolean }[]
}
export interface ExamTopic { id: string; title: string; confidence: 1 | 2 | 3 | 4 | 5; effortHours: number; done: boolean; noteIds?: ID[]; deckIds?: ID[]; quizIds?: ID[] }
export interface PlanItem { id: string; day: string; topicId?: string; title: string; minutes: number; done: boolean; manual?: boolean }
export interface Exam extends Base { name: string; subjectId?: ID; date: string; priority: 'low' | 'medium' | 'high'; coverage: { id: string; title: string; done: boolean }[]; hoursPerWeek?: number; topics?: ExamTopic[]; availableMinutesPerDay?: number; plan?: PlanItem[] }
/** Append-only reward ledger. id = 'led:' + key, so the same event can never be recorded twice. Points may be negative (shop purchases). */
export interface LedgerEntry extends Base { key: string; kind: 'session' | 'task' | 'review' | 'quiz' | 'goal' | 'achievement' | 'purchase' | 'bonus'; points: number; xp: number; refId?: string; note?: string; day: string }
/** One grown plant per focus session. id = 'tree:' + sessionId. Species is chosen once and persisted. */
export interface Tree extends Base { sessionId: ID; species: string; minutes: number; stage: 0 | 1 | 2 | 3 | 4 | 5; complete: boolean; plantedAt: string; day: string; subjectId?: ID; season: 'spring' | 'summer' | 'autumn' | 'winter' }
export interface Achievement extends Base { key: string; earnedAt: string; snapshot?: { name: string; condition: string; category?: string; tier?: string }; reward?: string }
export interface ReviewLog extends Base { cardId: ID; rating: 'again' | 'hard' | 'good' | 'easy'; at: string }

export interface TimerSnapshot {
  phase: 'idle' | SessionType
  status: 'idle' | 'running' | 'paused'
  presetId?: ID; subjectId?: ID; taskId?: ID; intention?: string
  startedAt?: number; endsAt?: number; pausedRemainingMs?: number; plannedMs: number
  accumulatedFocusMs: number; completedFocusSessions: number; interruptions: number; sessionId?: ID; segmentStart?: number
}

export interface Prefs {
  displayName: string; timezone: string; weekStartsOn: 0 | 1; dailyGoalMinutes: number; weeklyGoalMinutes?: number
  themeId: string; appearance: 'light' | 'dark' | 'system'; accent?: string; radius: number; fontScale: number
  density: 'comfortable' | 'compact'; motion: 'full' | 'low' | 'off'; glow: number; timerStyle: 'ring' | 'minimal' | 'bar'; scene: string
  favoriteThemes: string[]; eveningWarm: boolean
  activePresetId: string; navMode: 'simple' | 'full'; onboarded: boolean
  gamification: boolean; graceDay: boolean
  reminders: { enabled: boolean; daily: boolean; time: string; days: number[]; quietStart: string; quietEnd: string; deadlines: boolean; flashcards: boolean }
  ai: { enabled: boolean; consented: boolean; provider: AiProviderId; model: string; baseUrl?: string; proxyUrl?: string; maxPerMinute: number }
  shareFields: { minutes: boolean; sessions: boolean; streak: boolean; badges: boolean; name: boolean }
  dismissedRecs: Record<string, string>
  game: GameState
  buddy2: BuddyPrefs; env: EnvPrefs; sound: SoundPrefs; forest: ForestPrefs; habits: HabitPrefs; aiHub: AiHubState; journey: { visible: boolean }; avatar: import('@/domain/avatar').AvatarCfg; touch: { fx: 'off' | 'ripple' | 'critters' | 'paws' | 'hearts' | 'sparkles' | 'bubbles'; animal: string; trail: boolean; haptics: boolean }; cursor: { on: boolean; mode: 'image' | 'live'; arrow: string; companion: string; size: 'normal' | 'large' }
}
export type BuddyKind = 'cat' | 'owl' | 'frog' | 'fox' | 'rabbit' | 'penguin' | 'robot' | 'ghost' | 'dragon' | 'spirit'
export interface BuddyPrefs {
  enabled: boolean; kind: BuddyKind; names: Partial<Record<BuddyKind, string>>; style: 'cheerful' | 'calm' | 'playful' | 'minimal'
  intensity: 'full' | 'gentle' | 'still'; messages: boolean; sound: boolean; outfit: { hat?: string; neck?: string; held?: string; aura?: string }
  aiMode: boolean; coStudy: boolean
}
export interface EnvPrefs { id: string; staticBackground: boolean; showBuddy: boolean; showAvatar?: boolean }
export interface SoundPrefs { volume: number; muted: boolean; mix: Record<string, boolean>; sleepMinutes: number; auto: 'off' | 'focus-only' | 'focus-and-break'; breakSound: string }
export interface ForestPrefs { mode: 'rich' | 'quiet'; placed: string[]; featured?: string }
export interface HabitPrefs { minDailyMinutes: number; studyDays: number[]; restDays: string[]; weeklySessionsTarget: number; graceDaysPerWeek: number; breakActivities: boolean; focusLock: boolean; focusOpen: string[]; tabWarning: 'off' | 'warn' | 'pause' }
export type AiAdapter = 'gemini' | 'openai' | 'anthropic' | 'openai-compatible'
export type AiFeature = 'chat' | 'summary' | 'cards' | 'quiz' | 'exam' | 'plan' | 'explain'
export type ProviderStatus = 'not-configured' | 'ready' | 'testing' | 'connected' | 'auth-failed' | 'model-unavailable' | 'network' | 'provider-error' | 'unsupported'
export interface ProviderProfile {
  id: string; name: string; adapter: AiAdapter; baseUrl?: string; model: string; enabled: boolean; keyMode: 'session' | 'device'
  headers?: Record<string, string>; timeoutMs: number; maxOutputTokens: number; maxPerMinute: number
  capabilities: { json: boolean; vision: boolean; pdf: boolean; modelList: boolean }; status: ProviderStatus; statusDetail?: string
  createdAt: string; updatedAt: string
}
export interface AiHubState { profiles: ProviderProfile[]; defaultId?: string; featureModels: Partial<Record<AiFeature, { profileId: string; model: string }>>; log: { at: string; profileId: string; feature: string; ok: boolean; detail: string }[] }
export type AiProviderId = 'gemini' | 'openai' | 'anthropic' | 'compatible'
/** Local-only rewards state. Tokens are earned by finished focus sessions and spent in the Arcade. */
export interface GameState {
  tokens: number; earnedDay: string; earnedToday: number
  best: Record<string, number>; plays: Record<string, number>
  pet: { kind: string; name: string; fed: number }
  questDay: string; questsDone: string[]; claimedQuests: string[]
  lastSeenDay: string; freezeTokens: number; seenBadges: string[]
  buddy: string
}
