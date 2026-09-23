import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { authService } from '@/services/authService'
import { studentService } from '@/services/studentService'
import { supabase } from '@/lib/supabase'

vi.mock('@/services/authService', () => ({
  authService: {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
    getUserRoles: vi.fn().mockResolvedValue(['student']),
    getActiveColleges: vi.fn().mockResolvedValue([]),
    getDepartmentsForCollege: vi.fn().mockResolvedValue([]),
    completeOnboarding: vi.fn(),
  },
}))

vi.mock('@/services/studentService', () => ({
  studentService: {
    getCurrentProfile: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          } as any,
        },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: vi.fn(),
  },
}))

function renderWithProviders(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('Authentication Foundation & Onboarding UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockReset()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        } as any,
      },
    })
    vi.mocked(studentService.getCurrentProfile).mockReset()
    vi.mocked(studentService.getCurrentProfile).mockResolvedValue(null)
    vi.mocked(authService.getUserRoles).mockReset()
    vi.mocked(authService.getUserRoles).mockResolvedValue(['student'])
    vi.mocked(authService.getActiveColleges).mockReset()
    vi.mocked(authService.getActiveColleges).mockResolvedValue([])
    vi.mocked(authService.getDepartmentsForCollege).mockReset()
    vi.mocked(authService.getDepartmentsForCollege).mockResolvedValue([])
  })

  describe('1. LoginPage Flow', () => {
    it('renders email and password inputs with sign-in button', () => {
      renderWithProviders(<LoginPage />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument()
    })

    it('displays error when submitting with empty email or password', async () => {
      renderWithProviders(<LoginPage />)

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email address is required/i)
      })

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@example.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password is required/i)
      })
    })

    it('calls authService.signIn with trimmed email and password', async () => {
      vi.mocked(authService.signIn).mockResolvedValueOnce({
        user: { id: 'mock-user-id' } as any,
        session: { access_token: 'token' } as any,
      })

      renderWithProviders(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: ' student@example.edu ' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'ValidPassword123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(authService.signIn).toHaveBeenCalledWith('student@example.edu', 'ValidPassword123')
      })
    })

    it('displays error message when signIn fails', async () => {
      vi.mocked(authService.signIn).mockRejectedValueOnce(
        new Error('Invalid login credentials')
      )

      renderWithProviders(<LoginPage />)

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' },
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials')
      })
    })
  })

  describe('2. SignupPage Flow', () => {
    it('validates email format, password length, and matching passwords', async () => {
      renderWithProviders(<SignupPage />)

      // 1. Invalid email
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'invalid-email' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: '123456' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: '123456' },
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i)
      })

      // 2. Short password
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@test.edu' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: '12345' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: '12345' },
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/at least 6 characters/i)
      })

      // 3. Mismatched passwords
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'secretpass' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'differentpass' },
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
      })
    })

    it('submits valid registration and renders confirmation if email verification is required', async () => {
      vi.mocked(authService.signUp).mockResolvedValueOnce({
        user: { id: 'new-user-id' } as any,
        session: null, // confirmation required
      })

      renderWithProviders(<SignupPage />)

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'newstudent@college.edu' },
      })
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'Password123' },
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Password123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalledWith('newstudent@college.edu', 'Password123')
        expect(screen.getByRole('status')).toHaveTextContent(/check your email inbox/i)
      })
    })
  })

  describe('3. Student Onboarding UI & Institutional Empty State', () => {
    it('displays the institutional empty state when no colleges are registered in the database', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@student.edu' } as any,
          } as any,
        },
        error: null,
      })

      vi.mocked(authService.getActiveColleges).mockResolvedValue([])

      renderWithProviders(<OnboardingPage />)

      await waitFor(() => {
        expect(screen.getByText(/Institutional Registration Required/i)).toBeInTheDocument()
        expect(
          screen.getByText(/No approved colleges are currently registered in the database/i)
        ).toBeInTheDocument()
      })
    })

    it('populates college and department selectors and submits valid onboarding', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@student.edu' } as any,
          } as any,
        },
        error: null,
      })

      vi.mocked(authService.getActiveColleges).mockResolvedValue([
        {
          id: 'college-uuid-1',
          name: 'Engineering Institute of Technology',
          city: 'Chennai',
          state: 'Tamil Nadu',
        },
      ])

      vi.mocked(authService.getDepartmentsForCollege).mockResolvedValue([
        {
          id: 'dept-uuid-1',
          college_id: 'college-uuid-1',
          name: 'Electronics and Communication Engineering',
          short_name: 'ECE',
        },
      ])

      vi.mocked(authService.completeOnboarding).mockResolvedValue('new-student-uuid')

      renderWithProviders(<OnboardingPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Institution/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/First Name/i), {
        target: { value: 'Priya' },
      })
      fireEvent.change(screen.getByLabelText(/Last Name/i), {
        target: { value: 'Raman' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Complete Onboarding/i }))

      await waitFor(() => {
        expect(authService.completeOnboarding).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Priya',
            lastName: 'Raman',
            collegeId: 'college-uuid-1',
            branch: 'ECE',
          })
        )
      })
    })
  })

  describe('4. ProtectedRoute Gating', () => {
    it('redirects unauthenticated users to /login', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING_PAGE</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>PROTECTED_APP</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialEntries: ['/app'] }
      )

      await waitFor(() => {
        expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument()
      })
    })

    it('redirects authenticated but unprovisioned users to /onboarding', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'unprovisioned-user' } as any,
          } as any,
        },
        error: null,
      })
      vi.mocked(studentService.getCurrentProfile).mockResolvedValue(null)

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING_PAGE</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>PROTECTED_APP</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialEntries: ['/app'] }
      )

      await waitFor(() => {
        expect(screen.getByText('ONBOARDING_PAGE')).toBeInTheDocument()
      })
    })

    it('renders protected student content when user is authenticated and provisioned', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            user: { id: 'provisioned-user' } as any,
          } as any,
        },
        error: null,
      })

      vi.mocked(studentService.getCurrentProfile).mockResolvedValue({
        id: 'student-profile-uuid',
        user_id: 'provisioned-user',
        college_id: 'college-uuid',
        college_name: 'Engineering College',
        first_name: 'Priya',
        last_name: 'Raman',
        display_name: 'Priya Raman',
      } as any)

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING_PAGE</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>PROTECTED_APP</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialEntries: ['/app'] }
      )

      await waitFor(() => {
        expect(screen.getByText('PROTECTED_APP')).toBeInTheDocument()
      })
    })
  })
})
