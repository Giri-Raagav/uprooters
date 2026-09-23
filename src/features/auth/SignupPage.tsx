import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BookOpen, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isStudentProvisioned } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      if (isStudentProvisioned) {
        navigate('/app', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [user, isStudentProvisioned, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Email address is required')
      return
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please provide a valid email address')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const data = await authService.signUp(trimmedEmail, password)
      if (data.session) {
        // User session established immediately
        navigate('/onboarding', { replace: true })
      } else {
        // Email confirmation is required by Supabase project settings
        setSuccessMessage(
          'Account created successfully! Please check your email inbox to confirm your address before signing in.'
        )
      }
    } catch (err: any) {
      console.warn('Sign-up error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
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

      <div className="w-full max-w-[420px]">
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
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start tracking your college journey and career readiness
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

          {successMessage && (
            <div
              role="status"
              className="mb-5 p-4 rounded-xl text-sm flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden="true" />
              <div className="space-y-2">
                <p className="font-medium">{successMessage}</p>
                <Link
                  to="/login"
                  className="inline-block text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Email address
                </label>
                <input
                  id="signup-email"
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
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Password (min. 6 characters)
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
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

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Confirm password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
                id="signup-submit"
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--brand-wine)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
