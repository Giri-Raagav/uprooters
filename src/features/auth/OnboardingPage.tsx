import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  AlertCircle,
  Loader2,
  GraduationCap,
  LogOut,
  Info,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService, CollegeOption, DepartmentOption } from '@/services/authService'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isStudentProvisioned, refreshProfile, signOut, isLoading: authLoading } = useAuth()

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [collegeId, setCollegeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [degree, setDegree] = useState('B.E.')
  const [branch, setBranch] = useState('ECE')
  const [admissionYear, setAdmissionYear] = useState<number>(2022)
  const [expectedGraduationYear, setExpectedGraduationYear] = useState<number>(2026)
  const [currentSemester, setCurrentSemester] = useState<number>(1)

  // Institutional data state
  const [colleges, setColleges] = useState<CollegeOption[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [loadingColleges, setLoadingColleges] = useState(true)
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Error & submission state
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Navigation guard: Must be authenticated, and not already provisioned
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (isStudentProvisioned) {
        navigate('/app', { replace: true })
      }
    }
  }, [user, isStudentProvisioned, authLoading, navigate])

  // Fetch active colleges on mount
  useEffect(() => {
    let isMounted = true
    setLoadingColleges(true)
    authService
      .getActiveColleges()
      .then(data => {
        if (isMounted) {
          setColleges(data)
          if (data.length > 0) {
            setCollegeId(data[0].id)
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Failed to load colleges', err)
          setError('Could not load college directory')
        }
      })
      .finally(() => {
        if (isMounted) setLoadingColleges(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch departments when college changes
  useEffect(() => {
    if (!collegeId) {
      setDepartments([])
      setDepartmentId('')
      return
    }

    let isMounted = true
    setLoadingDepartments(true)
    authService
      .getDepartmentsForCollege(collegeId)
      .then(data => {
        if (isMounted) {
          setDepartments(data)
          if (data.length > 0) {
            setDepartmentId(data[0].id)
          } else {
            setDepartmentId('')
          }
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('Failed to load departments', err)
          setDepartments([])
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDepartments(false)
      })

    return () => {
      isMounted = false
    }
  }, [collegeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      return
    }

    if (!collegeId) {
      setError('An approved institution must be selected')
      return
    }

    if (expectedGraduationYear < admissionYear) {
      setError('Expected graduation year cannot precede admission year')
      return
    }

    setIsSubmitting(true)

    try {
      await authService.completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        collegeId,
        departmentId: departmentId || null,
        degree,
        branch,
        admissionYear,
        expectedGraduationYear,
        currentSemester,
      })

      // Refresh student identity in context
      await refreshProfile()
      navigate('/app', { replace: true })
    } catch (err: any) {
      console.error('Onboarding failed', err)
      setError(err.message || 'Failed to complete profile onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 relative"
      style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
    >
      {/* Top action bar */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle size="sm" />
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          aria-label="Sign out from onboarding"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>

      <div className="w-full max-w-[540px]">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-3"
            style={{ background: 'var(--brand-wine)', color: 'var(--brand-accent)' }}
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Complete your student profile
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tell us about your college and academic timeline to initialize your readiness tracker
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

          {loadingColleges ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-brand-wine" aria-hidden="true" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading institutional directory...
              </span>
            </div>
          ) : colleges.length === 0 ? (
            /* Institutional Empty State — strictly required when no canonical colleges exist */
            <div
              className="p-6 rounded-xl border flex flex-col items-center text-center space-y-3.5"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }}
              role="region"
              aria-label="No colleges registered"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--brand-wine-soft)', color: 'var(--brand-wine)' }}
              >
                <Building2 className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Institutional Registration Required
                </h3>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  No approved colleges are currently registered in the database.
                  UPROOTERS strictly prevents arbitrary or fabricated institutions;
                  student records require linkage to an authoritative institution.
                </p>
              </div>

              <div
                className="w-full text-left p-3.5 rounded-lg border text-xs flex items-start gap-2.5"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" aria-hidden="true" />
                <span>
                  Please wait until an administrator seeds verified institutional reference data before completing onboarding.
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="onboarding-first-name"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    First Name *
                  </label>
                  <input
                    id="onboarding-first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="e.g. Ada"
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
                    htmlFor="onboarding-last-name"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Last Name *
                  </label>
                  <input
                    id="onboarding-last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="e.g. Lovelace"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                    style={{
                      background: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Institution / College */}
              <div>
                <label
                  htmlFor="onboarding-college"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Institution (College) *
                </label>
                <select
                  id="onboarding-college"
                  required
                  value={collegeId}
                  onChange={e => setCollegeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                  style={{
                    background: 'var(--surface-raised)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city}, {c.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              {departments.length > 0 && (
                <div>
                  <label
                    htmlFor="onboarding-department"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Department
                  </label>
                  <select
                    id="onboarding-department"
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    disabled={loadingDepartments}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                    style={{
                      background: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.short_name ? `(${d.short_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Degree & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="onboarding-degree"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Degree
                  </label>
                  <input
                    id="onboarding-degree"
                    type="text"
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
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
                    htmlFor="onboarding-branch"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Branch / Major
                  </label>
                  <input
                    id="onboarding-branch"
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                    style={{
                      background: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Academic Timeline: Admission & Graduation Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="onboarding-admission-year"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Admission Year *
                  </label>
                  <input
                    id="onboarding-admission-year"
                    type="number"
                    min={2000}
                    max={2100}
                    required
                    value={admissionYear}
                    onChange={e => setAdmissionYear(parseInt(e.target.value, 10))}
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
                    htmlFor="onboarding-graduation-year"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Expected Grad *
                  </label>
                  <input
                    id="onboarding-graduation-year"
                    type="number"
                    min={2000}
                    max={2100}
                    required
                    value={expectedGraduationYear}
                    onChange={e => setExpectedGraduationYear(parseInt(e.target.value, 10))}
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
                    htmlFor="onboarding-current-semester"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Current Semester *
                  </label>
                  <select
                    id="onboarding-current-semester"
                    value={currentSemester}
                    onChange={e => setCurrentSemester(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-wine/50"
                    style={{
                      background: 'var(--surface-raised)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <button
                id="onboarding-submit"
                type="submit"
                disabled={isSubmitting || colleges.length === 0}
                className="w-full mt-4 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine disabled:opacity-50"
                style={{
                  background: 'var(--brand-wine)',
                  color: 'white',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Provisioning student profile...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" aria-hidden="true" />
                    <span>Complete Onboarding &amp; Enter Platform</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
