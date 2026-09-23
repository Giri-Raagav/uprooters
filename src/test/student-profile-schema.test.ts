import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/003_student_profile.sql')

describe('Milestone 05 — Student Profile Foundation (Migration 003)', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  describe('Safeguard 1: Exact Profile Completion Formula & Semantics', () => {
    it('migration file exists at supabase/migrations/003_student_profile.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('evaluates exactly the 12 core profile fields documented in docs/05_DATABASE_SPEC.md §12', () => {
      // The 12 core fields documented in docs/05_DATABASE_SPEC.md §12
      const expectedCoreFields = [
        'first_name',
        'last_name',
        'display_name',
        'college_id',
        'department_id',
        'degree',
        'branch',
        'admission_year',
        'expected_graduation_year',
        'current_semester',
        'location',
        'bio',
      ]

      for (const field of expectedCoreFields) {
        expect(migrationSql).toMatch(new RegExp(`NEW\\.${field}\\s+IS\\s+NOT\\s+NULL`, 'i'))
      }
    })

    it('calculates profile completion percentage as an unweighted ratio of the 12 core fields (zero arbitrary weights)', () => {
      // Must use floor((v_count::numeric / 12::numeric) * 100) or equivalent unweighted calculation
      expect(migrationSql).toMatch(/floor\(\s*\(v_count::numeric\s*\/\s*12::numeric\)\s*\*\s*100\s*\)/i)
      // Must not contain arbitrary weights like 20, 30, 15 point constants for identity/enrollment
      expect(migrationSql).not.toMatch(/v_count\s*:=\s*v_count\s*\+\s*20/i)
      expect(migrationSql).not.toMatch(/v_count\s*:=\s*v_count\s*\+\s*30/i)
    })

    it('sets profile_completed to true iff all 12 core fields are present', () => {
      expect(migrationSql).toMatch(/NEW\.profile_completed\s*:=\s*\(v_count\s*=\s*12\);/i)
    })

    it('attaches handle_student_profile_completion trigger before insert or update on public.students', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+handle_student_profile_completion_trigger/i)
      expect(migrationSql).toMatch(/BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.students/i)
      expect(migrationSql).toMatch(/EXECUTE\s+FUNCTION\s+public\.handle_student_profile_completion\(\)/i)
    })
  })

  describe('Safeguard 2: Zero-Parameter SECURITY DEFINER Helper Function & Cross-Student Isolation', () => {
    it('defines get_current_student_profile() with zero parameters', () => {
      // Must take NO arguments (no student_id or user_id parameter)
      expect(migrationSql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_current_student_profile\(\s*\)/i)
    })

    it('uses auth.uid() internally and strictly filters by user_id = auth.uid()', () => {
      expect(migrationSql).toMatch(/WHERE\s+s\.user_id\s*=\s*auth\.uid\(\)/i)
      expect(migrationSql).toMatch(/LIMIT\s+1/i)
    })

    it('specifies explicit RETURNS TABLE column list and does NOT return whole students row', () => {
      const funcMatch = migrationSql.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_current_student_profile\(\)[\s\S]*?AS\s+\$\$/i)
      expect(funcMatch).toBeDefined()
      const funcSignature = funcMatch![0]
      expect(funcSignature).toMatch(/RETURNS\s+TABLE\s*\(/i)
      expect(funcSignature).not.toMatch(/RETURNS\s+SETOF\s+public\.students/i)
      expect(funcSignature).not.toMatch(/RETURNS\s+public\.students/i)

      const funcBodyMatch = migrationSql.match(/public\.get_current_student_profile\(\)[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)
      expect(funcBodyMatch).toBeDefined()
      const funcBody = funcBodyMatch![1]
      expect(funcBody).not.toMatch(/SELECT\s+s\.\*\s+FROM/i)
      expect(funcBody).not.toMatch(/SELECT\s+\*\s+FROM\s+public\.students/i)
    })

    it('uses SECURITY DEFINER with fixed search_path = public, pg_temp', () => {
      const funcMatch = migrationSql.match(/FUNCTION\s+public\.get_current_student_profile\(\)[\s\S]*?AS\s+\$\$/i)
      expect(funcMatch).toBeDefined()
      const funcDef = funcMatch![0]
      expect(funcDef).toMatch(/SECURITY\s+DEFINER/i)
      expect(funcDef).toMatch(/SET\s+search_path\s*=\s*public,\s*pg_temp/i)
    })

    it('explicitly revokes execute from PUBLIC and grants execute to authenticated', () => {
      expect(migrationSql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.get_current_student_profile\(\)\s+FROM\s+PUBLIC;/i)
      expect(migrationSql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_current_student_profile\(\)\s+TO\s+authenticated;/i)
    })
  })

  describe('Safeguard 3: student_profiles_view Permitted Columns & Invoker Security', () => {
    it('creates student_profiles_view with security_invoker = true', () => {
      expect(migrationSql).toMatch(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.student_profiles_view\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)/i)
    })

    it('joins colleges and departments correctly', () => {
      expect(migrationSql).toMatch(/JOIN\s+public\.colleges\s+c\s+ON\s+s\.college_id\s*=\s*c\.id/i)
      expect(migrationSql).toMatch(/LEFT\s+JOIN\s+public\.departments\s+d\s+ON\s+s\.department_id\s*=\s*d\.id/i)
    })

    it('exposes only permitted profile columns whitelist', () => {
      const permittedColumns = [
        'id',
        'user_id',
        'college_id',
        'college_name',
        'college_city',
        'college_state',
        'department_id',
        'department_name',
        'department_short_name',
        'first_name',
        'last_name',
        'display_name',
        'degree',
        'branch',
        'admission_year',
        'expected_graduation_year',
        'current_semester',
        'date_of_birth',
        'profile_photo_url',
        'bio',
        'location',
        'country',
        'phone_number',
        'github_url',
        'linkedin_url',
        'portfolio_url',
        'career_interests',
        'profile_completed',
        'profile_completion_percentage',
        'created_at',
        'updated_at',
      ]

      // Extract SELECT columns from student_profiles_view
      const viewMatch = migrationSql.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.student_profiles_view[\s\S]*?AS\s+SELECT([\s\S]*?)FROM\s+public\.students/i)
      expect(viewMatch).toBeDefined()
      const selectBlock = viewMatch![1]

      for (const col of permittedColumns) {
        expect(selectBlock).toMatch(new RegExp(`\\b${col}\\b`, 'i'))
      }

      // Must not expose internal admin flags like is_active in the student profile view
      expect(selectBlock).not.toMatch(/\bis_active\b/i)
    })
  })

  describe('Safeguard 4: Validation Constraints (Realistic & Non-Restrictive)', () => {
    it('phone number constraint accepts international formats with +, digits, spaces, hyphens, and parens', () => {
      expect(migrationSql).toMatch(/students_phone_number_check/i)
      expect(migrationSql).toMatch(/\^\[\+0-9\\s\\-\(\)\]\+\$/i)
      expect(migrationSql).toMatch(/char_length\(trim\(phone_number\)\)\s*>=\s*7/i)
      expect(migrationSql).toMatch(/char_length\(trim\(phone_number\)\)\s*<=\s*25/i)
    })

    it('linkedin url constraint supports regional subdomains such as in.linkedin.com', () => {
      expect(migrationSql).toMatch(/students_linkedin_url_check/i)
      // Must support subdomains like in.linkedin.com or www.linkedin.com
      expect(migrationSql).toMatch(/\(\[a-zA-Z0-9-\]\+\\\.\)\*linkedin\\\.com\/in\//i)
    })

    it('github url constraint supports subdomains and valid handles', () => {
      expect(migrationSql).toMatch(/students_github_url_check/i)
      expect(migrationSql).toMatch(/\(\[a-zA-Z0-9-\]\+\\\.\)\*github\\\.com\//i)
    })

    it('portfolio url constraint validates web URLs starting with http:// or https://', () => {
      expect(migrationSql).toMatch(/students_portfolio_url_check/i)
      expect(migrationSql).toMatch(/\^https\?:\/\//i)
    })

    it('career interests validates 1-dimensional array', () => {
      expect(migrationSql).toMatch(/students_career_interests_check/i)
      expect(migrationSql).toMatch(/array_ndims\(career_interests\)\s*<=\s*1/i)
    })

    it('profile completion percentage is bounded between 0 and 100', () => {
      expect(migrationSql).toMatch(/students_profile_completion_percentage_check/i)
      expect(migrationSql).toMatch(/profile_completion_percentage\s*>=\s*0\s+AND\s+profile_completion_percentage\s*<=\s*100/i)
    })
  })

  describe('Safeguard 5: End-to-End Migration Idempotency', () => {
    it('uses ADD COLUMN IF NOT EXISTS for all new columns', () => {
      const columns = [
        'phone_number',
        'github_url',
        'linkedin_url',
        'portfolio_url',
        'career_interests',
        'profile_completion_percentage',
      ]
      for (const col of columns) {
        expect(migrationSql).toMatch(new RegExp(`ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+${col}`, 'i'))
      }
    })

    it('wraps constraint additions in safe pg_constraint check DO blocks', () => {
      const constraintNames = [
        'students_phone_number_check',
        'students_github_url_check',
        'students_linkedin_url_check',
        'students_portfolio_url_check',
        'students_career_interests_check',
        'students_profile_completion_percentage_check',
      ]
      for (const con of constraintNames) {
        expect(migrationSql).toMatch(new RegExp(`SELECT\\s+1\\s+FROM\\s+pg_constraint\\s+WHERE\\s+conname\\s*=\\s*'${con}'`, 'i'))
      }
    })

    it('uses DROP TRIGGER IF EXISTS before creating triggers', () => {
      expect(migrationSql).toMatch(/DROP\s+TRIGGER\s+IF\s+EXISTS\s+handle_student_profile_completion_trigger/i)
    })

    it('uses CREATE INDEX IF NOT EXISTS for completion index', () => {
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_students_profile_completed/i)
    })
  })

  describe('Safeguard 6: TypeScript Database Contract Synchronization', () => {
    it('database.types.ts includes all new columns on students table', () => {
      type StudentRow = Database['public']['Tables']['students']['Row']
      type StudentInsert = Database['public']['Tables']['students']['Insert']
      type StudentUpdate = Database['public']['Tables']['students']['Update']

      // Compile-time assertions verifying type structure
      const sampleStudent: StudentRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        college_id: '123e4567-e89b-12d3-a456-426614174002',
        department_id: '123e4567-e89b-12d3-a456-426614174003',
        first_name: 'Arun',
        last_name: 'Kumar',
        display_name: 'Arun Kumar',
        degree: 'B.E.',
        branch: 'ECE',
        admission_year: 2022,
        expected_graduation_year: 2026,
        current_semester: 5,
        date_of_birth: '2004-05-15',
        profile_photo_url: null,
        bio: 'ECE Student passionate about embedded systems',
        location: 'Chennai',
        country: 'India',
        phone_number: '+91 9876543210',
        github_url: 'https://github.com/arunkumar',
        linkedin_url: 'https://in.linkedin.com/in/arunkumar',
        portfolio_url: 'https://arunkumar.dev',
        career_interests: ['Embedded Systems', 'IoT'],
        profile_completed: true,
        profile_completion_percentage: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(sampleStudent.phone_number).toBe('+91 9876543210')
      expect(sampleStudent.career_interests).toHaveLength(2)
      expect(sampleStudent.profile_completion_percentage).toBe(100)

      const sampleInsert: StudentInsert = {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        college_id: '123e4567-e89b-12d3-a456-426614174002',
        first_name: 'Arun',
        last_name: 'Kumar',
        admission_year: 2022,
        expected_graduation_year: 2026,
        phone_number: '+91 9876543210',
        career_interests: ['Embedded Systems'],
      }
      expect(sampleInsert.phone_number).toBe('+91 9876543210')

      const sampleUpdate: StudentUpdate = {
        bio: 'Updated bio',
        profile_completion_percentage: 90,
      }
      expect(sampleUpdate.profile_completion_percentage).toBe(90)
    })

    it('database.types.ts includes student_profiles_view in Views', () => {
      type ViewRow = Database['public']['Views']['student_profiles_view']['Row']

      const sampleView: ViewRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        college_id: '123e4567-e89b-12d3-a456-426614174002',
        college_name: 'Rajalakshmi Institute of Technology',
        college_city: 'Chennai',
        college_state: 'Tamil Nadu',
        department_id: '123e4567-e89b-12d3-a456-426614174003',
        department_name: 'Electronics and Communication Engineering',
        department_short_name: 'ECE',
        first_name: 'Arun',
        last_name: 'Kumar',
        display_name: 'Arun Kumar',
        degree: 'B.E.',
        branch: 'ECE',
        admission_year: 2022,
        expected_graduation_year: 2026,
        current_semester: 5,
        date_of_birth: null,
        profile_photo_url: null,
        bio: 'ECE Student',
        location: 'Chennai',
        country: 'India',
        phone_number: null,
        github_url: null,
        linkedin_url: null,
        portfolio_url: null,
        career_interests: ['VLSI'],
        profile_completed: false,
        profile_completion_percentage: 75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      expect(sampleView.college_name).toBe('Rajalakshmi Institute of Technology')
      expect(sampleView.department_short_name).toBe('ECE')
    })

    it('database.types.ts includes get_current_student_profile function with zero args and valid return type', () => {
      type FuncDef = Database['public']['Functions']['get_current_student_profile']
      type FuncArgs = FuncDef['Args']
      type FuncReturn = FuncDef['Returns']

      // Compile-time check: Args must be empty object (0 parameters)
      const args: FuncArgs = {}
      expect(Object.keys(args)).toHaveLength(0)

      const sampleReturn: FuncReturn = []
      expect(Array.isArray(sampleReturn)).toBe(true)
    })
  })
})
