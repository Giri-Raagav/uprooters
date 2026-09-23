import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  ProjectType,
  VerificationStatus,
  VerificationLevel,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/006_projects_certifications.sql')

describe('Milestone 08 — Projects & Certifications (Migration 006)', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  describe('1. Table Structure & Columns (§25–§28)', () => {
    it('migration file exists at supabase/migrations/006_projects_certifications.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates public.projects with required columns, defaults, and constraints', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.projects\b/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/title\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(title\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/project_type\s+VARCHAR\(50\)\s+NOT\s+NULL\s+DEFAULT\s+'academic'/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*project_type\s+IN\s*\(\s*'academic',\s*'capstone',\s*'personal',\s*'hackathon',\s*'competition',\s*'open_source',\s*'client',\s*'other'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/verification_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'unverified'/i)
      expect(migrationSql).toMatch(/CHECK\s*\(\s*verification_status\s+IN\s*\(\s*'unverified',\s*'pending',\s*'verified',\s*'rejected'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+projects_id_student_key\s+UNIQUE\s*\(\s*id,\s*student_id\s*\)/i)
    })

    it('creates public.project_skills with required columns, composite foreign key, and unique constraint', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.project_skills\b/i)
      expect(migrationSql).toMatch(/project_id\s+UUID\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+project_skills_project_student_fkey\s+FOREIGN\s+KEY\s*\(\s*project_id,\s*student_id\s*\)\s+REFERENCES\s+public\.projects\s*\(\s*id,\s*student_id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+project_skills_project_skill_key\s+UNIQUE\s*\(\s*project_id,\s*skill_id\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+project_skills_id_student_key\s+UNIQUE\s*\(\s*id,\s*student_id\s*\)/i)
    })

    it('creates public.certifications with required columns, defaults, and constraints', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.certifications\b/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/name\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(name\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/issuing_organization\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(issuing_organization\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/issue_date\s+DATE\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/verification_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'unverified'/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+certifications_id_student_key\s+UNIQUE\s*\(\s*id,\s*student_id\s*\)/i)
    })

    it('creates public.certification_skills with required columns, composite foreign key, and unique constraint', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.certification_skills\b/i)
      expect(migrationSql).toMatch(/certification_id\s+UUID\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+certification_skills_cert_student_fkey\s+FOREIGN\s+KEY\s*\(\s*certification_id,\s*student_id\s*\)\s+REFERENCES\s+public\.certifications\s*\(\s*id,\s*student_id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+certification_skills_cert_skill_key\s+UNIQUE\s*\(\s*certification_id,\s*skill_id\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+certification_skills_id_student_key\s+UNIQUE\s*\(\s*id,\s*student_id\s*\)/i)
    })
  })

  describe('2. Canonical Skill Enforcement & Foreign Key Behavior (§20, §76)', () => {
    it('enforces ON DELETE RESTRICT on canonical skills in project_skills and certification_skills', () => {
      expect(migrationSql).toMatch(/CONSTRAINT\s+project_skills_skill_fkey\s+FOREIGN\s+KEY\s*\(\s*skill_id\s*\)\s+REFERENCES\s+public\.skills\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+certification_skills_skill_fkey\s+FOREIGN\s+KEY\s*\(\s*skill_id\s*\)\s+REFERENCES\s+public\.skills\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i)
    })
  })

  describe('3. Date & URL Integrity Constraints', () => {
    it('enforces start_date <= end_date on projects when both exist', () => {
      expect(migrationSql).toMatch(/end_date\s+DATE\s+CHECK\s*\(\s*end_date\s+IS\s+NULL\s+OR\s+start_date\s+IS\s+NULL\s+OR\s+end_date\s*>=\s*start_date\s*\)/i)
    })

    it('enforces issue_date <= expiry_date on certifications when expiry exists', () => {
      expect(migrationSql).toMatch(/expiry_date\s+DATE\s+CHECK\s*\(\s*expiry_date\s+IS\s+NULL\s+OR\s+expiry_date\s*>=\s*issue_date\s*\)/i)
    })

    it('validates HTTP/HTTPS URL format for project and documentation URLs', () => {
      expect(migrationSql).toContain("project_url ~* '^https?://[^\\s]+$'")
      expect(migrationSql).toContain("documentation_url ~* '^https?://[^\\s]+$'")
    })

    it('validates HTTP/HTTPS URL format for credential URLs', () => {
      expect(migrationSql).toContain("credential_url ~* '^https?://[^\\s]+$'")
    })
  })

  describe('4. Dual-Phase Verification Anti-Spoofing Triggers (§29, Security Model)', () => {
    it('protects project verification fields on INSERT and UPDATE', () => {
      const funcBody = migrationSql.match(/FUNCTION\s+public\.protect_project_verification_fields[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()
      expect(funcBody).toMatch(/v_is_authorized\s*:=\s*\(public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\);/i)
      expect(funcBody).toMatch(/IF\s+TG_OP\s*=\s*'INSERT'\s+THEN/i)
      expect(funcBody).toMatch(/NEW\.verification_status\s*<>\s*'unverified'/i)
      expect(funcBody).toMatch(/NEW\.verification_level\s*<>\s*'unverified'/i)
      expect(funcBody).toMatch(/NEW\.verified_at\s+IS\s+NOT\s+NULL/i)
      expect(funcBody).toMatch(/NEW\.verified_by\s+IS\s+NOT\s+NULL/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: students cannot set verification fields/i)
      expect(funcBody).toMatch(/ELSIF\s+TG_OP\s*=\s*'UPDATE'\s+THEN/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: only verifiers or administrators can modify project verification fields/i)
    })

    it('protects certification verification fields on INSERT and UPDATE', () => {
      const funcBody = migrationSql.match(/FUNCTION\s+public\.protect_certification_verification_fields[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()
      expect(funcBody).toMatch(/v_is_authorized\s*:=\s*\(public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\);/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: students cannot set verification fields on inserted certifications'/i)
      expect(funcBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied: only verifiers or administrators can modify certification verification fields'/i)
    })

    it('enforces exact finite verification levels matching §40', () => {
      const expectedLevels = "('unverified', 'official_source', 'official_ats', 'corroborated_public_source', 'manually_curated')"
      expect(migrationSql).toMatch(new RegExp(expectedLevels.replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'i'))
    })
  })

  describe('5. Evidence Integration & Single-Source Constraint (§24)', () => {
    it('alters skill_evidence with project_id and certification_id foreign keys', () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.skill_evidence[\s\S]*?ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+project_id\s+UUID\s+REFERENCES\s+public\.projects\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.skill_evidence[\s\S]*?ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+certification_id\s+UUID\s+REFERENCES\s+public\.certifications\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('enforces single-source evidence exclusivity constraint (num_nonnulls <= 1)', () => {
      expect(migrationSql).toMatch(/CONSTRAINT\s+skill_evidence_single_source_check\s+CHECK\s*\(\s*num_nonnulls\(\s*attempt_id,\s*project_id,\s*certification_id\s*\)\s*<=\s*1\s*\)/i)
    })

    it('extends check_skill_evidence_integrity() to validate project and certification exact pairs and student ownership', () => {
      const integrityFunc = migrationSql.match(/FUNCTION\s+public\.check_skill_evidence_integrity[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(integrityFunc).toBeDefined()
      // Academic attempt validation preserved
      expect(integrityFunc).toMatch(/IF\s+v_attempt_student\s*<>\s*NEW\.student_id\s+THEN/i)

      // Project cross-student check
      expect(integrityFunc).toMatch(/IF\s+v_proj_student\s*<>\s*NEW\.student_id\s+THEN/i)
      expect(integrityFunc).toMatch(/RAISE\s+EXCEPTION\s+'Project belongs to a different student: cross-student evidence linking is prohibited'/i)
      // Project exact pair existence in project_skills
      expect(integrityFunc).toMatch(/WHERE\s+project_id\s*=\s*NEW\.project_id\s+AND\s+skill_id\s*=\s*NEW\.skill_id/i)
      expect(integrityFunc).toMatch(/RAISE\s+EXCEPTION\s+'Skill % is not associated with project % in project_skills'/i)

      // Certification cross-student check
      expect(integrityFunc).toMatch(/IF\s+v_cert_student\s*<>\s*NEW\.student_id\s+THEN/i)
      expect(integrityFunc).toMatch(/RAISE\s+EXCEPTION\s+'Certification belongs to a different student: cross-student evidence linking is prohibited'/i)
      // Certification exact pair existence in certification_skills
      expect(integrityFunc).toMatch(/WHERE\s+certification_id\s*=\s*NEW\.certification_id\s+AND\s+skill_id\s*=\s*NEW\.skill_id/i)
      expect(integrityFunc).toMatch(/RAISE\s+EXCEPTION\s+'Skill % is not associated with certification % in certification_skills'/i)
    })
  })

  describe('6. Parent Deletion Coordinator Triggers & Invalidation Guards', () => {
    it('attaches handle_project_deletion BEFORE DELETE ON projects to clear evidence pointer', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_handle_project_deletion[\s\S]*?BEFORE\s+DELETE\s+ON\s+public\.projects/i)
      const funcBody = migrationSql.match(/FUNCTION\s+public\.handle_project_deletion[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()
      expect(funcBody).toMatch(/UPDATE\s+public\.skill_evidence\s+SET\s+project_id\s*=\s*NULL,\s*updated_at\s*=\s*now\(\)\s+WHERE\s+project_id\s*=\s*OLD\.id;/i)
    })

    it('attaches handle_certification_deletion BEFORE DELETE ON certifications to clear evidence pointer', () => {
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+trg_handle_certification_deletion[\s\S]*?BEFORE\s+DELETE\s+ON\s+public\.certifications/i)
      const funcBody = migrationSql.match(/FUNCTION\s+public\.handle_certification_deletion[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()
      expect(funcBody).toMatch(/UPDATE\s+public\.skill_evidence\s+SET\s+certification_id\s*=\s*NULL,\s*updated_at\s*=\s*now\(\)\s+WHERE\s+certification_id\s*=\s*OLD\.id;/i)
    })

    it('guard_project_skill_evidence_invalidation prevents direct deletion/mutation when active evidence exists', () => {
      const guardFunc = migrationSql.match(/FUNCTION\s+public\.guard_project_skill_evidence_invalidation[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(guardFunc).toBeDefined()
      expect(guardFunc).toMatch(/WHERE\s+project_id\s*=\s*OLD\.project_id\s+AND\s+skill_id\s*=\s*OLD\.skill_id/i)
      expect(guardFunc).toMatch(/RAISE\s+EXCEPTION\s+'Cannot remove skill % from project %: active skill evidence references this project-skill association'/i)
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+guard_project_skill_evidence_invalidation_trg[\s\S]*?BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.project_skills/i)
    })

    it('guard_certification_skill_evidence_invalidation prevents direct deletion/mutation when active evidence exists', () => {
      const guardFunc = migrationSql.match(/FUNCTION\s+public\.guard_certification_skill_evidence_invalidation[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(guardFunc).toBeDefined()
      expect(guardFunc).toMatch(/WHERE\s+certification_id\s*=\s*OLD\.certification_id\s+AND\s+skill_id\s*=\s*OLD\.skill_id/i)
      expect(guardFunc).toMatch(/RAISE\s+EXCEPTION\s+'Cannot remove skill % from certification %: active skill evidence references this certification-skill association'/i)
      expect(migrationSql).toMatch(/CREATE\s+TRIGGER\s+guard_certification_skill_evidence_invalidation_trg[\s\S]*?BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.certification_skills/i)
    })

    it('guards against modifying skills on verified projects and certifications', () => {
      expect(migrationSql).toMatch(/FUNCTION\s+public\.guard_verified_project_skill_mutation/i)
      expect(migrationSql).toMatch(/RAISE\s+EXCEPTION\s+'Cannot modify skill associations on a verified project'/i)
      expect(migrationSql).toMatch(/FUNCTION\s+public\.guard_verified_certification_skill_mutation/i)
      expect(migrationSql).toMatch(/RAISE\s+EXCEPTION\s+'Cannot modify skill associations on a verified certification'/i)
    })
  })

  describe('7. Row-Level Security Policies (§27–§31)', () => {
    it('enables RLS on projects, project_skills, certifications, certification_skills', () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.projects\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.project_skills\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.certifications\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.certification_skills\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
    })

    it('enforces student isolation and prevents deleting verified projects/certifications', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+projects_select_policy\s+ON\s+public\.projects\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+projects_delete_policy\s+ON\s+public\.projects\s+FOR\s+DELETE\s+USING\s*\(\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+AND\s+verification_status\s*<>\s*'verified'\s*\)\s+OR\s+public\.is_admin\(\)\s*\)/i)

      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+certifications_select_policy\s+ON\s+public\.certifications\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+certifications_delete_policy\s+ON\s+public\.certifications\s+FOR\s+DELETE\s+USING\s*\(\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+AND\s+verification_status\s*<>\s*'verified'\s*\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
    })
  })

  describe('8. TypeScript Type Contract Verification', () => {
    it('defines ProjectType enum and conforms to Database interface', () => {
      const projType: ProjectType = 'capstone'
      const verStatus: VerificationStatus = 'unverified'
      const verLevel: VerificationLevel = 'manually_curated'

      expect(projType).toBe('capstone')
      expect(verStatus).toBe('unverified')
      expect(verLevel).toBe('manually_curated')

      type ProjectRow = Database['public']['Tables']['projects']['Row']
      type ProjectSkillRow = Database['public']['Tables']['project_skills']['Row']
      type CertificationRow = Database['public']['Tables']['certifications']['Row']
      type CertificationSkillRow = Database['public']['Tables']['certification_skills']['Row']
      type SkillEvidenceRow = Database['public']['Tables']['skill_evidence']['Row']

      const mockProject: ProjectRow = {
        id: '11111111-1111-1111-1111-111111111111',
        student_id: '22222222-2222-2222-2222-222222222222',
        title: 'RISC-V Core in Verilog',
        description: 'Pipelined 32-bit RISC-V CPU core implementation',
        project_type: 'personal',
        role_responsibility: 'Lead Hardware Designer',
        start_date: '2026-01-01',
        end_date: '2026-03-01',
        project_url: 'https://github.com/uprooters/riscv-core',
        documentation_url: 'https://docs.uprooters.io/riscv',
        verification_status: 'unverified',
        verification_level: 'unverified',
        verified_at: null,
        verified_by: null,
        metadata: { instructions_supported: ['RV32I'] },
        created_at: '2026-09-23T00:00:00Z',
        updated_at: '2026-09-23T00:00:00Z',
      }

      const mockProjectSkill: ProjectSkillRow = {
        id: '33333333-3333-3333-3333-333333333333',
        project_id: '11111111-1111-1111-1111-111111111111',
        student_id: '22222222-2222-2222-2222-222222222222',
        skill_id: '44444444-4444-4444-4444-444444444444',
        contribution_description: 'Designed ALU and control hazard units',
        created_at: '2026-09-23T00:00:00Z',
      }

      const mockCert: CertificationRow = {
        id: '55555555-5555-5555-5555-555555555555',
        student_id: '22222222-2222-2222-2222-222222222222',
        name: 'Certified Embedded Systems Architect',
        issuing_organization: 'IEEE Computer Society',
        issue_date: '2026-02-15',
        expiry_date: '2029-02-15',
        credential_id: 'IEEE-CESA-987654',
        credential_url: 'https://ieee.org/verify/987654',
        verification_status: 'verified',
        verification_level: 'official_source',
        verified_at: '2026-02-20T00:00:00Z',
        verified_by: '66666666-6666-6666-6666-666666666666',
        metadata: { badge: 'CESA-Gold' },
        created_at: '2026-09-23T00:00:00Z',
        updated_at: '2026-09-23T00:00:00Z',
      }

      const mockCertSkill: CertificationSkillRow = {
        id: '77777777-7777-7777-7777-777777777777',
        certification_id: '55555555-5555-5555-5555-555555555555',
        student_id: '22222222-2222-2222-2222-222222222222',
        skill_id: '44444444-4444-4444-4444-444444444444',
        created_at: '2026-09-23T00:00:00Z',
      }

      const mockEvidence: SkillEvidenceRow = {
        id: '88888888-8888-8888-8888-888888888888',
        student_id: '22222222-2222-2222-2222-222222222222',
        skill_id: '44444444-4444-4444-4444-444444444444',
        student_skill_id: null,
        evidence_type: 'project',
        title: 'RISC-V Core in Verilog',
        description: 'ALU verification testbench',
        evidence_url: 'https://github.com/uprooters/riscv-core',
        subject_id: null,
        attempt_id: null,
        project_id: '11111111-1111-1111-1111-111111111111',
        certification_id: null,
        reference_id: null,
        verification_status: 'unverified',
        verification_level: 'unverified',
        verified_at: null,
        verified_by: null,
        metadata: {},
        created_at: '2026-09-23T00:00:00Z',
        updated_at: '2026-09-23T00:00:00Z',
      }

      expect(mockProject.title).toBe('RISC-V Core in Verilog')
      expect(mockProjectSkill.student_id).toBe(mockProject.student_id)
      expect(mockCert.issuing_organization).toBe('IEEE Computer Society')
      expect(mockCertSkill.student_id).toBe(mockCert.student_id)
      expect(mockEvidence.project_id).toBe(mockProject.id)
      expect(mockEvidence.certification_id).toBeNull()
    })
  })
})
