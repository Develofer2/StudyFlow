import { useEffect, useState, type ReactNode } from 'react'
import { Card, Field, Input } from '@/components/ui'

export const Section = ({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) =>
  <Card className="space-y-4"><div><h2 className="font-display text-xl font-semibold">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</div>{children}</Card>

/** Keeps the raw text while typing and only commits valid values, so clearing the box never writes NaN. */
export function NumField({ label, value, min, max, onCommit, hint, optional, unit }: { label: string; value: number | undefined; min: number; max: number; onCommit: (v: number | undefined) => void; hint?: string; optional?: boolean; unit?: string }) {
  const [txt, setTxt] = useState(value === undefined ? '' : String(value))
  useEffect(() => { setTxt(value === undefined ? '' : String(value)) }, [value])
  const n = Number(txt), bad = txt !== '' ? !Number.isInteger(n) || n < min || n > max : !optional
  return <Field label={unit ? `${label} (${unit})` : label} hint={hint} error={bad ? `Enter a whole number from ${min} to ${max}.` : undefined}>{(id, d) =>
    <Input id={id} aria-describedby={d} inputMode="numeric" value={txt} aria-invalid={bad} onChange={e => { setTxt(e.target.value); const v = e.target.value.trim(); if (v === '' && optional) onCommit(undefined); else { const x = Number(v); if (v !== '' && Number.isInteger(x) && x >= min && x <= max) onCommit(x) } }} />}</Field>
}
