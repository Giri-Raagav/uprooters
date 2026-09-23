-- ============================================================================
-- Migration: 008_recommendations.sql
-- Description: Recommendations System (Catalog, Skills Mapping, Student Instances,
--              Lifecycle Enforcement, Gap-to-Recommendation Generation)
-- Milestone: 10 — Recommendations
-- Specifications:
--   - docs/05_DATABASE_SPEC.md §47–§50, §52, §63, §77
--   - docs/06_READINESS_ENGINE.md §55–§57, §60–§63, §68
--   - docs/07_SECURITY_MODEL.md §27, §65, §81
--   - docs/08_DEVELOPMENT_RULES.md §31, §84–§85
--   - .agents/rules/uprooters.md
-- ============================================================================

-- ── 1. Recommendations Catalog (public.recommendations) ─────────────────────
-- Canonical, reusable recommendation entries.
-- Recommendations must connect to actual evidence and requirements
-- and must not become generic motivational content.
-- Spec ref: docs/05_DATABASE_SPEC.md §47, docs/06_READINESS_ENGINE.md §60
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  -- Approved recommendation_type enum (derived from DB spec §47 examples):
  --   skill_acquisition: Learn/practice a canonical skill
  --   project:           Build a documented project
  --   certification:     Obtain a certification credential
  --   academic:          Improve academic performance (CGPA, subjects)
  --   experience:        Gain internship or practical experience
  --   other:             Unclassified actionable recommendation
  recommendation_type VARCHAR(30) NOT NULL
    CHECK (recommendation_type IN ('skill_acquisition', 'project', 'certification', 'academic', 'experience', 'other')),
  -- Optional primary canonical skill this recommendation addresses.
  -- ON DELETE SET NULL: retiring a skill does not destroy the catalog entry.
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_recommendations_type ON public.recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_skill_id ON public.recommendations(skill_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON public.recommendations(status);

-- ── 2. Recommendation Skills Mapping (public.recommendation_skills) ──────────
-- A single recommendation may target one or more canonical skills (DB spec §48).
-- ON DELETE RESTRICT on skill_id: deleting a skill that has active recommendation-skill
--   mappings is blocked (skill lifecycle must be managed via skill.status column).
-- ON DELETE CASCADE on recommendation_id: removing a catalog entry cleans up its skill links.
-- Spec ref: docs/05_DATABASE_SPEC.md §48
CREATE TABLE IF NOT EXISTS public.recommendation_skills (
  recommendation_id UUID NOT NULL
    REFERENCES public.recommendations(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL
    REFERENCES public.skills(id) ON DELETE RESTRICT,
  PRIMARY KEY (recommendation_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_skills_skill_id ON public.recommendation_skills(skill_id);

-- ── 3. Student Recommendations (public.student_recommendations) ──────────────
-- Per-student recommendation instances derived from identified gaps.
-- Recommendations must be connected to actual gaps and traceable to the
-- requirement or evaluation that generated them (DB spec §50, RE §61).
-- Spec ref: docs/05_DATABASE_SPEC.md §47–§50, docs/06_READINESS_ENGINE.md §62–§63
CREATE TABLE IF NOT EXISTS public.student_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership: student that this recommendation belongs to.
  -- ON DELETE CASCADE: removing a student clears their recommendations.
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,

  -- Catalog reference. ON DELETE RESTRICT: catalog entries must not be deleted
  -- while student records reference them (prevents orphaned history).
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE RESTRICT,

  -- ── Provenance: gap that triggered this recommendation (DB spec §50, RE §61) ──
  -- ON DELETE SET NULL: deleting the evaluation or requirement does NOT cascade-delete
  -- the student recommendation — provenance pointers are NULLed to preserve history.
  source_evaluation_id UUID REFERENCES public.readiness_evaluations(id) ON DELETE SET NULL,
  source_requirement_id UUID REFERENCES public.career_requirements(id) ON DELETE SET NULL,

  -- ── Optional explicit target (DB spec §49) ───────────────────────────────────
  -- All target FKs: ON DELETE SET NULL so career catalog changes do not silently
  -- destroy the student recommendation record.
  target_type VARCHAR(30)
    CHECK (target_type IS NULL OR target_type IN ('role', 'job_opening', 'skill', 'academic', 'career_domain', 'profile_area')),
  target_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  target_job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE SET NULL,
  target_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,

  -- ── Priority (RE §57, approved M10 product decisions) ────────────────────────
  -- Priority is assigned at generation time from gap characteristics and is not
  -- recalculated retroactively. The mapping is:
  --   critical: is_blocking = true AND requirement_scope = 'required' AND result_status = 'not_met'
  --   high:     is_blocking = false AND requirement_scope = 'required' AND result_status = 'not_met'
  --   medium:   requirement_scope = 'required' AND result_status = 'partially_met'
  --             OR requirement_scope = 'preferred' AND result_status = 'not_met'
  --   low:      requirement_scope = 'preferred' AND result_status = 'partially_met'
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- ── Lifecycle (RE §62, dev rules §85) ───────────────────────────────────────
  -- generated → active → completed (student-initiated)
  -- active    → dismissed           (student-initiated)
  -- generated → dismissed           (student-initiated)
  -- generated/active → expired      (system/admin only)
  -- completed → verified            (admin/verifier only)
  -- Completing a recommendation does NOT automatically satisfy a career requirement (RE §63).
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('generated', 'active', 'completed', 'verified', 'dismissed', 'expired')),

  -- ── Explainability (DB spec §50, RE §61) ─────────────────────────────────────
  -- Human-readable reason connecting the gap to this recommendation.
  reason TEXT,
  -- Point-in-time snapshot of the gap that generated this recommendation.
  -- Preserved so the reason remains interpretable even after career data evolves.
  gap_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- ── Lifecycle timestamps ──────────────────────────────────────────────────────
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,    -- set by trigger on → completed
  dismissed_at  TIMESTAMPTZ,    -- set by trigger on → dismissed
  expired_at    TIMESTAMPTZ,    -- set by trigger on → expired
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ── Deduplication ────────────────────────────────────────────────────────────
  -- One active recommendation per student × catalog entry × target combination.
  -- NULLS NOT DISTINCT ensures NULLs in target columns are treated as equal for
  -- uniqueness purposes (PostgreSQL 15+).
  CONSTRAINT uq_student_recommendation_active
    UNIQUE NULLS NOT DISTINCT (student_id, recommendation_id, target_role_id, target_job_opening_id)
);

CREATE TRIGGER set_student_recommendations_updated_at
  BEFORE UPDATE ON public.student_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_recommendations_student_id ON public.student_recommendations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_status ON public.student_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_priority ON public.student_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_source_eval ON public.student_recommendations(source_evaluation_id);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_source_req ON public.student_recommendations(source_requirement_id);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_target_role ON public.student_recommendations(target_role_id);
CREATE INDEX IF NOT EXISTS idx_student_recommendations_target_opening ON public.student_recommendations(target_job_opening_id);

-- ── 4. Lifecycle Enforcement Trigger ─────────────────────────────────────────
-- Validates state transitions and sets lifecycle timestamps.
-- Also prevents mutation of provenance/immutable columns after INSERT.
-- Spec ref: docs/06_READINESS_ENGINE.md §62, docs/08_DEVELOPMENT_RULES.md §85
CREATE OR REPLACE FUNCTION public.enforce_student_recommendation_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old_status VARCHAR(20);
  v_new_status VARCHAR(20);
BEGIN
  v_old_status := OLD.status;
  v_new_status := NEW.status;

  -- 1. Provenance columns are immutable after INSERT.
  --    student_id, recommendation_id, source_evaluation_id, source_requirement_id,
  --    gap_snapshot, priority, generated_at must not be mutated.
  IF NEW.student_id <> OLD.student_id THEN
    RAISE EXCEPTION 'student_recommendations.student_id is immutable after creation.';
  END IF;
  IF NEW.recommendation_id <> OLD.recommendation_id THEN
    RAISE EXCEPTION 'student_recommendations.recommendation_id is immutable after creation.';
  END IF;
  IF NEW.gap_snapshot <> OLD.gap_snapshot THEN
    RAISE EXCEPTION 'student_recommendations.gap_snapshot is immutable after creation.';
  END IF;
  IF NEW.priority <> OLD.priority THEN
    RAISE EXCEPTION 'student_recommendations.priority is immutable after creation.';
  END IF;
  IF NEW.generated_at <> OLD.generated_at THEN
    RAISE EXCEPTION 'student_recommendations.generated_at is immutable after creation.';
  END IF;

  -- 2. Validate state transitions.
  IF v_old_status <> v_new_status THEN
    -- Allowed transitions:
    --   generated → active        (student or system)
    --   generated → dismissed     (student)
    --   generated → expired       (system/admin)
    --   active    → completed     (student)
    --   active    → dismissed     (student)
    --   active    → expired       (system/admin)
    --   completed → verified      (admin/verifier)
    IF NOT (
      (v_old_status = 'generated' AND v_new_status IN ('active', 'dismissed', 'expired'))
      OR (v_old_status = 'active'    AND v_new_status IN ('completed', 'dismissed', 'expired'))
      OR (v_old_status = 'completed' AND v_new_status = 'verified')
    ) THEN
      RAISE EXCEPTION
        'Invalid student_recommendation status transition: % → %. Allowed: generated→{active,dismissed,expired}, active→{completed,dismissed,expired}, completed→verified.',
        v_old_status, v_new_status;
    END IF;

    -- 3. Set lifecycle timestamps on transition.
    IF v_new_status = 'completed' THEN
      NEW.completed_at := now();
    ELSIF v_new_status = 'dismissed' THEN
      NEW.dismissed_at := now();
    ELSIF v_new_status = 'expired' THEN
      NEW.expired_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_student_recommendation_lifecycle
  BEFORE UPDATE ON public.student_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_student_recommendation_lifecycle();

-- ── 5. Gap-to-Recommendation Generation Function ─────────────────────────────
-- Reads readiness_requirement_results from a completed evaluation and generates
-- student_recommendations rows for every not_met or partially_met requirement.
-- Skips: not_applicable (stale requirement), unknown (missing data, not actionable),
--        met (already satisfied).
-- Deduplicates: does not create a duplicate if an active recommendation already exists
--   for the same (student, catalog_entry, target).
-- Priority mapping (approved M10 product decisions, RE §57):
--   critical: is_blocking AND scope = required AND result_status = not_met
--   high:     NOT is_blocking AND scope = required AND result_status = not_met
--   medium:   scope = required AND result_status = partially_met
--             OR scope = preferred AND result_status = not_met
--   low:      scope = preferred AND result_status = partially_met
-- Spec ref: docs/06_READINESS_ENGINE.md §55–§57, §60–§61, docs/05_DATABASE_SPEC.md §47–§50
CREATE OR REPLACE FUNCTION public.generate_recommendations_from_evaluation(
  p_evaluation_id UUID
)
RETURNS INT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_student_id UUID;
  v_target_type VARCHAR(20);
  v_target_role_id UUID;
  v_target_opening_id UUID;
  v_caller_student_id UUID;
  v_is_caller_admin BOOLEAN;
  v_created_count INT := 0;

  r RECORD;
  v_priority VARCHAR(20);
  v_rec_id UUID;
  v_gap_snapshot JSONB;
  v_target_skill_id UUID;
BEGIN
  -- 1. Security check: caller must be the owning student or an admin.
  v_caller_student_id := public.get_current_student_id();
  v_is_caller_admin := public.is_admin();

  -- 2. Load the evaluation and confirm it belongs to the caller.
  SELECT re.student_id, re.target_type, re.role_id, re.job_opening_id
  INTO v_student_id, v_target_type, v_target_role_id, v_target_opening_id
  FROM public.readiness_evaluations re
  WHERE re.id = p_evaluation_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Readiness evaluation with id % not found.', p_evaluation_id;
  END IF;

  IF v_student_id <> v_caller_student_id AND NOT v_is_caller_admin THEN
    RAISE EXCEPTION 'Access denied. You may only generate recommendations for your own readiness evaluation.';
  END IF;

  -- 3. Iterate over actionable gaps from the evaluation in deterministic order.
  FOR r IN
    SELECT
      rrr.requirement_id,
      rrr.requirement_type,
      rrr.requirement_scope,
      rrr.is_blocking,
      rrr.result_status,
      rrr.evidence_status,
      rrr.explanation,
      cr.title AS requirement_title,
      cr.skill_id AS requirement_skill_id
    FROM public.readiness_requirement_results rrr
    JOIN public.career_requirements cr ON cr.id = rrr.requirement_id
    WHERE rrr.evaluation_id = p_evaluation_id
      AND rrr.result_status IN ('not_met', 'partially_met')
    ORDER BY
      -- deterministic processing order matching priority tier (highest first)
      (rrr.is_blocking AND rrr.requirement_scope = 'required' AND rrr.result_status = 'not_met') DESC,
      (rrr.requirement_scope = 'required' AND rrr.result_status = 'not_met') DESC,
      (rrr.requirement_scope = 'required' AND rrr.result_status = 'partially_met') DESC,
      rrr.requirement_id ASC
  LOOP
    -- 4. Determine approved priority tier.
    IF r.is_blocking AND r.requirement_scope = 'required' AND r.result_status = 'not_met' THEN
      v_priority := 'critical';
    ELSIF NOT r.is_blocking AND r.requirement_scope = 'required' AND r.result_status = 'not_met' THEN
      v_priority := 'high';
    ELSIF r.requirement_scope = 'required' AND r.result_status = 'partially_met' THEN
      v_priority := 'medium';
    ELSIF r.requirement_scope = 'preferred' AND r.result_status = 'not_met' THEN
      v_priority := 'medium';
    ELSE
      -- preferred + partially_met
      v_priority := 'low';
    END IF;

    -- 5. Find or derive a catalog recommendation for this gap.
    v_rec_id := NULL;
    v_target_skill_id := r.requirement_skill_id;

    -- Prefer an existing active skill-specific catalog entry.
    IF r.requirement_skill_id IS NOT NULL THEN
      SELECT rec.id INTO v_rec_id
      FROM public.recommendations rec
      WHERE rec.skill_id = r.requirement_skill_id
        AND rec.status = 'active'
      ORDER BY rec.created_at ASC
      LIMIT 1;
    END IF;

    -- Fall back to an active catalog entry by type if no skill-specific entry.
    IF v_rec_id IS NULL THEN
      SELECT rec.id INTO v_rec_id
      FROM public.recommendations rec
      WHERE rec.recommendation_type = CASE r.requirement_type
          WHEN 'skill'          THEN 'skill_acquisition'
          WHEN 'certification'  THEN 'certification'
          WHEN 'cgpa'           THEN 'academic'
          WHEN 'degree'         THEN 'academic'
          WHEN 'branch'         THEN 'academic'
          WHEN 'experience'     THEN 'experience'
          ELSE                       'other'
        END
        AND rec.status = 'active'
        AND rec.skill_id IS NULL
      ORDER BY rec.created_at ASC
      LIMIT 1;
    END IF;

    -- If still no catalog entry, create a minimal one grounded in the gap data.
    -- Every real gap must produce a traceable recommendation rather than being silently dropped.
    IF v_rec_id IS NULL THEN
      INSERT INTO public.recommendations (
        title,
        description,
        recommendation_type,
        skill_id,
        status
      ) VALUES (
        CASE r.requirement_type
          WHEN 'skill'         THEN 'Develop: ' || r.requirement_title
          WHEN 'certification' THEN 'Obtain certification: ' || r.requirement_title
          WHEN 'cgpa'          THEN 'Improve academic CGPA: ' || r.requirement_title
          WHEN 'degree'        THEN 'Confirm degree eligibility: ' || r.requirement_title
          WHEN 'branch'        THEN 'Confirm branch eligibility: ' || r.requirement_title
          WHEN 'experience'    THEN 'Gain experience: ' || r.requirement_title
          ELSE                      'Address requirement: ' || r.requirement_title
        END,
        'Auto-generated from career requirement gap. ' || COALESCE(r.explanation, ''),
        CASE r.requirement_type
          WHEN 'skill'         THEN 'skill_acquisition'
          WHEN 'certification' THEN 'certification'
          WHEN 'cgpa'          THEN 'academic'
          WHEN 'degree'        THEN 'academic'
          WHEN 'branch'        THEN 'academic'
          WHEN 'experience'    THEN 'experience'
          ELSE                      'other'
        END,
        r.requirement_skill_id,
        'active'
      )
      RETURNING id INTO v_rec_id;
    END IF;

    -- 6. Build explainability snapshot.
    v_gap_snapshot := jsonb_build_object(
      'evaluation_id',      p_evaluation_id,
      'requirement_id',     r.requirement_id,
      'requirement_type',   r.requirement_type,
      'requirement_title',  r.requirement_title,
      'requirement_scope',  r.requirement_scope,
      'is_blocking',        r.is_blocking,
      'result_status',      r.result_status,
      'evidence_status',    r.evidence_status,
      'explanation',        r.explanation,
      'generated_at',       now()
    );

    -- 7. Insert student recommendation, skipping if an equivalent active one already exists.
    INSERT INTO public.student_recommendations (
      student_id,
      recommendation_id,
      source_evaluation_id,
      source_requirement_id,
      target_type,
      target_role_id,
      target_job_opening_id,
      target_skill_id,
      priority,
      status,
      reason,
      gap_snapshot,
      generated_at
    )
    VALUES (
      v_student_id,
      v_rec_id,
      p_evaluation_id,
      r.requirement_id,
      v_target_type,
      v_target_role_id,
      v_target_opening_id,
      v_target_skill_id,
      v_priority,
      'active',
      'Gap identified: ' || r.requirement_title || '. Status: ' || r.result_status || '. ' || COALESCE(r.explanation, ''),
      v_gap_snapshot,
      now()
    )
    ON CONFLICT ON CONSTRAINT uq_student_recommendation_active
    DO NOTHING;

    -- Count only newly inserted rows.
    IF FOUND THEN
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;

  RETURN v_created_count;
END;
$$;

-- ── 6. Row-Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_recommendations ENABLE ROW LEVEL SECURITY;

-- 6.1 recommendations (catalog) Policies
-- Catalog is publicly readable; only admins/data_editors may write.
DROP POLICY IF EXISTS recommendations_select_policy ON public.recommendations;
CREATE POLICY recommendations_select_policy ON public.recommendations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS recommendations_insert_policy ON public.recommendations;
CREATE POLICY recommendations_insert_policy ON public.recommendations
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS recommendations_update_policy ON public.recommendations;
CREATE POLICY recommendations_update_policy ON public.recommendations
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS recommendations_delete_policy ON public.recommendations;
CREATE POLICY recommendations_delete_policy ON public.recommendations
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor'));

-- 6.2 recommendation_skills Policies
DROP POLICY IF EXISTS recommendation_skills_select_policy ON public.recommendation_skills;
CREATE POLICY recommendation_skills_select_policy ON public.recommendation_skills
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS recommendation_skills_insert_policy ON public.recommendation_skills;
CREATE POLICY recommendation_skills_insert_policy ON public.recommendation_skills
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS recommendation_skills_update_policy ON public.recommendation_skills;
CREATE POLICY recommendation_skills_update_policy ON public.recommendation_skills
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS recommendation_skills_delete_policy ON public.recommendation_skills;
CREATE POLICY recommendation_skills_delete_policy ON public.recommendation_skills
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor'));

-- 6.3 student_recommendations Policies (Student Isolation)
-- Students may SELECT their own. Admins and verifiers may SELECT all.
DROP POLICY IF EXISTS student_recommendations_select_policy ON public.student_recommendations;
CREATE POLICY student_recommendations_select_policy ON public.student_recommendations
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

-- Students receive recommendations only via the SECURITY DEFINER generation function.
-- Direct INSERT from students is prohibited (admin only via RLS).
DROP POLICY IF EXISTS student_recommendations_insert_policy ON public.student_recommendations;
CREATE POLICY student_recommendations_insert_policy ON public.student_recommendations
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Students may UPDATE only their own rows (for status transitions).
-- The lifecycle trigger enforces column immutability and valid transitions.
DROP POLICY IF EXISTS student_recommendations_update_policy ON public.student_recommendations;
CREATE POLICY student_recommendations_update_policy ON public.student_recommendations
  FOR UPDATE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  )
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

-- Only admins may DELETE student recommendations.
DROP POLICY IF EXISTS student_recommendations_delete_policy ON public.student_recommendations;
CREATE POLICY student_recommendations_delete_policy ON public.student_recommendations
  FOR DELETE
  USING (public.is_admin());

-- ── 7. Permissions & Grants ───────────────────────────────────────────────────
-- Catalog tables: full DML to authenticated (filtered by RLS above).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_skills TO authenticated;

-- Student recommendations: SELECT + UPDATE only; direct INSERT/DELETE require admin via RLS.
GRANT SELECT, UPDATE ON public.student_recommendations TO authenticated;

-- Generation function: executable by authenticated users.
-- SECURITY DEFINER prevents privilege escalation; the function checks student ownership.
REVOKE ALL ON FUNCTION public.generate_recommendations_from_evaluation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_recommendations_from_evaluation(UUID) TO authenticated;

-- Lifecycle trigger function: internal only, no external grants needed.
REVOKE ALL ON FUNCTION public.enforce_student_recommendation_lifecycle() FROM PUBLIC;
