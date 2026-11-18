# StudyFlow

StudyFlow is a free, offline-first study app that runs in your browser. Plan tasks, focus with a Pomodoro timer beside a study buddy and your own avatar, review flashcards, take quizzes and keep notes. Earn points for real studying, spend them in the shop and track them in a wallet. No accounts, no ads. Your data stays on your device.

Created by [develofer2](https://github.com/develofer2). © 2026 develofer2. All rights reserved (see `LICENSE`).

## What it does
- **Focus:** Pomodoro timer with presets, scenes, sounds, a study buddy and your avatar studying beside you. Optional focus lock keeps you on the Focus page.
- **Plan:** subjects, tasks and a planner, exam countdowns and a revision plan (Exam Rescue).
- **Learn:** flashcards with spaced repetition, quizzes and exams, notes.
- **Progress:** analytics, streaks, achievements, a journey map and a weekly report.
- **Rewards:** points for finished sessions, tasks, quizzes and reviews; a shop (buddies, outfits, trees, scenes, timer skins, effects), an avatar wardrobe, a forest and a points wallet that works like a bank statement.
- **Make it yours:** 18 themes, custom cursors, touch effects, large or small shop view.
- **AI (optional):** bring your own key (Gemini, OpenAI, Anthropic or any OpenAI-compatible service) for notes, cards and quizzes from text or images. Off until you add a key.
- **Help:** a Help & Guide page, tips on every page, and Legal & policies.

## Privacy in one line
No accounts, ads or analytics. Data lives in your browser (IndexedDB and localStorage). Only AI actions you press send the chosen text to your provider. Export and delete are in Settings.

## Using it
1. Open the site and finish the short setup (name, theme, first subject).
2. Press **Focus** to start a session, or add a task first.
3. Finish sessions to earn points, then spend them in **Shop** or the avatar wardrobe.
4. Install it from your browser (Install app or Add to Home Screen) to use it offline.
5. Back up from **Settings** before clearing browser data.

## Tech
React 19, TypeScript, Vite, Tailwind CSS v4, IndexedDB (idb), Recharts, Zod, a service worker for offline use. Fonts: Fraunces, Nunito, JetBrains Mono.

## Run it
```
pnpm install
pnpm dev        # development server
pnpm test       # unit tests
pnpm typecheck
pnpm build      # production build in dist/
```

## Limits
No cloud sync, accounts or friends. AI answers can be wrong. Interface is English only.
