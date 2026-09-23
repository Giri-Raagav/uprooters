import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  SourceType,
  TrustTier,
  CareerSourceStatus,
  CareerSourceEntityType,
  VerificationEntityType,
  CareerTargetStatus,
  AuditAction,
  AuditActorType,
  IngestionBatchStatus,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/009_career_sources_and_audit.sql')

describe('Milestone 11 — Career Sources, Verification & Audit Schema (Migration 009)', () => {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  // ── Section 1: public.career_sources ───────────────────────────────────────
  describe('1. Career Data Sources Schema (DB spec §38)', () => {
    it('migration file exists at supabase/migrations/009_career_sources_and_audit.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates public.career_sources with name, publisher, source_type, trust_tier, status, timestamps', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.career_sources\b/i)
      expect(sql).toMatch(/name\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(name\)\)\s*>\s*0\s*\)/i)
      expect(sql).toMatch(/publisher\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(publisher\)\)\s*>\s*0\s*\)/i)
      expect(sql).toMatch(/source_type\s+VARCHAR\(40\)\s+NOT\s+NULL\s+CHECK\s*\(\s*source_type\s+IN\s*\(/i)
      expect(sql).toMatch(/'official_careers_page'/i)
      expect(sql).toMatch(/'official_job_posting'/i)
      expect(sql).toMatch(/'official_company_page'/i)
      expect(sql).toMatch(/'public_job_board'/i)
      expect(sql).toMatch(/'public_recruitment_post'/i)
      expect(sql).toMatch(/'other_public_source'/i)
      expect(sql).toMatch(/'discovery_source'/i)
      expect(sql).toMatch(/trust_tier\s+VARCHAR\(30\)\s+NOT\s+NULL\s+DEFAULT\s+'tier_4_unverified'/i)
      expect(sql).toMatch(/'tier_1_official'/i)
      expect(sql).toMatch(/'tier_2_verified_job_board'/i)
      expect(sql).toMatch(/'tier_3_public_curated'/i)
      expect(sql).toMatch(/'tier_4_unverified'/i)
    })

    it('attaches updated_at trigger and indexes to public.career_sources', () => {
      expect(sql).toMatch(/TRIGGER\s+set_career_sources_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.career_sources/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_career_sources_type\s+ON\s+public\.career_sources\(source_type\)/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_career_sources_trust_tier\s+ON\s+public\.career_sources\(trust_tier\)/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_career_sources_status\s+ON\s+public\.career_sources\(status\)/i)
    })
  })

  // ── Section 2: public.career_source_links ──────────────────────────────────
  describe('2. Career Source Links Schema (DB spec §39)', () => {
    it('creates public.career_source_links with FKs and entity exclusivity constraint', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.career_source_links\b/i)
      expect(sql).toMatch(/source_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.career_sources\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(sql).toMatch(/entity_type\s+VARCHAR\(30\)\s+NOT\s+NULL\s+CHECK\s*\(\s*entity_type\s+IN\s*\(\s*'company',\s*'role',\s*'job_opening',\s*'career_requirement'\s*\)\s*\)/i)
      expect(sql).toMatch(/CONSTRAINT\s+career_source_links_entity_check\s+CHECK/i)
    })

    it('enforces cascading FKs on target entities to avoid orphaned source links', () => {
      expect(sql).toMatch(/company_id\s+UUID\s+REFERENCES\s+public\.companies\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(sql).toMatch(/role_id\s+UUID\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(sql).toMatch(/job_opening_id\s+UUID\s+REFERENCES\s+public\.job_openings\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(sql).toMatch(/career_requirement_id\s+UUID\s+REFERENCES\s+public\.career_requirements\(id\)\s+ON\s+DELETE\s+CASCADE/i)
    })
  })

  // ── Section 3: public.verification_records ────────────────────────────────
  describe('3. Verification Records Schema (DB spec §40)', () => {
    it('creates public.verification_records with verifier FK, status, and level enums', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.verification_records\b/i)
      expect(sql).toMatch(/verifier_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(sql).toMatch(/verification_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+CHECK\s*\(\s*verification_status\s+IN\s*\(\s*'pending',\s*'verified',\s*'rejected',\s*'stale'\s*\)\s*\)/i)
      expect(sql).toMatch(/verification_level\s+VARCHAR\(40\)\s+NOT\s+NULL\s+CHECK\s*\(\s*verification_level\s+IN\s*\(\s*'official_source',\s*'official_ats',\s*'corroborated_public_source',\s*'manually_curated',\s*'unverified'\s*\)\s*\)/i)
      expect(sql).toMatch(/verified_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })

    it('creates indexes on entity, verifier, and status for verification records', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_verification_records_entity\s+ON\s+public\.verification_records\(entity_type,\s*entity_id\)/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_verification_records_verifier\s+ON\s+public\.verification_records\(verifier_id\)/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_verification_records_status\s+ON\s+public\.verification_records\(verification_status\)/i)
    })
  })

  // ── Section 4: public.student_career_targets ──────────────────────────────
  describe('4. Student Career Targets Schema (DB spec §44, §49)', () => {
    it('creates public.student_career_targets with target exclusivity constraint', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_career_targets\b/i)
      expect(sql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(sql).toMatch(/target_type\s+VARCHAR\(20\)\s+NOT\s+NULL\s+CHECK\s*\(\s*target_type\s+IN\s*\(\s*'role',\s*'job_opening'\s*\)\s*\)/i)
      expect(sql).toMatch(/CONSTRAINT\s+student_career_targets_target_check\s+CHECK\s*\(\s*\(\s*target_type\s*=\s*'role'\s+AND\s+role_id\s+IS\s+NOT\s+NULL\s+AND\s+job_opening_id\s+IS\s+NULL\s*\)\s+OR\s+\(\s*target_type\s*=\s*'job_opening'\s+AND\s+job_opening_id\s+IS\s+NOT\s+NULL\s+AND\s+role_id\s+IS\s+NULL\s*\)\s*\)/i)
    })

    it('enforces at most one active primary target per student via partial unique index', () => {
      expect(sql).toMatch(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_career_targets_primary\s+ON\s+public\.student_career_targets\s*\(\s*student_id\s*\)\s+WHERE\s*\(\s*is_primary\s*=\s*true\s+AND\s+status\s*=\s*'active'\s*\)/i)
    })

    it('enforces deduplication of target selections per student', () => {
      expect(sql).toMatch(/CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_career_targets_dedup\s+ON\s+public\.student_career_targets/i)
    })
  })

  // ── Section 5: public.audit_logs (Append-Only) ────────────────────────────
  describe('5. Append-Only Audit Logs Schema (DB spec §42–§43, Security §36, §87)', () => {
    it('creates public.audit_logs with entity, action, actor_id, actor_type, before/after states', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.audit_logs\b/i)
      expect(sql).toMatch(/action\s+VARCHAR\(30\)\s+NOT\s+NULL\s+CHECK\s*\(\s*action\s+IN\s*\(/i)
      expect(sql).toMatch(/actor_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+auth\.users\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(sql).toMatch(/actor_type\s+VARCHAR\(30\)\s+NOT\s+NULL\s+CHECK\s*\(\s*actor_type\s+IN\s*\(\s*'student',\s*'data_editor',\s*'verifier',\s*'super_admin',\s*'system'\s*\)\s*\)/i)
    })

    it('enforces strict append-only behavior via prevent_audit_logs_mutation trigger', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.prevent_audit_logs_mutation/i)
      expect(sql).toMatch(/audit_logs\s+is\s+strictly\s+append-only:\s+UPDATE\s+and\s+DELETE\s+operations\s+are\s+prohibited/i)
      expect(sql).toMatch(/CREATE\s+TRIGGER\s+trg_audit_logs_immutable\s+BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.audit_logs/i)
    })

    it('revokes direct INSERT, UPDATE, and DELETE on audit_logs from all external roles', () => {
      expect(sql).toMatch(/REVOKE\s+INSERT,\s*UPDATE,\s*DELETE\s+ON\s+public\.audit_logs\s+FROM\s+PUBLIC,\s*authenticated,\s*anon/i)
    })
  })

  // ── Section 6: Ingestion Batch Tracking ───────────────────────────────────
  describe('6. Ingestion Batch Tracking Schema (DB spec §79)', () => {
    it('creates public.ingestion_batches with status, processed, valid, invalid counters', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ingestion_batches\b/i)
      expect(sql).toMatch(/batch_reference\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(batch_reference\)\)\s*>\s*0\s*\)/i)
      expect(sql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'completed'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'in_progress',\s*'completed',\s*'failed'\s*\)\s*\)/i)
      expect(sql).toMatch(/records_processed\s+INT\s+NOT\s+NULL\s+DEFAULT\s+0\s+CHECK\s*\(\s*records_processed\s*>=\s*0\s*\)/i)
    })
  })

  // ── Section 7: Helper Functions & RPCs ────────────────────────────────────
  describe('7. Secure Helper Functions & RPCs', () => {
    it('defines record_audit_event with actor-spoofing prevention', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.record_audit_event/i)
      expect(sql).toMatch(/SECURITY\s+DEFINER/i)
      expect(sql).toMatch(/SET\s+search_path\s*=\s*public,\s*pg_temp/i)
      expect(sql).toMatch(/v_actor_id\s*:=\s*auth\.uid\(\)/i)
      expect(sql).toMatch(/v_actor_type\s*:=\s*'super_admin'/i)
      expect(sql).toMatch(/v_actor_type\s*:=\s*'verifier'/i)
      expect(sql).toMatch(/v_actor_type\s*:=\s*'data_editor'/i)
    })

    it('defines verify_career_requirement restricted to verifiers and super_admins', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.verify_career_requirement/i)
      expect(sql).toMatch(/public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)/i)
      expect(sql).toMatch(/Unauthorized:\s+only\s+verifiers\s+or\s+super\s+admins\s+may\s+verify\s+career\s+requirements/i)
      expect(sql).toMatch(/INSERT\s+INTO\s+public\.verification_records/i)
    })

    it('defines verify_job_opening restricted to verifiers and super_admins', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.verify_job_opening/i)
      expect(sql).toMatch(/public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)/i)
      expect(sql).toMatch(/INSERT\s+INTO\s+public\.verification_records/i)
    })

    it('defines mark_stale_job_openings with deterministic expiration logic', () => {
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.mark_stale_job_openings\(\)\s+RETURNS\s+INT/i)
      expect(sql).toMatch(/status\s*=\s*'published'/i)
      expect(sql).toMatch(/closing_date\s+IS\s+NOT\s+NULL/i)
      expect(sql).toMatch(/closing_date\s*<\s*CURRENT_DATE/i)
      expect(sql).toMatch(/SET\s+status\s*=\s*'stale'/i)
    })
  })

  // ── Section 8: Row-Level Security Policies ────────────────────────────────
  describe('8. Row-Level Security Policies & Isolation', () => {
    it('enables RLS on all migration 009 tables', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.career_sources\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.career_source_links\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.verification_records\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.student_career_targets\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.audit_logs\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.ingestion_batches\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i)
    })

    it('enforces student ownership and isolation on student_career_targets', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+"student_career_targets_select_policy"[\s\S]*?student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"student_career_targets_insert_policy"[\s\S]*?student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"student_career_targets_update_policy"[\s\S]*?student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+"student_career_targets_delete_policy"[\s\S]*?student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)/i)
    })

    it('enforces privileged audit log access', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+"audit_logs_select_policy"[\s\S]*?public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s+OR\s+public\.has_role\('data_editor'\)/i)
    })
  })

  // ── Section 9: TypeScript Type Contract Verification ─────────────────────
  describe('9. TypeScript Type Contracts', () => {
    it('verifies SourceType union values', () => {
      const types: SourceType[] = [
        'official_careers_page',
        'official_job_posting',
        'official_company_page',
        'public_job_board',
        'public_recruitment_post',
        'other_public_source',
        'discovery_source',
      ]
      expect(types).toHaveLength(7)
    })

    it('verifies TrustTier union values', () => {
      const tiers: TrustTier[] = [
        'tier_1_official',
        'tier_2_verified_job_board',
        'tier_3_public_curated',
        'tier_4_unverified',
      ]
      expect(tiers).toHaveLength(4)
    })

    it('verifies AuditAction union values', () => {
      const actions: AuditAction[] = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'ARCHIVE',
        'PUBLISH',
        'UNPUBLISH',
        'VERIFY',
        'REJECT',
        'RETIRE',
      ]
      expect(actions).toHaveLength(9)
    })

    it('verifies additional M11 enum types', () => {
      const sourceStatuses: CareerSourceStatus[] = ['active', 'inactive', 'archived']
      expect(sourceStatuses).toHaveLength(3)

      const sourceEntities: CareerSourceEntityType[] = ['company', 'role', 'job_opening', 'career_requirement']
      expect(sourceEntities).toHaveLength(4)

      const verificationEntities: VerificationEntityType[] = ['company', 'role', 'job_opening', 'career_requirement', 'skill_evidence']
      expect(verificationEntities).toHaveLength(5)

      const targetStatuses: CareerTargetStatus[] = ['active', 'archived']
      expect(targetStatuses).toHaveLength(2)

      const actorTypes: AuditActorType[] = ['student', 'data_editor', 'verifier', 'super_admin', 'system']
      expect(actorTypes).toHaveLength(5)

      const batchStatuses: IngestionBatchStatus[] = ['in_progress', 'completed', 'failed']
      expect(batchStatuses).toHaveLength(3)
    })

    it('verifies Database schema type includes all new tables and RPCs', () => {
      type PublicTables = keyof Database['public']['Tables']
      type PublicFuncs = keyof Database['public']['Functions']

      const hasSourcesTable: PublicTables = 'career_sources'
      const hasLinksTable: PublicTables = 'career_source_links'
      const hasVerificationTable: PublicTables = 'verification_records'
      const hasTargetsTable: PublicTables = 'student_career_targets'
      const hasAuditTable: PublicTables = 'audit_logs'
      const hasBatchesTable: PublicTables = 'ingestion_batches'

      expect(hasSourcesTable).toBe('career_sources')
      expect(hasLinksTable).toBe('career_source_links')
      expect(hasVerificationTable).toBe('verification_records')
      expect(hasTargetsTable).toBe('student_career_targets')
      expect(hasAuditTable).toBe('audit_logs')
      expect(hasBatchesTable).toBe('ingestion_batches')

      const hasAuditRPC: PublicFuncs = 'record_audit_event'
      const hasVerifyReqRPC: PublicFuncs = 'verify_career_requirement'
      const hasVerifyJobRPC: PublicFuncs = 'verify_job_opening'
      const hasStaleRPC: PublicFuncs = 'mark_stale_job_openings'

      expect(hasAuditRPC).toBe('record_audit_event')
      expect(hasVerifyReqRPC).toBe('verify_career_requirement')
      expect(hasVerifyJobRPC).toBe('verify_job_opening')
      expect(hasStaleRPC).toBe('mark_stale_job_openings')
    })
  })
})
