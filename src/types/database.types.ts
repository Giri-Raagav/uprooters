/**
-- ============================================================================
-- UPROOTERS Database Types — Authoritative Schema Types
-- Synced with: supabase/migrations/001_initial_schema.sql
-- Spec references:
--   docs/05_DATABASE_SPEC.md (§3–§12)
--   docs/07_SECURITY_MODEL.md (§6–§15)
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
          profile_completed: boolean
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
          profile_completed?: boolean
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
          profile_completed?: boolean
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
    }
    Views: {
      [_ in never]: never
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
    }
    Enums: {
      application_role: ApplicationRole
      institution_status: InstitutionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
