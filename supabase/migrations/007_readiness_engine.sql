-- ============================================================================
-- Migration: 007_readiness_engine.sql
-- Description: Readiness Engine (Companies, Roles, Job Openings, Career Requirements,
--              Effective Requirement Resolution, Evaluations, Results & Snapshots)
-- Milestone: 09 — Readiness Engine
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §16–§21, §22–§27
--   - docs/04_ARCHITECTURE.md §20–§23
--   - docs/05_DATABASE_SPEC.md §31–§46, §53–§57
--   - docs/06_READINESS_ENGINE.md §1–§100
--   - docs/07_SECURITY_MODEL.md §27–§31
--   - docs/08_DEVELOPMENT_RULES.md
--   - .agents/rules/uprooters.md
-- ============================================================================

-- ── 1. Companies (public.companies) ─────────────────────────────────────────
-- Stores canonical company identities and source provenance.
-- Spec ref: docs/05_DATABASE_SPEC.md §31, docs/01_PRODUCT_SPEC.md §16
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  normalized_name TEXT GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  slug VARCHAR(100) NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
  website TEXT CHECK (website IS NULL OR website ~* '^https?://[^\s]+$'),
  industry VARCHAR(100) NOT NULL DEFAULT 'Semiconductor & Electronics',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_companies_normalized_name ON public.companies(normalized_name);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- ── 2. Roles (public.roles) ─────────────────────────────────────────────────
-- Stores canonical career roles, career domains, and baseline expectations.
-- Role-level eligibility fields (eligible_degrees, eligible_branches, minimum_cgpa, experience_months)
-- serve as baseline descriptive metadata for search, catalog filtering, and display.
-- Authoritative criteria evaluated by the readiness engine are registered in
-- public.career_requirements to ensure full data provenance, traceability, and weighting.
-- Spec ref: docs/05_DATABASE_SPEC.md §32, docs/06_READINESS_ENGINE.md §4–§5
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  slug VARCHAR(100) NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
  domain VARCHAR(100) NOT NULL DEFAULT 'Embedded Systems',
  description TEXT,
  eligible_degrees TEXT[] NOT NULL DEFAULT ARRAY['B.E.', 'B.Tech']::TEXT[],
  eligible_branches TEXT[] NOT NULL DEFAULT ARRAY['ECE', 'EEE', 'EIE']::TEXT[],
  minimum_cgpa NUMERIC(4, 2) DEFAULT NULL CHECK (minimum_cgpa IS NULL OR (minimum_cgpa >= 0 AND minimum_cgpa <= 10.00)),
  experience_months INT NOT NULL DEFAULT 0 CHECK (experience_months >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_roles_domain ON public.roles(domain);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);

-- ── 3. Job Openings (public.job_openings) ───────────────────────────────────
-- Represents specific job vacancies published by companies, linked to generic roles.
-- Descriptive eligibility defaults are preserved for quick faceted filtering; authoritative
-- evaluation requirements are resolved from public.career_requirements.
-- Spec ref: docs/05_DATABASE_SPEC.md §33, docs/06_READINESS_ENGINE.md §4, §6
CREATE TABLE IF NOT EXISTS public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  location TEXT,
  work_mode VARCHAR(20) NOT NULL DEFAULT 'on_site' CHECK (work_mode IN ('on_site', 'hybrid', 'remote')),
  employment_type VARCHAR(50) NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'internship', 'contract', 'co_op')),
  eligible_degrees TEXT[] DEFAULT NULL,
  eligible_branches TEXT[] DEFAULT NULL,
  minimum_cgpa NUMERIC(4, 2) DEFAULT NULL CHECK (minimum_cgpa IS NULL OR (minimum_cgpa >= 0 AND minimum_cgpa <= 10.00)),
  experience_months INT DEFAULT NULL CHECK (experience_months IS NULL OR experience_months >= 0),
  source_url TEXT CHECK (source_url IS NULL OR source_url ~* '^https?://[^\s]+$'),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed', 'archived', 'stale')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Historical closing dates are permitted; closed/archived status represents lifecycle validity,
  -- while chronological ordering requires closing_date >= published_at::date when present.
  closing_date DATE CHECK (closing_date IS NULL OR closing_date >= published_at::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_job_openings_updated_at
  BEFORE UPDATE ON public.job_openings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_job_openings_company_id ON public.job_openings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_role_id ON public.job_openings(role_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_status ON public.job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_closing_date ON public.job_openings(closing_date);

-- ── 4. Career Requirements (public.career_requirements) ─────────────────────
-- Structured documented criteria for career roles and individual job openings.
-- Spec ref: docs/05_DATABASE_SPEC.md §34–§36, docs/06_READINESS_ENGINE.md §16, §29
CREATE TABLE IF NOT EXISTS public.career_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('role', 'job_opening')),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('skill', 'degree', 'branch', 'cgpa', 'experience', 'certification', 'other')),
  skill_id UUID REFERENCES public.skills(id) ON DELETE RESTRICT,
  requirement_scope VARCHAR(20) NOT NULL DEFAULT 'required' CHECK (requirement_scope IN ('required', 'preferred')),
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  required_value TEXT,
  weight NUMERIC(4, 2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 10.0),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(50) NOT NULL DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified', 'official_source', 'official_ats', 'corroborated_public_source', 'manually_curated')),
  source_url TEXT CHECK (source_url IS NULL OR source_url ~* '^https?://[^\s]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT career_requirements_target_check
    CHECK (
      (target_type = 'role' AND role_id IS NOT NULL AND job_opening_id IS NULL)
      OR
      (target_type = 'job_opening' AND job_opening_id IS NOT NULL AND role_id IS NULL)
    ),
  CONSTRAINT career_requirements_skill_check
    CHECK (requirement_type <> 'skill' OR skill_id IS NOT NULL)
);

CREATE TRIGGER set_career_requirements_updated_at
  BEFORE UPDATE ON public.career_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_career_requirements_target_role ON public.career_requirements(target_type, role_id);
CREATE INDEX IF NOT EXISTS idx_career_requirements_target_opening ON public.career_requirements(target_type, job_opening_id);
CREATE INDEX IF NOT EXISTS idx_career_requirements_skill ON public.career_requirements(requirement_type, skill_id);
CREATE INDEX IF NOT EXISTS idx_career_requirements_scope ON public.career_requirements(requirement_scope);

-- ── 5. Readiness Evaluations (public.readiness_evaluations) ─────────────────
-- Stores point-in-time calculation snapshots of student readiness for roles or openings.
-- Spec ref: docs/05_DATABASE_SPEC.md §44, docs/06_READINESS_ENGINE.md §7, §44–§45
CREATE TABLE IF NOT EXISTS public.readiness_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('role', 'job_opening')),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('requested', 'validating', 'calculating', 'completed', 'failed')),
  overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  required_score NUMERIC(5, 2) NOT NULL CHECK (required_score >= 0 AND required_score <= 100),
  preferred_score NUMERIC(5, 2) NOT NULL CHECK (preferred_score >= 0 AND preferred_score <= 100),
  is_eligible BOOLEAN NOT NULL DEFAULT true,
  has_unresolved_blocking BOOLEAN NOT NULL DEFAULT false,
  requirement_count INT NOT NULL DEFAULT 0 CHECK (requirement_count >= 0),
  satisfied_count INT NOT NULL DEFAULT 0 CHECK (satisfied_count >= 0),
  partial_count INT NOT NULL DEFAULT 0 CHECK (partial_count >= 0),
  missing_count INT NOT NULL DEFAULT 0 CHECK (missing_count >= 0),
  unknown_count INT NOT NULL DEFAULT 0 CHECK (unknown_count >= 0),
  blocking_count INT NOT NULL DEFAULT 0 CHECK (blocking_count >= 0),
  engine_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT readiness_evaluations_target_check
    CHECK (
      (target_type = 'role' AND role_id IS NOT NULL AND job_opening_id IS NULL)
      OR
      (target_type = 'job_opening' AND job_opening_id IS NOT NULL AND role_id IS NULL)
    ),
  CONSTRAINT readiness_evaluations_id_student_key UNIQUE (id, student_id)
);

CREATE TRIGGER set_readiness_evaluations_updated_at
  BEFORE UPDATE ON public.readiness_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_readiness_evaluations_student_id ON public.readiness_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_readiness_evaluations_target_role ON public.readiness_evaluations(target_type, role_id);
CREATE INDEX IF NOT EXISTS idx_readiness_evaluations_target_opening ON public.readiness_evaluations(target_type, job_opening_id);
CREATE INDEX IF NOT EXISTS idx_readiness_evaluations_calculated_at ON public.readiness_evaluations(calculated_at DESC);

-- ── 6. Readiness Requirement Results (public.readiness_requirement_results) ─
-- Requirement-level breakdown for evaluation explainability and gap detection.
-- Spec ref: docs/05_DATABASE_SPEC.md §45, docs/06_READINESS_ENGINE.md §30–§35
CREATE TABLE IF NOT EXISTS public.readiness_requirement_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL,
  student_id UUID NOT NULL,
  requirement_id UUID NOT NULL REFERENCES public.career_requirements(id) ON DELETE CASCADE,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_scope VARCHAR(20) NOT NULL CHECK (requirement_scope IN ('required', 'preferred')),
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  result_status VARCHAR(20) NOT NULL
    CHECK (result_status IN ('met', 'partially_met', 'not_met', 'not_applicable', 'unknown')),
  match_type VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (match_type IN ('exact', 'related', 'parent', 'child', 'none', 'not_applicable')),
  evidence_status VARCHAR(50) NOT NULL
    CHECK (evidence_status IN (
      'verified', 'unverified', 'supported', 'unsupported_claim',
      'missing', 'stale', 'academic_record', 'calculated_cgpa',
      'missing_data', 'stale_requirement', 'not_applicable'
    )),
  score_contribution NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (score_contribution >= 0 AND score_contribution <= 100),
  evidence_count INT NOT NULL DEFAULT 0 CHECK (evidence_count >= 0),
  verified_evidence_count INT NOT NULL DEFAULT 0 CHECK (verified_evidence_count >= 0),
  evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_readiness_req_result_eval_direct
    FOREIGN KEY (evaluation_id)
    REFERENCES public.readiness_evaluations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_readiness_req_result_student
    FOREIGN KEY (student_id)
    REFERENCES public.students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_readiness_req_result_eval_student
    FOREIGN KEY (evaluation_id, student_id)
    REFERENCES public.readiness_evaluations(id, student_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_readiness_req_results_eval ON public.readiness_requirement_results(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_readiness_req_results_student ON public.readiness_requirement_results(student_id);
CREATE INDEX IF NOT EXISTS idx_readiness_req_results_requirement ON public.readiness_requirement_results(requirement_id);
CREATE INDEX IF NOT EXISTS idx_readiness_req_results_status ON public.readiness_requirement_results(result_status);

-- ── 7. Effective Requirement Resolution Function ────────────────────────────
-- Resolves the effective requirement set for a target:
-- For role: returns active role career requirements.
-- For job opening: returns opening requirements, overriding role defaults on
--   (requirement_type, skill_id) for skills, or (requirement_type) for non-skills.
-- Spec ref: docs/05_DATABASE_SPEC.md §37, docs/06_READINESS_ENGINE.md §39–§40
CREATE OR REPLACE FUNCTION public.resolve_effective_requirements(
  p_target_type VARCHAR,
  p_target_id UUID
)
RETURNS TABLE (
  id UUID,
  target_type VARCHAR(20),
  role_id UUID,
  job_opening_id UUID,
  requirement_type VARCHAR(50),
  skill_id UUID,
  requirement_scope VARCHAR(20),
  is_blocking BOOLEAN,
  title TEXT,
  description TEXT,
  required_value TEXT,
  weight NUMERIC(4, 2),
  verification_status VARCHAR(20),
  verification_level VARCHAR(50),
  source_url TEXT,
  is_inherited BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  IF p_target_type = 'role' THEN
    RETURN QUERY
    SELECT
      cr.id,
      cr.target_type,
      cr.role_id,
      cr.job_opening_id,
      cr.requirement_type,
      cr.skill_id,
      cr.requirement_scope,
      cr.is_blocking,
      cr.title,
      cr.description,
      cr.required_value,
      cr.weight,
      cr.verification_status,
      cr.verification_level,
      cr.source_url,
      false AS is_inherited
    FROM public.career_requirements cr
    WHERE cr.target_type = 'role'
      AND cr.role_id = p_target_id
    ORDER BY cr.requirement_scope DESC, cr.is_blocking DESC, cr.id ASC;

  ELSIF p_target_type = 'job_opening' THEN
    SELECT jo.role_id INTO v_role_id
    FROM public.job_openings jo
    WHERE jo.id = p_target_id;

    IF v_role_id IS NULL THEN
      RAISE EXCEPTION 'Job opening with id % not found.', p_target_id;
    END IF;

    -- Return opening-specific requirements plus un-overridden role requirements
    RETURN QUERY
    WITH opening_reqs AS (
      SELECT
        cr.id,
        cr.target_type,
        cr.role_id,
        cr.job_opening_id,
        cr.requirement_type,
        cr.skill_id,
        cr.requirement_scope,
        cr.is_blocking,
        cr.title,
        cr.description,
        cr.required_value,
        cr.weight,
        cr.verification_status,
        cr.verification_level,
        cr.source_url,
        false AS is_inherited
      FROM public.career_requirements cr
      WHERE cr.target_type = 'job_opening'
        AND cr.job_opening_id = p_target_id
    ),
    role_reqs AS (
      SELECT
        cr.id,
        cr.target_type,
        cr.role_id,
        cr.job_opening_id,
        cr.requirement_type,
        cr.skill_id,
        cr.requirement_scope,
        cr.is_blocking,
        cr.title,
        cr.description,
        cr.required_value,
        cr.weight,
        cr.verification_status,
        cr.verification_level,
        cr.source_url,
        true AS is_inherited
      FROM public.career_requirements cr
      WHERE cr.target_type = 'role'
        AND cr.role_id = v_role_id
        -- Exclude if opening-specific override exists for the same skill or non-skill type
        AND NOT EXISTS (
          SELECT 1 FROM opening_reqs o
          WHERE (o.requirement_type = 'skill' AND cr.requirement_type = 'skill' AND o.skill_id = cr.skill_id)
             OR (o.requirement_type <> 'skill' AND cr.requirement_type <> 'skill' AND o.requirement_type = cr.requirement_type)
        )
    )
    SELECT * FROM opening_reqs
    UNION ALL
    SELECT * FROM role_reqs
    ORDER BY requirement_scope DESC, is_blocking DESC, id ASC;

  ELSE
    RAISE EXCEPTION 'Invalid target_type: %. Must be ''role'' or ''job_opening''.', p_target_type;
  END IF;
END;
$$;

-- ── 8. On-Demand Readiness Evaluation Function ──────────────────────────────
-- Evaluates student readiness deterministically using the approved engine model (1.0.0).
-- Invariant: same student state + same target + same effective requirements
--            + same engine version + same config = same readiness result.
-- Spec ref: docs/06_READINESS_ENGINE.md §44–§50, §65, §86–§87
CREATE OR REPLACE FUNCTION public.evaluate_student_readiness(
  p_student_id UUID,
  p_target_type VARCHAR,
  p_target_id UUID,
  p_engine_config JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_student_id UUID;
  v_is_caller_admin BOOLEAN;
  v_student_record RECORD;
  v_target_role_id UUID;
  v_target_opening_id UUID;
  v_evaluation_id UUID;
  
  -- Engine parameters (configurable with approved v1 defaults)
  v_engine_version VARCHAR(20) := '1.0.0';
  v_w_req NUMERIC(4, 2) := 1.0;
  v_w_pref NUMERIC(4, 2) := 0.5;
  v_related_credit NUMERIC(4, 2) := 0.00; -- strictly 0.00 as approved
  
  -- Calculation metrics
  v_req_weighted_sum NUMERIC(10, 4) := 0.0;
  v_req_total_weight NUMERIC(10, 4) := 0.0;
  v_pref_weighted_sum NUMERIC(10, 4) := 0.0;
  v_pref_total_weight NUMERIC(10, 4) := 0.0;
  
  v_required_score NUMERIC(5, 2) := 0.00;
  v_preferred_score NUMERIC(5, 2) := 0.00;
  v_overall_score NUMERIC(5, 2) := 0.00;
  
  v_requirement_count INT := 0;
  v_satisfied_count INT := 0;
  v_partial_count INT := 0;
  v_missing_count INT := 0;
  v_unknown_count INT := 0;
  v_blocking_count INT := 0;
  v_has_unresolved_blocking BOOLEAN := false;
  v_is_eligible BOOLEAN := true;
  
  -- Per-requirement working variables
  r RECORD;
  v_res_status VARCHAR(20);
  v_match_type VARCHAR(20);
  v_ev_status VARCHAR(50);
  v_score_contribution NUMERIC(5, 2);
  v_ev_count INT;
  v_verified_ev_count INT;
  v_ev_refs JSONB;
  v_explanation TEXT;
  
  -- Academic & Student working vars
  v_cgpa NUMERIC(4, 2);
  v_student_skill RECORD;
  v_related_skill RECORD;
  v_snapshot JSONB;
BEGIN
  -- 1. Security Check
  v_caller_student_id := public.get_current_student_id();
  v_is_caller_admin := public.is_admin();

  IF p_student_id <> v_caller_student_id AND NOT v_is_caller_admin THEN
    RAISE EXCEPTION 'Access denied. You may only evaluate readiness for your own student record.';
  END IF;

  -- 2. Verify student exists
  SELECT id, user_id, degree, branch, current_semester
  INTO v_student_record
  FROM public.students
  WHERE id = p_student_id;

  IF v_student_record.id IS NULL THEN
    RAISE EXCEPTION 'Student with id % not found.', p_student_id;
  END IF;

  -- 3. Resolve target IDs and verify target exists
  IF p_target_type = 'role' THEN
    v_target_role_id := p_target_id;
    v_target_opening_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM public.roles WHERE id = p_target_id) THEN
      RAISE EXCEPTION 'Role with id % not found.', p_target_id;
    END IF;
  ELSIF p_target_type = 'job_opening' THEN
    SELECT role_id INTO v_target_role_id
    FROM public.job_openings
    WHERE id = p_target_id;
    IF v_target_role_id IS NULL THEN
      RAISE EXCEPTION 'Job opening with id % not found.', p_target_id;
    END IF;
    v_target_opening_id := p_target_id;
  ELSE
    RAISE EXCEPTION 'Invalid target_type: %. Must be ''role'' or ''job_opening''.', p_target_type;
  END IF;

  -- 4. Load configured weights if provided
  IF p_engine_config IS NOT NULL THEN
    IF (p_engine_config->>'required_weight') IS NOT NULL THEN
      v_w_req := (p_engine_config->>'required_weight')::numeric;
    END IF;
    IF (p_engine_config->>'preferred_weight') IS NOT NULL THEN
      v_w_pref := (p_engine_config->>'preferred_weight')::numeric;
    END IF;
    -- Note: related-skill score credit remains strictly 0.00 as approved
  END IF;

  -- 5. Create temporary table to stage requirement results
  CREATE TEMPORARY TABLE temp_requirement_results (
    requirement_id UUID,
    requirement_type VARCHAR(50),
    requirement_scope VARCHAR(20),
    is_blocking BOOLEAN,
    result_status VARCHAR(20),
    match_type VARCHAR(20),
    evidence_status VARCHAR(50),
    score_contribution NUMERIC(5, 2),
    evidence_count INT,
    verified_evidence_count INT,
    evidence_references JSONB,
    explanation TEXT,
    weight NUMERIC(4, 2)
  ) ON COMMIT DROP;

  -- 6. Evaluate each effective requirement in deterministic order
  FOR r IN SELECT * FROM public.resolve_effective_requirements(p_target_type, p_target_id) LOOP
    v_requirement_count := v_requirement_count + 1;
    v_res_status := 'not_met';
    v_match_type := 'none';
    v_ev_status := 'missing';
    v_score_contribution := 0.00;
    v_ev_count := 0;
    v_verified_ev_count := 0;
    v_ev_refs := '[]'::jsonb;
    v_explanation := '';

    -- Check if requirement itself is retired/stale
    IF r.verification_status = 'rejected' THEN
      v_res_status := 'not_applicable';
      v_match_type := 'not_applicable';
      v_ev_status := 'stale_requirement';
      v_explanation := 'Target requirement has been rejected or retired from active evaluation.';

    ELSIF r.requirement_type = 'skill' THEN
      -- A. Exact skill match check
      SELECT ss.id, ss.status, ss.proficiency_level
      INTO v_student_skill
      FROM public.student_skills ss
      WHERE ss.student_id = p_student_id
        AND ss.skill_id = r.skill_id;

      IF v_student_skill.id IS NOT NULL THEN
        -- Tally actual qualifying evidence from skill_evidence
        SELECT
          COUNT(*)::INT,
          COUNT(*) FILTER (WHERE se.verification_status = 'verified')::INT,
          COALESCE(jsonb_agg(jsonb_build_object(
            'evidence_id', se.id,
            'source_type', se.source_type,
            'verification_status', se.verification_status
          )), '[]'::jsonb)
        INTO v_ev_count, v_verified_ev_count, v_ev_refs
        FROM public.skill_evidence se
        WHERE se.student_id = p_student_id
          AND se.skill_id = r.skill_id;

        IF v_verified_ev_count > 0 THEN
          v_res_status := 'met';
          v_match_type := 'exact';
          v_ev_status := 'verified';
          v_score_contribution := 100.00;
          v_explanation := 'Exact skill match supported by verified evidence.';
        ELSIF v_ev_count > 0 THEN
          v_res_status := 'partially_met';
          v_match_type := 'exact';
          v_ev_status := 'unverified';
          v_score_contribution := 50.00;
          v_explanation := 'Exact skill match supported by unverified evidence.';
        ELSE
          -- Declared claim in student_skills with zero supporting evidence rows
          v_res_status := 'not_met';
          v_match_type := 'none';
          v_ev_status := 'unsupported_claim';
          v_score_contribution := 0.00;
          v_explanation := 'Skill declared by student but lacks documented supporting evidence.';
        END IF;

      ELSE
        -- B. Check related/parent/child taxonomy skills
        -- Exact skill != Related skill invariant: can NEVER produce MET for exact required skill.
        SELECT sk.id, sk.name, ss.id AS student_skill_id
        INTO v_related_skill
        FROM public.skills sk
        JOIN public.student_skills ss ON ss.skill_id = sk.id
        WHERE ss.student_id = p_student_id
          AND (
            sk.parent_skill_id = r.skill_id
            OR sk.id = (SELECT parent_skill_id FROM public.skills WHERE id = r.skill_id)
          )
        LIMIT 1;

        IF v_related_skill.id IS NOT NULL THEN
          -- Check if student has evidence for the related skill
          SELECT
            COUNT(*)::INT,
            COUNT(*) FILTER (WHERE se.verification_status = 'verified')::INT
          INTO v_ev_count, v_verified_ev_count
          FROM public.skill_evidence se
          WHERE se.student_id = p_student_id
            AND se.skill_id = v_related_skill.id;

          IF v_ev_count > 0 THEN
            v_res_status := 'partially_met';
            v_match_type := 'related';
            v_ev_status := 'supported';
            v_score_contribution := v_related_credit; -- 0.00 numerical points
            v_explanation := format('Supporting related skill %s detected; related skill does not satisfy exact required skill.', v_related_skill.name);
          ELSE
            v_res_status := 'not_met';
            v_match_type := 'none';
            v_ev_status := 'missing';
            v_score_contribution := 0.00;
            v_explanation := 'Requirement is missing from student profile with no qualifying evidence.';
          END IF;
        ELSE
          v_res_status := 'not_met';
          v_match_type := 'none';
          v_ev_status := 'missing';
          v_score_contribution := 0.00;
          v_explanation := 'Requirement is missing from student profile with no qualifying evidence.';
        END IF;
      END IF;

    ELSIF r.requirement_type = 'degree' THEN
      IF v_student_record.degree IS NULL OR trim(v_student_record.degree) = '' THEN
        v_res_status := 'unknown';
        v_match_type := 'none';
        v_ev_status := 'missing_data';
        v_explanation := 'Student degree information is not documented in profile.';
      ELSIF lower(btrim(v_student_record.degree)) = lower(btrim(r.required_value))
         OR (r.required_value ILIKE '%' || v_student_record.degree || '%') THEN
        v_res_status := 'met';
        v_match_type := 'exact';
        v_ev_status := 'academic_record';
        v_score_contribution := 100.00;
        v_explanation := format('Documented degree (%s) matches required degree (%s).', v_student_record.degree, r.required_value);
      ELSE
        v_res_status := 'not_met';
        v_match_type := 'none';
        v_ev_status := 'academic_record';
        v_score_contribution := 0.00;
        v_explanation := format('Documented degree (%s) does not match required degree (%s).', v_student_record.degree, r.required_value);
      END IF;

    ELSIF r.requirement_type = 'branch' THEN
      IF v_student_record.branch IS NULL OR trim(v_student_record.branch) = '' THEN
        v_res_status := 'unknown';
        v_match_type := 'none';
        v_ev_status := 'missing_data';
        v_explanation := 'Student engineering branch information is not documented in profile.';
      ELSIF lower(btrim(v_student_record.branch)) = lower(btrim(r.required_value))
         OR (r.required_value ILIKE '%' || v_student_record.branch || '%') THEN
        v_res_status := 'met';
        v_match_type := 'exact';
        v_ev_status := 'academic_record';
        v_score_contribution := 100.00;
        v_explanation := format('Documented branch (%s) is eligible for this opportunity.', v_student_record.branch);
      ELSE
        v_res_status := 'not_met';
        v_match_type := 'none';
        v_ev_status := 'academic_record';
        v_score_contribution := 0.00;
        v_explanation := format('Documented branch (%s) is not in eligible branch list (%s).', v_student_record.branch, r.required_value);
      END IF;

    ELSIF r.requirement_type = 'cgpa' THEN
      v_cgpa := public.calculate_student_cgpa(p_student_id);
      IF v_cgpa IS NULL THEN
        v_res_status := 'unknown';
        v_match_type := 'none';
        v_ev_status := 'missing_data';
        v_score_contribution := 0.00;
        v_explanation := 'Student academic records contain no subject attempts to calculate CGPA.';
      ELSIF v_cgpa >= (r.required_value)::numeric THEN
        v_res_status := 'met';
        v_match_type := 'exact';
        v_ev_status := 'calculated_cgpa';
        v_score_contribution := 100.00;
        v_explanation := format('Calculated CGPA of %s meets or exceeds required %s.', v_cgpa, r.required_value);
      ELSE
        v_res_status := 'not_met';
        v_match_type := 'none';
        v_ev_status := 'calculated_cgpa';
        v_score_contribution := 0.00;
        v_explanation := format('Calculated CGPA of %s is below required %s.', v_cgpa, r.required_value);
      END IF;

    ELSIF r.requirement_type = 'experience' THEN
      -- Post-M08: No experience table exists in schema. Must report UNKNOWN with missing_data.
      v_res_status := 'unknown';
      v_match_type := 'none';
      v_ev_status := 'missing_data';
      v_score_contribution := 0.00;
      v_explanation := 'Student experience records are not currently documented in the platform to evaluate this requirement.';

    ELSIF r.requirement_type = 'certification' THEN
      SELECT COUNT(*)::INT, COUNT(*) FILTER (WHERE c.verification_status = 'verified')::INT
      INTO v_ev_count, v_verified_ev_count
      FROM public.certifications c
      WHERE c.student_id = p_student_id
        AND (c.name ILIKE '%' || r.title || '%' OR (r.required_value IS NOT NULL AND c.name ILIKE '%' || r.required_value || '%'));

      IF v_verified_ev_count > 0 THEN
        v_res_status := 'met';
        v_match_type := 'exact';
        v_ev_status := 'verified';
        v_score_contribution := 100.00;
        v_explanation := 'Verified certification credentials documented in profile.';
      ELSIF v_ev_count > 0 THEN
        v_res_status := 'partially_met';
        v_match_type := 'exact';
        v_ev_status := 'unverified';
        v_score_contribution := 50.00;
        v_explanation := 'Certification credentials documented but unverified.';
      ELSE
        v_res_status := 'not_met';
        v_match_type := 'none';
        v_ev_status := 'missing';
        v_score_contribution := 0.00;
        v_explanation := 'Required certification credential not found in student records.';
      END IF;

    ELSE
      -- Generic / Other requirement
      v_res_status := 'unknown';
      v_match_type := 'none';
      v_ev_status := 'missing_data';
      v_score_contribution := 0.00;
      v_explanation := 'Requirement evaluation condition requires additional manual or qualitative verification.';
    END IF;

    -- Tally status counts
    IF v_res_status = 'met' THEN
      v_satisfied_count := v_satisfied_count + 1;
    ELSIF v_res_status = 'partially_met' THEN
      v_partial_count := v_partial_count + 1;
    ELSIF v_res_status = 'not_met' THEN
      v_missing_count := v_missing_count + 1;
    ELSIF v_res_status = 'unknown' THEN
      v_unknown_count := v_unknown_count + 1;
    END IF;

    -- Check blocking requirement gate:
    -- If ANY blocking requirement is not met, partially met, or unknown:
    -- has_unresolved_blocking := true and is_eligible := false
    IF r.is_blocking AND v_res_status IN ('not_met', 'partially_met', 'unknown') THEN
      v_has_unresolved_blocking := true;
      v_is_eligible := false;
      v_blocking_count := v_blocking_count + 1;
    END IF;

    -- Tally scoring weights:
    -- UNKNOWN represents missing/insufficient data and must not be treated as a confirmed NOT_MET.
    -- To prevent incomplete data from being incorrectly penalized as confirmed absence,
    -- UNKNOWN requirements are excluded from the scoring denominator (weight sum).
    IF r.requirement_scope = 'required' AND v_res_status NOT IN ('not_applicable', 'unknown') THEN
      v_req_weighted_sum := v_req_weighted_sum + (r.weight * (v_score_contribution / 100.00));
      v_req_total_weight := v_req_total_weight + r.weight;
    ELSIF r.requirement_scope = 'preferred' AND v_res_status NOT IN ('not_applicable', 'unknown') THEN
      v_pref_weighted_sum := v_pref_weighted_sum + (r.weight * (v_score_contribution / 100.00));
      v_pref_total_weight := v_pref_total_weight + r.weight;
    END IF;

    -- Stage result row
    INSERT INTO temp_requirement_results (
      requirement_id, requirement_type, requirement_scope, is_blocking,
      result_status, match_type, evidence_status, score_contribution,
      evidence_count, verified_evidence_count, evidence_references, explanation, weight
    ) VALUES (
      r.id, r.requirement_type, r.requirement_scope, r.is_blocking,
      v_res_status, v_match_type, v_ev_status, v_score_contribution,
      v_ev_count, v_verified_ev_count, v_ev_refs, v_explanation, r.weight
    );
  END LOOP;

  -- 7. Compute deterministic category and overall scores
  IF v_req_total_weight > 0 THEN
    v_required_score := ROUND(((v_req_weighted_sum / v_req_total_weight) * 100.00), 2);
  ELSIF v_requirement_count > 0 THEN
    -- When required criteria exist but all are unknown or not applicable, score is 0.00
    v_required_score := 0.00;
  ELSE
    v_required_score := 100.00;
  END IF;

  IF v_pref_total_weight > 0 THEN
    v_preferred_score := ROUND(((v_pref_weighted_sum / v_pref_total_weight) * 100.00), 2);
    -- Overall formula with configured weights
    v_overall_score := ROUND(
      ((v_w_req * v_required_score + v_w_pref * v_preferred_score) / (v_w_req + v_w_pref)),
      2
    );
  ELSE
    v_preferred_score := 0.00;
    v_overall_score := v_required_score;
  END IF;

  -- Ensure strictly bounded in [0.00, 100.00]
  v_overall_score := LEAST(GREATEST(v_overall_score, 0.00), 100.00);

  -- 8. Assemble immutable evaluation snapshot JSONB
  v_snapshot := jsonb_build_object(
    'engine_version', v_engine_version,
    'engine_config', jsonb_build_object(
      'required_weight', v_w_req,
      'preferred_weight', v_w_pref,
      'related_skill_score_credit', v_related_credit
    ),
    'target_type', p_target_type,
    'target_id', p_target_id,
    'student_id', p_student_id,
    'scores', jsonb_build_object(
      'overall', v_overall_score,
      'required', v_required_score,
      'preferred', v_preferred_score
    ),
    'counts', jsonb_build_object(
      'total', v_requirement_count,
      'satisfied', v_satisfied_count,
      'partial', v_partial_count,
      'missing', v_missing_count,
      'unknown', v_unknown_count,
      'blocking', v_blocking_count
    ),
    'eligibility', jsonb_build_object(
      'is_eligible', v_is_eligible,
      'has_unresolved_blocking', v_has_unresolved_blocking
    ),
    'calculated_at', now()
  );

  -- 9. Insert evaluation record (enforce target exclusivity: role_id NULL for opening)
  INSERT INTO public.readiness_evaluations (
    student_id, target_type, role_id, job_opening_id,
    status, overall_score, required_score, preferred_score,
    is_eligible, has_unresolved_blocking,
    requirement_count, satisfied_count, partial_count, missing_count, unknown_count, blocking_count,
    engine_version, snapshot
  ) VALUES (
    p_student_id,
    p_target_type,
    CASE WHEN p_target_type = 'role' THEN v_target_role_id ELSE NULL END,
    CASE WHEN p_target_type = 'job_opening' THEN v_target_opening_id ELSE NULL END,
    'completed', v_overall_score, v_required_score, v_preferred_score,
    v_is_eligible, v_has_unresolved_blocking,
    v_requirement_count, v_satisfied_count, v_partial_count, v_missing_count, v_unknown_count, v_blocking_count,
    v_engine_version, v_snapshot
  ) RETURNING id INTO v_evaluation_id;

  -- 10. Insert child requirement results
  INSERT INTO public.readiness_requirement_results (
    evaluation_id, student_id, requirement_id, requirement_type,
    requirement_scope, is_blocking, result_status, match_type,
    evidence_status, score_contribution, evidence_count,
    verified_evidence_count, evidence_references, explanation
  )
  SELECT
    v_evaluation_id,
    p_student_id,
    t.requirement_id,
    t.requirement_type,
    t.requirement_scope,
    t.is_blocking,
    t.result_status,
    t.match_type,
    t.evidence_status,
    t.score_contribution,
    t.evidence_count,
    t.verified_evidence_count,
    t.evidence_references,
    t.explanation
  FROM temp_requirement_results t;

  RETURN v_evaluation_id;
END;
$$;

-- ── 9. Non-Recursive Row-Level Security ──────────────────────────────────────
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_requirement_results ENABLE ROW LEVEL SECURITY;

-- 9.1 companies Policies
DROP POLICY IF EXISTS companies_select_policy ON public.companies;
CREATE POLICY companies_select_policy ON public.companies
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS companies_insert_policy ON public.companies;
CREATE POLICY companies_insert_policy ON public.companies
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS companies_update_policy ON public.companies;
CREATE POLICY companies_update_policy ON public.companies
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS companies_delete_policy ON public.companies;
CREATE POLICY companies_delete_policy ON public.companies
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor'));

-- 9.2 roles Policies
DROP POLICY IF EXISTS roles_select_policy ON public.roles;
CREATE POLICY roles_select_policy ON public.roles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS roles_insert_policy ON public.roles;
CREATE POLICY roles_insert_policy ON public.roles
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS roles_update_policy ON public.roles;
CREATE POLICY roles_update_policy ON public.roles
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS roles_delete_policy ON public.roles;
CREATE POLICY roles_delete_policy ON public.roles
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor'));

-- 9.3 job_openings Policies
DROP POLICY IF EXISTS job_openings_select_policy ON public.job_openings;
CREATE POLICY job_openings_select_policy ON public.job_openings
  FOR SELECT
  USING (
    status IN ('published', 'closed', 'archived')
    OR public.is_admin()
    OR public.has_role('data_editor')
  );

DROP POLICY IF EXISTS job_openings_insert_policy ON public.job_openings;
CREATE POLICY job_openings_insert_policy ON public.job_openings
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS job_openings_update_policy ON public.job_openings;
CREATE POLICY job_openings_update_policy ON public.job_openings
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

DROP POLICY IF EXISTS job_openings_delete_policy ON public.job_openings;
CREATE POLICY job_openings_delete_policy ON public.job_openings
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor'));

-- 9.4 career_requirements Policies
DROP POLICY IF EXISTS career_requirements_select_policy ON public.career_requirements;
CREATE POLICY career_requirements_select_policy ON public.career_requirements
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS career_requirements_insert_policy ON public.career_requirements;
CREATE POLICY career_requirements_insert_policy ON public.career_requirements
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.has_role('data_editor') OR public.has_role('verifier'));

DROP POLICY IF EXISTS career_requirements_update_policy ON public.career_requirements;
CREATE POLICY career_requirements_update_policy ON public.career_requirements
  FOR UPDATE
  USING (public.is_admin() OR public.has_role('data_editor') OR public.has_role('verifier'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor') OR public.has_role('verifier'));

DROP POLICY IF EXISTS career_requirements_delete_policy ON public.career_requirements;
CREATE POLICY career_requirements_delete_policy ON public.career_requirements
  FOR DELETE
  USING (public.is_admin() OR public.has_role('data_editor') OR public.has_role('verifier'));

-- 9.5 readiness_evaluations Policies (Historical Snapshot Immutability)
DROP POLICY IF EXISTS readiness_evaluations_select_policy ON public.readiness_evaluations;
CREATE POLICY readiness_evaluations_select_policy ON public.readiness_evaluations
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS readiness_evaluations_insert_policy ON public.readiness_evaluations;
CREATE POLICY readiness_evaluations_insert_policy ON public.readiness_evaluations
  FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS readiness_evaluations_update_policy ON public.readiness_evaluations;
CREATE POLICY readiness_evaluations_update_policy ON public.readiness_evaluations
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS readiness_evaluations_delete_policy ON public.readiness_evaluations;
CREATE POLICY readiness_evaluations_delete_policy ON public.readiness_evaluations
  FOR DELETE
  USING (public.is_admin());

-- 9.6 readiness_requirement_results Policies (Historical Snapshot Immutability)
DROP POLICY IF EXISTS readiness_req_results_select_policy ON public.readiness_requirement_results;
CREATE POLICY readiness_req_results_select_policy ON public.readiness_requirement_results
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS readiness_req_results_insert_policy ON public.readiness_requirement_results;
CREATE POLICY readiness_req_results_insert_policy ON public.readiness_requirement_results
  FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS readiness_req_results_update_policy ON public.readiness_requirement_results;
CREATE POLICY readiness_req_results_update_policy ON public.readiness_requirement_results
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS readiness_req_results_delete_policy ON public.readiness_requirement_results;
CREATE POLICY readiness_req_results_delete_policy ON public.readiness_requirement_results
  FOR DELETE
  USING (public.is_admin());

-- ── 10. Permissions & Grants ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_openings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_requirements TO authenticated;

-- Historical snapshot tables: students have SELECT only; direct writes restricted to admin
GRANT SELECT ON public.readiness_evaluations TO authenticated;
GRANT SELECT ON public.readiness_requirement_results TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_effective_requirements(VARCHAR, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_effective_requirements(VARCHAR, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.evaluate_student_readiness(UUID, VARCHAR, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.evaluate_student_readiness(UUID, VARCHAR, UUID, JSONB) TO authenticated;
