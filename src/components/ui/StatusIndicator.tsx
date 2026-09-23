import React from 'react'
import {
  CheckCircle2,
  MinusCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

export type StatusState =
  | 'met'
  | 'partial'
  | 'missing'
  | 'unverified'
  | 'stale'
  | 'loading'
  | 'not-evaluated'

interface StatusIndicatorProps {
  status: StatusState
  label?: string
  className?: string
}

/** Config per status — always colour + icon + text, never colour alone */
const statusConfig: Record<
  StatusState,
  { label: string; icon: React.ReactNode; dot: string; text: string }
> = {
  met: {
    label: 'Met',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  partial: {
    label: 'Partially Supported',
    icon: <MinusCircle className="w-3.5 h-3.5" />,
    dot: 'bg-amber-400',
    text: 'text-amber-700',
  },
  missing: {
    label: 'Missing',
    icon: <XCircle className="w-3.5 h-3.5" />,
    dot: 'bg-red-500',
    text: 'text-red-700',
  },
  unverified: {
    label: 'Unverified',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    dot: 'bg-amber-400',
    text: 'text-amber-600',
  },
  stale: {
    label: 'Stale',
    icon: <Clock className="w-3.5 h-3.5" />,
    dot: 'bg-slate-400',
    text: 'text-slate-500',
  },
  loading: {
    label: 'Loading',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    dot: 'bg-slate-300',
    text: 'text-slate-400',
  },
  'not-evaluated': {
    label: 'Not Evaluated',
    icon: <MinusCircle className="w-3.5 h-3.5" />,
    dot: 'bg-slate-300',
    text: 'text-slate-400',
  },
}

/**
 * StatusIndicator — Dot + icon + label for requirement/data states.
 *
 * Uses colour AND icon AND text — never colour alone.
 * Spec ref: 02_FRONTEND_SPEC §15 (Readiness Result States), §26 (Accessibility)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
}) => {
  const config = statusConfig[status]
  const displayLabel = label ?? config.label

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text} ${className}`}
      role="status"
      aria-label={displayLabel}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
        aria-hidden="true"
      />
      <span aria-hidden="true" className="flex items-center">
        {config.icon}
      </span>
      {displayLabel}
    </span>
  )
}
