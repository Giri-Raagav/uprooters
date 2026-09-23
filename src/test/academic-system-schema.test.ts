import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  SubjectType,
  SemesterStatus,
  AttemptResultStatus,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/004_academic_system.sql')

describe('Milestone 06 — Academic System (Migration 004)', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  describe('Safeguard 1: Exact Academic Tables & Architecture (§13–§17)', () => {
    it('migration file exists at supabase/migrations/004_academic_system.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates all 4 required academic tables', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.subjects\b/i)
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_semesters\b/i)
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_subject_attempts\b/i)
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.semester_summaries\b/i)
    })

    it('subjects table contains all documented columns and constraints (§15)', () => {
      const subjectCols = [
        'id UUID PRIMARY KEY',
        'department_id UUID NOT NULL',
        'code VARCHAR(50) NOT NULL',
        'name TEXT NOT NULL',
        'normalized_name TEXT GENERATED',
        'credits NUMERIC(4, 2) NOT NULL',
        'subject_type VARCHAR(50) NOT NULL',
        'status VARCHAR(20) NOT NULL',
      ]
      for (const col of subjectCols) {
        expect(migrationSql).toMatch(new RegExp(col.replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i'))
      }
      expect(migrationSql).toMatch(/subjects_department_code_key\s+UNIQUE\s*\(department_id,\s*code\)/i)
      expect(migrationSql).toMatch(/credits\s*>=\s*0\s+AND\s+credits\s*<=\s*30/i)
    })

    it('student_semesters table contains all documented columns and constraints (§14)', () => {
      expect(migrationSql).toMatch(/semester_number\s+INT\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/academic_year\s+VARCHAR\(20\)\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/semester_label\s+VARCHAR\(50\)\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/semester_number\s*>=\s*1\s+AND\s+semester_number\s*<=\s*12/i)
      expect(migrationSql).toMatch(/student_semesters_student_semester_key\s+UNIQUE\s*\(student_id,\s*semester_number\)/i)
    })
  })

  describe('Safeguard 2: Exact CGPA & SGPA Semantics (§17–§18, Readiness §12, §15)', () => {
    it('CGPA calculation calculates credit-weighted average across latest attempts', () => {
      const funcMatch = migrationSql.match(/FUNCTION\s+public\.calculate_student_cgpa[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)
      expect(funcMatch).toBeDefined()
      const body = funcMatch![1]

      // Numerator: SUM(credits_attempted * grade_points)
      expect(body).toMatch(/SUM\s*\(\s*credits_attempted\s*\*\s*grade_points\s*\)/i)
      // Denominator: SUM(credits_attempted)
      expect(body).toMatch(/SUM\s*\(\s*credits_attempted\s*\)/i)
      // Latest attempt filter
      expect(body).toMatch(/is_latest_attempt\s*=\s*true/i)
      // Excludes pending results
      expect(body).toMatch(/result_status\s+NOT\s+IN\s*\(\s*'in_progress',\s*'withheld'\s*\)/i)
      expect(body).toMatch(/grade_points\s+IS\s+NOT\s+NULL/i)
      // Returns rounded NUMERIC(4, 2)
      expect(body).toMatch(/ROUND\s*\(\s*v_weighted_points\s*\/\s*v_total_credits,\s*2\s*\)/i)
    })

    it('returns NULL if no qualifying graded credits exist to avoid false 0.00', () => {
      const funcMatch = migrationSql.match(/FUNCTION\s+public\.calculate_student_cgpa[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)
      const body = funcMatch![1]
      expect(body).toMatch(/v_cgpa\s+NUMERIC\(4,\s*2\)\s*:=\s*NULL;/i)
      expect(body).toMatch(/IF\s+v_total_credits\s*>\s*0\s+THEN/i)
    })
  })

  describe('Safeguard 3: Latest-Attempt Integrity (Database-Level Protection)', () => {
    it('creates partial unique index ensuring strictly at most one latest attempt per (student_id, subject_id)', () => {
      expect(migrationSql).toMatch(
        /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_subject_latest_attempt_unique\s+ON\s+public\.student_subject_attempts\s*\(\s*student_id,\s*subject_id\s*\)\s+WHERE\s*\(\s*is_latest_attempt\s*=\s*true\s*\);/i
      )
    })

    it('attaches manage_latest_attempt_flag trigger before insert or update', () => {
      expect(migrationSql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.manage_latest_attempt_flag/i)
      expect(migrationSql).toMatch(/UPDATE\s+public\.student_subject_attempts\s+SET\s+is_latest_attempt\s*=\s*false/i)
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_manage_latest_attempt_flag/i)
      expect(migrationSql).toMatch(/BEFORE\s+INSERT\s+OR\s+UPDATE\s+OF\s+is_latest_attempt\s+ON\s+public\.student_subject_attempts/i)
    })

    it('preserves historical attempts with unique attempt numbering per (student_id, subject_id)', () => {
      expect(migrationSql).toMatch(/student_subject_attempts_attempt_key\s+UNIQUE\s*\(student_id,\s*subject_id,\s*attempt_number\)/i)
    })
  })

  describe('Safeguard 4: Cross-Student Semester Ownership Enforcement', () => {
    it('defines composite unique candidate key on student_semesters (id, student_id)', () => {
      expect(migrationSql).toMatch(/student_semesters_id_student_id_key\s+UNIQUE\s*\(id,\s*student_id\)/i)
    })

    it('enforces composite foreign key on student_subject_attempts (semester_id, student_id)', () => {
      expect(migrationSql).toMatch(
        /student_subject_attempts_semester_student_fkey\s+FOREIGN\s+KEY\s*\(semester_id,\s*student_id\)\s+REFERENCES\s+public\.student_semesters\s*\(id,\s*student_id\)\s+ON\s+DELETE\s+CASCADE/i
      )
    })

    it('enforces composite foreign key on semester_summaries (semester_id, student_id)', () => {
      expect(migrationSql).toMatch(
        /semester_summaries_semester_student_fkey\s+FOREIGN\s+KEY\s*\(semester_id,\s*student_id\)\s+REFERENCES\s+public\.student_semesters\s*\(id,\s*student_id\)\s+ON\s+DELETE\s+CASCADE/i
      )
    })
  })

  describe('Safeguard 5: Semester Summaries Source of Truth & Reconciliation', () => {
    it('defines reconcile_semester_summary function aggregating raw attempts', () => {
      expect(migrationSql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.reconcile_semester_summary/i)
      expect(migrationSql).toMatch(/FROM\s+public\.student_subject_attempts\s+WHERE\s+student_id\s*=\s*p_student_id\s+AND\s+semester_id\s*=\s*p_semester_id/i)
      expect(migrationSql).toMatch(/INSERT\s+INTO\s+public\.semester_summaries/i)
      expect(migrationSql).toMatch(/ON\s+CONFLICT\s*\(student_id,\s*semester_id\)\s+DO\s+UPDATE/i)
    })

    it('attaches automated sync trigger on student_subject_attempts', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_sync_semester_summary/i)
      expect(migrationSql).toMatch(/AFTER\s+INSERT\s+OR\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.student_subject_attempts/i)
      expect(migrationSql).toMatch(/EXECUTE\s+FUNCTION\s+public\.handle_sync_semester_summary\(\)/i)
    })

    it('preserves calculation_version defaulting to 1', () => {
      expect(migrationSql).toMatch(/calculation_version\s+INT\s+NOT\s+NULL\s+DEFAULT\s+1/i)
    })
  })

  describe('Safeguard 6: CGPA Function Security Contract', () => {
    it('uses SECURITY DEFINER with fixed search_path = public, pg_temp', () => {
      const funcMatch = migrationSql.match(/FUNCTION\s+public\.calculate_student_cgpa[\s\S]*?AS\s+\$\$/i)
      expect(funcMatch).toBeDefined()
      const signature = funcMatch![0]
      expect(signature).toMatch(/SECURITY\s+DEFINER/i)
      expect(signature).toMatch(/SET\s+search_path\s*=\s*public,\s*pg_temp/i)
    })

    it('denies anonymous callers explicitly', () => {
      expect(migrationSql).toMatch(/IF\s+auth\.uid\(\)\s+IS\s+NULL\s+THEN\s+RAISE\s+EXCEPTION\s+'Authentication required';/i)
    })

    it('restricts execution to student self-access or admin', () => {
      expect(migrationSql).toMatch(/IF\s+p_student_id\s*<>\s*public\.get_current_student_id\(\)\s+AND\s+NOT\s+public\.is_admin\(\)\s+THEN\s+RAISE\s+EXCEPTION\s+'Access denied/i)
    })

    it('explicitly revokes execute from PUBLIC and grants execute to authenticated', () => {
      expect(migrationSql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.calculate_student_cgpa\(UUID\)\s+FROM\s+PUBLIC;/i)
      expect(migrationSql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.calculate_student_cgpa\(UUID\)\s+TO\s+authenticated;/i)
      expect(migrationSql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.reconcile_semester_summary\(UUID,\s*UUID\)\s+FROM\s+PUBLIC;/i)
      expect(migrationSql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.reconcile_semester_summary\(UUID,\s*UUID\)\s+TO\s+authenticated;/i)
    })
  })

  describe('Safeguard 7: Row-Level Security & Non-Recursive Student Ownership', () => {
    it('enables RLS on all 4 academic tables', () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.subjects\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.student_semesters\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.student_subject_attempts\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.semester_summaries\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
    })

    it('uses non-recursive get_current_student_id() for student policies', () => {
      expect(migrationSql).toMatch(/student_id\s*=\s*public\.get_current_student_id\(\)/i)
    })

    it('protects subjects table modifications for admin only', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+"subjects_insert_admin"\s+ON\s+public\.subjects[\s\S]*?WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+"subjects_delete_admin"\s+ON\s+public\.subjects[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s*\)/i)
    })
  })

  describe('Safeguard 8: TypeScript Database Contract Synchronization', () => {
    it('database.types.ts includes all 4 academic tables and enums', () => {
      type SubjectRow = Database['public']['Tables']['subjects']['Row']
      type SemesterRow = Database['public']['Tables']['student_semesters']['Row']
      type AttemptRow = Database['public']['Tables']['student_subject_attempts']['Row']
      type SummaryRow = Database['public']['Tables']['semester_summaries']['Row']

      const sampleSubject: SubjectRow = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        department_id: '123e4567-e89b-12d3-a456-426614174003',
        code: 'EC8351',
        name: 'Electronic Circuits I',
        normalized_name: 'electronic circuits i',
        credits: 3.0,
        subject_type: 'theory' as SubjectType,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(sampleSubject.code).toBe('EC8351')

      const sampleSemester: SemesterRow = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        student_id: '123e4567-e89b-12d3-a456-426614174000',
        semester_number: 3,
        academic_year: '2023-2024',
        semester_label: 'Semester 3',
        start_date: '2023-08-01',
        end_date: '2023-12-15',
        status: 'completed' as SemesterStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(sampleSemester.semester_number).toBe(3)

      const sampleAttempt: AttemptRow = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        student_id: sampleSemester.student_id,
        semester_id: sampleSemester.id,
        subject_id: sampleSubject.id,
        attempt_number: 1,
        marks: 85,
        grade: 'A+',
        grade_points: 9.0,
        credits_attempted: 3.0,
        credits_earned: 3.0,
        result_status: 'pass' as AttemptResultStatus,
        is_passing: true,
        is_latest_attempt: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(sampleAttempt.grade).toBe('A+')
      expect(sampleAttempt.is_latest_attempt).toBe(true)

      const sampleSummary: SummaryRow = {
        id: '123e4567-e89b-12d3-a456-426614174040',
        student_id: sampleSemester.student_id,
        semester_id: sampleSemester.id,
        sgpa: 9.0,
        attempted_credits: 3.0,
        earned_credits: 3.0,
        backlogs: 0,
        calculation_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(sampleSummary.sgpa).toBe(9.0)
      expect(sampleSummary.backlogs).toBe(0)
    })

    it('database.types.ts includes calculate_student_cgpa function signature', () => {
      type CgpaFunc = Database['public']['Functions']['calculate_student_cgpa']
      type Args = CgpaFunc['Args']
      type Ret = CgpaFunc['Returns']

      const sampleArgs: Args = { p_student_id: '123e4567-e89b-12d3-a456-426614174000' }
      expect(sampleArgs.p_student_id).toBeDefined()

      const sampleRet: Ret = 8.75
      expect(typeof sampleRet).toBe('number')
    })
  })
})
