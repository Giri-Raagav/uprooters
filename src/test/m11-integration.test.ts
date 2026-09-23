import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { readinessService } from '@/services/readinessService'
import { recommendationsService } from '@/services/recommendationsService'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase'

describe('Milestone 11 — End-to-End Integration & Boundary Verification', () => {
  const M001_PATH = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql')
  const M007_PATH = path.resolve(__dirname, '../../supabase/migrations/007_readiness_engine.sql')
  const M008_PATH = path.resolve(__dirname, '../../supabase/migrations/008_recommendations.sql')
  const M009_PATH = path.resolve(__dirname, '../../supabase/migrations/009_career_sources_and_audit.sql')

  const sql001 = fs.readFileSync(M001_PATH, 'utf-8')
  const sql007 = fs.readFileSync(M007_PATH, 'utf-8')
  const sql008 = fs.readFileSync(M008_PATH, 'utf-8')
  const sql009 = fs.readFileSync(M009_PATH, 'utf-8')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Acceptance Test 1: Student / Student Isolation ────────────────────────
  describe('Acceptance Test 1: Student / Student Isolation', () => {
    it('enforces student isolation via user_id and get_current_student_id across student tables', () => {
      // student profile (001) - parent table uses user_id = auth.uid()
      expect(sql001).toMatch(/user_id\s*=\s*auth\.uid\(\)/i)
      // student career targets (009) - child table uses student_id = get_current_student_id()
      expect(sql009).toMatch(/student_id\s*=\s*public\.get_current_student_id\(\)/i)
      // student recommendations (008)
      expect(sql008).toMatch(/student_id\s*=\s*public\.get_current_student_id\(\)/i)
      // readiness evaluations (007)
      expect(sql007).toMatch(/student_id\s*=\s*public\.get_current_student_id\(\)/i)
    })

    it('rejects cross-student evaluation requests in evaluate_student_readiness', () => {
      expect(sql007).toMatch(/IF\s+p_student_id\s*<>\s*v_caller_student_id\s+AND\s+NOT\s+v_is_caller_admin\s+THEN/i)
      expect(sql007).toMatch(/RAISE\s+EXCEPTION\s+'Access denied\.\s+You may only evaluate readiness for your own student record\.'/i)
    })
  })

  // ── Acceptance Test 2: Student / Admin Boundaries ─────────────────────────
  describe('Acceptance Test 2: Student / Admin Boundaries', () => {
    it('restricts verify_career_requirement to verifier and super_admin', () => {
      expect(sql009).toMatch(/v_is_authorized\s*:=\s*public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\);/i)
      expect(sql009).toMatch(/Unauthorized:\s+only\s+verifiers\s+or\s+super\s+admins\s+may\s+verify\s+career\s+requirements\./i)
    })

    it('restricts verify_job_opening to verifier and super_admin', () => {
      expect(sql009).toMatch(/v_is_authorized\s*:=\s*public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\);/i)
      expect(sql009).toMatch(/Unauthorized:\s+only\s+verifiers\s+or\s+super\s+admins\s+may\s+verify\s+job\s+openings\./i)
    })

    it('prevents student role from mutating public.career_sources or public.audit_logs', () => {
      // career_sources insert/update restricted to admin or data_editor
      expect(sql009).toMatch(/CREATE\s+POLICY\s+"career_sources_insert_policy"[\s\S]*?public\.is_admin\(\)\s+OR\s+public\.has_role\('data_editor'\)/i)
      // audit_logs direct mutation revoked from all
      expect(sql009).toMatch(/REVOKE\s+INSERT,\s*UPDATE,\s*DELETE\s+ON\s+public\.audit_logs\s+FROM\s+PUBLIC,\s*authenticated,\s*anon;/i)
    })
  })

  // ── Acceptance Test 3: Data-Editor / Verifier Boundaries ───────────────────
  describe('Acceptance Test 3: Data-Editor / Verifier Boundaries', () => {
    it('allows data_editor to manage career sources and batches but NOT verification records', () => {
      // data_editor can insert career sources
      expect(sql009).toMatch(/CREATE\s+POLICY\s+"career_sources_insert_policy"[\s\S]*?has_role\('data_editor'\)/i)
      // data_editor can insert ingestion batches
      expect(sql009).toMatch(/CREATE\s+POLICY\s+"ingestion_batches_insert_policy"[\s\S]*?has_role\('data_editor'\)/i)
      // verification_records insert is strictly verifier or admin
      expect(sql009).toMatch(/CREATE\s+POLICY\s+"verification_records_insert_policy"[\s\S]*?public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)/i)
    })
  })

  // ── Acceptance Test 4: Verification Transitions & Records ─────────────────
  describe('Acceptance Test 4: Verification Transitions', () => {
    it('records each verification transition in verification_records and audit_logs', () => {
      // verify_career_requirement records audit event and insert into verification_records
      expect(sql009).toMatch(/PERFORM\s+public\.record_audit_event\(\s*'career_requirement'/i)
      expect(sql009).toMatch(/INSERT\s+INTO\s+public\.verification_records/i)
      // verify_job_opening records audit event and insert into verification_records
      expect(sql009).toMatch(/PERFORM\s+public\.record_audit_event\(\s*'job_opening'/i)
    })
  })

  // ── Acceptance Test 5: Source Provenance ───────────────────────────────────
  describe('Acceptance Test 5: Source Provenance', () => {
    it('connects entities to career_sources through career_source_links with exclusivity', () => {
      expect(sql009).toMatch(/CONSTRAINT\s+career_source_links_entity_check\s+CHECK/i)
      expect(sql009).toMatch(/source_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.career_sources\(id\)/i)
    })
  })

  // ── Acceptance Test 6: Career-Target Ownership & Exclusivity ───────────────
  describe('Acceptance Test 6: Career-Target Ownership & Exclusivity', () => {
    it('enforces target exclusivity between role and job_opening', () => {
      expect(sql009).toMatch(/CONSTRAINT\s+student_career_targets_target_check\s+CHECK\s*\(\s*\(\s*target_type\s*=\s*'role'\s+AND\s+role_id\s+IS\s+NOT\s+NULL\s+AND\s+job_opening_id\s+IS\s+NULL\s*\)\s+OR\s+\(\s*target_type\s*=\s*'job_opening'\s+AND\s+job_opening_id\s+IS\s+NOT\s+NULL\s+AND\s+role_id\s+IS\s+NULL\s*\)\s*\)/i)
    })

    it('enforces at most one active primary target per student', () => {
      expect(sql009).toMatch(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_career_targets_primary/i)
      expect(sql009).toMatch(/WHERE\s*\(\s*is_primary\s*=\s*true\s+AND\s+status\s*=\s*'active'\s*\)/i)
    })
  })

  // ── Acceptance Test 7: Historical Readiness Integrity ─────────────────────
  describe('Acceptance Test 7: Historical Readiness Integrity', () => {
    it('uses ON DELETE RESTRICT on career roles and job openings to protect evaluations', () => {
      expect(sql007).toMatch(/role_id\s+UUID\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(sql007).toMatch(/job_opening_id\s+UUID\s+REFERENCES\s+public\.job_openings\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
    })

    it('preserves immutable snapshots in readiness_evaluations', () => {
      expect(sql007).toMatch(/snapshot\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'\{\}'::jsonb/i)
      expect(sql007).toMatch(/engine_version\s+VARCHAR\(20\)\s+NOT\s+NULL/i)
    })
  })

  // ── Acceptance Test 8: Recommendation Provenance ──────────────────────────
  describe('Acceptance Test 8: Recommendation Provenance', () => {
    it('preserves gap_snapshot and source pointers with ON DELETE SET NULL', () => {
      expect(sql008).toMatch(/source_evaluation_id\s+UUID\s+REFERENCES\s+public\.readiness_evaluations\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(sql008).toMatch(/source_requirement_id\s+UUID\s+REFERENCES\s+public\.career_requirements\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(sql008).toMatch(/gap_snapshot\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'\{\}'::jsonb/i)
    })
  })

  // ── Acceptance Test 9: Canonical Readiness RPC Integration ────────────────
  describe('Acceptance Test 9: Canonical Readiness RPC Integration', () => {
    it('readinessService calls exactly evaluate_student_readiness', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: 'mock-eval-uuid',
        error: null,
      } as any)

      const result = await readinessService.evaluateReadiness(
        'student-uuid-1',
        'role',
        'role-uuid-1'
      )

      expect(rpcSpy).toHaveBeenCalledWith('evaluate_student_readiness', {
        p_student_id: 'student-uuid-1',
        p_target_type: 'role',
        p_target_id: 'role-uuid-1',
        p_engine_config: undefined,
      })
      expect(result).toBe('mock-eval-uuid')
    })

    it('recommendationsService calls exactly generate_recommendations_from_evaluation', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: 3,
        error: null,
      } as any)

      const count = await recommendationsService.generateFromEvaluation('eval-uuid-1')

      expect(rpcSpy).toHaveBeenCalledWith('generate_recommendations_from_evaluation', {
        p_evaluation_id: 'eval-uuid-1',
      })
      expect(count).toBe(3)
    })
  })

  // ── Acceptance Test 10: Freshness Automation Invariants ───────────────────
  describe('Acceptance Test 10: Freshness Automation Invariants', () => {
    it('mark_stale_job_openings only transitions published openings past closing_date', () => {
      expect(sql009).toMatch(/SET\s+status\s*=\s*'stale'/i)
      expect(sql009).toMatch(/WHERE\s+status\s*=\s*'published'/i)
      expect(sql009).toMatch(/AND\s+closing_date\s+IS\s+NOT\s+NULL/i)
      expect(sql009).toMatch(/AND\s+closing_date\s*<\s*CURRENT_DATE/i)
    })

    it('adminService.markStaleJobOpenings invokes mark_stale_job_openings RPC', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
        data: 2,
        error: null,
      } as any)

      const updatedCount = await adminService.markStaleJobOpenings()
      expect(rpcSpy).toHaveBeenCalledWith('mark_stale_job_openings')
      expect(updatedCount).toBe(2)
    })
  })
})
