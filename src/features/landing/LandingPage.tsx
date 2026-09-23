import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck, ArrowRight, BookOpen, Quote } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Static presentational copy — no career data, spec §03 §3
const STUDY_QUOTE =
  'The roots of education are bitter, but the fruit is sweet.'
const QUOTE_AUTHOR = 'Aristotle'
const PRODUCT_TAGLINE =
  'UPROOTERS tracks your complete college journey and tells you exactly which career paths, companies, and roles you are ready for — and what you need to get there.'

/**
 * LandingPage — Ace&place opening experience and role selector.
 *
 * Spec refs: 03_UI_UX_SPEC §2 (Brand Structure), §3 (Opening Experience), §4 (Entry and Role Selection)
 *
 * NOTE: Role selection here is for visual navigation only.
 * Authentication and authorization are deferred to a later milestone.
 */
export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { setRole } = useRole()

  const handleRoleSelect = (role: 'student' | 'admin') => {
    setRole(role)
    navigate(role === 'student' ? '/app' : '/admin')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel: Ace&place brand + atmosphere ────────────────── */}
      <div className="relative flex flex-col justify-between p-10 lg:p-14 lg:w-[52%] overflow-hidden bg-[#3D0B12]">
        {/* Atmospheric gradient layers */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 10% 90%, rgba(242,185,79,0.12) 0%, transparent 55%), radial-gradient(ellipse at 90% 10%, rgba(88,17,26,0.8) 0%, transparent 60%), linear-gradient(135deg, #3D0B12 0%, #1a0509 60%, #0d0306 100%)',
          }}
        />
        {/* Subtle dot grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ace&place brand */}
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <BookOpen className="w-5 h-5 text-brand-accent" aria-hidden="true" />
            </div>
            <div>
              <div className="text-white font-bold text-xl tracking-tight leading-none">
                Ace&amp;place
              </div>
              <div className="text-white/40 text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5">
                Career Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Center: quote + product description */}
        <div className="relative z-10 animate-slide-up">
          <Quote
            className="w-7 h-7 text-brand-accent/60 mb-6"
            aria-hidden="true"
          />
          <blockquote className="text-3xl lg:text-[2.1rem] font-light text-white leading-snug mb-3">
            {STUDY_QUOTE}
          </blockquote>
          <p className="text-white/40 text-sm font-medium tracking-wide mb-9">
            — {QUOTE_AUTHOR}
          </p>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-[420px]">
            {PRODUCT_TAGLINE}
          </p>
        </div>

        {/* Bottom: product identity */}
        <div className="relative z-10 animate-fade-in">
          <p className="text-white/25 text-xs tracking-wide">
            UPROOTERS by Ace&amp;place &nbsp;·&nbsp; Career Readiness Platform
          </p>
        </div>
      </div>

      {/* ── Right Panel: Role selector ──────────────────────────────── */}
      <div
        className="relative flex flex-1 flex-col justify-center items-center p-10 lg:p-14"
        style={{ background: 'var(--surface-raised)' }}
      >
        {/* Top-right theme toggle */}
        <div className="absolute top-6 right-6">
          <ThemeToggle size="sm" />
        </div>

        <div className="w-full max-w-[360px]">
          {/* Heading */}
          <div className="mb-8 animate-slide-up">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Get started
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Choose how you would like to enter UPROOTERS.
            </p>
          </div>

          {/* Role cards */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
            {/* Student */}
            <button
              id="role-student"
              onClick={() => handleRoleSelect('student')}
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              className="
                w-full text-left group p-5 rounded-2xl border-2
                hover:border-brand-wine hover:shadow-xl hover:shadow-brand-wine/10
                hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine focus-visible:ring-offset-2
              "
              aria-label="Enter UPROOTERS as a Student"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-wine-soft border border-brand-wine/10 flex items-center justify-center shrink-0 group-hover:bg-brand-wine group-hover:border-brand-wine transition-colors duration-200">
                    <GraduationCap
                      className="w-6 h-6 text-brand-wine group-hover:text-white transition-colors duration-200"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div
                      className="font-semibold text-[15px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Student
                    </div>
                    <div
                      className="text-sm mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Track your journey &amp; career readiness
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 group-hover:text-brand-wine group-hover:translate-x-1 transition-all duration-200 shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
              </div>
            </button>

            {/* Administrator */}
            <button
              id="role-admin"
              onClick={() => handleRoleSelect('admin')}
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              className="
                w-full text-left group p-5 rounded-2xl border-2
                hover:border-brand-emerald hover:shadow-xl hover:shadow-brand-emerald/10
                hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2
              "
              aria-label="Enter UPROOTERS as an Administrator"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-emerald-soft border border-brand-emerald/10 flex items-center justify-center shrink-0 group-hover:bg-brand-emerald group-hover:border-brand-emerald transition-colors duration-200">
                    <ShieldCheck
                      className="w-6 h-6 text-brand-emerald group-hover:text-white transition-colors duration-200"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div
                      className="font-semibold text-[15px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Administrator
                    </div>
                    <div
                      className="text-sm mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Manage data, verification &amp; oversight
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 group-hover:text-brand-emerald group-hover:translate-x-1 transition-all duration-200 shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>

          {/* Direct Auth Action */}
          <div className="mt-8 pt-6 border-t text-center space-y-2 animate-fade-in" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Ready to access your verified career intelligence?
            </p>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold">
              <button
                id="landing-signin-btn"
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                Sign In
              </button>
              <button
                id="landing-signup-btn"
                onClick={() => navigate('/signup')}
                className="px-3.5 py-1.5 rounded-lg transition-colors hover:opacity-90"
                style={{ background: 'var(--brand-wine)', color: 'white' }}
              >
                Create Account
              </button>
            </div>
            <p
              className="text-center text-xs mt-3 pt-2 text-muted"
              style={{ color: 'var(--text-muted)' }}
            >
              Role selection is for navigation only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
