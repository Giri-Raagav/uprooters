import { supabase } from '@/lib/supabase'
import type {
  Database,
  StudentProfileViewRow,
  StudentSkillStatus,
  ProficiencyLevel,
  TargetType,
} from '@/types/database.types'

type StudentUpdate = Database['public']['Tables']['students']['Update']
type StudentCareerTargetInsert = Database['public']['Tables']['student_career_targets']['Insert']

/**
 * studentService — Authoritative client service for student-owned data.
 * All queries execute under Row-Level Security with authenticated student identity.
 */
export const studentService = {
  /**
   * Fetch currently authenticated student profile using the secure database view.
   */
  async getCurrentProfile(): Promise<StudentProfileViewRow | null> {
    const { data, error } = await supabase
      .from('student_profiles_view')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('studentService.getCurrentProfile: database query returned error', error)
      return null
    }

    return ((data as unknown) as StudentProfileViewRow) || null
  },

  /**
   * Update student profile.
   */
  async updateProfile(studentId: string, updates: StudentUpdate): Promise<boolean> {
    const { error } = await (supabase.from('students') as any)
      .update(updates)
      .eq('id', studentId)

    if (error) {
      console.error('studentService.updateProfile failed', error)
      throw error
    }
    return true
  },

  /**
   * Fetch student's academic semesters and summary.
   */
  async getSemesters(studentId: string) {
    const { data: semesters, error: semError } = await supabase
      .from('student_semesters')
      .select(`
        *,
        semester_summaries (*)
      `)
      .eq('student_id', studentId)
      .order('semester_number', { ascending: true })

    if (semError) {
      console.warn('studentService.getSemesters error', semError)
      return []
    }
    return semesters || []
  },

  /**
   * Fetch subject attempts for a given semester or all semesters.
   */
  async getSubjectAttempts(studentId: string, semesterId?: string) {
    let query = supabase
      .from('student_subject_attempts')
      .select(`
        *,
        subjects (*)
      `)
      .eq('student_id', studentId)

    if (semesterId) {
      query = query.eq('student_semester_id', semesterId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('studentService.getSubjectAttempts error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch student's claimed and established skills with canonical metadata.
   */
  /**
   * Fetch the canonical skill catalog available to students.
   */
  async getCanonicalSkills() {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      console.warn('studentService.getCanonicalSkills error', error)
      return []
    }

    return data || []
  },
  async getSkills(studentId: string) {
    const { data, error } = await supabase
      .from('student_skills')
      .select(`
        *,
        skills (*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('studentService.getSkills error', error)
      return []
    }
    return data || []
  },

  /**
   * Claim or update a student skill.
   */
  async upsertSkill(studentId: string, skillId: string, proficiency: ProficiencyLevel) {
    const { data, error } = await (supabase.from('student_skills') as any)
      .upsert({
        student_id: studentId,
        skill_id: skillId,
        proficiency_level: proficiency,
        status: 'claimed' as StudentSkillStatus,
      })
      .select()

    if (error) throw error
    return data
  },

  /**
   * Fetch skill evidence records for a student.
   */
  async getSkillEvidence(studentId: string, skillId?: string) {
    let query = supabase
      .from('skill_evidence')
      .select(`
        *,
        skills (*)
      `)
      .eq('student_id', studentId)

    if (skillId) {
      query = query.eq('skill_id', skillId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('studentService.getSkillEvidence error', error)
      return []
    }
    return data || []
  },

  /**
   * Submit evidence for a student's canonical skill.
   */
  async addSkillEvidence(
    evidence: Database['public']['Tables']['skill_evidence']['Insert']
  ) {
    const { data, error } = await (supabase.from('skill_evidence') as any)
      .insert(evidence)
      .select()
      .single()

    if (error) {
      console.error('studentService.addSkillEvidence failed', error)
      throw error
    }

    return data
  },
  /**
   * Fetch student projects.
   */
  async getProjects(studentId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_skills (
          skill_id,
          skills (*)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('studentService.getProjects error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch student certifications.
   */
  async getCertifications(studentId: string) {
    const { data, error } = await supabase
      .from('certifications')
      .select(`
        *,
        certification_skills (
          skill_id,
          skills (*)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('studentService.getCertifications error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch student career targets (roles and job openings).
   */
  async getCareerTargets(studentId: string) {
    const { data, error } = await supabase
      .from('student_career_targets')
      .select(`
        *,
        roles (*),
        job_openings (
          *,
          companies (*)
        )
      `)
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false })

    if (error) {
      console.warn('studentService.getCareerTargets error', error)
      return []
    }
    return data || []
  },

  /**
   * Add a new career target (enforcing exclusivity: role OR job_opening).
   */
  async addCareerTarget(
    studentId: string,
    targetType: TargetType,
    targetId: string,
    isPrimary = false
  ) {
    // If setting as primary, demote existing primary target first
    if (isPrimary) {
      await (supabase.from('student_career_targets') as any)
        .update({ is_primary: false })
        .eq('student_id', studentId)
        .eq('is_primary', true)
    }

    const payload: StudentCareerTargetInsert = {
      student_id: studentId,
      target_type: targetType,
      role_id: targetType === 'role' ? targetId : null,
      job_opening_id: targetType === 'job_opening' ? targetId : null,
      is_primary: isPrimary,
      status: 'active',
    }

    const { data, error } = await (supabase.from('student_career_targets') as any)
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Set an existing target as primary.
   */
  async setPrimaryTarget(studentId: string, targetId: string) {
    await (supabase.from('student_career_targets') as any)
      .update({ is_primary: false })
      .eq('student_id', studentId)
      .eq('is_primary', true)

    const { data, error } = await (supabase.from('student_career_targets') as any)
      .update({ is_primary: true })
      .eq('id', targetId)
      .eq('student_id', studentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove a career target.
   */
  async removeCareerTarget(targetId: string, studentId: string) {
    const { error } = await supabase
      .from('student_career_targets')
      .delete()
      .eq('id', targetId)
      .eq('student_id', studentId)

    if (error) throw error
    return true
  },
}

