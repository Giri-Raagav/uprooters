import React from 'react'
import { Info } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  specReference: string
  description: string
}

/**
 * PlaceholderPage — Legacy placeholder used during early milestone development.
 * @deprecated Use PageHeader + EmptyState from ui/ instead.
 */
export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  specReference,
  description,
}) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div
        className="rounded-xl border shadow-sm p-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded bg-brand-wine-soft text-brand-wine border border-brand-wine/10">
            {specReference}
          </span>
        </div>
        <p className="mt-4 leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
        <div
          className="mt-6 p-4 rounded-lg border text-xs flex items-start gap-2"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong style={{ color: 'var(--text-secondary)' }}>Milestone 02 — Application Shell Active.</strong>{' '}
            Business logic and verified data connections will be implemented in subsequent milestones per development rules.
          </span>
        </div>
      </div>
    </div>
  )
}
