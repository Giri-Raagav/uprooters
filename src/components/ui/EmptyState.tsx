import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  /** Lucide icon component */
  icon: LucideIcon
  title: string
  description: string
  /** Optional primary call-to-action */
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState — Structured empty-state with icon, title, description, and optional CTA.
 *
 * Used across all pages before data connections are established.
 * Provides context about what the page will show when data is available.
 * Spec ref: 02_FRONTEND_SPEC §22 (Empty state)
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto ${className}`}
  >
    {/* Icon container */}
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border"
      style={{ background: 'var(--surface-overlay)', borderColor: 'var(--border)' }}
    >
      <Icon
        className="w-7 h-7"
        style={{ color: 'var(--text-muted)' }}
        aria-hidden="true"
        strokeWidth={1.5}
      />
    </div>

    {/* Title */}
    <h2
      className="text-base font-semibold mb-2"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h2>

    {/* Description */}
    <p
      className="text-sm leading-relaxed mb-6"
      style={{ color: 'var(--text-secondary)' }}
    >
      {description}
    </p>

    {/* Optional action */}
    {action && (
      <Button variant="secondary" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
)
