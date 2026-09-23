import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Optional action buttons/content aligned to the right */
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader — Consistent page heading with title, optional subtitle, and actions area.
 *
 * Every page has exactly one <h1> via this component, satisfying the single-h1 rule.
 * Spec ref: 02_FRONTEND_SPEC §27 (Component Architecture)
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
    <div className="min-w-0">
      <h1
        className="text-xl font-bold leading-tight tracking-tight truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-sm mt-1 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0 mt-0.5">{actions}</div>
    )}
  </div>
)
