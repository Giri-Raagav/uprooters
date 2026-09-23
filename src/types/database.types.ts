/**
-- ============================================================================
-- UPROOTERS Database Types — Authoritative Schema Types
-- Synced with:
--   - supabase/migrations/001_initial_schema.sql
--   - supabase/migrations/002_seed_phase1_taxonomy.sql
--   - supabase/migrations/003_student_profile.sql
--   - supabase/migrations/004_academic_system.sql
-- Spec references:
--   docs/05_DATABASE_SPEC.md (§3–§18, §19–§22, §76–§78)
--   docs/07_SECURITY_MODEL.md (§6–§15, §17, §24, §27–§30)
-- ============================================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApplicationRole = 'student' | 'data_editor' | 'verifier' | 'super_admin'
export type InstitutionStatus = 'active' | 'inactive' | 'archived'
export type SkillStatus = 'active' | 'inactive' | 'archived'

export type SubjectType = 'theory' | 'laboratory' | 'project' | 'elective' | 'mandatory' | 'other'
export type SemesterStatus = 'in_progress' | 'completed' | 'upcoming' | 'archived'
export type AttemptResultStatus = 'pass' | 'fail' | 'arrear' | 'retake' | 'withheld' | 'absent' | 'in_progress'

export type ProjectType =
  | 'academic'
  | 'capstone'
  | 'personal'
  | 'hackathon'
  | 'competition'
  | 'open_source'
  | 'client'
  | 'other'

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type StudentSkillStatus = 'claimed' | 'supported' | 'verified' | 'archived'
export type EvidenceType =
  | 'academic_coursework'
  | 'project'
  | 'certification'
  | 'internship'
  | 'experience'
  | 'assessment'
  | 'portfolio'
  | 'other'
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type VerificationLevel =
  | 'unverified'
  | 'official_source'
  | 'official_ats'
  | 'corroborated_public_source'
  | 'manually_curated'

export type SkillCategory =
  | 'PROGRAMMING'
  | 'EMBEDDED'
  | 'RTOS'
  | 'MICROCONTROLLERS'
  | 'VLSI'
  | 'FPGA'
  | 'SEMICONDUCTOR'
  | 'ELECTRONICS'
  | 'HARDWARE'
  | 'PCB'
  | 'COMMUNICATION'
  | 'RF_WIRELESS'
  | 'IOT'
  | 'ROBOTICS'
  | 'SOFTWARE'
  | 'TOOLS'
  | 'OTHER'

export type CompanyStatus = 'active' | 'inactive' | 'archived'
export type RoleStatus = 'active' | 'inactive' | 'archived'
export type WorkMode = 'on_site' | 'hybrid' | 'remote'
export type EmploymentType = 'full_time' | 'internship' | 'contract' | 'co_op'
export type JobOpeningStatus = 'draft' | 'published' | 'closed' | 'archived' | 'stale'
export type TargetType = 'role' | 'job_opening'
export type RequirementType = 'skill' | 'degree' | 'branch' | 'cgpa' | 'experience' | 'certification' | 'other'
export type RequirementScope = 'required' | 'preferred'
export type ReadinessEvaluationStatus = 'requested' | 'validating' | 'calculating' | 'completed' | 'failed'
export type CanonicalReadinessResultStatus = 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'unknown'
export type ReadinessMatchType = 'exact' | 'related' | 'parent' | 'child' | 'none' | 'not_applicable'
export type ReadinessEvidenceStatus =
  | 'verified'
  | 'unverified'
  | 'supported'
  | 'unsupported_claim'
  | 'missing'
  | 'stale'
  | 'academic_record'
  | 'calculated_cgpa'
  | 'missing_data'
  | 'stale_requirement'
  | 'not_applicable'

export interface EffectiveRequirementRow {
  id: string
  target_type: TargetType
  role_id: string | null
  job_opening_id: string | null
  requirement_type: RequirementType
  skill_id: string | null
  requirement_scope: RequirementScope
  is_blocking: boolean
  title: string
  description: string | null
  required_value: string | null
  weight: number
  verification_status: VerificationStatus
  verification_level: VerificationLevel
  source_url: string | null
  is_inherited: boolean
}

export interface StudentProfileViewRow {
  id: string
  user_id: string
  college_id: string
  college_name: string
  college_city: string
  college_state: string
  department_id: string | null
  department_name: string | null
  department_short_name: string | null
  first_name: string
  last_name: string
  display_name: string
  degree: string
  branch: string
  admission_year: number
  expected_graduation_year: number
  current_semester: number
  date_of_birth: string | null
  profile_photo_url: string | null
  bio: string | null
  location: string | null
  country: string
  phone_number: string | null
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  career_interests: string[]
  profile_completed: boolean
  profile_completion_percentage: number
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: ApplicationRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: ApplicationRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: ApplicationRole
          created_at?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          id: string
          name: string
          normalized_name: string
          slug: string
          website: string | null
          city: string
          state: string
          country: string
          status: InstitutionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          normalized_name: string
          slug: string
          website?: string | null
          city: string
          state: string
          country?: string
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          normalized_name?: string
          slug?: string
          website?: string | null
          city?: string
          state?: string
          country?: string
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          college_id: string
          name: string
          normalized_name: string
          short_name: string | null
          status: InstitutionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          college_id: string
          name: string
          normalized_name: string
          short_name?: string | null
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          college_id?: string
          name?: string
          normalized_name?: string
          short_name?: string | null
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'departments_college_id_fkey'
            columns: ['college_id']
            referencedRelation: 'colleges'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          id: string
          user_id: string
          college_id: string
          department_id: string | null
          first_name: string
          last_name: string
          display_name: string
          degree: string
          branch: string
          admission_year: number
          expected_graduation_year: number
          current_semester: number
          date_of_birth: string | null
          profile_photo_url: string | null
          bio: string | null
          location: string | null
          country: string
          phone_number: string | null
          github_url: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          career_interests: string[]
          profile_completed: boolean
          profile_completion_percentage: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          college_id: string
          department_id?: string | null
          first_name: string
          last_name: string
          display_name?: string
          degree?: string
          branch?: string
          admission_year: number
          expected_graduation_year: number
          current_semester?: number
          date_of_birth?: string | null
          profile_photo_url?: string | null
          bio?: string | null
          location?: string | null
          country?: string
          phone_number?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          career_interests?: string[]
          profile_completed?: boolean
          profile_completion_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          college_id?: string
          department_id?: string | null
          first_name?: string
          last_name?: string
          display_name?: string
          degree?: string
          branch?: string
          admission_year?: number
          expected_graduation_year?: number
          current_semester?: number
          date_of_birth?: string | null
          profile_photo_url?: string | null
          bio?: string | null
          location?: string | null
          country?: string
          phone_number?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          career_interests?: string[]
          profile_completed?: boolean
          profile_completion_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_college_id_fkey'
            columns: ['college_id']
            referencedRelation: 'colleges'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_department_id_fkey'
            columns: ['department_id']
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      skills: {
        Row: {
          id: string
          name: string
          normalized_name: string
          slug: string
          category: SkillCategory
          parent_skill_id: string | null
          description: string | null
          status: SkillStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          normalized_name: string
          slug: string
          category: SkillCategory
          parent_skill_id?: string | null
          description?: string | null
          status?: SkillStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          normalized_name?: string
          slug?: string
          category?: SkillCategory
          parent_skill_id?: string | null
          description?: string | null
          status?: SkillStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skills_parent_skill_id_fkey'
            columns: ['parent_skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      skill_aliases: {
        Row: {
          id: string
          skill_id: string
          alias: string
          normalized_alias: string
          created_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          alias: string
          normalized_alias: string
          created_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          alias?: string
          normalized_alias?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skill_aliases_skill_id_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          department_id: string
          code: string
          name: string
          normalized_name: string
          credits: number
          subject_type: SubjectType
          status: InstitutionStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id: string
          code: string
          name: string
          normalized_name?: string
          credits: number
          subject_type?: SubjectType
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string
          code?: string
          name?: string
          normalized_name?: string
          credits?: number
          subject_type?: SubjectType
          status?: InstitutionStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subjects_department_id_fkey'
            columns: ['department_id']
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
      student_semesters: {
        Row: {
          id: string
          student_id: string
          semester_number: number
          academic_year: string
          semester_label: string
          start_date: string | null
          end_date: string | null
          status: SemesterStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          semester_number: number
          academic_year: string
          semester_label: string
          start_date?: string | null
          end_date?: string | null
          status?: SemesterStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          semester_number?: number
          academic_year?: string
          semester_label?: string
          start_date?: string | null
          end_date?: string | null
          status?: SemesterStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_semesters_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      student_subject_attempts: {
        Row: {
          id: string
          student_id: string
          semester_id: string
          subject_id: string
          attempt_number: number
          marks: number | null
          grade: string | null
          grade_points: number | null
          credits_attempted: number
          credits_earned: number
          result_status: AttemptResultStatus
          is_passing: boolean
          is_latest_attempt: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          semester_id: string
          subject_id: string
          attempt_number?: number
          marks?: number | null
          grade?: string | null
          grade_points?: number | null
          credits_attempted: number
          credits_earned?: number
          result_status?: AttemptResultStatus
          is_passing?: boolean
          is_latest_attempt?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          semester_id?: string
          subject_id?: string
          attempt_number?: number
          marks?: number | null
          grade?: string | null
          grade_points?: number | null
          credits_attempted?: number
          credits_earned?: number
          result_status?: AttemptResultStatus
          is_passing?: boolean
          is_latest_attempt?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_subject_attempts_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_subject_attempts_semester_student_fkey'
            columns: ['semester_id', 'student_id']
            referencedRelation: 'student_semesters'
            referencedColumns: ['id', 'student_id']
          },
          {
            foreignKeyName: 'student_subject_attempts_subject_id_fkey'
            columns: ['subject_id']
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
        ]
      }
      semester_summaries: {
        Row: {
          id: string
          student_id: string
          semester_id: string
          sgpa: number | null
          attempted_credits: number
          earned_credits: number
          backlogs: number
          calculation_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          semester_id: string
          sgpa?: number | null
          attempted_credits?: number
          earned_credits?: number
          backlogs?: number
          calculation_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          semester_id?: string
          sgpa?: number | null
          attempted_credits?: number
          earned_credits?: number
          backlogs?: number
          calculation_version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'semester_summaries_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'semester_summaries_semester_student_fkey'
            columns: ['semester_id', 'student_id']
            referencedRelation: 'student_semesters'
            referencedColumns: ['id', 'student_id']
          },
        ]
      }
      student_skills: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          proficiency_level: ProficiencyLevel
          status: StudentSkillStatus
          confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          proficiency_level?: ProficiencyLevel
          status?: StudentSkillStatus
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          proficiency_level?: ProficiencyLevel
          status?: StudentSkillStatus
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'student_skills_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_skills_skill_id_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      skill_evidence: {
        Row: {
          id: string
          student_id: string
          skill_id: string
          student_skill_id: string | null
          evidence_type: EvidenceType
          title: string
          description: string | null
          evidence_url: string | null
          subject_id: string | null
          attempt_id: string | null
          project_id: string | null
          certification_id: string | null
          reference_id: string | null
          verification_status: VerificationStatus
          verification_level: VerificationLevel
          verified_at: string | null
          verified_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_id: string
          student_skill_id?: string | null
          evidence_type: EvidenceType
          title: string
          description?: string | null
          evidence_url?: string | null
          subject_id?: string | null
          attempt_id?: string | null
          project_id?: string | null
          certification_id?: string | null
          reference_id?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_id?: string
          student_skill_id?: string | null
          evidence_type?: EvidenceType
          title?: string
          description?: string | null
          evidence_url?: string | null
          subject_id?: string | null
          attempt_id?: string | null
          project_id?: string | null
          certification_id?: string | null
          reference_id?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'skill_evidence_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_evidence_skill_id_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_evidence_student_skill_fkey'
            columns: ['student_skill_id', 'student_id', 'skill_id']
            referencedRelation: 'student_skills'
            referencedColumns: ['id', 'student_id', 'skill_id']
          },
          {
            foreignKeyName: 'skill_evidence_subject_id_fkey'
            columns: ['subject_id']
            referencedRelation: 'subjects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_evidence_attempt_id_fkey'
            columns: ['attempt_id']
            referencedRelation: 'student_subject_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_evidence_project_id_fkey'
            columns: ['project_id']
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'skill_evidence_certification_id_fkey'
            columns: ['certification_id']
            referencedRelation: 'certifications'
            referencedColumns: ['id']
          },
        ]
      }
      projects: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string | null
          project_type: ProjectType
          role_responsibility: string | null
          start_date: string | null
          end_date: string | null
          project_url: string | null
          documentation_url: string | null
          verification_status: VerificationStatus
          verification_level: VerificationLevel
          verified_at: string | null
          verified_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description?: string | null
          project_type?: ProjectType
          role_responsibility?: string | null
          start_date?: string | null
          end_date?: string | null
          project_url?: string | null
          documentation_url?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string | null
          project_type?: ProjectType
          role_responsibility?: string | null
          start_date?: string | null
          end_date?: string | null
          project_url?: string | null
          documentation_url?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      project_skills: {
        Row: {
          id: string
          project_id: string
          student_id: string
          skill_id: string
          contribution_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          student_id: string
          skill_id: string
          contribution_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          student_id?: string
          skill_id?: string
          contribution_description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_skills_project_student_fkey'
            columns: ['project_id', 'student_id']
            referencedRelation: 'projects'
            referencedColumns: ['id', 'student_id']
          },
          {
            foreignKeyName: 'project_skills_skill_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_skills_student_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      certifications: {
        Row: {
          id: string
          student_id: string
          name: string
          issuing_organization: string
          issue_date: string
          expiry_date: string | null
          credential_id: string | null
          credential_url: string | null
          verification_status: VerificationStatus
          verification_level: VerificationLevel
          verified_at: string | null
          verified_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          name: string
          issuing_organization: string
          issue_date: string
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          name?: string
          issuing_organization?: string
          issue_date?: string
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          verified_at?: string | null
          verified_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certifications_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      certification_skills: {
        Row: {
          id: string
          certification_id: string
          student_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          certification_id: string
          student_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          certification_id?: string
          student_id?: string
          skill_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certification_skills_cert_student_fkey'
            columns: ['certification_id', 'student_id']
            referencedRelation: 'certifications'
            referencedColumns: ['id', 'student_id']
          },
          {
            foreignKeyName: 'certification_skills_skill_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certification_skills_student_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          normalized_name: string
          slug: string
          website: string | null
          industry: string
          description: string | null
          status: CompanyStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          website?: string | null
          industry?: string
          description?: string | null
          status?: CompanyStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          website?: string | null
          industry?: string
          description?: string | null
          status?: CompanyStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          slug: string
          domain: string
          description: string | null
          eligible_degrees: string[]
          eligible_branches: string[]
          minimum_cgpa: number | null
          experience_months: number
          status: RoleStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          domain?: string
          description?: string | null
          eligible_degrees?: string[]
          eligible_branches?: string[]
          minimum_cgpa?: number | null
          experience_months?: number
          status?: RoleStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          domain?: string
          description?: string | null
          eligible_degrees?: string[]
          eligible_branches?: string[]
          minimum_cgpa?: number | null
          experience_months?: number
          status?: RoleStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_openings: {
        Row: {
          id: string
          company_id: string
          role_id: string
          title: string
          description: string | null
          location: string | null
          work_mode: WorkMode
          employment_type: EmploymentType
          eligible_degrees: string[] | null
          eligible_branches: string[] | null
          minimum_cgpa: number | null
          experience_months: number | null
          source_url: string | null
          status: JobOpeningStatus
          published_at: string
          closing_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          role_id: string
          title: string
          description?: string | null
          location?: string | null
          work_mode?: WorkMode
          employment_type?: EmploymentType
          eligible_degrees?: string[] | null
          eligible_branches?: string[] | null
          minimum_cgpa?: number | null
          experience_months?: number | null
          source_url?: string | null
          status?: JobOpeningStatus
          published_at?: string
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          role_id?: string
          title?: string
          description?: string | null
          location?: string | null
          work_mode?: WorkMode
          employment_type?: EmploymentType
          eligible_degrees?: string[] | null
          eligible_branches?: string[] | null
          minimum_cgpa?: number | null
          experience_months?: number | null
          source_url?: string | null
          status?: JobOpeningStatus
          published_at?: string
          closing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'job_openings_company_id_fkey'
            columns: ['company_id']
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_openings_role_id_fkey'
            columns: ['role_id']
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
        ]
      }
      career_requirements: {
        Row: {
          id: string
          target_type: TargetType
          role_id: string | null
          job_opening_id: string | null
          requirement_type: RequirementType
          skill_id: string | null
          requirement_scope: RequirementScope
          is_blocking: boolean
          title: string
          description: string | null
          required_value: string | null
          weight: number
          verification_status: VerificationStatus
          verification_level: VerificationLevel
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          target_type: TargetType
          role_id?: string | null
          job_opening_id?: string | null
          requirement_type: RequirementType
          skill_id?: string | null
          requirement_scope?: RequirementScope
          is_blocking?: boolean
          title: string
          description?: string | null
          required_value?: string | null
          weight?: number
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          target_type?: TargetType
          role_id?: string | null
          job_opening_id?: string | null
          requirement_type?: RequirementType
          skill_id?: string | null
          requirement_scope?: RequirementScope
          is_blocking?: boolean
          title?: string
          description?: string | null
          required_value?: string | null
          weight?: number
          verification_status?: VerificationStatus
          verification_level?: VerificationLevel
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'career_requirements_role_id_fkey'
            columns: ['role_id']
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'career_requirements_job_opening_id_fkey'
            columns: ['job_opening_id']
            referencedRelation: 'job_openings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'career_requirements_skill_id_fkey'
            columns: ['skill_id']
            referencedRelation: 'skills'
            referencedColumns: ['id']
          },
        ]
      }
      readiness_evaluations: {
        Row: {
          id: string
          student_id: string
          target_type: TargetType
          role_id: string | null
          job_opening_id: string | null
          status: ReadinessEvaluationStatus
          overall_score: number
          required_score: number
          preferred_score: number
          is_eligible: boolean
          has_unresolved_blocking: boolean
          requirement_count: number
          satisfied_count: number
          partial_count: number
          missing_count: number
          unknown_count: number
          blocking_count: number
          engine_version: string
          calculated_at: string
          snapshot: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          target_type: TargetType
          role_id?: string | null
          job_opening_id?: string | null
          status?: ReadinessEvaluationStatus
          overall_score: number
          required_score: number
          preferred_score: number
          is_eligible?: boolean
          has_unresolved_blocking?: boolean
          requirement_count?: number
          satisfied_count?: number
          partial_count?: number
          missing_count?: number
          unknown_count?: number
          blocking_count?: number
          engine_version?: string
          calculated_at?: string
          snapshot?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          target_type?: TargetType
          role_id?: string | null
          job_opening_id?: string | null
          status?: ReadinessEvaluationStatus
          overall_score?: number
          required_score?: number
          preferred_score?: number
          is_eligible?: boolean
          has_unresolved_blocking?: boolean
          requirement_count?: number
          satisfied_count?: number
          partial_count?: number
          missing_count?: number
          unknown_count?: number
          blocking_count?: number
          engine_version?: string
          calculated_at?: string
          snapshot?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'readiness_evaluations_student_id_fkey'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'readiness_evaluations_role_id_fkey'
            columns: ['role_id']
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'readiness_evaluations_job_opening_id_fkey'
            columns: ['job_opening_id']
            referencedRelation: 'job_openings'
            referencedColumns: ['id']
          },
        ]
      }
      readiness_requirement_results: {
        Row: {
          id: string
          evaluation_id: string
          student_id: string
          requirement_id: string
          requirement_type: string
          requirement_scope: RequirementScope
          is_blocking: boolean
          result_status: CanonicalReadinessResultStatus
          match_type: ReadinessMatchType
          evidence_status: ReadinessEvidenceStatus
          score_contribution: number
          evidence_count: number
          verified_evidence_count: number
          evidence_references: Json
          explanation: string
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          student_id: string
          requirement_id: string
          requirement_type: string
          requirement_scope: RequirementScope
          is_blocking?: boolean
          result_status: CanonicalReadinessResultStatus
          match_type?: ReadinessMatchType
          evidence_status: ReadinessEvidenceStatus
          score_contribution?: number
          evidence_count?: number
          verified_evidence_count?: number
          evidence_references?: Json
          explanation: string
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          student_id?: string
          requirement_id?: string
          requirement_type?: string
          requirement_scope?: RequirementScope
          is_blocking?: boolean
          result_status?: CanonicalReadinessResultStatus
          match_type?: ReadinessMatchType
          evidence_status?: ReadinessEvidenceStatus
          score_contribution?: number
          evidence_count?: number
          verified_evidence_count?: number
          evidence_references?: Json
          explanation?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fk_readiness_req_result_eval_direct'
            columns: ['evaluation_id']
            referencedRelation: 'readiness_evaluations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_readiness_req_result_student'
            columns: ['student_id']
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'readiness_requirement_results_requirement_id_fkey'
            columns: ['requirement_id']
            referencedRelation: 'career_requirements'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      student_profiles_view: {
        Row: StudentProfileViewRow
        Relationships: [
          {
            foreignKeyName: 'students_college_id_fkey'
            columns: ['college_id']
            referencedRelation: 'colleges'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_department_id_fkey'
            columns: ['department_id']
            referencedRelation: 'departments'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: { requested_role: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_student_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      get_current_student_profile: {
        Args: Record<PropertyKey, never>
        Returns: StudentProfileViewRow[]
      }
      calculate_student_cgpa: {
        Args: { p_student_id: string }
        Returns: number | null
      }
      reconcile_semester_summary: {
        Args: { p_student_id: string; p_semester_id: string }
        Returns: void
      }
      sync_student_skill_status: {
        Args: { p_student_id: string; p_skill_id: string }
        Returns: void
      }
      resolve_effective_requirements: {
        Args: { p_target_type: string; p_target_id: string }
        Returns: EffectiveRequirementRow[]
      }
      evaluate_student_readiness: {
        Args: {
          p_student_id: string
          p_target_type: string
          p_target_id: string
          p_engine_config?: Json
        }
        Returns: string
      }
    }
    Enums: {
      application_role: ApplicationRole
      institution_status: InstitutionStatus
      skill_category: SkillCategory
      skill_status: SkillStatus
      subject_type: SubjectType
      semester_status: SemesterStatus
      attempt_result_status: AttemptResultStatus
      proficiency_level: ProficiencyLevel
      student_skill_status: StudentSkillStatus
      evidence_type: EvidenceType
      verification_status: VerificationStatus
      verification_level: VerificationLevel
      project_type: ProjectType
      company_status: CompanyStatus
      role_status: RoleStatus
      work_mode: WorkMode
      employment_type: EmploymentType
      job_opening_status: JobOpeningStatus
      target_type: TargetType
      requirement_type: RequirementType
      requirement_scope: RequirementScope
      readiness_evaluation_status: ReadinessEvaluationStatus
      canonical_readiness_result_status: CanonicalReadinessResultStatus
      readiness_match_type: ReadinessMatchType
      readiness_evidence_status: ReadinessEvidenceStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
