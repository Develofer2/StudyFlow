import type { FocusPreset, Prefs } from '@/types'
const t = '2024-01-01T00:00:00.000Z'
export const BUILT_IN_PRESETS: FocusPreset[] = [
  { id: 'preset-classic', name: 'Classic Pomodoro', workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4, autoStartBreaks: false, autoStartWork: false, soundEnabled: true, builtIn: true, createdAt: t, updatedAt: t },
  { id: 'preset-deep', name: 'Deep Work', workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, sessionsBeforeLongBreak: 3, autoStartBreaks: false, autoStartWork: false, soundEnabled: true, builtIn: true, createdAt: t, updatedAt: t },
  { id: 'preset-sprint', name: 'Short Sprint', workMinutes: 15, shortBreakMinutes: 3, longBreakMinutes: 10, sessionsBeforeLongBreak: 4, autoStartBreaks: false, autoStartWork: false, soundEnabled: true, builtIn: true, createdAt: t, updatedAt: t },
]
export const defaultPrefs = (): Prefs => ({
  displayName: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', weekStartsOn: 1, dailyGoalMinutes: 60,
  themeId: 'paper-ink', appearance: 'system', radius: 16, fontScale: 1, density: 'comfortable', motion: 'low', glow: 0, timerStyle: 'ring', scene: 'classic-ring',
  favoriteThemes: [], eveningWarm: false, activePresetId: 'preset-classic', navMode: 'simple', onboarded: false, gamification: true, graceDay: false,
  reminders: { enabled: false, daily: true, time: '18:00', days: [1, 2, 3, 4, 5], quietStart: '22:00', quietEnd: '07:00', deadlines: true, flashcards: true },
  ai: { enabled: false, consented: false, provider: 'gemini', model: 'gemini-3.5-flash-lite', maxPerMinute: 8 },
  shareFields: { minutes: true, sessions: true, streak: true, badges: false, name: false }, dismissedRecs: {},
  avatar: { body: 'masc', style: 'chibi', skin: '#f0b98d', hair: 'short', hairColor: '#6b4226', top: 'tee-blue', bottom: 'jeans', shoes: 'sneak-white', hat: '', face: 'blush', back: '', held: '', bg: 'mint' },
  game: { tokens: 0, earnedDay: '', earnedToday: 0, best: {}, plays: {}, pet: { kind: 'cat', name: 'Mochi', fed: 0 }, questDay: '', questsDone: [], claimedQuests: [], lastSeenDay: '', freezeTokens: 0, seenBadges: [], buddy: 'cat' },
  buddy2: { enabled: true, kind: 'cat', names: {}, style: 'cheerful', intensity: 'gentle', messages: true, sound: false, outfit: {}, aiMode: false, coStudy: false },
  env: { id: 'minimal-desk', staticBackground: false, showBuddy: true },
  sound: { volume: 0.5, muted: false, mix: {}, sleepMinutes: 0, auto: 'off', breakSound: '' },
  forest: { mode: 'rich', placed: [] },
  habits: { minDailyMinutes: 20, studyDays: [1, 2, 3, 4, 5], restDays: [], weeklySessionsTarget: 10, graceDaysPerWeek: 1, breakActivities: true, focusLock: true, focusOpen: ['tasks', 'subjects', 'notes', 'flashcards', 'quizzes', 'study', 'coach', 'exam-rescue', 'buddy', 'themes', 'settings'], tabWarning: 'warn' },
  aiHub: { profiles: [], featureModels: {}, log: [] },
  journey: { visible: true },
  touch: { fx: 'critters', animal: 'cat', trail: true, haptics: true },
  cursor: { on: false, mode: 'image', arrow: 'classic', companion: 'cat', size: 'normal' },
})
