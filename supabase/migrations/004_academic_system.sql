-- ============================================================================
-- Migration: 004_academic_system.sql
-- Description: Academic System (Subjects, Semesters, Attempts, Summaries, CGPA)
-- Milestone: 06 — Academic System
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §10 (Academic System)
--   - docs/04_ARCHITECTURE.md §17 (Academic Data Architecture)
--   - docs/05_DATABASE_SPEC.md §13–§18, §53, §57, §76–§77
--   - docs/06_READINESS_ENGINE.md §12, §15 (Academic Inputs & CGPA Thresholds)
--   - docs/07_SECURITY_MODEL.md §27–§30 (Academic RLS & Student Isolation)
-- ============================================================================

-- ── 1. Academic Catalog: Subjects (public.subjects) ──────────────────────────
-- Represents academic courses belonging to departments.
-- Course code is unique within a department.
-- Spec ref: docs/05_DATABASE_SPEC.md §15
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL CHECK (char_length(trim(code)) > 0),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  normalized_name TEXT GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  credits NUMERIC(4, 2) NOT NULL CHECK (credits >= 0 AND credits <= 30),
  subject_type VARCHAR(50) NOT NULL DEFAULT 'theory'
    CHECK (subject_type IN ('theory', 'laboratory', 'project', 'elective', 'mandatory', 'other')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT subjects_department_code_key UNIQUE (department_id, code)
);

CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_subjects_department_id ON public.subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_normalized_name ON public.subjects(normalized_name);

-- ── 2. Academic Timeline: Student Semesters (public.student_semesters) ────────
-- Represents a student's academic progression timeline.
-- Unique on (student_id, semester_number).
-- Composite candidate key on (id, student_id) enables composite foreign keys
-- that physically enforce cross-student semester ownership at the storage level.
-- Spec ref: docs/05_DATABASE_SPEC.md §14
CREATE TABLE IF NOT EXISTS public.student_semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  semester_number INT NOT NULL CHECK (semester_number >= 1 AND semester_number <= 12),
  academic_year VARCHAR(20) NOT NULL CHECK (char_length(trim(academic_year)) > 0),
  semester_label VARCHAR(50) NOT NULL CHECK (char_length(trim(semester_label)) > 0),
  start_date DATE,
  end_date DATE CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  status VARCHAR(20) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('in_progress', 'completed', 'upcoming', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_semesters_student_semester_key UNIQUE (student_id, semester_number),
  CONSTRAINT student_semesters_id_student_id_key UNIQUE (id, student_id)
);

CREATE TRIGGER set_student_semesters_updated_at
  BEFORE UPDATE ON public.student_semesters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_semesters_student_id ON public.student_semesters(student_id);

-- ── 3. Academic Evidence: Subject Attempts (public.student_subject_attempts) ──
-- Authoritative system of record for all course attempts, arrears, and retakes.
-- Preserves complete attempt history without overwriting prior records.
-- Enforces:
--   1. (student_id, subject_id, attempt_number) is unique (retake history preservation).
--   2. Composite foreign key (semester_id, student_id) references student_semesters(id, student_id),
--      guaranteeing that an attempt cannot reference another student's semester.
--   3. Partial unique index on (student_id, subject_id) WHERE (is_latest_attempt = true)
--      strictly prevents dual-latest states even during concurrent transactions.
-- Spec ref: docs/05_DATABASE_SPEC.md §16
CREATE TABLE IF NOT EXISTS public.student_subject_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  marks NUMERIC(5, 2) CHECK (marks IS NULL OR (marks >= 0 AND marks <= 100)),
  grade VARCHAR(10),
  grade_points NUMERIC(4, 2) CHECK (grade_points IS NULL OR (grade_points >= 0 AND grade_points <= 10)),
  credits_attempted NUMERIC(4, 2) NOT NULL CHECK (credits_attempted >= 0),
  credits_earned NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (credits_earned >= 0 AND credits_earned <= credits_attempted),
  result_status VARCHAR(20) NOT NULL DEFAULT 'pass'
    CHECK (result_status IN ('pass', 'fail', 'arrear', 'retake', 'withheld', 'absent', 'in_progress')),
  is_passing BOOLEAN NOT NULL DEFAULT false,
  is_latest_attempt BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_subject_attempts_attempt_key UNIQUE (student_id, subject_id, attempt_number),
  CONSTRAINT student_subject_attempts_semester_student_fkey
    FOREIGN KEY (semester_id, student_id)
    REFERENCES public.student_semesters(id, student_id)
    ON DELETE CASCADE
);

CREATE TRIGGER set_student_subject_attempts_updated_at
  BEFORE UPDATE ON public.student_subject_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Partial unique index ensuring strictly AT MOST ONE latest attempt per (student_id, subject_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_subject_latest_attempt_unique
  ON public.student_subject_attempts(student_id, subject_id)
  WHERE (is_latest_attempt = true);

CREATE INDEX IF NOT EXISTS idx_student_subject_attempts_student_id ON public.student_subject_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_attempts_semester_id ON public.student_subject_attempts(semester_id);
CREATE INDEX IF NOT EXISTS idx_student_subject_attempts_subject_id ON public.student_subject_attempts(subject_id);

-- ── 3.1 Latest-Attempt Management Trigger ─────────────────────────────────────
-- Automatically sets prior attempts to is_latest_attempt = false when a new latest attempt is recorded.
CREATE OR REPLACE FUNCTION public.manage_latest_attempt_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_latest_attempt = true THEN
    UPDATE public.student_subject_attempts
    SET is_latest_attempt = false, updated_at = now()
    WHERE student_id = NEW.student_id
      AND subject_id = NEW.subject_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_latest_attempt = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_manage_latest_attempt_flag ON public.student_subject_attempts;
CREATE TRIGGER trg_manage_latest_attempt_flag
  BEFORE INSERT OR UPDATE OF is_latest_attempt ON public.student_subject_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_latest_attempt_flag();

-- ── 4. Derived Academic Results: Semester Summaries (public.semester_summaries)
-- Stores derived point-in-time calculation snapshots (SGPA, credits, backlogs).
-- Composite foreign key guarantees that semester_id belongs to student_id.
-- Spec ref: docs/05_DATABASE_SPEC.md §17
CREATE TABLE IF NOT EXISTS public.semester_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL,
  sgpa NUMERIC(4, 2) CHECK (sgpa IS NULL OR (sgpa >= 0 AND sgpa <= 10)),
  attempted_credits NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (attempted_credits >= 0),
  earned_credits NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (earned_credits >= 0 AND earned_credits <= attempted_credits),
  backlogs INT NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
  calculation_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT semester_summaries_student_semester_key UNIQUE (student_id, semester_id),
  CONSTRAINT semester_summaries_semester_student_fkey
    FOREIGN KEY (semester_id, student_id)
    REFERENCES public.student_semesters(id, student_id)
    ON DELETE CASCADE
);

CREATE TRIGGER set_semester_summaries_updated_at
  BEFORE UPDATE ON public.semester_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_semester_summaries_student_id ON public.semester_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_semester_summaries_semester_id ON public.semester_summaries(semester_id);

-- ── 4.1 Automated Semester Summary Reconciliation Function ────────────────────
-- Automatically reconciles raw attempts into the derived semester summary snapshot.
-- Evaluates qualifying attempts: grade_points IS NOT NULL and result_status NOT IN ('in_progress', 'withheld').
CREATE OR REPLACE FUNCTION public.reconcile_semester_summary(p_student_id UUID, p_semester_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempted NUMERIC(5, 2) := 0;
  v_earned NUMERIC(5, 2) := 0;
  v_backlogs INT := 0;
  v_weighted_pts NUMERIC(10, 2) := 0;
  v_graded_credits NUMERIC(5, 2) := 0;
  v_sgpa NUMERIC(4, 2) := NULL;
BEGIN
  -- Aggregate raw attempts for this semester
  SELECT
    COALESCE(SUM(credits_attempted), 0),
    COALESCE(SUM(credits_earned), 0),
    COALESCE(COUNT(*) FILTER (WHERE is_passing = false AND result_status IN ('fail', 'arrear', 'absent')), 0),
    COALESCE(SUM(credits_attempted * grade_points) FILTER (WHERE grade_points IS NOT NULL AND result_status NOT IN ('in_progress', 'withheld')), 0),
    COALESCE(SUM(credits_attempted) FILTER (WHERE grade_points IS NOT NULL AND result_status NOT IN ('in_progress', 'withheld')), 0)
  INTO
    v_attempted, v_earned, v_backlogs, v_weighted_pts, v_graded_credits
  FROM public.student_subject_attempts
  WHERE student_id = p_student_id AND semester_id = p_semester_id;

  IF v_graded_credits > 0 THEN
    v_sgpa := ROUND(v_weighted_pts / v_graded_credits, 2);
  END IF;

  INSERT INTO public.semester_summaries (
    student_id, semester_id, sgpa, attempted_credits, earned_credits, backlogs, calculation_version, updated_at
  ) VALUES (
    p_student_id, p_semester_id, v_sgpa, v_attempted, v_earned, v_backlogs, 1, now()
  )
  ON CONFLICT (student_id, semester_id) DO UPDATE SET
    sgpa = EXCLUDED.sgpa,
    attempted_credits = EXCLUDED.attempted_credits,
    earned_credits = EXCLUDED.earned_credits,
    backlogs = EXCLUDED.backlogs,
    calculation_version = EXCLUDED.calculation_version,
    updated_at = now();
END;
$$;

-- Trigger to automatically reconcile semester summary whenever attempts change
CREATE OR REPLACE FUNCTION public.handle_sync_semester_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.reconcile_semester_summary(OLD.student_id, OLD.semester_id);
    RETURN OLD;
  ELSE
    PERFORM public.reconcile_semester_summary(NEW.student_id, NEW.semester_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_semester_summary ON public.student_subject_attempts;
CREATE TRIGGER trg_sync_semester_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.student_subject_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sync_semester_summary();

-- ── 5. Readiness Engine CGPA Calculation Helper Function ─────────────────────
-- Calculates cumulative GPA across all qualifying latest attempts for a student.
-- Security:
--   - SECURITY DEFINER with fixed search_path = public, pg_temp.
--   - Denies anonymous callers.
--   - Self-access only for students (p_student_id = get_current_student_id()).
--   - Super admin / readiness engine access permitted (is_admin()).
--   - Blocks arbitrary cross-student access.
-- Spec ref: docs/05_DATABASE_SPEC.md §18, docs/06_READINESS_ENGINE.md §15
CREATE OR REPLACE FUNCTION public.calculate_student_cgpa(p_student_id UUID)
RETURNS NUMERIC(4, 2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_weighted_points NUMERIC(10, 2) := 0;
  v_total_credits NUMERIC(8, 2) := 0;
  v_cgpa NUMERIC(4, 2) := NULL;
BEGIN
  -- 1. Anonymous Denial
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Authorization Check (Self-Access or Admin only)
  IF p_student_id <> public.get_current_student_id() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: cannot calculate CGPA for another student';
  END IF;

  -- 3. Calculate CGPA across qualifying latest attempts
  SELECT
    COALESCE(SUM(credits_attempted * grade_points), 0),
    COALESCE(SUM(credits_attempted), 0)
  INTO
    v_weighted_points, v_total_credits
  FROM public.student_subject_attempts
  WHERE student_id = p_student_id
    AND is_latest_attempt = true
    AND grade_points IS NOT NULL
    AND result_status NOT IN ('in_progress', 'withheld');

  IF v_total_credits > 0 THEN
    v_cgpa := ROUND(v_weighted_points / v_total_credits, 2);
  END IF;

  RETURN v_cgpa;
END;
$$;

-- Privilege configuration: revoke from PUBLIC, grant to authenticated
REVOKE ALL ON FUNCTION public.calculate_student_cgpa(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_student_cgpa(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.reconcile_semester_summary(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_semester_summary(UUID, UUID) TO authenticated;

-- ── 6. Row-Level Security (RLS) Configuration ───────────────────────────────
-- Non-recursive: uses public.get_current_student_id() and public.is_admin().
-- Spec ref: docs/07_SECURITY_MODEL.md §27–§30

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_summaries ENABLE ROW LEVEL SECURITY;

-- ── 6.1 Policies for public.subjects ─────────────────────────────────────────
-- Active courses readable by any authenticated user; all readable by admin
CREATE POLICY "subjects_select_authenticated"
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "subjects_insert_admin"
  ON public.subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "subjects_update_admin"
  ON public.subjects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subjects_delete_admin"
  ON public.subjects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 6.2 Policies for public.student_semesters ─────────────────────────────────
-- Students can only view their own progression; admins can view all
CREATE POLICY "student_semesters_select_own_or_admin"
  ON public.student_semesters
  FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_semesters_insert_own"
  ON public.student_semesters
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = public.get_current_student_id());

CREATE POLICY "student_semesters_update_own_or_admin"
  ON public.student_semesters
  FOR UPDATE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin())
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_semesters_delete_own_or_admin"
  ON public.student_semesters
  FOR DELETE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

-- ── 6.3 Policies for public.student_subject_attempts ─────────────────────────
-- Students can only view their own attempts; admins can view all
CREATE POLICY "student_subject_attempts_select_own_or_admin"
  ON public.student_subject_attempts
  FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_subject_attempts_insert_own"
  ON public.student_subject_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = public.get_current_student_id());

CREATE POLICY "student_subject_attempts_update_own_or_admin"
  ON public.student_subject_attempts
  FOR UPDATE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin())
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_subject_attempts_delete_own_or_admin"
  ON public.student_subject_attempts
  FOR DELETE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

-- ── 6.4 Policies for public.semester_summaries ───────────────────────────────
-- Summaries are derived snapshots; students can view their own, admins can view all
CREATE POLICY "semester_summaries_select_own_or_admin"
  ON public.semester_summaries
  FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "semester_summaries_insert_own_or_admin"
  ON public.semester_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "semester_summaries_update_own_or_admin"
  ON public.semester_summaries
  FOR UPDATE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin())
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "semester_summaries_delete_admin"
  ON public.semester_summaries
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
