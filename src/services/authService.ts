import { supabase } from '@/lib/supabase'
import type { ApplicationRole } from '@/types/database.types'

export interface OnboardingParams {
  firstName: string
  lastName: string
  collegeId: string
  departmentId?: string | null
  degree?: string
  branch?: string
  admissionYear: number
  expectedGraduationYear: number
  currentSemester?: number
}

export interface CollegeOption {
  id: string
  name: string
  city: string
  state: string
}

export interface DepartmentOption {
  id: string
  college_id: string
  name: string
  short_name: string | null
}

/**
 * authService — Authoritative client service for authentication and onboarding.
 * Never stores or exposes secrets. Relies on Supabase Auth & RLS.
 */
export const authService = {
  /**
   * Register a new user with Supabase Auth (email/password).
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Authenticate an existing user with email/password.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  /**
   * Invalidate current session and sign out.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Fetch current active session.
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.warn('authService.getSession error', error)
      return null
    }
    return data.session
  },

  /**
   * Fetch roles assigned to the currently authenticated user.
   */
  async getUserRoles(userId: string): Promise<ApplicationRole[]> {
    const { data, error } = await (supabase.from('user_roles') as any)
      .select('role')
      .eq('user_id', userId)

    if (error) {
      console.warn('authService.getUserRoles error', error)
      return []
    }

    return (data || []).map((r: { role: string }) => r.role as ApplicationRole)
  },

  /**
   * Fetch active canonical colleges for student onboarding selection.
   */
  async getActiveColleges(): Promise<CollegeOption[]> {
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, city, state')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      console.warn('authService.getActiveColleges error', error)
      return []
    }

    return (data as CollegeOption[]) || []
  },

  /**
   * Fetch active departments for a chosen college.
   */
  async getDepartmentsForCollege(collegeId: string): Promise<DepartmentOption[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('id, college_id, name, short_name')
      .eq('college_id', collegeId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      console.warn('authService.getDepartmentsForCollege error', error)
      return []
    }

    return (data as DepartmentOption[]) || []
  },

  /**
   * Complete student onboarding atomically via the SECURITY DEFINER RPC.
   * Identity is determined strictly by auth.uid() on the server.
   */
  async completeOnboarding(params: OnboardingParams): Promise<string> {
    const { data, error } = await (supabase as any).rpc('complete_student_onboarding', {
      p_first_name: params.firstName,
      p_last_name: params.lastName,
      p_college_id: params.collegeId,
      p_department_id: params.departmentId || null,
      p_degree: params.degree || 'B.E.',
      p_branch: params.branch || 'ECE',
      p_admission_year: params.admissionYear,
      p_expected_graduation_year: params.expectedGraduationYear,
      p_current_semester: params.currentSemester || 1,
    })

    if (error) throw error
    return data as string
  },
}
