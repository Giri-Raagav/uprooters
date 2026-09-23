import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  ProficiencyLevel,
  StudentSkillStatus,
  EvidenceType,
  VerificationStatus,
  VerificationLevel,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/005_student_skills_evidence.sql')

describe('Milestone 07 — Student Skills & Evidence (Migration 005)', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  describe('1. Table Structure & Integrity Constraints (§23–§24)', () => {
    it('migration file exists at supabase/migrations/005_student_skills_evidence.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates public.student_skills with required columns, constraints, and candidate keys', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_skills\b/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/proficiency_level\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'beginner'/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*proficiency_level\s+IN\s*\(\s*'beginner',\s*'intermediate',\s*'advanced',\s*'expert'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'claimed'/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*status\s+IN\s*\(\s*'claimed',\s*'supported',\s*'verified',\s*'archived'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/confidence\s+NUMERIC\(3,\s*2\)\s+DEFAULT\s+NULL/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*confidence\s+IS\s+NULL\s+OR\s*\(\s*confidence\s*>=\s*0\s+AND\s+confidence\s*<=\s*1\.00\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+student_skills_student_skill_key\s+UNIQUE\s*\(\s*student_id,\s*skill_id\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+student_skills_id_student_skill_key\s+UNIQUE\s*\(\s*id,\s*student_id,\s*skill_id\s*\)/i)
    })

    it('creates public.skill_evidence with required columns, constraints, and types', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.skill_evidence\b/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/title\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(title\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/verification_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'unverified'/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*verification_status\s+IN\s*\(\s*'unverified',\s*'pending',\s*'verified',\s*'rejected'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/metadata\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'\{\}'::jsonb/i)
    })
  })

  describe('2. Canonical Skill Enforcement (§20, §76)', () => {
    it('enforces ON DELETE RESTRICT on canonical skill foreign keys to preserve taxonomy integrity', () => {
      // student_skills
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      // skill_evidence
      const skillEvidenceBlock = migrationSql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.skill_evidence[\s\S]*?\);/i)?.[0]
      expect(skillEvidenceBlock).toBeDefined()
      expect(skillEvidenceBlock).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
    })
  })

  describe('3. Academic Evidence Referential Integrity & Deletion (§14, §17, §24)', () => {
    it('preserves immutable student_id NOT NULL and nullable attempt_id with ON DELETE SET NULL', () => {
      const skillEvidenceBlock = migrationSql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.skill_evidence[\s\S]*?\);/i)?.[0]
      expect(skillEvidenceBlock).toBeDefined()
      expect(skillEvidenceBlock).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(skillEvidenceBlock).toMatch(/attempt_id\s+UUID\s+REFERENCES\s+public\.student_subject_attempts\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('validates attempt cross-student isolation and subject consistency in check_skill_evidence_integrity()', () => {
      const integrityFunc = migrationSql.match(/FUNCTION\s+public\.check_skill_evidence_integrity[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(integrityFunc).toBeDefined()
      // Cross-student rejection
      expect(integrityFunc).toMatch(/IF\s+v_attempt_student\s*<>\s*NEW\.student_id\s+THEN/i)
      expect(integrityFunc).toMatch(/RAISE\s+EXCEPTION\s+'Academic attempt belongs to a different student/i)
      // Subject consistency check
      expect(integrityFunc).toMatch(/IF\s+NEW\.subject_id\s+IS\s+NOT\s+NULL\s+AND\s+NEW\.subject_id\s*<>\s*v_attempt_subject\s+THEN/i)
      // Auto-population of subject_id when NULL
      expect(integrityFunc).toMatch(/IF\s+NEW\.subject_id\s+IS\s+NULL\s+THEN\s+NEW\.subject_id\s*:=\s*v_attempt_subject;\s+END\s+IF;/i)
    })

    it('attaches BEFORE INSERT OR UPDATE trigger on public.skill_evidence', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+check_skill_evidence_integrity_trg[\s\S]*?BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.skill_evidence/i)
    })
  })

  describe('4. Composite Student Skill Linkage (§23–§24)', () => {
    it('enforces composite foreign key (student_skill_id, student_id, skill_id) -> student_skills', () => {
      expect(migrationSql).toMatch(/CONSTRAINT\s+skill_evidence_student_skill_fkey\s+FOREIGN\s+KEY\s*\(\s*student_skill_id,\s*student_id,\s*skill_id\s*\)\s+REFERENCES\s+public\.student_skills\s*\(\s*id,\s*student_id,\s*skill_id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    })
  })

  describe('5. Verification-Field Protection (§29, Security Model)', () => {
    it('implements dual-phase protection for both INSERT and UPDATE in protect_evidence_verification_fields()', () => {
      const funcBody = migrationSql.match(/FUNCTION\s+public\.protect_evidence_verification_fields[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()

      // Checks authorization via non-recursive helpers
      expect(funcBody).toMatch(/v_is_authorized\s*:=\s*\(public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\);/i)

      // On INSERT: non-authorized users CANNOT insert evidence as verified/pending or set verification timestamps/reviewers
      expect(funcBody).toMatch(/IF\s+TG_OP\s*=\s*'INSERT'\s+THEN/i)
      expect(funcBody).toMatch(/NEW\.verification_status\s*<>\s*'unverified'/i)
      expect(funcBody).toMatch(/NEW\.verification_level\s*<>\s*'unverified'/i)
      expect(funcBody).toMatch(/NEW\.verified_at\s+IS\s+NOT\s+NULL/i)
      expect(funcBody).toMatch(/NEW\.verified_by\s+IS\s+NOT\s+NULL/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: students cannot set verification fields/i)

      // On UPDATE: non-authorized users CANNOT alter verification fields
      expect(funcBody).toMatch(/ELSIF\s+TG_OP\s*=\s*'UPDATE'\s+THEN/i)
      expect(funcBody).toMatch(/NEW\.verification_status\s*<>\s*OLD\.verification_status/i)
      expect(funcBody).toMatch(/NEW\.verification_level\s*<>\s*OLD\.verification_level/i)
      expect(funcBody).toMatch(/NEW\.verified_at\s+IS\s+DISTINCT\s+FROM\s+OLD\.verified_at/i)
      expect(funcBody).toMatch(/NEW\.verified_by\s+IS\s+DISTINCT\s+FROM\s+OLD\.verified_by/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: only verifiers or administrators can modify verification fields/i)
    })

    it('attaches protect_skill_evidence_verification_fields_trg as BEFORE INSERT OR UPDATE trigger', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+protect_skill_evidence_verification_fields_trg[\s\S]*?BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.skill_evidence/i)
    })
  })

  describe('6. Exact Verification Levels from Specifications (§40)', () => {
    it('enforces exact finite verification_level set without invented levels', () => {
      const levels = [
        'unverified',
        'official_source',
        'official_ats',
        'corroborated_public_source',
        'manually_curated',
      ]
      for (const level of levels) {
        expect(migrationSql).toContain(`'${level}'`)
      }
      expect(migrationSql).toMatch(/CHECK\s*\(\s*verification_level\s+IN\s*\(\s*'unverified',\s*'official_source',\s*'official_ats',\s*'corroborated_public_source',\s*'manually_curated'\s*\)\s*\)/i)
    })
  })

  describe('7. Deterministic Skill Status Synchronization & Archival Invariance (§23)', () => {
    it('sync_student_skill_status reconciles claimed, supported, verified correctly', () => {
      const syncFunc = migrationSql.match(/FUNCTION\s+public\.sync_student_skill_status[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(syncFunc).toBeDefined()

      // Target status derivation
      expect(syncFunc).toMatch(/IF\s+v_verified_evidence\s*>\s*0\s+THEN\s+v_target_status\s*:=\s*'verified';/i)
      expect(syncFunc).toMatch(/ELSIF\s+v_total_evidence\s*>\s*0\s+THEN\s+v_target_status\s*:=\s*'supported';/i)
      expect(syncFunc).toMatch(/ELSE\s+v_target_status\s*:=\s*'claimed';/i)

      // Prevents trigger recursion by updating only when status actually changes
      expect(syncFunc).toMatch(/AND\s+status\s*<>\s*v_target_status/i)
    })

    it('archived skills are NEVER resurrected by evidence changes', () => {
      const syncFunc = migrationSql.match(/FUNCTION\s+public\.sync_student_skill_status[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(syncFunc).toBeDefined()
      expect(syncFunc).toMatch(/IF\s+v_current_status\s+IS\s+NULL\s+OR\s+v_current_status\s*=\s*'archived'\s+THEN\s+RETURN;\s+END\s+IF;/i)
    })

    it('attaches trg_sync_skill_status_on_evidence_change AFTER INSERT OR UPDATE OR DELETE', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_sync_skill_status_on_evidence_change[\s\S]*?AFTER\s+INSERT\s+OR\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.skill_evidence/i)
    })

    it('attaches unarchive trigger on student_skills to re-evaluate evidence when explicitly unarchived', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_sync_skill_status_on_unarchive[\s\S]*?AFTER\s+UPDATE\s+OF\s+status\s+ON\s+public\.student_skills/i)
      expect(migrationSql).toMatch(/WHEN\s*\(\s*OLD\.status\s*=\s*'archived'\s+AND\s+NEW\.status\s*<>\s*'archived'\s*\)/i)
    })
  })

  describe('8. Anti-Bypass Guard on Student Skills', () => {
    it('guard_student_skill_status_mutation prevents students from manually elevating status to supported or verified', () => {
      const guardFunc = migrationSql.match(/FUNCTION\s+public\.guard_student_skill_status_mutation[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(guardFunc).toBeDefined()
      expect(guardFunc).toMatch(/IF\s+NOT\s+\(public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\)\s+THEN/i)
      expect(guardFunc).toMatch(/IF\s+NEW\.status\s*<>\s*OLD\.status\s+AND\s+NEW\.status\s+IN\s*\('supported',\s*'verified'\)\s+THEN\s+NEW\.status\s*:=\s*OLD\.status;\s+END\s+IF;/i)
    })

    it('attaches guard_student_skills_status trigger BEFORE UPDATE on student_skills', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+guard_student_skills_status[\s\S]*?BEFORE\s+UPDATE\s+ON\s+public\.student_skills/i)
    })
  })

  describe('9. Row-Level Security & Non-Recursive Policies (§27–§30)', () => {
    it('enables RLS on both student_skills and skill_evidence', () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.student_skills\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.skill_evidence\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
    })

    it('student_skills RLS policies enforce student isolation and admin access', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+student_skills_select_policy\s+ON\s+public\.student_skills\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+student_skills_insert_policy\s+ON\s+public\.student_skills\s+FOR\s+INSERT\s+WITH\s+CHECK\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+student_skills_update_policy\s+ON\s+public\.student_skills\s+FOR\s+UPDATE\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+student_skills_delete_policy\s+ON\s+public\.student_skills\s+FOR\s+DELETE\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
    })

    it('skill_evidence RLS policies protect verified evidence from student deletion', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+skill_evidence_select_policy\s+ON\s+public\.skill_evidence\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+skill_evidence_delete_policy\s+ON\s+public\.skill_evidence\s+FOR\s+DELETE\s+USING\s*\(\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+AND\s+verification_status\s*<>\s*'verified'\s*\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
    })
  })

  describe('10. TypeScript Type Contract Verification', () => {
    it('defines all required Milestone 07 enums and types', () => {
      const proficiency: ProficiencyLevel = 'intermediate'
      const skillStatus: StudentSkillStatus = 'supported'
      const evidenceType: EvidenceType = 'academic_coursework'
      const verStatus: VerificationStatus = 'verified'
      const verLevel: VerificationLevel = 'official_source'

      expect(proficiency).toBe('intermediate')
      expect(skillStatus).toBe('supported')
      expect(evidenceType).toBe('academic_coursework')
      expect(verStatus).toBe('verified')
      expect(verLevel).toBe('official_source')
    })

    it('Database interface includes student_skills and skill_evidence with accurate types', () => {
      type StudentSkillRow = Database['public']['Tables']['student_skills']['Row']
      type SkillEvidenceRow = Database['public']['Tables']['skill_evidence']['Row']
      type SyncSkillStatusFn = Database['public']['Functions']['sync_student_skill_status']

      const mockSyncArgs: SyncSkillStatusFn['Args'] = {
        p_student_id: '22222222-2222-2222-2222-222222222222',
        p_skill_id: '33333333-3333-3333-3333-333333333333',
      }
      expect(mockSyncArgs.p_student_id).toBeDefined()

      const mockStudentSkill: StudentSkillRow = {
        id: '11111111-1111-1111-1111-111111111111',
        student_id: '22222222-2222-2222-2222-222222222222',
        skill_id: '33333333-3333-3333-3333-333333333333',
        proficiency_level: 'advanced',
        status: 'claimed',
        confidence: 0.85,
        created_at: '2026-09-23T00:00:00Z',
        updated_at: '2026-09-23T00:00:00Z',
      }

      const mockEvidence: SkillEvidenceRow = {
        id: '44444444-4444-4444-4444-444444444444',
        student_id: '22222222-2222-2222-2222-222222222222',
        skill_id: '33333333-3333-3333-3333-333333333333',
        student_skill_id: '11111111-1111-1111-1111-111111111111',
        evidence_type: 'academic_coursework',
        title: 'Digital Signal Processing Lab',
        description: 'Implemented FFT algorithms on DSP kit',
        evidence_url: 'https://dsp-coursework.edu',
        subject_id: '55555555-5555-5555-5555-555555555555',
        attempt_id: '66666666-6666-6666-6666-666666666666',
        project_id: null,
        certification_id: null,
        reference_id: null,
        verification_status: 'verified',
        verification_level: 'official_source',
        verified_at: '2026-09-23T00:00:00Z',
        verified_by: '77777777-7777-7777-7777-777777777777',
        metadata: { grade: 'A', credits: 4 },
        created_at: '2026-09-23T00:00:00Z',
        updated_at: '2026-09-23T00:00:00Z',
      }

      expect(mockStudentSkill.status).toBe('claimed')
      expect(mockEvidence.verification_status).toBe('verified')
    })
  })
})
