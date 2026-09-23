import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'uprooters-theme'

/**
 * ThemeProvider — manages light/dark theme for UPROOTERS.
 *
 * Default: light mode on first load.
 * Persists user preference in localStorage.
 * Sets data-theme="dark" on <html> element for CSS variable switching.
 *
 * NOTE: Does NOT use prefers-color-scheme — default is always light per spec decision.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    }
    return 'light' // Default: light mode
  })

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else {
      html.removeAttribute('data-theme')
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage may be unavailable in some environments; silently ignore
    }
  }, [theme])

  const toggleTheme = () =>
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
