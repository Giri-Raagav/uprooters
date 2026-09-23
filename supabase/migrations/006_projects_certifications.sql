-- ============================================================================
-- Migration: 006_projects_certifications.sql
-- Description: Projects & Certifications System (Projects, Project Skills, Certifications, Certification Skills, Evidence Integration)
-- Milestone: 08 — Projects & Certifications
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §11, §12, §13, §14, §20
--   - docs/04_ARCHITECTURE.md §18–§19
--   - docs/05_DATABASE_SPEC.md §20–§24, §25–§28, §40, §53, §58, §76–§77
--   - docs/07_SECURITY_MODEL.md §10, §27–§31, §39, §42
--   - docs/08_DEVELOPMENT_RULES.md
--   - .agents/rules/uprooters.md
-- ============================================================================

-- ── 1. Projects (public.projects) ───────────────────────────────────────────
-- Represents practical projects completed by students.
-- Immutable student ownership: student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE.
-- Verification states: unverified, pending, verified, rejected.
-- Verification levels: exact finite §40 set.
-- Spec ref: docs/05_DATABASE_SPEC.md §25
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  project_type VARCHAR(50) NOT NULL DEFAULT 'academic'
    CHECK (project_type IN ('academic', 'capstone', 'personal', 'hackathon', 'competition', 'open_source', 'client', 'other')),
  role_responsibility TEXT,
  start_date DATE,
  end_date DATE CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  project_url TEXT CHECK (project_url IS NULL OR project_url ~* '^https?://[^\s]+$'),
  documentation_url TEXT CHECK (documentation_url IS NULL OR documentation_url ~* '^https?://[^\s]+$'),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(50) NOT NULL DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified', 'official_source', 'official_ats', 'corroborated_public_source', 'manually_curated')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT projects_id_student_key UNIQUE (id, student_id)
);

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_projects_student_id ON public.projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_verification_status ON public.projects(verification_status);

-- ── 2. Project Skills (public.project_skills) ───────────────────────────────
-- Associates practical projects with canonical skills.
-- Composite FK (project_id, student_id) prevents cross-student project skill mapping.
-- Canonical skill enforcement: skill_id REFERENCES public.skills(id) ON DELETE RESTRICT.
-- Spec ref: docs/05_DATABASE_SPEC.md §26
CREATE TABLE IF NOT EXISTS public.project_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
  contribution_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_skills_project_student_fkey
    FOREIGN KEY (project_id, student_id)
    REFERENCES public.projects(id, student_id)
    ON DELETE CASCADE,
  CONSTRAINT project_skills_skill_fkey
    FOREIGN KEY (skill_id)
    REFERENCES public.skills(id)
    ON DELETE RESTRICT,
  CONSTRAINT project_skills_project_skill_key UNIQUE (project_id, skill_id),
  CONSTRAINT project_skills_id_student_key UNIQUE (id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON public.project_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_student_id ON public.project_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id ON public.project_skills(skill_id);

-- ── 3. Certifications (public.certifications) ───────────────────────────────
-- Represents formal credentials and certifications earned by students.
-- Immutable student ownership: student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE.
-- Verification states: unverified, pending, verified, rejected.
-- Verification levels: exact finite §40 set.
-- Spec ref: docs/05_DATABASE_SPEC.md §27
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  issuing_organization TEXT NOT NULL CHECK (char_length(trim(issuing_organization)) > 0),
  issue_date DATE NOT NULL,
  expiry_date DATE CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
  credential_id TEXT,
  credential_url TEXT CHECK (credential_url IS NULL OR credential_url ~* '^https?://[^\s]+$'),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(50) NOT NULL DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified', 'official_source', 'official_ats', 'corroborated_public_source', 'manually_curated')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT certifications_id_student_key UNIQUE (id, student_id)
);

CREATE TRIGGER set_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_certifications_student_id ON public.certifications(student_id);
CREATE INDEX IF NOT EXISTS idx_certifications_issuer ON public.certifications(issuing_organization);
CREATE INDEX IF NOT EXISTS idx_certifications_verification_status ON public.certifications(verification_status);

-- ── 4. Certification Skills (public.certification_skills) ───────────────────
-- Associates formal credentials with canonical skills.
-- Composite FK (certification_id, student_id) prevents cross-student mapping.
-- Canonical skill enforcement: skill_id REFERENCES public.skills(id) ON DELETE RESTRICT.
-- Spec ref: docs/05_DATABASE_SPEC.md §28
CREATE TABLE IF NOT EXISTS public.certification_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT certification_skills_cert_student_fkey
    FOREIGN KEY (certification_id, student_id)
    REFERENCES public.certifications(id, student_id)
    ON DELETE CASCADE,
  CONSTRAINT certification_skills_skill_fkey
    FOREIGN KEY (skill_id)
    REFERENCES public.skills(id)
    ON DELETE RESTRICT,
  CONSTRAINT certification_skills_cert_skill_key UNIQUE (certification_id, skill_id),
  CONSTRAINT certification_skills_id_student_key UNIQUE (id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_certification_skills_cert_id ON public.certification_skills(certification_id);
CREATE INDEX IF NOT EXISTS idx_certification_skills_student_id ON public.certification_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_certification_skills_skill_id ON public.certification_skills(skill_id);

-- ── 5. Safe Evolution of Skill Evidence (public.skill_evidence) ──────────────
-- Idempotently adds project_id and certification_id foreign keys with ON DELETE SET NULL.
-- Implements single-source exclusivity constraint.
-- Spec ref: docs/05_DATABASE_SPEC.md §24
ALTER TABLE public.skill_evidence
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS certification_id UUID REFERENCES public.certifications(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skill_evidence_single_source_check'
  ) THEN
    ALTER TABLE public.skill_evidence
      ADD CONSTRAINT skill_evidence_single_source_check
      CHECK (num_nonnulls(attempt_id, project_id, certification_id) <= 1);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_skill_evidence_project_id ON public.skill_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_certification_id ON public.skill_evidence(certification_id);

-- ── 6. Parent Deletion Coordinator Triggers ─────────────────────────────────
-- Explicitly clears the foreign pointer on all referencing skill_evidence rows
-- before deleting the parent project or certification.
-- Preserves surviving skill_evidence rows and allows child skill mappings
-- to cascade without false blockage from the mapping invalidation guard.
CREATE OR REPLACE FUNCTION public.handle_project_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.skill_evidence
  SET project_id = NULL, updated_at = now()
  WHERE project_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_project_deletion ON public.projects;
CREATE TRIGGER trg_handle_project_deletion
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_deletion();

CREATE OR REPLACE FUNCTION public.handle_certification_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.skill_evidence
  SET certification_id = NULL, updated_at = now()
  WHERE certification_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_certification_deletion ON public.certifications;
CREATE TRIGGER trg_handle_certification_deletion
  BEFORE DELETE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_certification_deletion();

-- ── 7. Mapping Invalidation Guards ──────────────────────────────────────────
-- Direct mutation/deletion of individual project_skills or certification_skills
-- mappings is strictly rejected if active skill_evidence references the mapping.
CREATE OR REPLACE FUNCTION public.guard_project_skill_evidence_invalidation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1 FROM public.skill_evidence
      WHERE project_id = OLD.project_id AND skill_id = OLD.skill_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove skill % from project %: active skill evidence references this project-skill association', OLD.skill_id, OLD.project_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.skill_id <> NEW.skill_id OR OLD.project_id <> NEW.project_id THEN
      IF EXISTS (
        SELECT 1 FROM public.skill_evidence
        WHERE project_id = OLD.project_id AND skill_id = OLD.skill_id
      ) THEN
        RAISE EXCEPTION 'Cannot modify skill mapping on project %: active skill evidence references this project-skill association', OLD.project_id;
      END IF;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_project_skill_evidence_invalidation_trg ON public.project_skills;
CREATE TRIGGER guard_project_skill_evidence_invalidation_trg
  BEFORE UPDATE OR DELETE ON public.project_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_project_skill_evidence_invalidation();

CREATE OR REPLACE FUNCTION public.guard_certification_skill_evidence_invalidation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (
      SELECT 1 FROM public.skill_evidence
      WHERE certification_id = OLD.certification_id AND skill_id = OLD.skill_id
    ) THEN
      RAISE EXCEPTION 'Cannot remove skill % from certification %: active skill evidence references this certification-skill association', OLD.skill_id, OLD.certification_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.skill_id <> NEW.skill_id OR OLD.certification_id <> NEW.certification_id THEN
      IF EXISTS (
        SELECT 1 FROM public.skill_evidence
        WHERE certification_id = OLD.certification_id AND skill_id = OLD.skill_id
      ) THEN
        RAISE EXCEPTION 'Cannot modify skill mapping on certification %: active skill evidence references this certification-skill association', OLD.certification_id;
      END IF;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_certification_skill_evidence_invalidation_trg ON public.certification_skills;
CREATE TRIGGER guard_certification_skill_evidence_invalidation_trg
  BEFORE UPDATE OR DELETE ON public.certification_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_certification_skill_evidence_invalidation();

-- ── 8. Guard Verified Entity Skill Mutation ─────────────────────────────────
-- Students cannot remove or alter skill associations of already-verified entities.
CREATE OR REPLACE FUNCTION public.guard_verified_project_skill_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  SELECT verification_status INTO v_status
  FROM public.projects
  WHERE id = OLD.project_id;

  IF v_status = 'verified' AND NOT (public.is_admin() OR public.has_role('verifier')) THEN
    RAISE EXCEPTION 'Cannot modify skill associations on a verified project';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_verified_project_skills_trg ON public.project_skills;
CREATE TRIGGER guard_verified_project_skills_trg
  BEFORE UPDATE OR DELETE ON public.project_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verified_project_skill_mutation();

CREATE OR REPLACE FUNCTION public.guard_verified_certification_skill_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  SELECT verification_status INTO v_status
  FROM public.certifications
  WHERE id = OLD.certification_id;

  IF v_status = 'verified' AND NOT (public.is_admin() OR public.has_role('verifier')) THEN
    RAISE EXCEPTION 'Cannot modify skill associations on a verified certification';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_verified_cert_skills_trg ON public.certification_skills;
CREATE TRIGGER guard_verified_cert_skills_trg
  BEFORE UPDATE OR DELETE ON public.certification_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_verified_certification_skill_mutation();

-- ── 9. Verification Protection Triggers (Projects & Certifications) ──────────
-- Dual-phase protection covering both INSERT and UPDATE.
-- Students cannot self-verify or spoof verification state.
-- Only authorized roles (verifier, super_admin) can establish or alter verification state.
CREATE OR REPLACE FUNCTION public.protect_project_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
BEGIN
  v_is_authorized := (public.is_admin() OR public.has_role('verifier'));

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> 'unverified'
         OR NEW.verification_level <> 'unverified'
         OR NEW.verified_at IS NOT NULL
         OR NEW.verified_by IS NOT NULL THEN
        RAISE EXCEPTION 'Access denied: students cannot set verification fields on inserted projects';
      END IF;
    ELSE
      IF NEW.verification_status = 'verified' THEN
        NEW.verified_at := COALESCE(NEW.verified_at, now());
        NEW.verified_by := COALESCE(NEW.verified_by, auth.uid());
      END IF;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> OLD.verification_status
         OR NEW.verification_level <> OLD.verification_level
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
        RAISE EXCEPTION 'Access denied: only verifiers or administrators can modify project verification fields';
      END IF;
    ELSE
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

DROP TRIGGER IF EXISTS protect_projects_verification_fields_trg ON public.projects;
CREATE TRIGGER protect_projects_verification_fields_trg
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_project_verification_fields();

CREATE OR REPLACE FUNCTION public.protect_certification_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
BEGIN
  v_is_authorized := (public.is_admin() OR public.has_role('verifier'));

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> 'unverified'
         OR NEW.verification_level <> 'unverified'
         OR NEW.verified_at IS NOT NULL
         OR NEW.verified_by IS NOT NULL THEN
        RAISE EXCEPTION 'Access denied: students cannot set verification fields on inserted certifications';
      END IF;
    ELSE
      IF NEW.verification_status = 'verified' THEN
        NEW.verified_at := COALESCE(NEW.verified_at, now());
        NEW.verified_by := COALESCE(NEW.verified_by, auth.uid());
      END IF;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_is_authorized THEN
      IF NEW.verification_status <> OLD.verification_status
         OR NEW.verification_level <> OLD.verification_level
         OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
         OR NEW.verified_by IS DISTINCT FROM OLD.verified_by THEN
        RAISE EXCEPTION 'Access denied: only verifiers or administrators can modify certification verification fields';
      END IF;
    ELSE
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

DROP TRIGGER IF EXISTS protect_certifications_verification_fields_trg ON public.certifications;
CREATE TRIGGER protect_certifications_verification_fields_trg
  BEFORE INSERT OR UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_certification_verification_fields();

-- ── 10. Extended check_skill_evidence_integrity() Trigger Function ───────────
-- Replaces function in-place. Preserves Milestone 07 academic attempt checks.
-- Adds project and certification checks requiring exact (entity_id, skill_id) pair in mappings.
CREATE OR REPLACE FUNCTION public.check_skill_evidence_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_student UUID;
  v_attempt_subject UUID;
  v_proj_student UUID;
  v_proj_skill_exists BOOLEAN;
  v_cert_student UUID;
  v_cert_skill_exists BOOLEAN;
BEGIN
  -- 1. Academic Attempt Validation
  IF NEW.attempt_id IS NOT NULL THEN
    SELECT student_id, subject_id
    INTO v_attempt_student, v_attempt_subject
    FROM public.student_subject_attempts
    WHERE id = NEW.attempt_id;

    IF v_attempt_student IS NULL THEN
      RAISE EXCEPTION 'Referenced academic attempt does not exist';
    END IF;

    IF v_attempt_student <> NEW.student_id THEN
      RAISE EXCEPTION 'Academic attempt belongs to a different student: cross-student evidence linking is prohibited';
    END IF;

    IF NEW.subject_id IS NOT NULL AND NEW.subject_id <> v_attempt_subject THEN
      RAISE EXCEPTION 'subject_id must match the subject of the referenced attempt';
    END IF;

    IF NEW.subject_id IS NULL THEN
      NEW.subject_id := v_attempt_subject;
    END IF;
  END IF;

  -- 2. Project Evidence Validation
  IF NEW.project_id IS NOT NULL THEN
    SELECT student_id INTO v_proj_student
    FROM public.projects
    WHERE id = NEW.project_id;

    IF v_proj_student IS NULL THEN
      RAISE EXCEPTION 'Referenced project does not exist';
    END IF;

    IF v_proj_student <> NEW.student_id THEN
      RAISE EXCEPTION 'Project belongs to a different student: cross-student evidence linking is prohibited';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.project_skills
      WHERE project_id = NEW.project_id AND skill_id = NEW.skill_id
    ) INTO v_proj_skill_exists;

    IF NOT v_proj_skill_exists THEN
      RAISE EXCEPTION 'Skill % is not associated with project % in project_skills', NEW.skill_id, NEW.project_id;
    END IF;
  END IF;

  -- 3. Certification Evidence Validation
  IF NEW.certification_id IS NOT NULL THEN
    SELECT student_id INTO v_cert_student
    FROM public.certifications
    WHERE id = NEW.certification_id;

    IF v_cert_student IS NULL THEN
      RAISE EXCEPTION 'Referenced certification does not exist';
    END IF;

    IF v_cert_student <> NEW.student_id THEN
      RAISE EXCEPTION 'Certification belongs to a different student: cross-student evidence linking is prohibited';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.certification_skills
      WHERE certification_id = NEW.certification_id AND skill_id = NEW.skill_id
    ) INTO v_cert_skill_exists;

    IF NOT v_cert_skill_exists THEN
      RAISE EXCEPTION 'Skill % is not associated with certification % in certification_skills', NEW.skill_id, NEW.certification_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 11. Row Level Security Policies ─────────────────────────────────────────
-- Uses non-recursive helper functions: public.get_current_student_id(), public.is_admin(), public.has_role()
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_skills ENABLE ROW LEVEL SECURITY;

-- projects Policies
DROP POLICY IF EXISTS projects_select_policy ON public.projects;
CREATE POLICY projects_select_policy ON public.projects
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS projects_insert_policy ON public.projects;
CREATE POLICY projects_insert_policy ON public.projects
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS projects_update_policy ON public.projects;
CREATE POLICY projects_update_policy ON public.projects
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

DROP POLICY IF EXISTS projects_delete_policy ON public.projects;
CREATE POLICY projects_delete_policy ON public.projects
  FOR DELETE
  USING (
    (student_id = public.get_current_student_id() AND verification_status <> 'verified')
    OR public.is_admin()
  );

-- project_skills Policies
DROP POLICY IF EXISTS project_skills_select_policy ON public.project_skills;
CREATE POLICY project_skills_select_policy ON public.project_skills
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS project_skills_insert_policy ON public.project_skills;
CREATE POLICY project_skills_insert_policy ON public.project_skills
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS project_skills_update_policy ON public.project_skills;
CREATE POLICY project_skills_update_policy ON public.project_skills
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

DROP POLICY IF EXISTS project_skills_delete_policy ON public.project_skills;
CREATE POLICY project_skills_delete_policy ON public.project_skills
  FOR DELETE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

-- certifications Policies
DROP POLICY IF EXISTS certifications_select_policy ON public.certifications;
CREATE POLICY certifications_select_policy ON public.certifications
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS certifications_insert_policy ON public.certifications;
CREATE POLICY certifications_insert_policy ON public.certifications
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS certifications_update_policy ON public.certifications;
CREATE POLICY certifications_update_policy ON public.certifications
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

DROP POLICY IF EXISTS certifications_delete_policy ON public.certifications;
CREATE POLICY certifications_delete_policy ON public.certifications
  FOR DELETE
  USING (
    (student_id = public.get_current_student_id() AND verification_status <> 'verified')
    OR public.is_admin()
  );

-- certification_skills Policies
DROP POLICY IF EXISTS certification_skills_select_policy ON public.certification_skills;
CREATE POLICY certification_skills_select_policy ON public.certification_skills
  FOR SELECT
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
    OR public.has_role('verifier')
  );

DROP POLICY IF EXISTS certification_skills_insert_policy ON public.certification_skills;
CREATE POLICY certification_skills_insert_policy ON public.certification_skills
  FOR INSERT
  WITH CHECK (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS certification_skills_update_policy ON public.certification_skills;
CREATE POLICY certification_skills_update_policy ON public.certification_skills
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

DROP POLICY IF EXISTS certification_skills_delete_policy ON public.certification_skills;
CREATE POLICY certification_skills_delete_policy ON public.certification_skills
  FOR DELETE
  USING (
    student_id = public.get_current_student_id()
    OR public.is_admin()
  );

-- ── 12. Permissions & Grants ────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_skills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certification_skills TO authenticated;
