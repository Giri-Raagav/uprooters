import React from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'verified'
  | 'unverified'
  | 'stale'
  | 'wine'
  | 'emerald'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  /** Optional leading icon */
  icon?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:    'bg-slate-100 text-slate-700 border-slate-200',
  success:    'bg-green-50  text-green-700  border-green-200',
  warning:    'bg-amber-50  text-amber-700  border-amber-200',
  error:      'bg-red-50    text-red-700    border-red-200',
  info:       'bg-blue-50   text-blue-700   border-blue-200',
  verified:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  unverified: 'bg-amber-50  text-amber-700  border-amber-200',
  stale:      'bg-slate-50  text-slate-500  border-slate-200',
  wine:       'bg-brand-wine-soft text-brand-wine border-brand-wine/20',
  emerald:    'bg-brand-emerald-soft text-brand-emerald border-brand-emerald/20',
}

/**
 * Badge — Status/category label with semantic colour variants.
 *
 * Always uses colour + text — never colour alone (accessibility requirement).
 * Spec ref: 02_FRONTEND_SPEC §26, 03_UI_UX_SPEC §24
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  icon,
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${variantClasses[variant]} ${className}`}
  >
    {icon && <span aria-hidden="true" className="flex items-center">{icon}</span>}
    {children}
  </span>
)
