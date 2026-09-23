import React from 'react'

type CardVariant = 'default' | 'elevated' | 'outlined'

interface CardProps {
  variant?: CardVariant
  children: React.ReactNode
  className?: string
  /** Subtle 3D hover effect per UI/UX spec §25 */
  interactive?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<CardVariant, string> = {
  default:  'border bg-[var(--surface)] border-[var(--border)]',
  elevated: 'border bg-[var(--surface)] border-[var(--border)] shadow-sm',
  outlined: 'border-2 bg-transparent border-[var(--border)]',
}

/**
 * Card — Structured content container with optional header/body/footer slots.
 * Spec ref: 02_FRONTEND_SPEC §27, 03_UI_UX_SPEC §21
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  interactive = false,
}) => (
  <div
    className={`
      rounded-xl overflow-hidden
      ${variantClasses[variant]}
      ${interactive
        ? 'hover:shadow-md hover:-translate-y-px hover:scale-[1.002] transition-all duration-200 cursor-pointer'
        : ''}
      ${className}
    `}
  >
    {children}
  </div>
)

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div
    className={`px-5 py-4 border-b border-[var(--border)] ${className}`}
  >
    {children}
  </div>
)

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`px-5 py-4 ${className}`}>{children}</div>
)

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div
    className={`px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-raised)] ${className}`}
  >
    {children}
  </div>
)
