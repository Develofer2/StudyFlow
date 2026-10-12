import { Field, Input, Select, Switch } from '@/components/ui'
import type { AiHubState } from '@/types'
import { FEATURES, setFeatureModel } from '@/services/ai/profiles'

export default function FeatureRouting({ hub }: { hub: AiHubState }) {
  const all = Object.keys(hub.featureModels).length === 0
  const live = hub.profiles.filter(p => p.enabled)
  return <div className="space-y-3">
    <Switch label="Use the default provider for everything" hint="Turn off to pick a provider and model per feature." checked={all}
      onChange={v => { if (v) for (const f of FEATURES) void setFeatureModel(f.id, null); else if (hub.defaultId) { const d = hub.profiles.find(p => p.id === hub.defaultId); if (d) void setFeatureModel('chat', { profileId: d.id, model: d.model }) } }} />
    {!all && <ul className="space-y-3">{FEATURES.map(f => { const cur = hub.featureModels[f.id]; const prof = hub.profiles.find(p => p.id === cur?.profileId)
      return <li key={f.id} className="grid gap-3 rounded-card border hairline p-3 sm:grid-cols-2">
        <Field label={f.label}>{id => <Select id={id} value={cur?.profileId ?? ''} onChange={e => { const p = hub.profiles.find(x => x.id === e.target.value); void setFeatureModel(f.id, p ? { profileId: p.id, model: p.model } : null) }}><option value="">Default provider</option>{live.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>}</Field>
        {cur && <Field label="Model for this feature" hint={prof ? `Provider default: ${prof.model}` : undefined}>{id => <Input id={id} key={cur.profileId} defaultValue={cur.model} spellCheck={false} onBlur={e => void setFeatureModel(f.id, { profileId: cur.profileId, model: e.target.value.trim() || prof?.model || '' })} />}</Field>}
      </li> })}</ul>}
  </div>
}
