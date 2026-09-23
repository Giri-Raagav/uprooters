import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/010_student_provisioning.sql')

describe('Milestone — Student Provisioning Foundation & Secure Onboarding RPC', () => {
  describe('Migration 010 SQL File Integrity', () => {
    it('migration file exists at supabase/migrations/010_student_provisioning.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('migration file contains valid documentation and specification references', () => {
      const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
      expect(sql.length).toBeGreaterThan(500)
      expect(sql).toContain('Migration: 010_student_provisioning.sql')
      expect(sql).toContain('01_PRODUCT_SPEC.md')
      expect(sql).toContain('04_ARCHITECTURE.md')
      expect(sql).toContain('05_DATABASE_SPEC.md')
      expect(sql).toContain('07_SECURITY_MODEL.md')
    })
  })

  describe('complete_student_onboarding RPC Contract & Security Design', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

    it('declares complete_student_onboarding with SECURITY DEFINER and fixed search_path', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.complete_student_onboarding(')
      expect(sql).toContain('SECURITY DEFINER')
      expect(sql).toContain('SET search_path = public, pg_temp')
    })

    it('identifies caller strictly from auth.uid() without trusting client-provided user_id', () => {
      expect(sql).toContain('v_user_id := auth.uid();')
      expect(sql).toContain('IF v_user_id IS NULL THEN')
      expect(sql).toContain('Authentication required: caller has no active authenticated session')
    })

    it('enforces string sanitization and non-empty checks for first and last names', () => {
      expect(sql).toContain('First name is required and cannot be empty')
      expect(sql).toContain('Last name is required and cannot be empty')
    })

    it('validates academic timeline constraints (admission year, graduation year, semester)', () => {
      expect(sql).toContain('p_admission_year < 2000 OR p_admission_year > 2100')
      expect(sql).toContain('Expected graduation year must be greater than or equal to admission year')
      expect(sql).toContain('Current semester must be between 1 and 12')
    })

    it('prevents double-provisioning for already provisioned users', () => {
      expect(sql).toContain('SELECT 1 FROM public.students WHERE user_id = v_user_id')
      expect(sql).toContain('Student profile is already provisioned for this user')
    })

    it('validates that the canonical college exists and has active status', () => {
      expect(sql).toContain('SELECT 1 FROM public.colleges')
      expect(sql).toContain("status = 'active'")
      expect(sql).toContain('Selected college is invalid or not active')
    })

    it('validates department-college consistency and active status if department is provided', () => {
      expect(sql).toContain('IF p_department_id IS NOT NULL THEN')
      expect(sql).toContain('SELECT 1 FROM public.departments')
      expect(sql).toContain('college_id = p_college_id')
      expect(sql).toContain('Selected department does not exist in the specified college or is inactive')
    })

    it('atomically assigns the student role ONLY into public.user_roles and forbids admin escalation', () => {
      expect(sql).toContain('INSERT INTO public.user_roles (user_id, role)')
      expect(sql).toContain("VALUES (v_user_id, 'student')")
      expect(sql).toContain('ON CONFLICT (user_id, role) DO NOTHING')
      // Must not assign any other role
      expect(sql).not.toContain("VALUES (v_user_id, 'super_admin')")
      expect(sql).not.toContain("VALUES (v_user_id, 'data_editor')")
      expect(sql).not.toContain("VALUES (v_user_id, 'verifier')")
    })

    it('inserts student record using auth.uid() and returns the student UUID', () => {
      expect(sql).toContain('INSERT INTO public.students (')
      expect(sql).toContain('user_id,')
      expect(sql).toContain('college_id,')
      expect(sql).toContain('first_name,')
      expect(sql).toContain('last_name,')
      expect(sql).toContain('display_name,')
      expect(sql).toContain('RETURNING id INTO v_student_id')
      expect(sql).toContain('RETURN v_student_id;')
    })

    it('revokes public/anon privileges and grants execution strictly to authenticated users', () => {
      expect(sql).toContain('REVOKE ALL ON FUNCTION public.complete_student_onboarding')
      expect(sql).toContain('FROM PUBLIC;')
      expect(sql).toContain('FROM anon;')
      expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.complete_student_onboarding')
      expect(sql).toContain('TO authenticated;')
    })
  })

  describe('TypeScript Database Contract Integration', () => {
    it('declares complete_student_onboarding in Database Functions contract', () => {
      type Functions = Database['public']['Functions']
      type HasOnboardingRPC = 'complete_student_onboarding' extends keyof Functions ? true : false
      const hasRPC: HasOnboardingRPC = true
      expect(hasRPC).toBe(true)

      type OnboardingArgs = Functions['complete_student_onboarding']['Args']
      type ArgsValid =
        OnboardingArgs extends {
          p_first_name: string
          p_last_name: string
          p_college_id: string
          p_admission_year: number
          p_expected_graduation_year: number
        }
          ? true
          : false

      const argsValid: ArgsValid = true
      expect(argsValid).toBe(true)
    })
  })
})
