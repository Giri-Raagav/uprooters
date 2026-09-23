import { render, type RenderOptions } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { RoleProvider } from '@/contexts/RoleContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { routes } from '@/app/routes'
import type { StudentProfileViewRow, ApplicationRole } from '@/types/database.types'

const defaultTestUser: User = {
  id: 'test-student-user-id',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'student@example.edu',
}

const defaultTestStudent: StudentProfileViewRow = {
  id: 'test-student-id',
  user_id: 'test-student-user-id',
  college_id: 'test-college-id',
  college_name: 'Rajalakshmi Institute of Technology',
  college_city: 'Chennai',
  college_state: 'Tamil Nadu',
  department_id: 'test-dept-id',
  department_name: 'Electronics and Communication Engineering',
  department_short_name: 'ECE',
  first_name: 'Alex',
  last_name: 'Morgan',
  display_name: 'Alex Morgan',
  degree: 'B.E.',
  branch: 'ECE',
  admission_year: 2022,
  expected_graduation_year: 2026,
  current_semester: 6,
  date_of_birth: null,
  profile_photo_url: null,
  bio: 'ECE Student',
  location: 'Chennai',
  country: 'India',
  phone_number: null,
  github_url: null,
  linkedin_url: null,
  portfolio_url: null,
  career_interests: ['Embedded Systems', 'VLSI'],
  profile_completed: true,
  profile_completion_percentage: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export interface RenderRoutesOptions extends RenderOptions {
  auth?: {
    user?: User | null
    student?: StudentProfileViewRow | null
    roles?: ApplicationRole[]
  }
}

/**
 * Renders the application route tree with MemoryRouter for reliable Vitest navigation.
 * Production uses BrowserRouter via App.tsx — behavior under test matches route config.
 */
export function renderRoutes(initialEntries: string[] = ['/'], options?: RenderRoutesOptions) {
  const router = createMemoryRouter(routes, { initialEntries })

  const authUser = options?.auth?.user !== undefined ? options.auth.user : defaultTestUser
  const authStudent = options?.auth?.student !== undefined ? options.auth.student : defaultTestStudent
  const authRoles = options?.auth?.roles !== undefined ? options.auth.roles : (['student'] as ApplicationRole[])

  return {
    router,
    ...render(
      <ThemeProvider>
        <RoleProvider>
          <AuthProvider
            initialUser={authUser}
            initialStudent={authStudent}
            initialRoles={authRoles}
            initialLoading={false}
          >
            <RouterProvider router={router} />
          </AuthProvider>
        </RoleProvider>
      </ThemeProvider>,
      options
    ),
  }
}
