import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  /** User-facing message — must NOT expose internal error details */
  message: string
  /** Optional retry action */
  onRetry?: () => void
  className?: string
}

/**
 * ErrorState — User-facing error display.
 *
 * Must not expose sensitive internal information, stack traces, or raw error messages.
 * Spec ref: 02_FRONTEND_SPEC §22 (Error state), 08_DEVELOPMENT_RULES §19 (Error Handling)
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto ${className}`}
  >
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-red-50 border border-red-100">
      <AlertCircle
        className="w-7 h-7 text-red-500"
        aria-hidden="true"
        strokeWidth={1.5}
      />
    </div>

    <h2 className="text-base font-semibold text-red-700 mb-2">{title}</h2>

    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
      {message}
    </p>

    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
)
