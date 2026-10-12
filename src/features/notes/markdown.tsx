import type { ReactNode } from 'react'

// Builds React elements instead of an HTML string, so all text is escaped by React and no raw HTML can ever be injected.
const safeUrl = (u: string) => /^(https?:\/\/|mailto:)/i.test(u)
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s][^*\n]*\*)|(\[[^\]\n]+\]\([^)\s]+\))/g

function inline(s: string, k = 'i'): ReactNode[] {
  const out: ReactNode[] = []; let last = 0, m: RegExpExecArray | null, n = 0
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0], key = `${k}${n++}`
    if (m[1]) out.push(<code key={key} className="rounded bg-surface2 px-1 font-mono text-[.9em]">{t.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={key}>{inline(t.slice(2, -2), key)}</strong>)
    else if (m[3]) out.push(<em key={key}>{inline(t.slice(1, -1), key)}</em>)
    else { const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!; out.push(safeUrl(lm[2]) ? <a key={key} href={lm[2]} target="_blank" rel="noopener noreferrer nofollow">{lm[1]}</a> : lm[0]) }
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

const UL = /^\s*[-*+]\s+(.*)$/, OL = /^\s*\d+[.)]\s+(.*)$/, H = /^(#{1,3})\s+(.*)$/
export function renderMarkdown(src: string): ReactNode[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n'); const out: ReactNode[] = []; let i = 0
  const blockStart = (l: string) => H.test(l) || UL.test(l) || OL.test(l) || /^```/.test(l) || /^>\s?/.test(l) || /^---+$/.test(l.trim())
  while (i < lines.length) {
    const l = lines[i], key = 'b' + i
    if (!l.trim()) { i++; continue }
    if (/^```/.test(l)) { const code: string[] = []; i++; while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]); i++
      out.push(<pre key={key} className="my-2 overflow-x-auto rounded-card bg-surface2 p-3 font-mono text-sm"><code>{code.join('\n')}</code></pre>); continue }
    let m
    if ((m = l.match(H))) { const lv = m[1].length; out.push(lv === 1 ? <h1 key={key}>{inline(m[2])}</h1> : lv === 2 ? <h2 key={key}>{inline(m[2])}</h2> : <h3 key={key} className="mb-1 mt-3 font-bold">{inline(m[2])}</h3>); i++; continue }
    if (/^---+$/.test(l.trim())) { out.push(<hr key={key} className="my-3 border-line" />); i++; continue }
    if (/^>\s?/.test(l)) { const q: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''))
      out.push(<blockquote key={key} className="my-2 border-l-4 border-line pl-3 text-muted">{inline(q.join(' '))}</blockquote>); continue }
    if (UL.test(l) || OL.test(l)) {
      const ordered = OL.test(l) && !UL.test(l); const re = ordered ? OL : UL; const items: ReactNode[] = []
      while (i < lines.length && re.test(lines[i])) {
        const txt = lines[i].match(re)![1], t = txt.match(/^\[( |x|X)\]\s+(.*)$/)
        items.push(t ? <li key={i} className="task flex items-start gap-2"><input type="checkbox" disabled checked={t[1] !== ' '} aria-label={t[1] !== ' ' ? 'Done' : 'Not done'} className="mt-1.5 h-4 w-4 accent-[var(--primary)]" /><span>{inline(t[2])}</span></li> : <li key={i}>{inline(txt)}</li>); i++
      }
      out.push(ordered ? <ol key={key} className="my-2 list-decimal pl-5">{items}</ol> : <ul key={key}>{items}</ul>); continue
    }
    const p: string[] = []
    while (i < lines.length && lines[i].trim() && !(p.length && blockStart(lines[i]))) p.push(lines[i++])
    out.push(<p key={key}>{p.flatMap((x, j) => (j ? [<br key={'br' + j} />, ...inline(x, `p${j}`)] : inline(x, 'p0')))}</p>)
  }
  return out
}
