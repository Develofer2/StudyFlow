# StudyFlow — implementation plan (revised against PRD + SDD)

## Context
The repo is an empty Vite + React 19 + TS + Tailwind v4 scaffold (`src/App.tsx` is an empty div, `src/index.css` only imports Tailwind, no router/charts/icons/tests, no `guidelines/`). This is a greenfield build. Only the scaffold wiring (`main.tsx`, `vite.config.ts`, `.figma/make/*`) is kept. The PRD + SDD describe a large app. Plan: finish all of P0, the local-only parts of P1, and a minimal P2. Backend-dependent features (cloud sync, auth, friends, remote push, external AI) get a defined adapter interface and an honest "not configured" UI. Nothing is faked.

## Aesthetic stance (committed)
**Editorial on textured paper.** Warm cream ground, ink text, one confident accent per theme, hairline rules, asymmetric layouts, large serif numerals. Avoids the SaaS-admin look.
- Fonts (Google `@import` at top of `src/index.css`): **Fraunces** (display), **Nunito** (body), **JetBrains Mono** (timer digits, small labels).
- Default theme "Paper & Ink". The 18 themes are complete token sets in `themes.css`/registry (light/dark variants), applied via `data-theme` + CSS vars. Charts, dialogs, tooltips and focus rings all read the tokens.

## Design, responsiveness and new-user friendliness (added from feedback)
- **Progressive disclosure**: a new user sees only 4 nav items (Home, Focus, Study = flashcards/notes/quizzes, Progress). Tasks, Subjects, Achievements, Themes and Settings sit under "More" until used. A "Simple / Full" navigation toggle in Settings reveals everything. Pages have one primary action each. Advanced options (preset editing, recurrence, visualizer, custom colours) are tucked into collapsible "Customize" panels.
- **Onboarding**: 3 short skippable steps (goal and daily target, theme, optional first subject). A "Start a 25-minute focus" button is on Home from second one. Friendly, never shaming copy. Empty states say what to do next, with a single button.
- **Responsive by design**: mobile-first. Bottom bar (4 items + More sheet) under 768px, icon rail at tablet, full sidebar at 1024px+. Fluid type with `clamp`, 44px touch targets, safe-area insets, dialogs become bottom sheets on mobile, tables become stacked cards, charts get fewer ticks and a table fallback on small screens. Checked at 360, 390, 768, 1024, 1440px, plus landscape phone.
- **Eye-comfort themes**: the 18 themes are tuned to avoid pure white (#fff) and pure black (#000) grounds, with muted saturation and body-text contrast around 7:1 (never below AA 4.5:1). I will run a contrast check script across every theme token pair. There is a "Comfort" filter in the gallery (Warm/Low-blue-light, Dark, Light, High-contrast), an automatic evening warm-shift option, and motion/glow/gradient sliders default to low. The timer never flashes.
- **Student-friendly extras**: friendly microcopy, break suggestions, an "I only have 10 minutes" quick session, a gentle daily goal (no streak guilt), and keyboard shortcuts (Space = start/pause on Focus).

## AI features (Gemini, free tier) — safe design
**Key handling (important):** the key you pasted will NOT be written into source code, the repo, the bundle or the service worker. Anything in browser code is readable by every visitor, and the SDD forbids exposing private keys there. Plan: a **bring-your-own-key** field in Settings > AI. The key is stored only in this browser on this device (IndexedDB, excluded from export, sync and share cards) and sent only to Google's Gemini endpoint. You paste it once at runtime. Because it appeared in this chat, you should treat it as exposed and rotate it in Google AI Studio afterward. The adapter also accepts an optional proxy URL, so a Supabase Edge Function can hold the key server-side later (documented, not faked). The key format you gave doesn't look like a standard Gemini key (`AIza...`), so a "Test connection" button will validate it and show a plain error if Google rejects it.

**Adapter:** `services/ai/` implements the SDD `FlashcardGenerator` interface plus `AiProvider { generateJson(prompt, parts, schema) }`, with `GeminiProvider` calling the `generativelanguage.googleapis.com` REST API with structured JSON output. The model name is configurable (default a Flash / Flash-Lite tier model, which I'll confirm is current before wiring). All features still work without AI; the rule-based generator remains the default.

**Features (chosen to help studying and to be cheap):**
1. **Scan notes -> cards / quiz / summary**: upload a photo, screenshot, text file or a short PDF (Gemini reads images and PDFs directly, so no OCR library is needed). Images are downscaled client-side (~1600px, JPEG) to cut tokens; PDFs are capped (e.g. 10 MB / ~15 pages) with a clear message beyond that.
2. **Generate flashcards from notes** (AI draft). Every card is shown for review/edit, and nothing is saved without confirmation.
3. **Generate quiz from notes**: MCQ/true-false/short answer with an answer key and an explanation. The user must confirm each key before saving, so it is never graded as "verified" automatically. Labeled "AI-generated".
4. **Explain this simply** on a flashcard or note: a short explanation, an example, and a mnemonic. This is read-only and is not saved unless the student chooses to.
5. **Summarise notes** into bullet points, and **study-plan polish**: rewrite the deterministic revision plan into friendly text (the plan itself stays rule-based and editable).

**Free-tier discipline:** a client-side rate limiter (about 10 requests/min, configurable), a per-day soft counter shown in the UI, a content-hash cache in IDB so identical requests are never re-sent, input size caps, and one retry with backoff on 429/5xx. Friendly messages for quota exceeded ("AI is resting — try again in a minute; manual tools still work"), offline ("AI needs internet"), and invalid key. No automatic or background calls: AI only runs after a button click.

**Privacy:** a one-time consent dialog states exactly what is sent to Google (the selected text/image only), warns that free-tier content may be used by Google to improve products per their terms, and offers a per-feature "don't ask again". AI is off until the user adds a key and consents. Outputs are tagged `source: "ai"`, and notes are never sent unless the user clicks an AI action on them.

## Dependencies to add
`idb` (IndexedDB), `lucide-react` (icons), `recharts` (charts), `react-router` (hash router, lazy routes), `zod` (schema validation for records and imports), `date-fns` + `date-fns-tz` (timezone/week boundaries). Dev: `vitest`, `fake-indexeddb`, `@testing-library/react` + `jsdom`. I will skip Playwright unless a browser is available. Manual browser checks cover the rest.

## Architecture (layers per SDD §3; no empty placeholder modules)
```
src/
  app/            App.tsx (shell/providers), routes.tsx (lazy), layouts/ (sidebar, mobile bar + More sheet)
  components/     ui/ (Button, Dialog, Sheet, Tabs, Switch, Toast, Field, ConfirmDialog, EmptyState), timer/, charts/, navigation/
  features/       dashboard, focus, subjects, tasks (+planner/kanban/calendar), notes, flashcards, quizzes (+exams), analytics, achievements, themes, settings (+reminders, data, sync status), social (share cards), onboarding
  domain/         PURE, tested: timer/, study-sessions/, spaced-repetition/, quizzes/, analytics/ (ranges, streaks, focus-time, weekly report), achievements/, recommendations/, scheduling/ (revision plan), flashcard-generation/, validation/ (zod schemas)
  data/           indexeddb/ (db.ts, versioned migrations), repositories/ (interfaces + IDB implementations), sync/ (SyncQueue, status model, CloudAdapter interface + NullCloudAdapter => "backend not configured")
  services/       export/, import/ (validated, preview, merge/replace), offline/ (online status, SW registration), notifications/ (permission only after user action; in-app reminder scheduler), sharing/ (canvas share card, Web Share), audio/
  hooks/ utils/ types/ tests/ styles/ (tokens.css, themes.css, globals.css)
public/ manifest.webmanifest, service-worker.js, icons/ (generated SVG + PNG icons that actually exist)
```
Rules: UI never touches IDB directly; all writes go through repositories (validate -> transaction -> enqueue sync op only if cloud enabled). Entities have UUID `id`, ISO UTC `createdAt/updatedAt`, optional `revision`/`deletedAt`. Types follow SDD §5 exactly (UserProfile, Subject, StudyTask, FocusPreset, StudySession, StudyNote, FlashcardDeck/Flashcard, StudyQuiz/QuizQuestion/QuizAttempt, StudyGoal, AchievementRecord, preferences). Stores per SDD §6 with indexes (subjectId, deckId, dueAt, startedAt, status, updatedAt). Small UI prefs (theme id, appearance mode) are mirrored to localStorage so the theme applies before first paint. Large data and notes stay in IDB only.

Storage errors (quota, unavailable IDB) go through one error-mapping helper and surface as toasts with a next action. A failed write is never dropped silently.

## Key engines
- **Timer** (`domain/timer` + a small external store): deadline-based (`endsAt`, `pausedRemainingMs`, `accumulatedFocusMs`), `useSyncExternalStore` so only the clock component re-renders. Active timer state persisted to IDB so reload restores it. Visibility/focus handler recomputes, with an idempotent transition guard (completion applied once by session id). Paused time is excluded; cancelled and interrupted sessions are stored with status and never count as completed. Inclusion policy (documented in UI help): interrupted sessions count their `actualFocusSeconds` toward focus time but not toward "completed sessions". Sanity cap on elapsed time for clock jumps.
- **SRS**: SM-2-style, bounded ease (1.3–3.0), interval cap, lapse handling, manual review of non-due cards. Documented in the module header and in the UI.
- **Stats**: pure functions over records with timezone and week-start aware ranges, a zero-filled day series, previous comparable period (or "unavailable"), streak with an optional deterministic grace day, and a task completion rate.
- **Recommendations**: rule list returning `{reason, trigger, action, snoozeable}`.
- **Quiz**: answer-key required; conservative short-answer normalization plus configured accepted answers; attempts stored independently of quiz edits.
- **Card generator**: deterministic patterns ("X is defined as Y", "consists of", "purpose of", "used for", `Term: definition`); user reviews and edits drafts before saving; explains when nothing is found.

## Build phases (SDD §24 order)
1. **Foundation**: fonts/tokens/18 themes + appearance prefs engine, IDB + migrations + repositories, shared UI kit, shell/nav/routes, SW + manifest, sync-status badge (default "Local only"; never "Synced" without a real remote success), settings skeleton, onboarding (skippable) + dashboard with empty-state checklist and an explicitly labelled removable demo workspace (demo records tagged `isDemo` so removal never touches real data).
2. **Core study**: Focus (presets CRUD + validation, circular/minimal/bar visuals, session-cycle dots, intention/reflection, fullscreen, break suggestions, aria-live status, reduced-motion fallback, optional alert sound/notification), subjects (archive/reassign on delete), tasks (subtasks, priority icon+label, list/Today/Upcoming/Overdue/Completed/Kanban/month+week calendar, start Pomodoro from task, actual vs estimated), notes (folders, tags, favorites, search, safe markdown-ish editor with sanitized rendering, autosave indicator, undo).
3. **Learning**: flashcards (decks/cards CRUD, flip/reveal, Again/Hard/Good/Easy, due/starred/missed/shuffle/quick, generator review flow), quizzes (builder, practice/timed/random/exam sim, results and missed-question review), exams (countdown, coverage checklist, editable revision plan that asks for available study time if unset).
4. **Analytics + motivation**: Recharts components (focus bar, weekly trend, subject split, completion trends, flashcard progress, quiz scores, consistency heatmap, goal progress), each with a text summary/table alternative, range and subject filters, empty states; weekly report with print + JSON/CSV export; XP/levels/12 badges with visible conditions (earned records persisted, not recomputed away), personal challenges, opt-in gamification.
5. **Design + offline polish**: all 18 themes verified for contrast, visualizer options, reduced-motion, responsive pass (375px/768px/1280px), SW with versioned caches (cache-first for hashed assets, navigation fallback to shell), offline indicator + retry, export/import (versioned JSON, zod-validated, preview, merge/replace, summary), clear-data with confirmation.
6. **Cloud/reminders**: `CloudAdapter` + `SyncQueue` + conflict record model implemented locally and unit-tested (idempotent ops, retry/backoff, conflict preservation of both versions); UI shows "Backend not configured" with exact setup steps (Supabase tables, RLS policy outline, env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, VAPID public key; private keys server-only). I will not invent credentials or claim sync works. In-app reminders work; browser notification permission is requested only after the user enables reminders, with support detection and iOS/PWA caveats.
7. **Social + QA**: local share-card generator (field toggles, preview, Web Share / PNG download / copy text); friends and challenges screens in setup-required state; final security/a11y/perf checks.

## Testing and verification
- **Vitest unit tests** (domain + data): timer transitions/duplicate-completion/expired-on-return, focus-time and interrupted policy, week/timezone boundaries, streak and grace day, empty-data and no-previous-period cases, SRS, quiz scoring/short answers, card generator, recommendations, zod validation, repository CRUD + migration (fake-indexeddb), export/import with malformed/duplicate/older-version/oversized input, sync queue retry and idempotency, conflict preservation. A few integration tests (complete session -> stats update; review card -> due date changes).
- `pnpm build` plus `pnpm preview`; check the production SW registers and the shell reloads offline, and that edits made offline persist after reload.
- Manual browser pass at ~375px and ~1280px for horizontal overflow, keyboard traversal, focus visibility, reduced motion, and theme persistence after reload. I will record only tests I actually ran. Anything I can't run (real iOS Safari/Android Chrome, Firefox) is reported as untested.

## Final report (SDD §1 / PRD §25)
Summary of implemented features, actual stack, storage strategy (IDB + localStorage prefs), offline details, cloud setup instructions, push setup instructions, env vars (none required for local use), known limitations (no PDF/DOCX/OCR import — txt/md/paste/JSON only; no real sync/friends/push without a backend), tests performed and outcomes, and remaining tasks in priority order. Features are labelled completed, partial, or unconfigured.

---
# Addendum (round 3): any-provider AI, Pomodoro companions/scenes, AI Study Notes

## Context
Gemini-only AI is limiting (new keys 404, free tier is tight). The user wants to bring any provider's key (GPT, Claude, others), a richer and more playful Pomodoro (a study buddy, a growing tree, more timer themes/designs), and a bigger AI that reads an image or file and produces a text study note from a form (title, purpose, subject, details), not a file output.

## 1. Multi-provider AI (`src/services/ai/`)
Honest limit: there is no universal key. Each provider uses a different endpoint and auth, so the app supports a provider list with adapters, not "any key".
- `providers.ts`: `AiProvider { id, label, defaultModel, keyHint, vision, pdf }` for **Gemini**, **OpenAI**, **Anthropic (Claude)**, and **OpenAI-compatible (custom base URL + model)**, which covers OpenRouter, Groq, Together, DeepSeek, Mistral, Ollama and others.
- Refactor `generateJson` in `gemini.ts` into `client.ts`: keeps rate limiter, daily counter, hash cache (key includes provider+model), retry, offline/quota errors. A per-provider `call()`:
  - Gemini: current code (structured schema).
  - OpenAI / compatible: `POST {base}/chat/completions`, `response_format: json_object` (JSON schema described in the prompt, always validated with zod), images as `image_url` data URLs. PDFs: Gemini and Claude read natively; OpenAI/compatible get "paste text or image" guidance.
  - Anthropic: `POST api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version`, and `anthropic-dangerous-direct-browser-access: true`; images and PDFs as base64 content blocks.
- Prefs: `ai.provider`, `ai.model` per provider, `ai.baseUrl` (compatible only). Key still lives only in IndexedDB (one key per provider id: `ai-key:<provider>`), never in prefs/export/share. Migrate existing `ai-key` to the Gemini slot.
- Settings > AI: provider picker, key field, model field with provider default, Test connection, capability badges ("reads images", "reads PDFs"), 404/401 messages per provider. Keep the Gemini model fallback.
- Caveats shown in the UI: browser-direct calls expose the key to this device only; some providers block browser CORS (the Test button will say so and suggest the proxy URL option, kept).

## 2. Pomodoro companions and scenes (`src/features/focus/`)
Replace the `ring|minimal|bar` timer style with `prefs.scene` (keep the three as "Classic" options under it). New scenes, all SVG/CSS, theme-token coloured, no assets:
- **Grow a tree**: seed -> sprout -> sapling -> full tree as focus progress rises; leaves/fruit by completed sessions; stopping early shows a wilting (not shaming) state.
- **Study buddy**: a small character (cat, owl, robot, plant) at a desk that studies alongside: idle -> reading while running -> stretching on break -> cheers on completion. Short encouraging bubble text from fixed copy (not AI).
- **Forest / Garden**: each finished session plants a tree in a persistent forest (derived from `sessions`, no new store); view it on Focus and Progress.
- **Night sky / Sunrise / Rain window / Aquarium**: ambient progress scenes (stars appear, sun rises, etc.).
- `scene` Segmented + preview gallery in the "Customize" panel; reduced-motion = static frames with progress still shown; every scene keeps a visible time readout and `role="img"` label.
- New `src/features/focus/scenes/*.tsx` + `Scene.tsx` dispatcher used by `Display.tsx`. Types: extend `Prefs`, `defaultPrefs`, `mergePrefs` fallback.

## 3. AI Study Notes (form -> text note)
New `src/features/ai/StudyNoteMaker.tsx`, opened from Notes ("Make a note with AI") and Study hub.
- Form: title, subject (select), purpose (Learn / Revise for exam / Summarise a reading / Homework help), detail level (brief/standard/deep), length, language, extra instructions, optional tags/folder; source = upload image(s)/PDF/text file or pasted text (multiple files allowed, size caps already in `fileToPart`).
- Output is **text only**, saved as a normal `StudyNote` (markdown: headings, key points, glossary, examples, "check yourself" questions) with `source: ai` tag. Preview/edit before saving; nothing saves without confirmation. No file export of AI output.
- New `aiStudyNote` in the client with zod schema `{ title, sections[], keyTerms[], questions[] }`, rendered to markdown locally. Follow-up buttons: make flashcards / quiz from this note (reuse `aiCards`/`aiQuiz`).
- Extra helpers (cheap, click-only): "Explain simply" on selection, "Quiz me on this note", "Study plan for exam from notes" (extends `aiPlanText`). Existing consent dialog and usage counter are reused; `Prefs.ai.consented` shows the selected provider's name in the consent text.

## Critical files
`src/services/ai/gemini.ts` (split into client/providers), `src/data/store.ts` (`getAiKey/setAiKey` per provider), `src/types/index.ts`, `src/data/defaults.ts`, `src/features/settings/AiTab.tsx`, `src/features/ai/AiPanel.tsx`, `src/features/Notes.tsx`, `src/features/focus/Display.tsx`, `src/features/Focus.tsx`, `src/features/Themes.tsx` (timer style control), `src/features/focus/PresetPanel.tsx`.

## Verification
- Unit tests: provider request builders (headers/body per provider, no key in URL or logs), response parsers, key migration, JSON validation failure paths, note-to-markdown renderer, scene progress mapping (0%/50%/100%, paused, reduced motion).
- Build + `tsc`; headless browser run at 390 and 1280px: each scene renders without overflow, the timer still counts and survives reload; form validation and note save work.
- AI calls cannot be verified without a working key per provider; report them as untested unless the user tests, and say which providers were checked.

## 4. Feedback addendum: games, pixel themes, richer achievements and comeback loops
Principle: rewards follow real study (focus minutes, reviews, tasks). No pay-to-play, no guilt, no dark patterns; all optional via `prefs.gamification`.

**Study Arcade (`src/features/Arcade.tsx`, new nav item under Progress/More).** Games are earned with focus time ("Play tokens": 1 token per completed focus session, capped daily, stored in prefs/kv) and are short (1-3 min) break activities. All offline, keyboard + touch, reduced-motion safe, no sound by default:
- **Memory Match** using the user's own flashcards (term/definition pairs; falls back to built-in pairs). Productive: counts as a review nudge, no SRS changes.
- **Word Scramble / Hangman** from deck terms.
- **Pixel Garden / Study Pet**: persistent pet or garden that grows from real focus minutes; feeding costs tokens; it never dies, it only "naps" when you're away.
- **Quick Math Sprint** (60s, difficulty select) and **Typing Sprint** (type your own note sentences).
- Scores/high scores and plays stored locally; game logic in pure `src/domain/games/*.ts` with unit tests.

**Pixel themes.** Add ~5 pixel-art styles as a "Style" axis on top of colour themes: crisp `image-rendering: pixelated` SVG/CSS sprites, `Press Start 2P`/`VT323` for headings only (body stays readable), stepped borders and hard shadows, optional scanline-free (eye-friendly). Pixel scenes for the timer too (pixel tree, pixel cat buddy, pixel campfire, pixel night sky). Names: Pixel Meadow, Pixel Night, Pixel Candy, Pixel Terminal (muted green), Pixel Sunset. Contrast test extended to cover them.

**Achievements expansion (`domain/achievements.ts`).** From 12 to ~40 badges in categories (Focus, Consistency, Cards, Quizzes, Tasks, Explorer, Secret/fun), tiers (bronze/silver/gold), visible progress bars toward the next badge, "newly earned" celebration dialog with a gentle confetti (off with reduced motion), rarity labels, XP -> levels with titles ("Curious Cub" ... "Scholar"), unlockable rewards (avatars/buddies, pixel themes, timer scenes, arcade games) so progress gives something to look forward to. Daily quests (3 small, achievable, derived from stats), weekly challenges, a "comeback" welcome (warm message after absence, streak freeze/grace day token earned by activity, never a shame message), and an optional weekly wrap card. All earned records persist in `achievements`; unlock rules are pure and tested.

**Order of build:** 1) provider layer + AI Study Notes, 2) timer scenes (tree, buddy, forest, ambient) + pixel scenes, 3) pixel themes, 4) achievements v2 + quests + rewards, 5) Arcade games, 6) tests, build, headless checks at 390/1280px.

Extra verification: game logic unit tests (match pairing, scramble validity, scoring, token earning cap), badge unlock/progress tests, pixel theme contrast, no horizontal overflow on Arcade at 360px.

---
# Addendum: Focus lock (stop switching pages and warn on browser-tab switches)

## Context
User wants to stop the student switching away during a focus session. Chosen: both app navigation lock and browser-tab-switch warning. A web page cannot block browser tabs, only detect and warn. The lock must never trap anyone: there is always a one-tap escape, and it applies only to a running or paused **focus** phase (never breaks or idle).

## Changes
1. **Prefs** (`src/types/index.ts` `HabitPrefs`, `src/data/defaults.ts`, `mergePrefs` already merges `habits`): add `focusLock: boolean` (default true) and `tabWarning: 'off' | 'warn' | 'pause'` (default 'warn'). Toggles go in Settings > Habits tab, and a small lock toggle on Focus.
2. **Navigation lock** (`src/app/Shell.tsx`, `src/app/router.ts`):
   - `locked = prefs.habits.focusLock && timer.phase==='focus' && status !== 'idle'` (via `useTimerSnapshot`).
   - Sidebar `Item`, mobile bottom bar, More sheet, logo and StatusChip buttons: `disabled` + `aria-disabled`, dimmed, with a "Locked during focus" hint. The Focus item stays active.
   - Route guard in router: when locked, reject `hashchange` to other paths by restoring `#/focus` (covers back button and typed URLs). Add `go()` check too.
   - A slim banner on Focus: "Focus lock is on. Pause or stop to leave", with an "Unlock for this session" button. Pausing or stopping the timer releases the lock automatically.
   - `beforeunload` prompt while locked, so reload or close asks for confirmation.
3. **Browser-tab warning** (new `src/hooks/useTabGuard.ts`, used in `Focus.tsx` or `Shell.tsx`; existing `visibilitychange` handlers in `timerService.ts:72` and `Focus.tsx:25` are untouched):
   - On `document.hidden` during running focus, record the leave time. On return, if away more than about 5s, show a gentle toast/dialog: "You were away 1m 20s. Welcome back" and count `distractions` for the session.
   - 'pause' mode pauses the timer on leave (reuse the timer service pause) and offers Resume on return. 'off' disables it.
   - Optionally flip `document.title` to "Come back to focus" while hidden (a true cross-tab nudge, no permission needed). Restore on return.
   - Tone: never shaming, no streak penalty.
4. **Buddy**: when the user returns, the buddy shows the existing `returning` state with a line from `domain/buddyMessages.ts`.
5. **Tests** (`src/tests`): pure helper `isLocked(prefs, snapshot)` and `awayMessage(ms)`, covering focus/break/idle/paused and the pref off. Route-guard test with jsdom hashchange.

## Verification
- `pnpm exec tsc --noEmit` and `vitest run`.
- Browser: start a focus session, confirm every nav entry is disabled on desktop and mobile widths, back button stays on Focus, Pause or Stop unlocks, the break phase is unlocked, the setting off disables it, and switching browser tabs shows the away message with the correct duration. Report anything not checked in a real browser as untested.

## Feedback additions to the focus-lock plan

### A. Motivational quotes from the buddy during focus
- New `src/domain/buddyQuotes.ts`: about 40 short original, rule-based encouragements (no real-person attributions, so nothing is misquoted), written in all four existing styles (cheerful/calm/playful/minimal) and filtered to be non-pressuring (never "push through when tired").
- `useBuddy.ts` (the `seed` already buckets elapsed time into 6-minute slots via `elapsedBucket`): during `focusing`, every bucket swaps the line to a quote via `pickQuote(style, seed)`, so a new one appears every few minutes without a timer of its own. Other states keep `pickMessage`.
- Shown in the Focus message row as "{buddyName}: {quote}", which satisfies the "from (who the buddy is)" request. A `Quote` label replaces "Built-in, rule-based". The bubble crossfades (respects reduced motion) and is `aria-live="polite"`, with updates limited to once per bucket so screen readers are not spammed.
- Setting in Buddy > Personalise: "Motivational quotes" switch (`buddy2.quotes`, default true) plus Frequency (Often 3 min / Normal 6 min / Rare 12 min), wired into the bucket size. Types, defaults and `mergePrefs` gain the new fields.
- Tests: `pickQuote` is deterministic per seed, covers every style, has no duplicates and stays under a length cap.

### B. Fix buttons that need scrolling, keep it looking good
Problem: on the Focus page the preset chips, scene, message, timer, cycle dots, Start/Pause/Stop buttons and the hint stack vertically, so the controls fall below the fold, especially on phones. The buddy and quote add more height.
- Phones: make the control row a **sticky bottom action bar** (above the mobile nav, with safe-area padding) holding Start/Pause, Stop and Discard as icon+label buttons. The Space-hint is dropped on touch. The scene gets a capped height (about 28dvh) so the timer and clock fit on a 360x640 screen without scrolling.
- Desktop/tablet (md+): a **two-column Focus card**: scene + buddy message on the left, timer + controls on the right, so everything shows at 768px+ with no scroll.
- Preset chips become one horizontally scrollable pill row (snap, no wrapping) or a compact dropdown on narrow screens. The fullscreen layout is kept.
- Secondary controls (Discard, Co-study, intention) move into a "More" overflow popover, leaving only primary actions in view.
- Use `dvh` units, check at 360x640, 390x844, 768x1024 and 1280x720 landscape, and keep the existing visual language.
- Files: `src/features/Focus.tsx` (layout), `focus/Stage.tsx`, `focus/Display.tsx` (smaller clock sizing via clamp), `src/index.css` (sticky bar helper).

### Verification additions
- Browser at the four sizes above: Start/Pause/Stop are visible without scrolling in the idle, running and break states. A quote changes at the chosen frequency (shorten the bucket in dev to check), and the setting off falls back to normal lines.
