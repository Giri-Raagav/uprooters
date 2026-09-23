-- ============================================================================
-- UPROOTERS — Migration 001: Initial Core Schema & Security Foundation
-- Spec references:
--   docs/04_ARCHITECTURE.md (§52)
--   docs/05_DATABASE_SPEC.md (§3–§12, §76–§77)
--   docs/07_SECURITY_MODEL.md (§6–§15, §24–§27, §90)
--   docs/08_DEVELOPMENT_RULES.md (§30–§33)
--
-- Scope:
--   - PostgreSQL Extensions & timestamp automation triggers
--   - Application roles table (public.user_roles)
--   - Role check & security helper functions (has_role, is_admin, get_current_student_id)
--   - Institutional hierarchy tables (public.colleges, public.departments)
--   - Core student profile table (public.students)
--   - Cross-institution validation trigger for students
--   - Row-Level Security (RLS) enabled on all tables with non-recursive policies
--
-- Note: Does NOT modify auth.users or create any user accounts.
-- ============================================================================

-- ── 1. Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Utility Triggers & Functions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 3. Application Roles (public.user_roles) ─────────────────────────────────
-- Roles: student, data_editor, verifier, super_admin
-- Spec ref: docs/05_DATABASE_SPEC.md §9, docs/07_SECURITY_MODEL.md §15
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL CHECK (role IN ('student', 'data_editor', 'verifier', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ── 4. Security Helper Functions ─────────────────────────────────────────────
-- Critical: Marked SECURITY DEFINER with fixed search_path to prevent
-- search_path hijacking and circular RLS policy evaluation.
-- Spec ref: docs/07_SECURITY_MODEL.md §24, §90

CREATE OR REPLACE FUNCTION public.has_role(requested_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = requested_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- ── 5. Institutional Hierarchy: Colleges (public.colleges) ───────────────────
-- Spec ref: docs/05_DATABASE_SPEC.md §10
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  normalized_name TEXT NOT NULL UNIQUE CHECK (char_length(trim(normalized_name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  website TEXT,
  city TEXT NOT NULL CHECK (char_length(trim(city)) > 0),
  state TEXT NOT NULL CHECK (char_length(trim(state)) > 0),
  country TEXT NOT NULL DEFAULT 'India',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_colleges_updated_at
  BEFORE UPDATE ON public.colleges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_colleges_slug ON public.colleges(slug);
CREATE INDEX IF NOT EXISTS idx_colleges_normalized_name ON public.colleges(normalized_name);

-- ── 6. Institutional Hierarchy: Departments (public.departments) ─────────────
-- Department name must be unique within its college.
-- Spec ref: docs/05_DATABASE_SPEC.md §11
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  normalized_name TEXT NOT NULL CHECK (char_length(trim(normalized_name)) > 0),
  short_name TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT departments_college_normalized_name_key UNIQUE (college_id, normalized_name)
);

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id);

-- ── 7. Student Profiles (public.students) ────────────────────────────────────
-- Spec ref: docs/05_DATABASE_SPEC.md §12, docs/07_SECURITY_MODEL.md §25
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL CHECK (char_length(trim(first_name)) > 0),
  last_name TEXT NOT NULL CHECK (char_length(trim(last_name)) > 0),
  display_name TEXT NOT NULL,
  degree TEXT NOT NULL DEFAULT 'B.E.',
  branch TEXT NOT NULL DEFAULT 'ECE',
  admission_year INT NOT NULL CHECK (admission_year >= 2000 AND admission_year <= 2100),
  expected_graduation_year INT NOT NULL CHECK (expected_graduation_year >= admission_year),
  current_semester INT NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 12),
  date_of_birth DATE,
  profile_photo_url TEXT,
  bio TEXT,
  location TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_college_id ON public.students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON public.students(department_id);

-- ── 8. Student Trigger: Integrity & Cross-Institution Check ──────────────────
-- Enforces that:
-- 1. display_name defaults to first_name + last_name if empty.
-- 2. department_id, if specified, belongs to the selected college_id.
-- Spec ref: docs/05_DATABASE_SPEC.md §12
CREATE OR REPLACE FUNCTION public.handle_student_before_insert_or_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Default display_name if blank
  IF NEW.display_name IS NULL OR trim(NEW.display_name) = '' THEN
    NEW.display_name := trim(NEW.first_name || ' ' || NEW.last_name);
  END IF;

  -- Validate that department belongs to the student's college
  IF NEW.department_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.departments
      WHERE id = NEW.department_id
        AND college_id = NEW.college_id
    ) THEN
      RAISE EXCEPTION 'Department does not belong to the selected college';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_student_institution_and_name
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_student_before_insert_or_update();

-- ── 9. Student Security Helper ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id
  FROM public.students
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ── 10. Row-Level Security (RLS) Configuration ───────────────────────────────
-- Deny by default: RLS enabled on all tables
-- Non-recursive: user_roles self-access checks user_id = auth.uid() directly
-- without calling has_role()/is_admin(), eliminating any infinite recursion.
-- Spec ref: docs/07_SECURITY_MODEL.md §24–§27

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ── 10.1 Policies for public.user_roles ──────────────────────────────────────
-- Users can view their own roles directly without recursive function calls
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Administrators can view all user roles
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only super admins can assign, update, or revoke roles
CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 10.2 Policies for public.colleges ────────────────────────────────────────
-- Active colleges are readable by any authenticated user; all readable by admin
CREATE POLICY "colleges_select_all"
  ON public.colleges
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.is_admin());

-- Only admins can modify college reference data
CREATE POLICY "colleges_insert_admin"
  ON public.colleges
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "colleges_update_admin"
  ON public.colleges
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "colleges_delete_admin"
  ON public.colleges
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 10.3 Policies for public.departments ─────────────────────────────────────
-- Active departments are readable by any authenticated user; all readable by admin
CREATE POLICY "departments_select_all"
  ON public.departments
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.is_admin());

-- Only admins can modify department reference data
CREATE POLICY "departments_insert_admin"
  ON public.departments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "departments_update_admin"
  ON public.departments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "departments_delete_admin"
  ON public.departments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 10.4 Policies for public.students ────────────────────────────────────────
-- Students can only view their own profile; admins can view all
CREATE POLICY "students_select_own_or_admin"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Students can insert their own profile record (user_id must match authenticated user)
CREATE POLICY "students_insert_own"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Students can update their own profile; admins can update all
CREATE POLICY "students_update_own_or_admin"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Only admins can delete student records
CREATE POLICY "students_delete_admin"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
