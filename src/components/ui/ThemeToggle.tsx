import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

type ToggleSize = 'sm' | 'md'
type ToggleVariant = 'default' | 'admin'

interface ThemeToggleProps {
  size?: ToggleSize
  /** 'admin' variant uses white-toned colours for dark sidebar context */
  variant?: ToggleVariant
  className?: string
}

/**
 * ThemeToggle — Light/dark mode toggle button.
 *
 * aria-label updates based on current theme so screen readers announce
 * what action will happen, not the current state.
 * Spec ref: 03_UI_UX_SPEC §6 (Theme System), 02_FRONTEND_SPEC §26 (Accessibility)
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const isAdmin = variant === 'admin'

  const buttonClasses = [
    'inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    size === 'sm'
      ? 'p-2 text-xs'
      : 'w-full px-3 py-2.5 text-xs justify-start',
    isAdmin
      ? 'text-white/60 hover:text-white hover:bg-white/10 focus-visible:ring-white/40'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] focus-visible:ring-[var(--focus-ring)]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={buttonClasses}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0 transition-transform duration-300 rotate-0" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 shrink-0 transition-transform duration-300" aria-hidden="true" />
      )}
      {size === 'md' && (
        <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  )
}
