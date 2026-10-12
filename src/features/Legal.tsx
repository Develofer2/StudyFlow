import { useEffect, useState, type ReactNode } from 'react'
import { Copyright, ExternalLink } from 'lucide-react'
import { Card, PageHeader, cx } from '@/components/ui'
import { go } from '@/app/router'
import { APP, AUTHOR, AUTHOR_URL, COPYRIGHT, UPDATED } from '@/domain/legal'

type Tab = 'privacy' | 'terms' | 'data' | 'ai' | 'copyright' | 'credits' | 'access'
const TABS: [Tab, string][] = [['privacy', 'Privacy'], ['terms', 'Terms of use'], ['data', 'Data & storage'], ['ai', 'AI & third parties'], ['copyright', 'Copyright'], ['credits', 'Credits'], ['access', 'Accessibility & safety']]

const H = ({ children }: { children: ReactNode }) => <h3 className="mt-4 font-display text-lg font-semibold first:mt-0">{children}</h3>
const P = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-relaxed">{children}</p>
const L = ({ items }: { items: ReactNode[] }) => <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
const Ext = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-brand underline underline-offset-2">{children}<ExternalLink size={13} aria-hidden /></a>

const LIBS: [string, string][] = [['React and React DOM', 'MIT'], ['Vite and @vitejs/plugin-react', 'MIT'], ['Tailwind CSS', 'MIT'], ['TypeScript', 'Apache-2.0'], ['idb', 'ISC'], ['date-fns', 'MIT'], ['zod', 'MIT'], ['Recharts', 'MIT'], ['Lucide icons', 'ISC (some icons MIT)'], ['Vitest, jsdom, fake-indexeddb (development only)', 'MIT']]
const FONTS: [string, string][] = [['Fraunces (headings)', 'SIL Open Font License 1.1'], ['Nunito (text)', 'SIL Open Font License 1.1'], ['JetBrains Mono (numbers)', 'SIL Open Font License 1.1']]

function Body({ tab }: { tab: Tab }) {
  if (tab === 'privacy') return <div className="space-y-2">
    <H>The short version</H>
    <P>{APP} has no accounts, no ads, no analytics and no tracking. The things you create stay on your device. The author does not receive your tasks, notes, flashcards, points or study history.</P>
    <H>What is stored, and where</H>
    <L items={['Your study data (tasks, subjects, notes, flashcards, quizzes, sessions, points, items, settings) is stored in your browser on this device (IndexedDB and localStorage).', 'Nothing is uploaded unless you choose to: for example by pressing an AI button, using Share, or exporting a file yourself.', 'AI keys you type in are stored only on this device and are left out of exports, backups and share cards.']} />
    <H>What leaves your device</H>
    <L items={['Fonts: the page asks Google Fonts for its typefaces when you are online, so Google can see your IP address and browser details as with any website. After the first load the fonts are cached for offline use.', 'AI actions: only when you press an AI button, the text or image you selected is sent to the AI provider you set up (see "AI & third parties").', 'Hosting: whoever hosts the site may keep ordinary server logs (such as IP address and time). That is outside the app.']} />
    <H>Children and students</H>
    <P>{APP} is made for students of all ages. It collects no personal data, so there is nothing to sign up for. If you are under 13 (or the age set by your country), please ask a parent, guardian or teacher before turning on any AI feature, because that sends your text to a third-party company.</P>
    <H>Your choices and rights</H>
    <L items={['Export a backup, or delete everything, from Settings. Deleting is permanent.', 'Clearing your browser data also deletes your {APP} data. Export first.'.replace('{APP}', APP), 'Because the author holds none of your data, there is nothing to request from the author. Anything you sent to an AI provider is covered by that provider’s own policy.']} />
    <H>Changes</H>
    <P>If this policy changes, the date below changes. Last updated: {UPDATED}.</P>
  </div>
  if (tab === 'terms') return <div className="space-y-2">
    <H>Using {APP}</H>
    <P>By using {APP} you agree to these terms. If you do not agree, please do not use it.</P>
    <L items={['{APP} is a study helper. It is not a school, a tutor, or professional advice.'.replace('{APP}', APP), 'You are responsible for what you enter and for keeping backups. Data lives only in your browser and can be lost if you clear it.', 'Do not use the app to break the law, harm others, or try to attack or disrupt it or any service it connects to.', 'Only add content you have the right to use. Do not paste other people’s private information into AI features.', 'Points, badges, buddies and items are fun progress markers inside the app. They have no money value, cannot be bought with money, sold or transferred, and may change when the app is updated.']} />
    <H>Study results</H>
    <P>Timers, plans, quizzes, spaced repetition and AI answers are aids. They can be wrong. Check important facts against your textbook or teacher, and do not rely on the app alone for exams or deadlines.</P>
    <H>No warranty and limit of liability</H>
    <P>The app is provided “as is” and “as available”, without warranties of any kind. To the extent the law allows, the author is not liable for lost data, missed deadlines, exam results, or any indirect or consequential loss from using the app. Nothing here limits rights you have by law that cannot be limited.</P>
    <H>Changes and ending</H>
    <P>The app and these terms may be updated. You can stop using the app at any time and delete your data from Settings.</P>
    <H>Contact</H>
    <P>Questions about these terms: open an issue or message the author on GitHub: <Ext href={AUTHOR_URL}>github.com/{AUTHOR}</Ext>. Last updated: {UPDATED}.</P>
  </div>
  if (tab === 'data') return <div className="space-y-2">
    <H>Storage and cookies</H>
    <L items={['No cookies are set by the app and there is no advertising or analytics storage.', 'IndexedDB holds your records. localStorage holds small preferences such as theme, view choices and dismissed tips.', 'A service worker and cache store the app files so it works offline.']} />
    <H>Retention</H>
    <P>Data stays until you delete it in Settings, clear your browser’s site data, or uninstall the app. There is no server copy to recover from.</P>
    <H>Backups and moving devices</H>
    <P>Use Export in Settings to save a file, and Import on another device. Export files contain your study data, so keep them private. They never include AI keys.</P>
    <H>Notifications</H>
    <P>Reminders are shown inside the app. Browser notifications are only asked for after you turn reminders on, and you can refuse or switch them off in your browser.</P>
    <H>Shared devices</H>
    <P>Anyone who can open this browser profile can see your data. Use your own profile on shared computers, and avoid private or incognito windows if you want to keep your work.</P>
  </div>
  if (tab === 'ai') return <div className="space-y-2">
    <H>Bring your own key</H>
    <P>AI features are off until you add a key from a provider you choose (such as Google Gemini, OpenAI, Anthropic or an OpenAI-compatible service) in Settings, AI. The key is yours: you are responsible for it, its cost and its limits. The author does not provide, see or store keys.</P>
    <H>What is sent</H>
    <L items={['Only when you press an AI button, and only the text, image or file you chose, plus your instruction, goes directly from your browser to that provider.', 'Providers handle it under their own terms and privacy policies. Free tiers can use content to improve products, so do not send anything private or sensitive.', 'You are asked to confirm before the first use, and you can remove your key at any time.']} />
    <H>AI output</H>
    <P>AI answers can be wrong, incomplete or biased. They are labelled and saved only when you confirm. Check them before you rely on them.</P>
    <H>Other third parties</H>
    <P>Google Fonts supplies typefaces (see Privacy). Share buttons use your device’s own share sheet, and what you share is chosen by you.</P>
  </div>
  if (tab === 'copyright') return <div className="space-y-3">
    <div className="flex items-center gap-3 rounded-card bg-surface2 p-4"><Copyright size={28} className="shrink-0 text-brand" aria-hidden /><div><p className="font-display text-xl font-semibold">{COPYRIGHT}</p><p className="text-sm text-muted">Created by <Ext href={AUTHOR_URL}>{AUTHOR} on GitHub</Ext></p></div></div>
    <P>{APP}, including its design, source code, logo, buddies, avatar parts, scenes, cursors, icons and written text, is owned by {AUTHOR}. You may use the app for your own studying. You may not copy, republish, resell or build a competing product from it without written permission. A copy of this notice is in the LICENSE file of the project.</P>
    <H>Your content</H>
    <P>Notes, cards, tasks and other things you write stay yours. The author claims no rights over them and never receives them.</P>
    <H>Trademarks</H>
    <P>Names such as Google, Gemini, OpenAI, Anthropic and GitHub belong to their owners and are used only to describe what the app connects to. {APP} is not affiliated with or endorsed by them.</P>
    <H>Reporting a problem</H>
    <P>If you believe something in the app infringes your rights, tell the author through <Ext href={AUTHOR_URL}>GitHub</Ext> with what, where and why, and it will be looked at promptly.</P>
  </div>
  if (tab === 'credits') return <div className="space-y-3">
    <P>{APP} is built on open-source software. Each item below keeps its own licence and copyright, and thanks go to their creators.</P>
    <H>Libraries</H>
    <ul className="divide-y divide-[var(--border)] rounded-card border hairline">{LIBS.map(([n, l]) => <li key={n} className="flex justify-between gap-3 px-3 py-2 text-[15px]"><span>{n}</span><span className="shrink-0 text-muted">{l}</span></li>)}</ul>
    <H>Fonts</H>
    <ul className="divide-y divide-[var(--border)] rounded-card border hairline">{FONTS.map(([n, l]) => <li key={n} className="flex justify-between gap-3 px-3 py-2 text-[15px]"><span>{n}</span><span className="shrink-0 text-muted">{l}</span></li>)}</ul>
    <H>Artwork</H>
    <P>The logo, buddies, avatar parts, forest, scenes, cursors and effects are original drawings made for {APP}. No outside images are used.</P>
  </div>
  return <div className="space-y-2">
    <H>Accessibility</H>
    <L items={['Works with keyboard, screen readers and touch, with visible focus, 44px touch targets and labelled controls.', 'Respects the “reduce motion” setting, and has a motion switch and low-glare themes in Themes.', 'If something is hard to use, tell the author on GitHub and it will be improved.']} />
    <H>Health and wellbeing</H>
    <L items={['Take real breaks. Rest, water and sleep help learning more than extra hours.', 'Points and streaks are meant to be encouraging. Skipping a day is fine and never punished.', 'The app has no flashing content. If any effect bothers you, turn effects and motion off.', 'If studying is causing you serious stress, please talk to a teacher, a parent or a counsellor. The app cannot give medical or mental-health advice.']} />
    <H>Safety online</H>
    <L items={['Never share passwords or API keys with anyone. Keep your AI key private and rotate it if it was ever exposed.', 'Share cards only include what you tick.']} />
  </div>
}

export default function Legal() {
  const [tab, setTab] = useState<Tab>(() => { const h = new URLSearchParams(location.hash.split('?')[1] ?? '').get('tab') as Tab | null; return h && TABS.some(t => t[0] === h) ? h : 'privacy' })
  useEffect(() => { const f = () => { const h = new URLSearchParams(location.hash.split('?')[1] ?? '').get('tab') as Tab | null; if (h && TABS.some(t => t[0] === h)) setTab(h) }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f) }, [])
  return <div className="space-y-5">
    <PageHeader title="Legal & policies" sub={`${COPYRIGHT} Last updated ${UPDATED}.`} action={<button onClick={() => go('guide')} className="min-h-11 rounded-full border hairline bg-surface2 px-4 text-sm font-bold">Help & Guide</button>} />
    <div role="tablist" aria-label="Legal sections" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">{TABS.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cx('min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition', tab === id ? 'border-brand bg-brand text-brand-fg' : 'hairline bg-surface text-muted')}>{l}</button>)}</div>
    <Card><Body tab={tab} /></Card>
    <p className="text-sm text-muted">This page explains how the app works in plain words. It is not legal advice. Local laws may give you extra rights.</p>
  </div>
}
