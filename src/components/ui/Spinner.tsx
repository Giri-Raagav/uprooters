import React from 'react'
import { Loader2 } from 'lucide-react'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

/**
 * Spinner — Accessible loading indicator.
 * Spec ref: 02_FRONTEND_SPEC §22 (Loading state)
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Loading…',
  className = '',
}) => (
  <span
    role="status"
    aria-label={label}
    className={`inline-flex items-center justify-center ${className}`}
  >
    <Loader2
      className={`animate-spin text-brand-wine ${sizeClasses[size]}`}
      aria-hidden="true"
    />
    <span className="sr-only">{label}</span>
  </span>
)
