import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  CompanyStatus,
  RoleStatus,
  WorkMode,
  EmploymentType,
  JobOpeningStatus,
  TargetType,
  RequirementType,
  RequirementScope,
  ReadinessEvaluationStatus,
  CanonicalReadinessResultStatus,
  ReadinessMatchType,
  ReadinessEvidenceStatus,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/007_readiness_engine.sql')
const M06_MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/006_projects_certifications.sql')

describe('Milestone 09 — Readiness Engine (Migration 007)', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')
  const m06Sql = fs.readFileSync(M06_MIGRATION_PATH, 'utf-8')

  describe('1. Companies Schema (§31, Product Spec §16)', () => {
    it('migration file exists at supabase/migrations/007_readiness_engine.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates public.companies with required columns, types, and constraints', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.companies\b/i)
      expect(migrationSql).toMatch(/name\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(name\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/normalized_name\s+TEXT\s+GENERATED\s+ALWAYS\s+AS\s*\(\s*lower\(btrim\(name\)\)\s*\)\s+STORED/i)
      expect(migrationSql).toMatch(/slug\s+VARCHAR\(100\)\s+NOT\s+NULL\s+UNIQUE/i)
      expect(migrationSql).toContain("website ~* '^https?://[^\\s]+$'")
      expect(migrationSql).toMatch(/industry\s+VARCHAR\(100\)\s+NOT\s+NULL\s+DEFAULT\s+'Semiconductor & Electronics'/i)
      expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'active'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'active',\s*'inactive',\s*'archived'\s*\)\s*\)/i)
    })

    it('attaches updated_at trigger and indexes to public.companies', () => {
      expect(migrationSql).toMatch(/TRIGGER\s+set_companies_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.companies/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_companies_normalized_name\s+ON\s+public\.companies/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_companies_slug\s+ON\s+public\.companies/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_companies_status\s+ON\s+public\.companies/i)
    })
  })

  describe('2. Roles Schema (§32, Readiness Engine §4–§5)', () => {
    it('creates public.roles with required columns, types, and constraints', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.roles\b/i)
      expect(migrationSql).toMatch(/name\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(name\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/slug\s+VARCHAR\(100\)\s+NOT\s+NULL\s+UNIQUE/i)
      expect(migrationSql).toMatch(/domain\s+VARCHAR\(100\)\s+NOT\s+NULL\s+DEFAULT\s+'Embedded Systems'/i)
      expect(migrationSql).toMatch(/eligible_degrees\s+TEXT\[\]\s+NOT\s+NULL\s+DEFAULT\s+ARRAY\['B\.E\.',\s*'B\.Tech'\]::TEXT\[\]/i)
      expect(migrationSql).toMatch(/eligible_branches\s+TEXT\[\]\s+NOT\s+NULL\s+DEFAULT\s+ARRAY\['ECE',\s*'EEE',\s*'EIE'\]::TEXT\[\]/i)
      expect(migrationSql).toMatch(/minimum_cgpa\s+NUMERIC\(4,\s*2\)\s+DEFAULT\s+NULL\s+CHECK\s*\(\s*minimum_cgpa\s+IS\s+NULL\s+OR\s*\(\s*minimum_cgpa\s*>=\s*0\s+AND\s+minimum_cgpa\s*<=\s*10\.00\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/experience_months\s+INT\s+NOT\s+NULL\s+DEFAULT\s+0\s+CHECK\s*\(\s*experience_months\s*>=\s*0\s*\)/i)
      expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'active'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'active',\s*'inactive',\s*'archived'\s*\)\s*\)/i)
    })

    it('attaches updated_at trigger and indexes to public.roles', () => {
      expect(migrationSql).toMatch(/TRIGGER\s+set_roles_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.roles/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_roles_domain\s+ON\s+public\.roles/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_roles_slug\s+ON\s+public\.roles/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_roles_status\s+ON\s+public\.roles/i)
    })
  })

  describe('3. Job Openings Schema (§33, Readiness Engine §4, §6)', () => {
    it('creates public.job_openings with company FK, role FK, and work modes', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.job_openings\b/i)
      expect(migrationSql).toMatch(/company_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.companies\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/role_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/title\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(title\)\)\s*>\s*0\s*\)/i)
      expect(migrationSql).toMatch(/work_mode\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'on_site'\s+CHECK\s*\(\s*work_mode\s+IN\s*\(\s*'on_site',\s*'hybrid',\s*'remote'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/employment_type\s+VARCHAR\(50\)\s+NOT\s+NULL\s+DEFAULT\s+'full_time'\s+CHECK\s*\(\s*employment_type\s+IN\s*\(\s*'full_time',\s*'internship',\s*'contract',\s*'co_op'\s*\)\s*\)/i)
      expect(migrationSql).toContain("source_url ~* '^https?://[^\\s]+$'")
      expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'published'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'draft',\s*'published',\s*'closed',\s*'archived',\s*'stale'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/closing_date\s+DATE\s+CHECK\s*\(\s*closing_date\s+IS\s+NULL\s+OR\s+closing_date\s*>=\s*published_at::date\s*\)/i)
      expect(migrationSql).not.toContain('closing_date >= CURRENT_DATE')
    })

    it('attaches updated_at trigger and foreign key indexes to public.job_openings', () => {
      expect(migrationSql).toMatch(/TRIGGER\s+set_job_openings_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.job_openings/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_job_openings_company_id\s+ON\s+public\.job_openings/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_job_openings_role_id\s+ON\s+public\.job_openings/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_job_openings_status\s+ON\s+public\.job_openings/i)
      expect(migrationSql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_job_openings_closing_date\s+ON\s+public\.job_openings/i)
    })
  })

  describe('4. Career Requirements Schema & Exclusivity Constraints (§34–§36)', () => {
    it('creates public.career_requirements with requirement scopes and blocking flag', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.career_requirements\b/i)
      expect(migrationSql).toMatch(/target_type\s+VARCHAR\(20\)\s+NOT\s+NULL\s+CHECK\s*\(\s*target_type\s+IN\s*\(\s*'role',\s*'job_opening'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/role_id\s+UUID\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/job_opening_id\s+UUID\s+REFERENCES\s+public\.job_openings\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/requirement_type\s+VARCHAR\(50\)\s+NOT\s+NULL\s+CHECK\s*\(\s*requirement_type\s+IN\s*\(\s*'skill',\s*'degree',\s*'branch',\s*'cgpa',\s*'experience',\s*'certification',\s*'other'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(migrationSql).toMatch(/requirement_scope\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'required'\s+CHECK\s*\(\s*requirement_scope\s+IN\s*\(\s*'required',\s*'preferred'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/is_blocking\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+false/i)
      expect(migrationSql).toMatch(/weight\s+NUMERIC\(4,\s*2\)\s+NOT\s+NULL\s+DEFAULT\s+1\.0\s+CHECK\s*\(\s*weight\s*>\s*0\s+AND\s+weight\s*<=\s*10\.0\s*\)/i)
      expect(migrationSql).toMatch(/verification_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'unverified'\s+CHECK\s*\(\s*verification_status\s+IN\s*\(\s*'unverified',\s*'pending',\s*'verified',\s*'rejected'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/verification_level\s+VARCHAR\(50\)\s+NOT\s+NULL\s+DEFAULT\s+'unverified'\s+CHECK\s*\(\s*verification_level\s+IN\s*\(\s*'unverified',\s*'official_source',\s*'official_ats',\s*'corroborated_public_source',\s*'manually_curated'\s*\)\s*\)/i)
      expect(migrationSql).toContain("source_url ~* '^https?://[^\\s]+$'")
    })

    it('enforces target exclusivity constraint on public.career_requirements', () => {
      expect(migrationSql).toMatch(/CONSTRAINT\s+career_requirements_target_check\s+CHECK\s*\(\s*\(\s*target_type\s*=\s*'role'\s+AND\s+role_id\s+IS\s+NOT\s+NULL\s+AND\s+job_opening_id\s+IS\s+NULL\s*\)\s+OR\s+\(\s*target_type\s*=\s*'job_opening'\s+AND\s+job_opening_id\s+IS\s+NOT\s+NULL\s+AND\s+role_id\s+IS\s+NULL\s*\)\s*\)/i)
    })

    it('enforces skill_id presence when requirement_type is skill', () => {
      expect(migrationSql).toMatch(/CONSTRAINT\s+career_requirements_skill_check\s+CHECK\s*\(\s*requirement_type\s*<>\s*'skill'\s+OR\s+skill_id\s+IS\s+NOT\s+NULL\s*\)/i)
    })
  })

  describe('5. Readiness Evaluations Schema (§44, Readiness Engine §7, §44–§45)', () => {
    it('creates public.readiness_evaluations with scores, counts, version, and snapshot JSONB', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.readiness_evaluations\b/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'completed'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'requested',\s*'validating',\s*'calculating',\s*'completed',\s*'failed'\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/overall_score\s+NUMERIC\(5,\s*2\)\s+NOT\s+NULL\s+CHECK\s*\(\s*overall_score\s*>=\s*0\s+AND\s+overall_score\s*<=\s*100\s*\)/i)
      expect(migrationSql).toMatch(/required_score\s+NUMERIC\(5,\s*2\)\s+NOT\s+NULL\s+CHECK\s*\(\s*required_score\s*>=\s*0\s+AND\s+required_score\s*<=\s*100\s*\)/i)
      expect(migrationSql).toMatch(/preferred_score\s+NUMERIC\(5,\s*2\)\s+NOT\s+NULL\s+CHECK\s*\(\s*preferred_score\s*>=\s*0\s+AND\s+preferred_score\s*<=\s*100\s*\)/i)
      expect(migrationSql).toMatch(/is_eligible\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+true/i)
      expect(migrationSql).toMatch(/has_unresolved_blocking\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+false/i)
      expect(migrationSql).toMatch(/unknown_count\s+INT\s+NOT\s+NULL\s+DEFAULT\s+0\s+CHECK\s*\(\s*unknown_count\s*>=\s*0\s*\)/i)
      expect(migrationSql).toMatch(/engine_version\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'1\.0\.0'/i)
      expect(migrationSql).toMatch(/snapshot\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'\{\}'::jsonb/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+readiness_evaluations_target_check\s+CHECK\s*\(\s*\(\s*target_type\s*=\s*'role'\s+AND\s+role_id\s+IS\s+NOT\s+NULL\s+AND\s+job_opening_id\s+IS\s+NULL\s*\)\s+OR\s+\(\s*target_type\s*=\s*'job_opening'\s+AND\s+job_opening_id\s+IS\s+NOT\s+NULL\s+AND\s+role_id\s+IS\s+NULL\s*\)\s*\)/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+readiness_evaluations_id_student_key\s+UNIQUE\s*\(\s*id,\s*student_id\s*\)/i)
    })
  })

  describe('6. Readiness Requirement Results Schema & Canonical States (§45, §30–§35)', () => {
    it('creates public.readiness_requirement_results with composite ownership foreign key', () => {
      expect(migrationSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.readiness_requirement_results\b/i)
      expect(migrationSql).toMatch(/evaluation_id\s+UUID\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/student_id\s+UUID\s+NOT\s+NULL/i)
      expect(migrationSql).toMatch(/requirement_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.career_requirements\(id\)\s+ON\s+DELETE\s+CASCADE/i)
      expect(migrationSql).toMatch(/CONSTRAINT\s+fk_readiness_req_result_eval_student\s+FOREIGN\s+KEY\s*\(\s*evaluation_id,\s*student_id\s*\)\s+REFERENCES\s+public\.readiness_evaluations\s*\(\s*id,\s*student_id\s*\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    it('enforces strictly the five canonical readiness result states (no invented unsupported status)', () => {
      expect(migrationSql).toMatch(/result_status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+CHECK\s*\(\s*result_status\s+IN\s*\(\s*'met',\s*'partially_met',\s*'not_met',\s*'not_applicable',\s*'unknown'\s*\)\s*\)/i)
      expect(migrationSql).not.toMatch(/result_status[\s\S]*?'unsupported'/i)
    })

    it('enforces strictly canonical match types', () => {
      expect(migrationSql).toMatch(/match_type\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'none'\s+CHECK\s*\(\s*match_type\s+IN\s*\(\s*'exact',\s*'related',\s*'parent',\s*'child',\s*'none',\s*'not_applicable'\s*\)\s*\)/i)
    })

    it('enforces all approved evidence status dimensions including stale_requirement', () => {
      const match = migrationSql.match(/evidence_status\s+VARCHAR\(50\)\s+NOT\s+NULL\s+CHECK\s*\(\s*evidence_status\s+IN\s*\(([\s\S]*?)\)\s*\)/i)?.[1]
      expect(match).toBeDefined()
      expect(match).toContain("'verified'")
      expect(match).toContain("'unverified'")
      expect(match).toContain("'supported'")
      expect(match).toContain("'unsupported_claim'")
      expect(match).toContain("'missing'")
      expect(match).toContain("'stale'")
      expect(match).toContain("'academic_record'")
      expect(match).toContain("'calculated_cgpa'")
      expect(match).toContain("'missing_data'")
      expect(match).toContain("'stale_requirement'")
      expect(match).toContain("'not_applicable'")
    })
  })

  describe('7. Effective Requirement Resolution Function (§37, §39–§40)', () => {
    it('defines resolve_effective_requirements with STABLE SECURITY DEFINER and fixed search_path', () => {
      expect(migrationSql).toMatch(/FUNCTION\s+public\.resolve_effective_requirements\s*\(\s*p_target_type\s+VARCHAR,\s*p_target_id\s+UUID\s*\)/i)
      expect(migrationSql).toMatch(/LANGUAGE\s+plpgsql\s+STABLE\s+SECURITY\s+DEFINER\s+SET\s+search_path\s*=\s*public,\s*pg_temp/i)
    })

    it('resolves opening-specific overrides over role defaults deterministically', () => {
      const funcBody = migrationSql.match(/FUNCTION\s+public\.resolve_effective_requirements[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1]
      expect(funcBody).toBeDefined()
      expect(funcBody).toMatch(/IF\s+p_target_type\s*=\s*'role'\s+THEN/i)
      expect(funcBody).toMatch(/ELSIF\s+p_target_type\s*=\s*'job_opening'\s+THEN/i)
      expect(funcBody).toMatch(/opening_reqs\s+AS\s*\(/i)
      expect(funcBody).toMatch(/role_reqs\s+AS\s*\(/i)
      expect(funcBody).toMatch(/NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+opening_reqs/i)
      expect(funcBody).toMatch(/is_inherited/i)
    })

    it('documents explicit semantics: role-level eligibility fields are descriptive metadata while career_requirements is authoritative', () => {
      expect(migrationSql).toMatch(/Role-level eligibility fields[\s\S]*?descriptive metadata/i)
      expect(migrationSql).toMatch(/Authoritative criteria evaluated by the readiness engine are registered in[\s\S]*?public\.career_requirements/i)
    })
  })

  describe('8. Deterministic On-Demand Readiness Evaluation Function (§44–§50, §65, §86–§87)', () => {
    let evalFuncBody: string

    it('defines evaluate_student_readiness with VOLATILE SECURITY DEFINER and fixed search_path', () => {
      expect(migrationSql).toMatch(/FUNCTION\s+public\.evaluate_student_readiness\s*\(\s*p_student_id\s+UUID,\s*p_target_type\s+VARCHAR,\s*p_target_id\s+UUID,\s*p_engine_config\s+JSONB\s+DEFAULT\s+NULL\s*\)/i)
      expect(migrationSql).toMatch(/LANGUAGE\s+plpgsql\s+VOLATILE\s+SECURITY\s+DEFINER\s+SET\s+search_path\s*=\s*public,\s*pg_temp/i)
      evalFuncBody = migrationSql.match(/FUNCTION\s+public\.evaluate_student_readiness[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1] || ''
      expect(evalFuncBody).not.toBe('')
    })

    it('enforces student ownership and admin authorization in evaluate_student_readiness', () => {
      expect(evalFuncBody).toMatch(/v_caller_student_id\s*:=\s*public\.get_current_student_id\(\);/i)
      expect(evalFuncBody).toMatch(/v_is_caller_admin\s*:=\s*public\.is_admin\(\);/i)
      expect(evalFuncBody).toMatch(/IF\s+p_student_id\s*<>\s*v_caller_student_id\s+AND\s+NOT\s+v_is_caller_admin\s+THEN/i)
      expect(evalFuncBody).toMatch(/RAISE\s+EXCEPTION\s+'Access denied/i)
    })

    it('uses approved v1 engine configuration: version 1.0.0, W_req = 1.0, W_pref = 0.5, related credit = 0.00', () => {
      expect(evalFuncBody).toMatch(/v_engine_version\s+VARCHAR\(20\)\s*:=\s*'1\.0\.0';/i)
      expect(evalFuncBody).toMatch(/v_w_req\s+NUMERIC\(4,\s*2\)\s*:=\s*1\.0;/i)
      expect(evalFuncBody).toMatch(/v_w_pref\s+NUMERIC\(4,\s*2\)\s*:=\s*0\.5;/i)
      expect(evalFuncBody).toMatch(/v_related_credit\s+NUMERIC\(4,\s*2\)\s*:=\s*0\.00;/i)
    })

    it('enforces exact skill != related skill invariant and related score contribution = 0.00', () => {
      expect(evalFuncBody).toMatch(/v_res_status\s*:=\s*'partially_met';\s*v_match_type\s*:=\s*'related';/i)
      expect(evalFuncBody).toMatch(/v_score_contribution\s*:=\s*v_related_credit;/i)
      expect(evalFuncBody).toMatch(/related\s+skill\s+does\s+not\s+satisfy\s+exact\s+required\s+skill/i)
    })

    it('evaluates unsupported student declared skill claim to NOT_MET with unsupported_claim', () => {
      expect(evalFuncBody).toMatch(/v_res_status\s*:=\s*'not_met';\s*v_match_type\s*:=\s*'none';\s*v_ev_status\s*:=\s*'unsupported_claim';\s*v_score_contribution\s*:=\s*0\.00;/i)
      expect(evalFuncBody).toMatch(/Skill declared by student but lacks documented supporting evidence/i)
    })

    it('evaluates experience requirements strictly to UNKNOWN with missing_data (no experience table created)', () => {
      expect(evalFuncBody).toMatch(/ELSIF\s+r\.requirement_type\s*=\s*'experience'\s+THEN[\s\S]*?v_res_status\s*:=\s*'unknown';\s*v_match_type\s*:=\s*'none';\s*v_ev_status\s*:=\s*'missing_data';/i)
      expect(evalFuncBody).toMatch(/Student experience records are not currently documented in the platform/i)
    })

    it('evaluates missing academic records (CGPA, degree, branch null) strictly to UNKNOWN with missing_data', () => {
      expect(evalFuncBody).toMatch(/v_cgpa\s+IS\s+NULL[\s\S]*?v_res_status\s*:=\s*'unknown';[\s\S]*?v_ev_status\s*:=\s*'missing_data';/i)
      expect(evalFuncBody).toMatch(/v_student_record\.degree\s+IS\s+NULL[\s\S]*?v_res_status\s*:=\s*'unknown';[\s\S]*?v_ev_status\s*:=\s*'missing_data';/i)
      expect(evalFuncBody).toMatch(/v_student_record\.branch\s+IS\s+NULL[\s\S]*?v_res_status\s*:=\s*'unknown';[\s\S]*?v_ev_status\s*:=\s*'missing_data';/i)
    })

    it('evaluates retired/stale requirements to NOT_APPLICABLE with stale_requirement', () => {
      expect(evalFuncBody).toMatch(/IF\s+r\.verification_status\s*=\s*'rejected'\s+THEN[\s\S]*?v_res_status\s*:=\s*'not_applicable';\s*v_match_type\s*:=\s*'not_applicable';\s*v_ev_status\s*:=\s*'stale_requirement';/i)
    })

    it('enforces blocking requirement invariant: unresolved blocking forces has_unresolved_blocking and is_eligible = false', () => {
      expect(evalFuncBody).toMatch(/IF\s+r\.is_blocking\s+AND\s+v_res_status\s+IN\s*\(\s*'not_met',\s*'partially_met',\s*'unknown'\s*\)\s+THEN/i)
      expect(evalFuncBody).toMatch(/v_has_unresolved_blocking\s*:=\s*true;/i)
      expect(evalFuncBody).toMatch(/v_is_eligible\s*:=\s*false;/i)
      expect(evalFuncBody).toMatch(/v_blocking_count\s*:=\s*v_blocking_count\s*\+\s*1;/i)
    })

    it('awards 50% partial numerical score contribution for exact unverified evidence', () => {
      expect(evalFuncBody).toMatch(/v_res_status\s*:=\s*'partially_met';\s*v_match_type\s*:=\s*'exact';\s*v_ev_status\s*:=\s*'unverified';\s*v_score_contribution\s*:=\s*50\.00;/i)
    })

    it('treats UNKNOWN by excluding it from scoring denominators to avoid penalizing incomplete data as absence', () => {
      expect(evalFuncBody).toMatch(/v_res_status\s+NOT\s+IN\s*\(\s*'not_applicable',\s*'unknown'\s*\)/i)
      expect(evalFuncBody).toMatch(/v_unknown_count\s*:=\s*v_unknown_count\s*\+\s*1;/i)
    })

    it('persists point-in-time calculation snapshot JSONB with version, config, counts, and eligibility', () => {
      expect(evalFuncBody).toMatch(/v_snapshot\s*:=\s*jsonb_build_object\(/i)
      expect(evalFuncBody).toMatch(/'engine_version',\s*v_engine_version/i)
      expect(evalFuncBody).toMatch(/'engine_config'/i)
      expect(evalFuncBody).toMatch(/'required_weight',\s*v_w_req/i)
      expect(evalFuncBody).toMatch(/'preferred_weight',\s*v_w_pref/i)
      expect(evalFuncBody).toMatch(/'related_skill_score_credit',\s*v_related_credit/i)
      expect(evalFuncBody).toMatch(/'unknown',\s*v_unknown_count/i)
      expect(evalFuncBody).toMatch(/'is_eligible',\s*v_is_eligible/i)
      expect(evalFuncBody).toMatch(/'has_unresolved_blocking',\s*v_has_unresolved_blocking/i)
    })
  })

  describe('9. Non-Recursive Row-Level Security & Snapshot Immutability (§27–§31, Security Model)', () => {
    it('enables RLS on all six readiness engine tables', () => {
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.companies\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.roles\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.job_openings\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.career_requirements\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.readiness_evaluations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(migrationSql).toMatch(/ALTER\s+TABLE\s+public\.readiness_requirement_results\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
    })

    it('enforces student ownership isolation on readiness_evaluations and requirement_results SELECT', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_evaluations_select_policy\s+ON\s+public\.readiness_evaluations\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_req_results_select_policy\s+ON\s+public\.readiness_requirement_results\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
    })

    it('enforces snapshot immutability: evaluations and requirement results are NOT student-updatable', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_evaluations_update_policy\s+ON\s+public\.readiness_evaluations\s+FOR\s+UPDATE\s+USING\s*\(\s*public\.is_admin\(\)\s*\)\s+WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_req_results_update_policy\s+ON\s+public\.readiness_requirement_results\s+FOR\s+UPDATE\s+USING\s*\(\s*public\.is_admin\(\)\s*\)\s+WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i)

      const evalUpdatePolicy = migrationSql.match(/CREATE\s+POLICY\s+readiness_evaluations_update_policy[^;]+;/i)?.[0] || ''
      const reqResultUpdatePolicy = migrationSql.match(/CREATE\s+POLICY\s+readiness_req_results_update_policy[^;]+;/i)?.[0] || ''
      expect(evalUpdatePolicy).not.toContain('get_current_student_id')
      expect(reqResultUpdatePolicy).not.toContain('get_current_student_id')
    })

    it('enforces snapshot immutability: evaluations and requirement results are NOT student-deletable', () => {
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_evaluations_delete_policy\s+ON\s+public\.readiness_evaluations\s+FOR\s+DELETE\s+USING\s*\(\s*public\.is_admin\(\)\s*\)/i)
      expect(migrationSql).toMatch(/CREATE\s+POLICY\s+readiness_req_results_delete_policy\s+ON\s+public\.readiness_requirement_results\s+FOR\s+DELETE\s+USING\s*\(\s*public\.is_admin\(\)\s*\)/i)

      const evalDeletePolicy = migrationSql.match(/CREATE\s+POLICY\s+readiness_evaluations_delete_policy[^;]+;/i)?.[0] || ''
      const reqResultDeletePolicy = migrationSql.match(/CREATE\s+POLICY\s+readiness_req_results_delete_policy[^;]+;/i)?.[0] || ''
      expect(evalDeletePolicy).not.toContain('get_current_student_id')
      expect(reqResultDeletePolicy).not.toContain('get_current_student_id')
    })
  })

  describe('10. Permissions & Function Grants', () => {
    it('revokes public execution and grants authenticated execution on RPC functions', () => {
      expect(migrationSql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.resolve_effective_requirements\s*\(\s*VARCHAR,\s*UUID\s*\)\s+FROM\s+PUBLIC;/i)
      expect(migrationSql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.resolve_effective_requirements\s*\(\s*VARCHAR,\s*UUID\s*\)\s+TO\s+authenticated;/i)
      expect(migrationSql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.evaluate_student_readiness\s*\(\s*UUID,\s*VARCHAR,\s*UUID,\s*JSONB\s*\)\s+FROM\s+PUBLIC;/i)
      expect(migrationSql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.evaluate_student_readiness\s*\(\s*UUID,\s*VARCHAR,\s*UUID,\s*JSONB\s*\)\s+TO\s+authenticated;/i)
    })

    it('grants SELECT only to authenticated for historical snapshot tables', () => {
      expect(migrationSql).toMatch(/GRANT\s+SELECT\s+ON\s+public\.readiness_evaluations\s+TO\s+authenticated;/i)
      expect(migrationSql).toMatch(/GRANT\s+SELECT\s+ON\s+public\.readiness_requirement_results\s+TO\s+authenticated;/i)
      expect(migrationSql).not.toMatch(/GRANT\s+[^;]*?(?:INSERT|UPDATE|DELETE)\s+ON\s+public\.readiness_evaluations\s+TO\s+authenticated/i)
      expect(migrationSql).not.toMatch(/GRANT\s+[^;]*?(?:INSERT|UPDATE|DELETE)\s+ON\s+public\.readiness_requirement_results\s+TO\s+authenticated/i)
    })
  })

  describe('11. Database TypeScript Contracts Compliance', () => {
    it('verifies Database type contracts include all new tables and functions', () => {
      type PublicTables = Database['public']['Tables']
      type PublicFunctions = Database['public']['Functions']
      type CanonicalStatusEnum = Database['public']['Enums']['canonical_readiness_result_status']
      const _statusCheck: CanonicalStatusEnum = 'met'
      expect(_statusCheck).toBe('met')

      // Table Row Contracts
      type CompaniesRow = PublicTables['companies']['Row']
      type RolesRow = PublicTables['roles']['Row']
      type JobOpeningsRow = PublicTables['job_openings']['Row']
      type CareerRequirementsRow = PublicTables['career_requirements']['Row']
      type ReadinessEvaluationsRow = PublicTables['readiness_evaluations']['Row']
      type ReadinessRequirementResultsRow = PublicTables['readiness_requirement_results']['Row']

      const mockCompany: CompaniesRow = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Qualcomm India',
        normalized_name: 'qualcomm india',
        slug: 'qualcomm-india',
        website: 'https://qualcomm.com',
        industry: 'Semiconductor & Electronics',
        description: 'Wireless technology and semiconductors',
        status: 'active' as CompanyStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockCompany.slug).toBe('qualcomm-india')

      const mockRole: RolesRow = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Embedded Systems Engineer',
        slug: 'embedded-systems-engineer',
        domain: 'Embedded Systems',
        description: 'Microcontroller firmware and RTOS development',
        eligible_degrees: ['B.E.', 'B.Tech'],
        eligible_branches: ['ECE', 'EEE', 'EIE'],
        minimum_cgpa: 7.5,
        experience_months: 0,
        status: 'active' as RoleStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockRole.domain).toBe('Embedded Systems')

      const mockOpening: JobOpeningsRow = {
        id: '33333333-3333-3333-3333-333333333333',
        company_id: mockCompany.id,
        role_id: mockRole.id,
        title: 'Embedded Firmware Engineer — Chennai',
        description: 'Develop low-level C firmware for Qualcomm modems',
        location: 'Chennai, Tamil Nadu',
        work_mode: 'on_site' as WorkMode,
        employment_type: 'full_time' as EmploymentType,
        eligible_degrees: null,
        eligible_branches: null,
        minimum_cgpa: 8.0,
        experience_months: 6,
        source_url: 'https://qualcomm.com/careers/job-1234',
        status: 'published' as JobOpeningStatus,
        published_at: new Date().toISOString(),
        closing_date: '2026-12-31',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockOpening.work_mode).toBe('on_site')

      const mockReq: CareerRequirementsRow = {
        id: '44444444-4444-4444-4444-444444444444',
        target_type: 'job_opening' as TargetType,
        role_id: null,
        job_opening_id: mockOpening.id,
        requirement_type: 'skill' as RequirementType,
        skill_id: '55555555-5555-5555-5555-555555555555',
        requirement_scope: 'required' as RequirementScope,
        is_blocking: true,
        title: 'Embedded C',
        description: 'Proficiency in Embedded C firmware and hardware registers',
        required_value: null,
        weight: 1.0,
        verification_status: 'verified',
        verification_level: 'official_ats',
        source_url: 'https://qualcomm.com/careers/job-1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockReq.is_blocking).toBe(true)

      const mockEval: ReadinessEvaluationsRow = {
        id: '66666666-6666-6666-6666-666666666666',
        student_id: '77777777-7777-7777-7777-777777777777',
        target_type: 'job_opening' as TargetType,
        role_id: null,
        job_opening_id: mockOpening.id,
        status: 'completed' as ReadinessEvaluationStatus,
        overall_score: 92.5,
        required_score: 90.0,
        preferred_score: 95.0,
        is_eligible: true,
        has_unresolved_blocking: false,
        requirement_count: 5,
        satisfied_count: 4,
        partial_count: 1,
        missing_count: 0,
        unknown_count: 0,
        blocking_count: 0,
        engine_version: '1.0.0',
        calculated_at: new Date().toISOString(),
        snapshot: {
          engine_version: '1.0.0',
          engine_config: { required_weight: 1.0, preferred_weight: 0.5, related_skill_score_credit: 0.0 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockEval.overall_score).toBe(92.5)

      const mockReqResult: ReadinessRequirementResultsRow = {
        id: '88888888-8888-8888-8888-888888888888',
        evaluation_id: mockEval.id,
        student_id: mockEval.student_id,
        requirement_id: mockReq.id,
        requirement_type: 'skill',
        requirement_scope: 'required' as RequirementScope,
        is_blocking: true,
        result_status: 'met' as CanonicalReadinessResultStatus,
        match_type: 'exact' as ReadinessMatchType,
        evidence_status: 'verified' as ReadinessEvidenceStatus,
        score_contribution: 100.0,
        evidence_count: 2,
        verified_evidence_count: 1,
        evidence_references: [{ evidence_id: '99999999-9999-9999-9999-999999999999' }],
        explanation: 'Exact skill match supported by verified evidence.',
        created_at: new Date().toISOString(),
      }
      expect(mockReqResult.result_status).toBe('met')

      // Function return type checking
      type ResolveEffectiveReqsReturn = PublicFunctions['resolve_effective_requirements']['Returns']
      const mockResolved: ResolveEffectiveReqsReturn = [
        {
          id: mockReq.id,
          target_type: 'job_opening',
          role_id: null,
          job_opening_id: mockOpening.id,
          requirement_type: 'skill',
          skill_id: mockReq.skill_id,
          requirement_scope: 'required',
          is_blocking: true,
          title: 'Embedded C',
          description: null,
          required_value: null,
          weight: 1.0,
          verification_status: 'verified',
          verification_level: 'official_ats',
          source_url: null,
          is_inherited: false,
        },
      ]
      expect(mockResolved[0].is_inherited).toBe(false)
    })
  })

  describe('12. Milestone 07/08 Evidence & Taxonomy Regression Safety', () => {
    it('preserves single-source evidence constraint from Milestone 08 in skill_evidence', () => {
      expect(m06Sql).toMatch(/CONSTRAINT\s+skill_evidence_single_source_check\s+CHECK\s*\(\s*num_nonnulls\s*\(\s*attempt_id,\s*project_id,\s*certification_id\s*\)\s*<=\s*1\s*\)/i)
    })

    it('preserves canonical skill ON DELETE RESTRICT constraints across project_skills and certification_skills', () => {
      expect(m06Sql).toMatch(/CONSTRAINT\s+project_skills_skill_fkey\s+FOREIGN\s+KEY\s*\(\s*skill_id\s*\)\s+REFERENCES\s+public\.skills\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i)
      expect(m06Sql).toMatch(/CONSTRAINT\s+certification_skills_skill_fkey\s+FOREIGN\s+KEY\s*\(\s*skill_id\s*\)\s+REFERENCES\s+public\.skills\s*\(\s*id\s*\)\s+ON\s+DELETE\s+RESTRICT/i)
    })

    it('preserves canonical skill ON DELETE RESTRICT in career_requirements', () => {
      expect(migrationSql).toMatch(/skill_id\s+UUID\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
    })
  })
})
