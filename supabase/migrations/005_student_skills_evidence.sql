-- ============================================================================
-- Migration: 005_student_skills_evidence.sql
-- Description: Student Skills & Evidence System (Skill Claims, Evidence, Verification Protection, Status Sync)
-- Milestone: 07 — Student Skills & Evidence
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §6.1, §11, §12 (Student Journey, Skills, Evidence)
--   - docs/04_ARCHITECTURE.md §18–§19 (Skill & Evidence Data Architecture)
--   - docs/05_DATABASE_SPEC.md §20–§24, §40, §53, §58, §76–§77, §96
--   - docs/06_READINESS_ENGINE.md §17–§23 (Skill Evidence Evaluation)
--   - docs/07_SECURITY_MODEL.md §27–§30 (Student Ownership & Verification Security)
--   - .agents/rules/uprooters.md
-- ============================================================================

-- ── 1. Student Skills (public.student_skills) ───────────────────────────────
-- Represents declared skill claims by students linked to canonical skills.
-- Canonical skill enforcement: skill_id -> public.skills(id) ON DELETE RESTRICT.
-- Status lifecycle: 'claimed' (0 evidence), 'supported' (>=1 unverified evidence),
-- 'verified' (>=1 verified evidence), 'archived' (retired claim).
-- Spec ref: docs/05_DATABASE_SPEC.md §23
CREATE TABLE IF NOT EXISTS public.student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
  proficiency_level VARCHAR(20) NOT NULL DEFAULT 'beginner'
    CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  status VARCHAR(20) NOT NULL DEFAULT 'claimed'
    CHECK (status IN ('claimed', 'supported', 'verified', 'archived')),
  confidence NUMERIC(3, 2) DEFAULT NULL
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1.00)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_skills_student_skill_key UNIQUE (student_id, skill_id),
  CONSTRAINT student_skills_id_student_skill_key UNIQUE (id, student_id, skill_id)
);

CREATE TRIGGER set_student_skills_updated_at
  BEFORE UPDATE ON public.student_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_skills_student_id ON public.student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id ON public.student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_status ON public.student_skills(status);

-- ── 2. Skill Evidence (public.skill_evidence) ───────────────────────────────
-- Represents verifiable artifacts supporting a student's skill.
-- Immutable student ownership: student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE.
-- Canonical skill enforcement: skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT.
-- Composite student_skill linkage: (student_skill_id, student_id, skill_id) -> student_skills(id, student_id, skill_id).
-- Academic attempt linking: attempt_id UUID REFERENCES student_subject_attempts(id) ON DELETE SET NULL.
-- Spec ref: docs/05_DATABASE_SPEC.md §24, §40
CREATE TABLE IF NOT EXISTS public.skill_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
  student_skill_id UUID,
  evidence_type VARCHAR(50) NOT NULL
    CHECK (evidence_type IN (
      'academic_coursework', 'project', 'certification',
      'internship', 'experience', 'assessment', 'portfolio', 'other'
    )),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  evidence_url TEXT CHECK (evidence_url IS NULL OR evidence_url ~* '^https?://[^\s]+$'),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  attempt_id UUID REFERENCES public.student_subject_attempts(id) ON DELETE SET NULL,
  reference_id UUID,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(50) NOT NULL DEFAULT 'unverified'
    CHECK (verification_level IN (
      'unverified', 'official_source', 'official_ats',
      'corroborated_public_source', 'manually_curated'
    )),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skill_evidence_student_skill_fkey
    FOREIGN KEY (student_skill_id, student_id, skill_id)
    REFERENCES public.student_skills(id, student_id, skill_id)
    ON DELETE CASCADE
);

CREATE TRIGGER set_skill_evidence_updated_at
  BEFORE UPDATE ON public.skill_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_skill_evidence_student_id ON public.skill_evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_skill_id ON public.skill_evidence(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_student_skill_id ON public.skill_evidence(student_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_attempt_id ON public.skill_evidence(attempt_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_type ON public.skill_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_verification_status ON public.skill_evidence(verification_status);

-- ── 3. Academic Evidence Cross-Student & Subject Validation Trigger ──────────
-- Ensures Student A cannot link Student B's academic attempt to their evidence.
-- Ensures subject_id is consistent with referenced attempt_id (populating if NULL).
CREATE OR REPLACE FUNCTION public.check_skill_evidence_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_student UUID;
  v_attempt_subject UUID;
BEGIN
  IF NEW.attempt_id IS NOT NULL THEN
    SELECT student_id, subject_id
    INTO v_attempt_student, v_attempt_subject
    FROM public.student_subject_attempts
    WHERE id = NEW.attempt_id;

    IF v_attempt_student IS NULL THEN
      RAISE EXCEPTION 'Referenced academic attempt does not exist';
    END IF;

    -- Cross-student isolation check
    IF v_attempt_student <> NEW.student_id THEN
      RAISE EXCEPTION 'Academic attempt belongs to a different student: cross-student evidence linking is prohibited';
    END IF;

    -- Subject consistency check
    IF NEW.subject_id IS NOT NULL AND NEW.subject_id <> v_attempt_subject THEN
      RAISE EXCEPTION 'subject_id must match the subject of the referenced attempt';
    END IF;

    -- Auto-populate subject_id from attempt if omitted
    IF NEW.subject_id IS NULL THEN
      NEW.subject_id := v_attempt_subject;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_skill_evidence_integrity_trg ON public.skill_evidence;
CREATE TRIGGER check_skill_evidence_integrity_trg
  BEFORE INSERT OR UPDATE ON public.skill_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.check_skill_evidence_integrity();

-- ── 4. Verification-Field Protection Trigger ─────────────────────────────────
-- Dual-phase protection covering both INSERT and UPDATE.
-- Students cannot self-verify or spoof verification state.
-- Only authorized roles (verifier, super_admin, college_admin) can establish or alter verification state.
CREATE OR REPLACE FUNCTION public.protect_evidence_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
BEGIN
  v_is_authorized := (public.is_admin() OR public.has_role('verifier'));

  -- On INSERT: non-authorized users CANNOT insert evidence as verified/pending
  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> 'unverified'
         OR NEW.verification_level <> 'unverified'
         OR NEW.verified_at IS NOT NULL
         OR NEW.verified_by IS NOT NULL THEN
        RAISE EXCEPTION 'Access denied: students cannot set verification fields on inserted evidence';
      END IF;
    ELSE
      -- Authorized verifier inserting pre-verified evidence
      IF NEW.verification_status = 'verified' THEN
        NEW.verified_at := COALESCE(NEW.verified_at, now());
        NEW.verified_by := COALESCE(NEW.verified_by, auth.uid());
      END IF;
    END IF;

  -- On UPDATE: non-authorized users CANNOT alter verification fields
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> OLD.verification_status
         OR NEW.verification_level <> OLD.verification_level
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
        RAISE EXCEPTION 'Access denied: only verifiers or administrators can modify verification fields';
      END IF;
    ELSE
      -- Authorized verifier updating verification status
      IF NEW.verification_status = 'verified' AND OLD.verification_status <> 'verified' THEN
        NEW.verified_at := COALESCE(NEW.verified_at, now());
        NEW.verified_by := COALESCE(NEW.verified_by, auth.uid());
      ELSIF NEW.verification_status IN ('unverified', 'pending', 'rejected') THEN
        IF NEW.verification_status = 'unverified' THEN
          NEW.verified_at := NULL;
          NEW.verified_by := NULL;
        ELSE
          NEW.verified_at := now();
          NEW.verified_by := auth.uid();
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_skill_evidence_verification_fields_trg ON public.skill_evidence;
CREATE TRIGGER protect_skill_evidence_verification_fields_trg
  BEFORE INSERT OR UPDATE ON public.skill_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_evidence_verification_fields();

-- ── 5. Student Skill Status Synchronization ──────────────────────────────────
-- Reconciles student_skills.status based on surviving qualifying evidence:
--   claimed   -> 0 evidence rows
--   supported -> >=1 unverified evidence rows
--   verified  -> >=1 verified evidence rows
-- Archival Invariance: An explicitly 'archived' skill must NEVER be resurrected by evidence changes.
-- Trigger recursion is avoided by updating student_skills only when status actually changes.
CREATE OR REPLACE FUNCTION public.sync_student_skill_status(p_student_id UUID, p_skill_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_status VARCHAR(20);
  v_total_evidence INT := 0;
  v_verified_evidence INT := 0;
  v_target_status VARCHAR(20) := 'claimed';
BEGIN
  -- Check current status of the student skill
  SELECT status INTO v_current_status
  FROM public.student_skills
  WHERE student_id = p_student_id AND skill_id = p_skill_id;

  -- If skill record does not exist or is explicitly ARCHIVED, do not mutate or resurrect
  IF v_current_status IS NULL OR v_current_status = 'archived' THEN
    RETURN;
  END IF;

  -- Count surviving qualifying evidence
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE verification_status = 'verified')
  INTO
    v_total_evidence, v_verified_evidence
  FROM public.skill_evidence
  WHERE student_id = p_student_id AND skill_id = p_skill_id;

  IF v_verified_evidence > 0 THEN
    v_target_status := 'verified';
  ELSIF v_total_evidence > 0 THEN
    v_target_status := 'supported';
  ELSE
    v_target_status := 'claimed';
  END IF;

  -- Avoid trigger recursion: only update if status actually changed
  UPDATE public.student_skills
  SET status = v_target_status, updated_at = now()
  WHERE student_id = p_student_id
    AND skill_id = p_skill_id
    AND status <> v_target_status;
END;
$$;

-- Trigger function on skill_evidence changes
CREATE OR REPLACE FUNCTION public.trg_sync_skill_status_on_evidence_change_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.sync_student_skill_status(NEW.student_id, NEW.skill_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.sync_student_skill_status(OLD.student_id, OLD.skill_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.sync_student_skill_status(NEW.student_id, NEW.skill_id);
    IF OLD.skill_id <> NEW.skill_id OR OLD.student_id <> NEW.student_id THEN
      PERFORM public.sync_student_skill_status(OLD.student_id, OLD.skill_id);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_skill_status_on_evidence_change ON public.skill_evidence;
CREATE TRIGGER trg_sync_skill_status_on_evidence_change
  AFTER INSERT OR UPDATE OR DELETE ON public.skill_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_skill_status_on_evidence_change_fn();

-- ── 6. Anti-Bypass Guard & Unarchive Sync on Student Skills ──────────────────
-- Anti-bypass: Students cannot manually elevate their status to 'supported' or 'verified'.
CREATE OR REPLACE FUNCTION public.guard_student_skill_status_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.has_role('verifier')) THEN
    -- Student can archive their skill (status := 'archived')
    -- Student can unarchive to 'claimed'
    -- But student cannot manually elevate status to 'supported' or 'verified'
    IF NEW.status <> OLD.status AND NEW.status IN ('supported', 'verified') THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_student_skills_status ON public.student_skills;
CREATE TRIGGER guard_student_skills_status
  BEFORE UPDATE ON public.student_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_student_skill_status_mutation();

-- Unarchive trigger function: when explicitly unarchiving, re-evaluate existing evidence
CREATE OR REPLACE FUNCTION public.trg_sync_skill_status_on_unarchive_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.sync_student_skill_status(NEW.student_id, NEW.skill_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_skill_status_on_unarchive ON public.student_skills;
CREATE TRIGGER trg_sync_skill_status_on_unarchive
  AFTER UPDATE OF status ON public.student_skills
  FOR EACH ROW
  WHEN (OLD.status = 'archived' AND NEW.status <> 'archived')
  EXECUTE FUNCTION public.trg_sync_skill_status_on_unarchive_fn();

-- ── 7. Row Level Security Policies ──────────────────────────────────────────
-- Uses non-recursive helper functions: public.get_current_student_id(), public.is_admin(), public.has_role()
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evidence ENABLE ROW LEVEL SECURITY;

-- student_skills Policies
DROP POLICY IF EXISTS student_skills_select_policy ON public.student_skills;
CREATE POLICY student_skills_select_policy ON public.student_skills
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS student_skills_insert_policy ON public.student_skills;
CREATE POLICY student_skills_insert_policy ON public.student_skills
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS student_skills_update_policy ON public.student_skills;
CREATE POLICY student_skills_update_policy ON public.student_skills
  FOR UPDATE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  )
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS student_skills_delete_policy ON public.student_skills;
CREATE POLICY student_skills_delete_policy ON public.student_skills
  FOR DELETE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

-- skill_evidence Policies
DROP POLICY IF EXISTS skill_evidence_select_policy ON public.skill_evidence;
CREATE POLICY skill_evidence_select_policy ON public.skill_evidence
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS skill_evidence_insert_policy ON public.skill_evidence;
CREATE POLICY skill_evidence_insert_policy ON public.skill_evidence
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS skill_evidence_update_policy ON public.skill_evidence;
CREATE POLICY skill_evidence_update_policy ON public.skill_evidence
  FOR UPDATE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  )
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS skill_evidence_delete_policy ON public.skill_evidence;
CREATE POLICY skill_evidence_delete_policy ON public.skill_evidence
  FOR DELETE
  USING (
    (student_id = public.get_current_student_id() AND verification_status <> 'verified')
    OR public.is_admin()
  );

-- ── 8. Permissions & Grants ──────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_evidence TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_student_skill_status(UUID, UUID) TO authenticated;
