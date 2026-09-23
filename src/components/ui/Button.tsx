import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Optional href — renders as <a> tag */
  href?: string
  children: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-brand-wine text-white hover:bg-brand-wine-light active:bg-brand-wine-dark shadow-sm hover:shadow-md disabled:bg-slate-300 disabled:text-slate-500',
  secondary: 'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] active:bg-[var(--surface-sunken)] disabled:text-[var(--text-muted)]',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] active:bg-[var(--surface-sunken)] disabled:text-[var(--text-muted)]',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md disabled:bg-slate-300 disabled:text-slate-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded-md',
  md: 'h-9  px-4   text-sm  gap-2   rounded-lg',
  lg: 'h-11 px-5   text-sm  gap-2.5 rounded-lg',
}

/**
 * Button — Reusable interactive control.
 * Spec ref: 02_FRONTEND_SPEC §27 (Component Architecture)
 *
 * No business logic — presentation only.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  href,
  children,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 select-none'

  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <Loader2
          className="w-3.5 h-3.5 animate-spin shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
