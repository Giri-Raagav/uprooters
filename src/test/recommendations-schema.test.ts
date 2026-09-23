import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type {
  Database,
  RecommendationType,
  RecommendationCatalogStatus,
  StudentRecommendationStatus,
  RecommendationPriority,
  RecommendationTargetType,
} from '@/types/database.types'

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/008_recommendations.sql')

describe('Milestone 10 — Recommendations (Migration 008)', () => {
  const sql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  // ── Section 1: public.recommendations catalog ────────────────────────────
  describe('1. Recommendations Catalog Schema (DB spec §47)', () => {
    it('migration file exists at supabase/migrations/008_recommendations.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    it('creates public.recommendations with title, description, type, skill_id, status, timestamps', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.recommendations\b/i)
      expect(sql).toMatch(/title\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*char_length\(trim\(title\)\)\s*>\s*0\s*\)/i)
      expect(sql).toMatch(/description\s+TEXT/i)
      expect(sql).toMatch(/recommendation_type\s+VARCHAR\(30\)\s+NOT\s+NULL\s+CHECK\s*\(\s*recommendation_type\s+IN\s*\(\s*'skill_acquisition',\s*'project',\s*'certification',\s*'academic',\s*'experience',\s*'other'\s*\)\s*\)/i)
      expect(sql).toMatch(/skill_id\s+UUID\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(sql).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'active'\s+CHECK\s*\(\s*status\s+IN\s*\(\s*'active',\s*'inactive',\s*'archived'\s*\)\s*\)/i)
      expect(sql).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
      expect(sql).toMatch(/updated_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
    })

    it('attaches updated_at trigger and indexes to public.recommendations', () => {
      expect(sql).toMatch(/TRIGGER\s+set_recommendations_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.recommendations/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_recommendations_type\s+ON\s+public\.recommendations/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_recommendations_skill_id\s+ON\s+public\.recommendations/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_recommendations_status\s+ON\s+public\.recommendations/i)
    })
  })

  // ── Section 2: public.recommendation_skills ──────────────────────────────
  describe('2. Recommendation Skills Mapping Schema (DB spec §48)', () => {
    it('creates public.recommendation_skills with composite PK', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.recommendation_skills\b/i)
      expect(sql).toMatch(/PRIMARY\s+KEY\s*\(\s*recommendation_id,\s*skill_id\s*\)/i)
    })

    it('enforces ON DELETE CASCADE on recommendation_id FK', () => {
      const recSkillBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.recommendation_skills[\s\S]*?\);/i)?.[0] || ''
      expect(recSkillBlock).toMatch(/recommendation_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.recommendations\(id\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    it('enforces ON DELETE RESTRICT on skill_id FK (skill canonicality preserved)', () => {
      const recSkillBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.recommendation_skills[\s\S]*?\);/i)?.[0] || ''
      expect(recSkillBlock).toMatch(/skill_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
    })

    it('creates index on recommendation_skills.skill_id', () => {
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_recommendation_skills_skill_id\s+ON\s+public\.recommendation_skills/i)
    })
  })

  // ── Section 3: public.student_recommendations ────────────────────────────
  describe('3. Student Recommendations Schema (DB spec §47–§50, RE §62–§63)', () => {
    let srBlock: string

    it('creates public.student_recommendations with all required columns', () => {
      expect(sql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations\b/i)
      srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).not.toBe('')
      expect(srBlock).toMatch(/student_id\s+UUID\s+NOT\s+NULL/i)
      expect(srBlock).toMatch(/recommendation_id\s+UUID\s+NOT\s+NULL/i)
      expect(srBlock).toMatch(/source_evaluation_id\s+UUID/i)
      expect(srBlock).toMatch(/source_requirement_id\s+UUID/i)
      expect(srBlock).toMatch(/target_type\s+VARCHAR\(30\)/i)
      expect(srBlock).toMatch(/priority\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'medium'/i)
      expect(srBlock).toMatch(/status\s+VARCHAR\(20\)\s+NOT\s+NULL\s+DEFAULT\s+'active'/i)
      expect(srBlock).toMatch(/reason\s+TEXT/i)
      expect(srBlock).toMatch(/gap_snapshot\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'{}'/i)
      expect(srBlock).toMatch(/generated_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/i)
      expect(srBlock).toMatch(/completed_at\s+TIMESTAMPTZ/i)
      expect(srBlock).toMatch(/dismissed_at\s+TIMESTAMPTZ/i)
      expect(srBlock).toMatch(/expired_at\s+TIMESTAMPTZ/i)
    })

    it('enforces all six canonical lifecycle status values', () => {
      srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/status[\s\S]*?CHECK\s*\(\s*status\s+IN\s*\(\s*'generated',\s*'active',\s*'completed',\s*'verified',\s*'dismissed',\s*'expired'\s*\)\s*\)/i)
    })

    it('enforces all four approved priority values', () => {
      srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/priority[\s\S]*?CHECK\s*\(\s*priority\s+IN\s*\(\s*'critical',\s*'high',\s*'medium',\s*'low'\s*\)\s*\)/i)
    })

    it('enforces all six target_type values', () => {
      srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/target_type\s+IS\s+NULL\s+OR\s+target_type\s+IN\s*\(\s*'role',\s*'job_opening',\s*'skill',\s*'academic',\s*'career_domain',\s*'profile_area'\s*\)/i)
    })

    it('attaches updated_at trigger and indexes to public.student_recommendations', () => {
      expect(sql).toMatch(/TRIGGER\s+set_student_recommendations_updated_at\s+BEFORE\s+UPDATE\s+ON\s+public\.student_recommendations/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_recommendations_student_id/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_recommendations_status/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_recommendations_priority/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_recommendations_source_eval/i)
      expect(sql).toMatch(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_student_recommendations_source_req/i)
    })
  })

  // ── Section 4: FK design — SET NULL on target and provenance ─────────────
  describe('4. Historical Integrity FK Design (ON DELETE SET NULL on provenance & targets)', () => {
    it('student_id uses ON DELETE CASCADE (student deletion clears recommendations)', () => {
      const srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/student_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.students\(id\)\s+ON\s+DELETE\s+CASCADE/i)
    })

    it('recommendation_id uses ON DELETE RESTRICT (catalog protected from deletion)', () => {
      const srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/recommendation_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.recommendations\(id\)\s+ON\s+DELETE\s+RESTRICT/i)
    })

    it('source_evaluation_id uses ON DELETE SET NULL (provenance preserved, not cascaded)', () => {
      const srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/source_evaluation_id\s+UUID\s+REFERENCES\s+public\.readiness_evaluations\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('source_requirement_id uses ON DELETE SET NULL (provenance preserved, not cascaded)', () => {
      const srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/source_requirement_id\s+UUID\s+REFERENCES\s+public\.career_requirements\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('target_role_id, target_job_opening_id, target_skill_id all use ON DELETE SET NULL', () => {
      const srBlock = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.student_recommendations[\s\S]*?\);/i)?.[0] || ''
      expect(srBlock).toMatch(/target_role_id\s+UUID\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(srBlock).toMatch(/target_job_opening_id\s+UUID\s+REFERENCES\s+public\.job_openings\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(srBlock).toMatch(/target_skill_id\s+UUID\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })
  })

  // ── Section 5: Uniqueness constraint ─────────────────────────────────────
  describe('5. Deduplication Constraint (uq_student_recommendation_active)', () => {
    it('enforces UNIQUE NULLS NOT DISTINCT on (student_id, recommendation_id, target_role_id, target_job_opening_id)', () => {
      expect(sql).toMatch(/CONSTRAINT\s+uq_student_recommendation_active\s+UNIQUE\s+NULLS\s+NOT\s+DISTINCT\s*\(\s*student_id,\s*recommendation_id,\s*target_role_id,\s*target_job_opening_id\s*\)/i)
    })
  })

  // ── Section 6: Lifecycle trigger ─────────────────────────────────────────
  describe('6. Lifecycle Enforcement Trigger (RE §62, dev rules §85)', () => {
    let triggerFuncBody: string

    it('defines enforce_student_recommendation_lifecycle trigger function', () => {
      expect(sql).toMatch(/FUNCTION\s+public\.enforce_student_recommendation_lifecycle\(\)\s+RETURNS\s+TRIGGER/i)
      triggerFuncBody = sql.match(/FUNCTION\s+public\.enforce_student_recommendation_lifecycle\(\)[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1] || ''
      expect(triggerFuncBody).not.toBe('')
    })

    it('rejects mutation of student_id (immutable after creation)', () => {
      expect(triggerFuncBody).toMatch(/NEW\.student_id\s*<>\s*OLD\.student_id[\s\S]*?RAISE\s+EXCEPTION\s+'student_recommendations\.student_id\s+is\s+immutable/i)
    })

    it('rejects mutation of recommendation_id (immutable after creation)', () => {
      expect(triggerFuncBody).toMatch(/NEW\.recommendation_id\s*<>\s*OLD\.recommendation_id[\s\S]*?RAISE\s+EXCEPTION\s+'student_recommendations\.recommendation_id\s+is\s+immutable/i)
    })

    it('rejects mutation of gap_snapshot (immutable after creation)', () => {
      expect(triggerFuncBody).toMatch(/NEW\.gap_snapshot\s*<>\s*OLD\.gap_snapshot[\s\S]*?RAISE\s+EXCEPTION\s+'student_recommendations\.gap_snapshot\s+is\s+immutable/i)
    })

    it('rejects mutation of priority (immutable after creation)', () => {
      expect(triggerFuncBody).toMatch(/NEW\.priority\s*<>\s*OLD\.priority[\s\S]*?RAISE\s+EXCEPTION\s+'student_recommendations\.priority\s+is\s+immutable/i)
    })

    it('rejects mutation of generated_at (immutable after creation)', () => {
      expect(triggerFuncBody).toMatch(/NEW\.generated_at\s*<>\s*OLD\.generated_at[\s\S]*?RAISE\s+EXCEPTION\s+'student_recommendations\.generated_at\s+is\s+immutable/i)
    })

    it('validates state transition allowlist and raises on illegal transitions', () => {
      expect(triggerFuncBody).toMatch(/v_old_status\s*=\s*'generated'\s+AND\s+v_new_status\s+IN\s*\(\s*'active',\s*'dismissed',\s*'expired'\s*\)/i)
      expect(triggerFuncBody).toMatch(/v_old_status\s*=\s*'active'\s+AND\s+v_new_status\s+IN\s*\(\s*'completed',\s*'dismissed',\s*'expired'\s*\)/i)
      expect(triggerFuncBody).toMatch(/v_old_status\s*=\s*'completed'\s+AND\s+v_new_status\s*=\s*'verified'/i)
      expect(triggerFuncBody).toMatch(/RAISE\s+EXCEPTION[\s\S]*?Invalid\s+student_recommendation\s+status\s+transition/i)
    })

    it('sets completed_at on → completed transition', () => {
      expect(triggerFuncBody).toMatch(/v_new_status\s*=\s*'completed'\s+THEN\s+NEW\.completed_at\s*:=\s*now\(\)/i)
    })

    it('sets dismissed_at on → dismissed transition', () => {
      expect(triggerFuncBody).toMatch(/v_new_status\s*=\s*'dismissed'\s+THEN\s+NEW\.dismissed_at\s*:=\s*now\(\)/i)
    })

    it('sets expired_at on → expired transition', () => {
      expect(triggerFuncBody).toMatch(/v_new_status\s*=\s*'expired'\s+THEN\s+NEW\.expired_at\s*:=\s*now\(\)/i)
    })

    it('attaches lifecycle trigger BEFORE UPDATE on public.student_recommendations', () => {
      expect(sql).toMatch(/CREATE\s+TRIGGER\s+trg_student_recommendation_lifecycle\s+BEFORE\s+UPDATE\s+ON\s+public\.student_recommendations/i)
    })
  })

  // ── Section 7: Generation function ───────────────────────────────────────
  describe('7. Gap-to-Recommendation Generation Function (RE §55–§57, §60–§61)', () => {
    let genFuncBody: string

    it('defines generate_recommendations_from_evaluation with VOLATILE SECURITY DEFINER and fixed search_path', () => {
      expect(sql).toMatch(/FUNCTION\s+public\.generate_recommendations_from_evaluation\s*\(\s*p_evaluation_id\s+UUID\s*\)\s+RETURNS\s+INT/i)
      expect(sql).toMatch(/LANGUAGE\s+plpgsql\s+VOLATILE\s+SECURITY\s+DEFINER\s+SET\s+search_path\s*=\s*public,\s*pg_temp/i)
      genFuncBody = sql.match(/FUNCTION\s+public\.generate_recommendations_from_evaluation[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1] || ''
      expect(genFuncBody).not.toBe('')
    })

    it('enforces ownership / security check before processing', () => {
      expect(genFuncBody).toMatch(/v_caller_student_id\s*:=\s*public\.get_current_student_id\(\)/i)
      expect(genFuncBody).toMatch(/v_is_caller_admin\s*:=\s*public\.is_admin\(\)/i)
      expect(genFuncBody).toMatch(/v_student_id\s*<>\s*v_caller_student_id\s+AND\s+NOT\s+v_is_caller_admin/i)
      expect(genFuncBody).toMatch(/RAISE\s+EXCEPTION\s+'Access\s+denied/i)
    })

    it('raises exception when evaluation is not found', () => {
      expect(genFuncBody).toMatch(/v_student_id\s+IS\s+NULL[\s\S]*?RAISE\s+EXCEPTION\s+'Readiness\s+evaluation\s+with\s+id\s+%\s+not\s+found/i)
    })

    it('selects only not_met and partially_met gaps from readiness_requirement_results', () => {
      expect(genFuncBody).toMatch(/rrr\.result_status\s+IN\s*\(\s*'not_met',\s*'partially_met'\s*\)/i)
    })

    it('joins career_requirements to get requirement title and skill_id for each gap', () => {
      expect(genFuncBody).toMatch(/JOIN\s+public\.career_requirements\s+cr\s+ON\s+cr\.id\s*=\s*rrr\.requirement_id/i)
      expect(genFuncBody).toMatch(/cr\.title\s+AS\s+requirement_title/i)
      expect(genFuncBody).toMatch(/cr\.skill_id\s+AS\s+requirement_skill_id/i)
    })

    it('uses ON CONFLICT DO NOTHING against uq_student_recommendation_active for deduplication', () => {
      expect(genFuncBody).toMatch(/ON\s+CONFLICT\s+ON\s+CONSTRAINT\s+uq_student_recommendation_active\s+DO\s+NOTHING/i)
    })

    it('returns INT count of newly inserted recommendations', () => {
      expect(genFuncBody).toMatch(/RETURN\s+v_created_count;/i)
    })

    it('builds gap_snapshot JSONB with evaluation_id, requirement_id, result_status, evidence_status, is_blocking', () => {
      expect(genFuncBody).toMatch(/'evaluation_id',\s*p_evaluation_id/i)
      expect(genFuncBody).toMatch(/'requirement_id',\s*r\.requirement_id/i)
      expect(genFuncBody).toMatch(/'result_status',\s*r\.result_status/i)
      expect(genFuncBody).toMatch(/'evidence_status',\s*r\.evidence_status/i)
      expect(genFuncBody).toMatch(/'is_blocking',\s*r\.is_blocking/i)
    })
  })

  // ── Section 8: Priority mapping correctness ───────────────────────────────
  describe('8. Priority Mapping Logic (RE §57, approved M10 decisions)', () => {
    let genFuncBody: string

    it('assigns critical to blocking + required + not_met', () => {
      genFuncBody = sql.match(/FUNCTION\s+public\.generate_recommendations_from_evaluation[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$;/i)?.[1] || ''
      expect(genFuncBody).toMatch(/r\.is_blocking\s+AND\s+r\.requirement_scope\s*=\s*'required'\s+AND\s+r\.result_status\s*=\s*'not_met'[\s\S]*?v_priority\s*:=\s*'critical'/i)
    })

    it('assigns high to non-blocking + required + not_met', () => {
      expect(genFuncBody).toMatch(/NOT\s+r\.is_blocking\s+AND\s+r\.requirement_scope\s*=\s*'required'\s+AND\s+r\.result_status\s*=\s*'not_met'[\s\S]*?v_priority\s*:=\s*'high'/i)
    })

    it('assigns medium to required + partially_met', () => {
      expect(genFuncBody).toMatch(/r\.requirement_scope\s*=\s*'required'\s+AND\s+r\.result_status\s*=\s*'partially_met'[\s\S]*?v_priority\s*:=\s*'medium'/i)
    })

    it('assigns medium to preferred + not_met', () => {
      expect(genFuncBody).toMatch(/r\.requirement_scope\s*=\s*'preferred'\s+AND\s+r\.result_status\s*=\s*'not_met'[\s\S]*?v_priority\s*:=\s*'medium'/i)
    })

    it('assigns low to preferred + partially_met (default ELSE branch)', () => {
      expect(genFuncBody).toMatch(/--\s*preferred\s*\+\s*partially_met[\s\S]*?v_priority\s*:=\s*'low'/i)
    })
  })

  // ── Section 9: RLS Policies ───────────────────────────────────────────────
  describe('9. Row-Level Security (Security Model §27, §65)', () => {
    it('enables RLS on all three recommendation tables', () => {
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.recommendations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.recommendation_skills\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
      expect(sql).toMatch(/ALTER\s+TABLE\s+public\.student_recommendations\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/i)
    })

    it('recommendations and recommendation_skills catalog: public SELECT', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+recommendations_select_policy\s+ON\s+public\.recommendations\s+FOR\s+SELECT\s+USING\s*\(\s*true\s*\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+recommendation_skills_select_policy\s+ON\s+public\.recommendation_skills\s+FOR\s+SELECT\s+USING\s*\(\s*true\s*\)/i)
    })

    it('recommendations catalog: INSERT/UPDATE/DELETE restricted to admin or data_editor', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+recommendations_insert_policy[\s\S]*?WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s+OR\s+public\.has_role\('data_editor'\)\s*\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+recommendations_update_policy[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s+OR\s+public\.has_role\('data_editor'\)\s*\)/i)
      expect(sql).toMatch(/CREATE\s+POLICY\s+recommendations_delete_policy[\s\S]*?USING\s*\(\s*public\.is_admin\(\)\s+OR\s+public\.has_role\('data_editor'\)\s*\)/i)
    })

    it('student_recommendations: SELECT isolated to own student_id, admin, or verifier', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+student_recommendations_select_policy\s+ON\s+public\.student_recommendations\s+FOR\s+SELECT\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s+OR\s+public\.has_role\('verifier'\)\s*\)/i)
    })

    it('student_recommendations: INSERT restricted to admin only (students use SECURITY DEFINER function)', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+student_recommendations_insert_policy\s+ON\s+public\.student_recommendations\s+FOR\s+INSERT\s+WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i)
    })

    it('student_recommendations: UPDATE allowed for own student or admin', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+student_recommendations_update_policy\s+ON\s+public\.student_recommendations\s+FOR\s+UPDATE\s+USING\s*\(\s*student_id\s*=\s*public\.get_current_student_id\(\)\s+OR\s+public\.is_admin\(\)\s*\)/i)
    })

    it('student_recommendations: DELETE restricted to admin only', () => {
      expect(sql).toMatch(/CREATE\s+POLICY\s+student_recommendations_delete_policy\s+ON\s+public\.student_recommendations\s+FOR\s+DELETE\s+USING\s*\(\s*public\.is_admin\(\)\s*\)/i)
    })
  })

  // ── Section 10: Grants ────────────────────────────────────────────────────
  describe('10. Permissions & Grants', () => {
    it('grants full DML on catalog tables to authenticated (filtered by RLS)', () => {
      expect(sql).toMatch(/GRANT\s+SELECT,\s*INSERT,\s*UPDATE,\s*DELETE\s+ON\s+public\.recommendations\s+TO\s+authenticated;/i)
      expect(sql).toMatch(/GRANT\s+SELECT,\s*INSERT,\s*UPDATE,\s*DELETE\s+ON\s+public\.recommendation_skills\s+TO\s+authenticated;/i)
    })

    it('grants SELECT and UPDATE only on student_recommendations to authenticated', () => {
      expect(sql).toMatch(/GRANT\s+SELECT,\s*UPDATE\s+ON\s+public\.student_recommendations\s+TO\s+authenticated;/i)
      // Must NOT grant INSERT or DELETE directly to authenticated
      expect(sql).not.toMatch(/GRANT\s+[^;]*?(?:INSERT|DELETE)\s+ON\s+public\.student_recommendations\s+TO\s+authenticated/i)
    })

    it('revokes PUBLIC and grants authenticated EXECUTE on generation function', () => {
      expect(sql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.generate_recommendations_from_evaluation\s*\(\s*UUID\s*\)\s+FROM\s+PUBLIC;/i)
      expect(sql).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.generate_recommendations_from_evaluation\s*\(\s*UUID\s*\)\s+TO\s+authenticated;/i)
    })

    it('revokes PUBLIC access from lifecycle trigger function (internal only)', () => {
      expect(sql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.enforce_student_recommendation_lifecycle\(\)\s+FROM\s+PUBLIC;/i)
    })
  })

  // ── Section 11: Historical integrity ─────────────────────────────────────
  describe('11. Historical Integrity — Provenance Preservation', () => {
    it('source_evaluation_id is SET NULL (not CASCADE) when evaluation is deleted', () => {
      expect(sql).toMatch(/source_evaluation_id\s+UUID\s+REFERENCES\s+public\.readiness_evaluations\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      // Must not use CASCADE on source_evaluation_id
      const evalCascadePattern = /source_evaluation_id\s+UUID[\s\S]*?ON\s+DELETE\s+CASCADE/i
      expect(sql).not.toMatch(evalCascadePattern)
    })

    it('source_requirement_id is SET NULL (not CASCADE) when requirement is deleted', () => {
      expect(sql).toMatch(/source_requirement_id\s+UUID\s+REFERENCES\s+public\.career_requirements\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('target FKs all use SET NULL (not CASCADE) so career changes do not destroy recommendations', () => {
      expect(sql).toMatch(/target_role_id\s+UUID\s+REFERENCES\s+public\.roles\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(sql).toMatch(/target_job_opening_id\s+UUID\s+REFERENCES\s+public\.job_openings\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
      expect(sql).toMatch(/target_skill_id\s+UUID\s+REFERENCES\s+public\.skills\(id\)\s+ON\s+DELETE\s+SET\s+NULL/i)
    })

    it('gap_snapshot JSONB preserves explainability even after referenced rows are NULLed', () => {
      expect(sql).toMatch(/gap_snapshot\s+JSONB\s+NOT\s+NULL\s+DEFAULT\s+'{}'/i)
    })

    it('completing a recommendation is independent of career requirement satisfaction (no auto-satisfy logic)', () => {
      // The generation function must NOT insert into student_skills or skill_evidence on completion
      expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.student_skills[\s\S]*?generate_recommendations_from_evaluation/i)
      expect(sql).not.toMatch(/INSERT\s+INTO\s+public\.skill_evidence[\s\S]*?generate_recommendations_from_evaluation/i)
    })
  })

  // ── Section 12: TypeScript type contracts ─────────────────────────────────
  describe('12. TypeScript Type Contracts (database.types.ts)', () => {
    it('exports RecommendationType with all six values', () => {
      const _check: RecommendationType = 'skill_acquisition'
      expect(_check).toBe('skill_acquisition')
      const _check2: RecommendationType = 'project'
      expect(_check2).toBe('project')
      const _check3: RecommendationType = 'certification'
      expect(_check3).toBe('certification')
      const _check4: RecommendationType = 'academic'
      expect(_check4).toBe('academic')
      const _check5: RecommendationType = 'experience'
      expect(_check5).toBe('experience')
      const _check6: RecommendationType = 'other'
      expect(_check6).toBe('other')
    })

    it('exports StudentRecommendationStatus with all six lifecycle states', () => {
      const s1: StudentRecommendationStatus = 'generated'
      const s2: StudentRecommendationStatus = 'active'
      const s3: StudentRecommendationStatus = 'completed'
      const s4: StudentRecommendationStatus = 'verified'
      const s5: StudentRecommendationStatus = 'dismissed'
      const s6: StudentRecommendationStatus = 'expired'
      expect([s1, s2, s3, s4, s5, s6]).toHaveLength(6)
    })

    it('exports RecommendationPriority with all four values', () => {
      const p1: RecommendationPriority = 'critical'
      const p2: RecommendationPriority = 'high'
      const p3: RecommendationPriority = 'medium'
      const p4: RecommendationPriority = 'low'
      expect([p1, p2, p3, p4]).toHaveLength(4)
    })

    it('exports RecommendationTargetType with all six values', () => {
      const t1: RecommendationTargetType = 'role'
      const t2: RecommendationTargetType = 'job_opening'
      const t3: RecommendationTargetType = 'skill'
      const t4: RecommendationTargetType = 'academic'
      const t5: RecommendationTargetType = 'career_domain'
      const t6: RecommendationTargetType = 'profile_area'
      expect([t1, t2, t3, t4, t5, t6]).toHaveLength(6)
    })

    it('exports Database table contracts for recommendations, recommendation_skills, student_recommendations', () => {
      type Tables = Database['public']['Tables']
      type RecRow = Tables['recommendations']['Row']
      type RecSkillRow = Tables['recommendation_skills']['Row']
      type SRRow = Tables['student_recommendations']['Row']

      const mockRec: RecRow = {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Build an RTOS-based ESP32 project',
        description: 'Complete a documented FreeRTOS project on ESP32',
        recommendation_type: 'project' as RecommendationType,
        skill_id: '22222222-2222-2222-2222-222222222222',
        status: 'active' as RecommendationCatalogStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockRec.recommendation_type).toBe('project')

      const mockRecSkill: RecSkillRow = {
        recommendation_id: mockRec.id,
        skill_id: '33333333-3333-3333-3333-333333333333',
      }
      expect(mockRecSkill.recommendation_id).toBe(mockRec.id)

      const mockSR: SRRow = {
        id: '44444444-4444-4444-4444-444444444444',
        student_id: '55555555-5555-5555-5555-555555555555',
        recommendation_id: mockRec.id,
        source_evaluation_id: '66666666-6666-6666-6666-666666666666',
        source_requirement_id: '77777777-7777-7777-7777-777777777777',
        target_type: 'role' as RecommendationTargetType,
        target_role_id: '88888888-8888-8888-8888-888888888888',
        target_job_opening_id: null,
        target_skill_id: null,
        priority: 'critical' as RecommendationPriority,
        status: 'active' as StudentRecommendationStatus,
        reason: 'Gap identified: FreeRTOS. Status: not_met.',
        gap_snapshot: {
          evaluation_id: '66666666-6666-6666-6666-666666666666',
          result_status: 'not_met',
          is_blocking: true,
        },
        generated_at: new Date().toISOString(),
        completed_at: null,
        dismissed_at: null,
        expired_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      expect(mockSR.priority).toBe('critical')
      expect(mockSR.status).toBe('active')
    })

    it('exports generate_recommendations_from_evaluation function signature returning number', () => {
      type Funcs = Database['public']['Functions']
      type GenRecArgs = Funcs['generate_recommendations_from_evaluation']['Args']
      type GenRecReturn = Funcs['generate_recommendations_from_evaluation']['Returns']
      const _argsCheck: GenRecArgs = { p_evaluation_id: '11111111-1111-1111-1111-111111111111' }
      const _returnCheck: GenRecReturn = 0
      expect(_argsCheck.p_evaluation_id).toBeDefined()
      expect(_returnCheck).toBe(0)
    })
  })
})
