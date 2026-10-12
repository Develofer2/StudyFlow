import { useEffect, useRef, useState } from 'react'
import { Cloud, Download, FileSpreadsheet, HardDrive, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { clearAllData, getAll, putMany, useCollection } from '@/data/store'
import { BUILT_IN_PRESETS } from '@/data/defaults'
import { Button, ConfirmDialog, Dialog, Field, Input, useToast } from '@/components/ui'
import { applyMerge, applyReplace, buildExport, download, parseImport, toCsv, type ImportPreview } from '@/services/dataio'
import { Section } from './common'

const mb = (n: number) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`)
const stamp = () => new Date().toISOString().slice(0, 10)

export default function DataTab() {
  const toast = useToast(), file = useRef<HTMLInputElement>(null)
  const sessions = useCollection('sessions'), tasks = useCollection('tasks')
  const [pv, setPv] = useState<ImportPreview | null>(null), [fname, setFname] = useState(''), [replace, setReplace] = useState(false), [busy, setBusy] = useState(false)
  const [wipe, setWipe] = useState(false), [typed, setTyped] = useState('')
  const [est, setEst] = useState<{ usage?: number; quota?: number } | null>(null), [persisted, setPersisted] = useState<boolean | null>(null)
  const refresh = () => { void navigator.storage?.estimate?.().then(e => setEst({ usage: e.usage, quota: e.quota })).catch(() => setEst({})); void navigator.storage?.persisted?.().then(setPersisted).catch(() => {}) }
  useEffect(refresh, [])

  const exportJson = () => { download(`studyflow-backup-${stamp()}.json`, JSON.stringify(buildExport(), null, 2)); toast('Backup downloaded') }
  const exportCsv = (name: 'sessions' | 'tasks') => { const c = toCsv(getAll(name) as any); if (!c) return toast(`You have no ${name} to export yet`, 'info'); download(`studyflow-${name}-${stamp()}.csv`, c, 'text/csv'); toast(`${name[0].toUpperCase() + name.slice(1)} exported`) }
  const pick = async (f?: File) => {
    if (!f) return
    try { const r = parseImport(await f.text()); setFname(f.name); setPv(r); if (!r.ok) toast(r.error ?? 'Could not read that file', 'err') } catch { toast('Could not read that file', 'err') }
    if (file.current) file.current.value = ''
  }
  const merge = async () => { if (!pv) return; setBusy(true); try { const r = await applyMerge(pv); toast(`Merged: ${r.added} added, ${r.updated} updated. Nothing was deleted.`); setPv(null) } catch { toast('Merge failed. Your data was not changed.', 'err') } finally { setBusy(false) } }
  const doReplace = async () => {
    if (!pv) return; setBusy(true)
    try { await applyReplace(pv); if (!getAll('presets').length) await putMany('presets', BUILT_IN_PRESETS.map(x => ({ ...x })), true); toast('Data replaced from backup'); setPv(null) }
    catch { toast('Import failed and your previous data was restored.', 'err') } finally { setBusy(false) }
  }
  const doWipe = async () => { try { await clearAllData(); toast('All data deleted from this device'); setWipe(false); setTyped(''); refresh() } catch { toast('Could not delete everything. Try again.', 'err') } }
  const persist = async () => { try { const ok = await navigator.storage.persist(); setPersisted(ok); toast(ok ? 'Storage protected from automatic cleanup' : 'The browser declined. It may grant it once you use the app more.', ok ? 'ok' : 'info') } catch { toast('Not supported in this browser', 'err') } }
  const rows = pv?.ok ? Object.entries(pv.counts) : []

  return <div className="space-y-5">
    <Section title="Export" sub="A backup contains your subjects, tasks, sessions, notes, cards, quizzes and settings. It never contains your AI key.">
      <div className="flex flex-wrap gap-2"><Button variant="primary" onClick={exportJson}><Download size={18} />Export everything (JSON)</Button>
        <Button onClick={() => exportCsv('sessions')}><FileSpreadsheet size={18} />Sessions CSV ({sessions.length})</Button><Button onClick={() => exportCsv('tasks')}><FileSpreadsheet size={18} />Tasks CSV ({tasks.length})</Button></div>
    </Section>

    <Section title="Import" sub="Choose a StudyFlow backup (.json). You will see what it contains before anything changes.">
      <input ref={file} type="file" accept="application/json,.json" className="sr-only" id="import-file" onChange={e => void pick(e.target.files?.[0])} />
      <Button onClick={() => file.current?.click()}><Upload size={18} />Choose backup file</Button>
      {pv && !pv.ok && <p role="alert" className="rounded-lg bg-surface2 p-3 text-sm text-bad">{pv.error}</p>}
      {pv?.ok && <div className="space-y-3 rounded-lg border hairline p-3"><p className="text-sm"><strong>{fname}</strong> (backup format v{pv.version})</p>
        {rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Contents of the backup</caption><thead><tr className="text-muted"><th scope="col" className="py-1 pr-3">Type</th><th scope="col" className="pr-3">Records</th><th scope="col" className="pr-3">Already here</th><th scope="col">Invalid</th></tr></thead>
          <tbody>{rows.map(([k, c]) => <tr key={k} className="border-t hairline"><th scope="row" className="py-1.5 pr-3 font-semibold capitalize">{k}</th><td className="tnum pr-3">{c!.total}</td><td className="tnum pr-3">{c!.duplicates}</td><td className={`tnum ${c!.invalid ? 'font-bold text-bad' : ''}`}>{c!.invalid}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted">This backup is empty.</p>}
        <p className="text-sm text-muted"><strong className="text-ink">Merge</strong> keeps everything you have and adds or updates from the backup (newer edit wins). <strong className="text-ink">Replace</strong> deletes your current data first. Invalid records are skipped.</p>
        <div className="flex flex-wrap gap-2"><Button variant="primary" disabled={busy || !rows.length} onClick={merge}>Merge into my data</Button><Button disabled={busy || !rows.length} onClick={() => setReplace(true)}>Replace my data</Button><Button variant="ghost" onClick={() => setPv(null)}>Cancel</Button></div></div>}
    </Section>

    <Section title="Storage" sub="Everything lives in this browser on this device.">
      <p className="text-sm tnum">{est?.usage !== undefined ? <>Using <strong>{mb(est.usage)}</strong>{est.quota ? <> of about {mb(est.quota)} available</> : null}.</> : est ? 'Your browser does not report storage usage.' : 'Checking…'}</p>
      <p className="text-sm text-muted">{persisted === null ? 'Persistent storage is not supported here.' : persisted ? 'Protected: the browser will not clear this data automatically.' : 'Not protected: under heavy storage pressure the browser may clear data. Export a backup now and then.'}</p>
      {persisted === false && <Button onClick={persist}><ShieldCheck size={18} />Request persistent storage</Button>}
    </Section>

    <Section title="Sync & backup">
      <p className="flex items-center gap-2 font-bold"><HardDrive size={18} className="text-brand" />Local only — cloud sync not configured</p>
      <p className="text-sm text-muted">Your data is not on any server. Until sync is set up, exporting a backup is the only way to move or protect it.</p>
      <details className="text-sm"><summary className="flex min-h-10 cursor-pointer items-center gap-2 font-bold"><Cloud size={16} />What cloud sync would need</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted"><li>A Supabase project, with its URL and anon key provided to the app as environment variables (<span className="font-mono">VITE_SUPABASE_URL</span>, <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>).</li><li>Tables for each kind of record (subjects, tasks, sessions, notes, decks, cards, quizzes, attempts, exams, achievements, reviews).</li><li>Row-level security so each signed-in user can only read and write their own rows.</li><li>A sign-in flow. None of this is built or enabled in this version.</li></ul></details>
    </Section>

    <section className="space-y-3 rounded-card border border-bad/50 bg-surface p-4 sm:p-5"><h2 className="font-display text-xl font-semibold text-bad">Delete all data</h2>
      <p className="text-sm text-muted">Removes every subject, task, note, card, session and setting from this device. This cannot be undone. Export a backup first.</p>
      <Button variant="danger" onClick={() => setWipe(true)}><Trash2 size={18} />Delete everything…</Button></section>

    <ConfirmDialog open={replace} onClose={() => setReplace(false)} onConfirm={doReplace} danger title="Replace all your data?" confirmLabel="Replace my data" body="Everything currently in StudyFlow will be replaced by the contents of this backup. If the import fails, your previous data is restored. Consider exporting a backup first." />
    <Dialog open={wipe} onClose={() => { setWipe(false); setTyped('') }} title="Delete all data?">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (typed === 'DELETE') void doWipe() }}>
        <p className="text-[15px] text-muted">This permanently erases everything stored by StudyFlow on this device, including settings and your saved AI key.</p>
        <Field label="Type DELETE to confirm">{id => <Input id={id} value={typed} autoComplete="off" onChange={e => setTyped(e.target.value)} />}</Field>
        <div className="flex justify-end gap-2"><Button onClick={() => { setWipe(false); setTyped('') }}>Cancel</Button><Button variant="danger" type="submit" disabled={typed !== 'DELETE'}>Delete everything</Button></div></form></Dialog>
  </div>
}
