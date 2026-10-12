import { CheckCircle2, CircleDashed, Loader2, TriangleAlert, WifiOff } from 'lucide-react'
import type { ProviderStatus } from '@/types'
import { Chip } from '@/components/ui'

export const STATUS_LABEL: Record<ProviderStatus, string> = {
  'not-configured': 'Not set up', ready: 'Ready, not tested', testing: 'Testing…', connected: 'Connected (tested)', 'auth-failed': 'Key rejected',
  'model-unavailable': 'Model not found', network: 'Network or CORS problem', 'provider-error': 'Provider error', unsupported: 'Not supported yet',
}
export function StatusChip({ status }: { status: ProviderStatus }) {
  const Icon = status === 'connected' ? CheckCircle2 : status === 'testing' ? Loader2 : status === 'not-configured' || status === 'ready' ? CircleDashed : status === 'network' ? WifiOff : TriangleAlert
  const tone = status === 'connected' ? 'text-ok' : status === 'not-configured' || status === 'ready' ? 'text-muted' : 'text-bad'
  return <Chip className={tone}><Icon size={14} className={status === 'testing' ? 'animate-spin' : ''} aria-hidden />{STATUS_LABEL[status]}</Chip>
}
