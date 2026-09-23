-- ============================================================================
-- Migration: 003_student_profile.sql
-- Description: Student Profile Foundation
-- Milestone: 05 — Student Profile Foundation
-- Specifications:
--   - docs/01_PRODUCT_SPEC.md §9 (Student Profile), §33 (Dashboard Concept)
--   - docs/04_ARCHITECTURE.md §16 (Student Data Architecture)
--   - docs/05_DATABASE_SPEC.md §12 (Students), §57 (Constraints), §76–§77 (Migration Architecture)
--   - docs/07_SECURITY_MODEL.md §25–§28 (Student RLS Model & Isolation)
-- ============================================================================

-- ── 1. Extend public.students with Profile Fields ─────────────────────────────
-- Add contact & external profile links, career interests, and completion metric.
-- Idempotent column additions.
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS career_interests TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INT NOT NULL DEFAULT 0;

-- ── 2. Add Validation Constraints ─────────────────────────────────────────────
-- Wrapped in idempotent DO blocks to ensure safe re-runnability.

-- 2.1 Phone number: optional +, 7 to 25 characters, digits/spaces/hyphens/parentheses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_phone_number_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_phone_number_check
      CHECK (
        phone_number IS NULL OR (
          char_length(trim(phone_number)) >= 7 AND
          char_length(trim(phone_number)) <= 25 AND
          phone_number ~ '^[+0-9\s\-()]+$'
        )
      );
  END IF;
END $$;

-- 2.2 GitHub URL: valid http/https URL with optional subdomain (e.g. www.) and username/org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_github_url_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_github_url_check
      CHECK (
        github_url IS NULL OR (
          github_url ~* '^https?://([a-zA-Z0-9-]+\.)*github\.com/[a-zA-Z0-9_.-]+/?$'
        )
      );
  END IF;
END $$;

-- 2.3 LinkedIn URL: valid http/https URL supporting international subdomains (e.g. in.linkedin.com)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_linkedin_url_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_linkedin_url_check
      CHECK (
        linkedin_url IS NULL OR (
          linkedin_url ~* '^https?://([a-zA-Z0-9-]+\.)*linkedin\.com/in/[a-zA-Z0-9_.-]+/?$'
        )
      );
  END IF;
END $$;

-- 2.4 Portfolio URL: valid web URL starting with http:// or https://
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_portfolio_url_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_portfolio_url_check
      CHECK (
        portfolio_url IS NULL OR (
          portfolio_url ~* '^https?://[^\s/$.?#].[^\s]*$'
        )
      );
  END IF;
END $$;

-- 2.5 Career interests: 1-dimensional array check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_career_interests_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_career_interests_check
      CHECK (array_ndims(career_interests) <= 1);
  END IF;
END $$;

-- 2.6 Profile completion percentage: range 0 to 100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_profile_completion_percentage_check'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_profile_completion_percentage_check
      CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);
  END IF;
END $$;

-- ── 3. Index for Profile Completion Filtering ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_profile_completed ON public.students(profile_completed);

-- ── 4. Profile Completion Automation Trigger ─────────────────────────────────
-- Calculates profile_completion_percentage and profile_completed boolean based on
-- the exact 12 core profile fields documented in docs/05_DATABASE_SPEC.md §12:
-- 1. first_name
-- 2. last_name
-- 3. display_name
-- 4. college_id
-- 5. department_id
-- 6. degree
-- 7. branch
-- 8. admission_year
-- 9. expected_graduation_year
-- 10. current_semester
-- 11. location
-- 12. bio
-- Zero arbitrary weights: strictly unweighted ratio of populated fields over 12.
CREATE OR REPLACE FUNCTION public.handle_student_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  -- Evaluate each of the 12 core profile fields documented in docs/05_DATABASE_SPEC.md §12
  IF NEW.first_name IS NOT NULL AND char_length(trim(NEW.first_name)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.last_name IS NOT NULL AND char_length(trim(NEW.last_name)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.display_name IS NOT NULL AND char_length(trim(NEW.display_name)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.college_id IS NOT NULL THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.department_id IS NOT NULL THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.degree IS NOT NULL AND char_length(trim(NEW.degree)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.branch IS NOT NULL AND char_length(trim(NEW.branch)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.admission_year IS NOT NULL THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.expected_graduation_year IS NOT NULL THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.current_semester IS NOT NULL THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.location IS NOT NULL AND char_length(trim(NEW.location)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  IF NEW.bio IS NOT NULL AND char_length(trim(NEW.bio)) > 0 THEN
    v_count := v_count + 1;
  END IF;

  -- Compute unweighted percentage across the 12 core fields
  NEW.profile_completion_percentage := floor((v_count::numeric / 12::numeric) * 100);

  -- profile_completed is true iff all 12 core fields are populated
  NEW.profile_completed := (v_count = 12);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_student_profile_completion_trigger ON public.students;
CREATE TRIGGER handle_student_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_student_profile_completion();

-- ── 5. Institutional Student Profile View ────────────────────────────────────
-- Enriched profile view joining institution (college) and department details.
-- Crucial: WITH (security_invoker = true) ensures that the querying user's RLS
-- permissions are evaluated, preserving full student data isolation.
CREATE OR REPLACE VIEW public.student_profiles_view
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.user_id,
  s.college_id,
  c.name AS college_name,
  c.city AS college_city,
  c.state AS college_state,
  s.department_id,
  d.name AS department_name,
  d.short_name AS department_short_name,
  s.first_name,
  s.last_name,
  s.display_name,
  s.degree,
  s.branch,
  s.admission_year,
  s.expected_graduation_year,
  s.current_semester,
  s.date_of_birth,
  s.profile_photo_url,
  s.bio,
  s.location,
  s.country,
  s.phone_number,
  s.github_url,
  s.linkedin_url,
  s.portfolio_url,
  s.career_interests,
  s.profile_completed,
  s.profile_completion_percentage,
  s.created_at,
  s.updated_at
FROM public.students s
JOIN public.colleges c ON s.college_id = c.id
LEFT JOIN public.departments d ON s.department_id = d.id;

-- ── 6. Student Profile Access Helper Function ────────────────────────────────
-- Zero-parameter SECURITY DEFINER function returning strictly the permitted
-- profile fields for auth.uid().
-- Explicit column list returned via RETURNS TABLE.
CREATE OR REPLACE FUNCTION public.get_current_student_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  college_id UUID,
  college_name TEXT,
  college_city TEXT,
  college_state TEXT,
  department_id UUID,
  department_name TEXT,
  department_short_name TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  degree TEXT,
  branch TEXT,
  admission_year INT,
  expected_graduation_year INT,
  current_semester INT,
  date_of_birth DATE,
  profile_photo_url TEXT,
  bio TEXT,
  location TEXT,
  country TEXT,
  phone_number TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  career_interests TEXT[],
  profile_completed BOOLEAN,
  profile_completion_percentage INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    s.id,
    s.user_id,
    s.college_id,
    c.name AS college_name,
    c.city AS college_city,
    c.state AS college_state,
    s.department_id,
    d.name AS department_name,
    d.short_name AS department_short_name,
    s.first_name,
    s.last_name,
    s.display_name,
    s.degree,
    s.branch,
    s.admission_year,
    s.expected_graduation_year,
    s.current_semester,
    s.date_of_birth,
    s.profile_photo_url,
    s.bio,
    s.location,
    s.country,
    s.phone_number,
    s.github_url,
    s.linkedin_url,
    s.portfolio_url,
    s.career_interests,
    s.profile_completed,
    s.profile_completion_percentage,
    s.created_at,
    s.updated_at
  FROM public.students s
  JOIN public.colleges c ON s.college_id = c.id
  LEFT JOIN public.departments d ON s.department_id = d.id
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

-- Explicit privilege configuration: execute granted only to authenticated users
REVOKE ALL ON FUNCTION public.get_current_student_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_student_profile() TO authenticated;
