import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { supabase } from '@/lib/supabase'
import type { Database, ApplicationRole, InstitutionStatus } from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql')

describe('Milestone 03 — Database Foundation & Initial Core Schema', () => {
  describe('Migration 001 SQL File Integrity', () => {
    it('migration file exists at supabase/migrations/001_initial_schema.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('migration file is non-empty and contains valid header documentation', () => {
      const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
      expect(sql.length).toBeGreaterThan(1000)
      expect(sql).toContain('Migration 001: Initial Core Schema & Security Foundation')
      expect(sql).toContain('04_ARCHITECTURE.md')
      expect(sql).toContain('05_DATABASE_SPEC.md')
      expect(sql).toContain('07_SECURITY_MODEL.md')
      expect(sql).toContain('08_DEVELOPMENT_RULES.md')
    })
  })

  describe('Core Schema Structure in Migration 001', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

    it('enables pgcrypto extension for UUID generation', () => {
      expect(sql).toMatch(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"pgcrypto"/i)
    })

    it('defines automated handle_updated_at trigger function', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.handle_updated_at()')
      expect(sql).toContain('NEW.updated_at = now()')
    })

    it('creates public.user_roles table with correct roles and constraints', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_roles')
      expect(sql).toContain("CHECK (role IN ('student', 'data_editor', 'verifier', 'super_admin'))")
      expect(sql).toContain('REFERENCES auth.users(id) ON DELETE CASCADE')
      expect(sql).toContain('CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)')
    })

    it('creates public.colleges table with normalized_name and slug constraints', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.colleges')
      expect(sql).toContain('slug TEXT NOT NULL UNIQUE CHECK (slug ~ \'^[a-z0-9-]+$\')')
      expect(sql).toContain('normalized_name TEXT NOT NULL UNIQUE')
      expect(sql).toContain("status VARCHAR(20) NOT NULL DEFAULT 'active'")
      expect(sql).toContain('BEFORE UPDATE ON public.colleges')
    })

    it('creates public.departments table scoped uniquely per college', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.departments')
      expect(sql).toContain('college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT')
      expect(sql).toContain('CONSTRAINT departments_college_normalized_name_key UNIQUE (college_id, normalized_name)')
      expect(sql).toContain('BEFORE UPDATE ON public.departments')
    })

    it('creates public.students table with academic constraints', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.students')
      expect(sql).toContain('user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE')
      expect(sql).toContain('college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT')
      expect(sql).toContain('department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT')
      expect(sql).toContain('admission_year INT NOT NULL CHECK (admission_year >= 2000 AND admission_year <= 2100)')
      expect(sql).toContain('CHECK (expected_graduation_year >= admission_year)')
      expect(sql).toContain('CHECK (current_semester >= 1 AND current_semester <= 12)')
      expect(sql).toContain('BEFORE UPDATE ON public.students')
    })

    it('implements cross-institution validation trigger for students', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.handle_student_before_insert_or_update()')
      expect(sql).toContain('Department does not belong to the selected college')
      expect(sql).toContain('check_student_institution_and_name')
    })
  })

  describe('Security Design & Non-Recursive RLS Verification', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

    it('helper functions are SECURITY DEFINER with fixed search_path', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.has_role(requested_role text)')
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_admin()')
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_current_student_id()')

      // All security functions must have search_path explicitly pinned to prevent search_path injection
      const functionBlocks = sql.split('CREATE OR REPLACE FUNCTION')
      const securityDefinerBlocks = functionBlocks.filter(b => b.includes('SECURITY DEFINER'))
      expect(securityDefinerBlocks.length).toBeGreaterThanOrEqual(4)

      for (const block of securityDefinerBlocks) {
        expect(block).toContain('SET search_path = public, pg_temp')
      }
    })

    it('enables Row Level Security (RLS) on all created tables', () => {
      expect(sql).toContain('ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;')
      expect(sql).toContain('ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;')
      expect(sql).toContain('ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;')
      expect(sql).toContain('ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;')
    })

    it('prevents recursive RLS evaluation on user_roles', () => {
      // The self-read policy on user_roles must directly check user_id = auth.uid()
      // without calling has_role() or is_admin(), which prevents infinite recursion.
      expect(sql).toContain('CREATE POLICY "user_roles_select_own"')
      expect(sql).toContain('USING (user_id = auth.uid());')
    })

    it('enforces student profile ownership without privilege escalation', () => {
      // Student INSERT must strictly verify user_id matches the authenticated caller
      expect(sql).toContain('CREATE POLICY "students_insert_own"')
      expect(sql).toContain('WITH CHECK (user_id = auth.uid());')

      // Student UPDATE must strictly verify user_id = auth.uid() or is_admin()
      expect(sql).toContain('CREATE POLICY "students_update_own_or_admin"')
      expect(sql).toContain('USING (user_id = auth.uid() OR public.is_admin())')
    })

    it('does not create any super_admin accounts or insert mock auth users', () => {
      expect(sql).not.toContain('INSERT INTO auth.users')
      expect(sql).not.toContain('INSERT INTO public.user_roles')
    })
  })

  describe('TypeScript Database Types Alignment', () => {
    it('defines Database interface with authoritative public schema', () => {
      // Type assertion compile test
      type PublicTables = Database['public']['Tables']
      type CollegesRow = PublicTables['colleges']['Row']
      type DepartmentsRow = PublicTables['departments']['Row']
      type UserRolesRow = PublicTables['user_roles']['Row']
      type StudentsRow = PublicTables['students']['Row']

      const mockCollege: CollegesRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Rajalakshmi Institute of Technology',
        normalized_name: 'rajalakshmi institute of technology',
        slug: 'rit-chennai',
        website: 'https://ritchennai.org',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        status: 'active' as InstitutionStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockDepartment: DepartmentsRow = {
        id: '123e4567-e89b-12d3-a456-426614174099',
        college_id: mockCollege.id,
        name: 'Electronics and Communication Engineering',
        normalized_name: 'electronics and communication engineering',
        short_name: 'ECE',
        status: 'active' as InstitutionStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockRole: UserRolesRow = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        user_id: '323e4567-e89b-12d3-a456-426614174002',
        role: 'student' as ApplicationRole,
        created_at: new Date().toISOString(),
      }

      const mockStudent: StudentsRow = {
        id: '423e4567-e89b-12d3-a456-426614174003',
        user_id: mockRole.user_id,
        college_id: mockCollege.id,
        department_id: mockDepartment.id,
        first_name: 'Giri',
        last_name: 'Raagav',
        display_name: 'Giri Raagav',
        degree: 'B.E.',
        branch: 'ECE',
        admission_year: 2024,
        expected_graduation_year: 2028,
        current_semester: 3,
        date_of_birth: null,
        profile_photo_url: null,
        bio: null,
        location: 'Chennai',
        country: 'India',
        profile_completed: false,
        phone_number: null,
        github_url: null,
        linkedin_url: null,
        portfolio_url: null,
        career_interests: [],
        profile_completion_percentage: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(mockCollege.id).toBeDefined()
      expect(mockRole.role).toBe('student')
      expect(mockStudent.branch).toBe('ECE')
    })

    it('exports supabase client typed against Database contract', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.from).toBe('function')
      // Validates that querying tables compiles against the generated Database schema
      const collegesQuery = supabase.from('colleges')
      expect(collegesQuery).toBeDefined()
    })
  })
})
