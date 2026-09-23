-- ============================================================================
-- Migration: 010_student_provisioning.sql
-- Description: Student Provisioning Foundation & Secure Onboarding RPC
-- Milestone: Authentication Foundation
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §9 (Student Profile)
--   - docs/04_ARCHITECTURE.md §12 (Authentication), §14 (Authorization), §15 (RLS)
--   - docs/05_DATABASE_SPEC.md §8 (Auth & Users), §9 (Roles), §12 (Students)
--   - docs/07_SECURITY_MODEL.md §6–§15 (Auth), §20 (Role Assignment), §24–§28 (RLS)
-- ============================================================================

-- ── 1. Secure Student Onboarding RPC ─────────────────────────────────────────
-- Atomic SECURITY DEFINER routine to:
--   1. Obtain caller identity strictly from auth.uid() (never trusts client user_id).
--   2. Verify user is authenticated and not already provisioned.
--   3. Validate that the specified college_id exists and is active.
--   4. Validate that the department_id (if provided) belongs to the college and is active.
--   5. Safely assign the 'student' application role in public.user_roles.
--   6. Insert the student record into public.students.
--   7. Return the newly created student UUID.

CREATE OR REPLACE FUNCTION public.complete_student_onboarding(
  p_first_name TEXT,
  p_last_name TEXT,
  p_college_id UUID,
  p_department_id UUID DEFAULT NULL,
  p_degree TEXT DEFAULT 'B.E.',
  p_branch TEXT DEFAULT 'ECE',
  p_admission_year INT DEFAULT NULL,
  p_expected_graduation_year INT DEFAULT NULL,
  p_current_semester INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_student_id UUID;
  v_trimmed_first_name TEXT;
  v_trimmed_last_name TEXT;
  v_degree TEXT;
  v_branch TEXT;
BEGIN
  -- 1. Identify caller strictly from auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: caller has no active authenticated session'
      USING ERRCODE = '28000';
  END IF;

  -- 2. Validate required string fields
  v_trimmed_first_name := trim(COALESCE(p_first_name, ''));
  v_trimmed_last_name := trim(COALESCE(p_last_name, ''));

  IF char_length(v_trimmed_first_name) = 0 THEN
    RAISE EXCEPTION 'First name is required and cannot be empty'
      USING ERRCODE = '22023';
  END IF;

  IF char_length(v_trimmed_last_name) = 0 THEN
    RAISE EXCEPTION 'Last name is required and cannot be empty'
      USING ERRCODE = '22023';
  END IF;

  -- 3. Validate academic years
  IF p_admission_year IS NULL OR p_admission_year < 2000 OR p_admission_year > 2100 THEN
    RAISE EXCEPTION 'Admission year must be between 2000 and 2100'
      USING ERRCODE = '22023';
  END IF;

  IF p_expected_graduation_year IS NULL OR p_expected_graduation_year < p_admission_year THEN
    RAISE EXCEPTION 'Expected graduation year must be greater than or equal to admission year'
      USING ERRCODE = '22023';
  END IF;

  -- 4. Validate current semester
  IF p_current_semester IS NULL OR p_current_semester < 1 OR p_current_semester > 12 THEN
    RAISE EXCEPTION 'Current semester must be between 1 and 12'
      USING ERRCODE = '22023';
  END IF;

  -- 5. Prevent double provisioning for the same user
  IF EXISTS (SELECT 1 FROM public.students WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Student profile is already provisioned for this user'
      USING ERRCODE = '23505';
  END IF;

  -- 6. Validate canonical college exists and is active
  IF p_college_id IS NULL THEN
    RAISE EXCEPTION 'Valid college selection is required'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.colleges
    WHERE id = p_college_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Selected college is invalid or not active'
      USING ERRCODE = '23503';
  END IF;

  -- 7. Validate department if provided
  IF p_department_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.departments
      WHERE id = p_department_id
        AND college_id = p_college_id
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Selected department does not exist in the specified college or is inactive'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  -- 8. Assign application role ('student' only — never administrative roles)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 9. Insert student record into public.students
  v_degree := COALESCE(NULLIF(trim(p_degree), ''), 'B.E.');
  v_branch := COALESCE(NULLIF(trim(p_branch), ''), 'ECE');

  INSERT INTO public.students (
    user_id,
    college_id,
    department_id,
    first_name,
    last_name,
    display_name,
    degree,
    branch,
    admission_year,
    expected_graduation_year,
    current_semester
  ) VALUES (
    v_user_id,
    p_college_id,
    p_department_id,
    v_trimmed_first_name,
    v_trimmed_last_name,
    v_trimmed_first_name || ' ' || v_trimmed_last_name,
    v_degree,
    v_branch,
    p_admission_year,
    p_expected_graduation_year,
    p_current_semester
  )
  RETURNING id INTO v_student_id;

  RETURN v_student_id;
END;
$$;

-- ── 2. Explicit Function Permissions ──────────────────────────────────────────
-- Strictly authenticated callers only; no anonymous access.
REVOKE ALL ON FUNCTION public.complete_student_onboarding(TEXT, TEXT, UUID, UUID, TEXT, TEXT, INT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_student_onboarding(TEXT, TEXT, UUID, UUID, TEXT, TEXT, INT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding(TEXT, TEXT, UUID, UUID, TEXT, TEXT, INT, INT, INT) TO authenticated;

COMMENT ON FUNCTION public.complete_student_onboarding IS
  'Securely provisions an authenticated student account, assigning the student role and creating the student record atomically.';
