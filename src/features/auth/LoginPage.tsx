import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { BookOpen, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isStudentProvisioned } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      if (isStudentProvisioned) {
        const from = (location.state as any)?.from?.pathname || '/app'
        navigate(from, { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, isStudentProvisioned, navigate, location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Email address is required')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    setIsSubmitting(true)

    try {
      await authService.signIn(trimmedEmail, password)
      // AuthContext will update onAuthStateChange and trigger navigation
    } catch (err: any) {
      console.warn('Sign-in error:', err)
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 relative"
      style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
    >
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-[400px]">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-3 mb-4 group focus-visible:outline-none"
            aria-label="Return to UPROOTERS landing page"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'var(--brand-wine)', color: 'var(--brand-accent)' }}
            >
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg tracking-tight leading-none">
                UPROOTERS
              </div>
              <div
                className="text-[10px] font-medium tracking-[0.14em] uppercase mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                by Ace&amp;place
              </div>
            </div>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Sign in to your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter your credentials to access your student career intelligence
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-2xl border shadow-sm"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.edu"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                style={{
                  background: 'var(--surface-raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password
                </label>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                style={{
                  background: 'var(--surface-raised)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine disabled:opacity-50"
              style={{
                background: 'var(--brand-wine)',
                color: 'white',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
            <Link
              to="/signup"
              className="font-semibold hover:underline"
              style={{ color: 'var(--brand-wine)' }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
