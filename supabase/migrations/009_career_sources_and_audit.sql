-- ============================================================================
-- UPROOTERS — Migration 009: Career Sources, Verification & Audit Foundation
-- Spec references:
--   docs/01_PRODUCT_SPEC.md (§16, §17, §19, §23, §24)
--   docs/05_DATABASE_SPEC.md (§38–§43, §53–§77, §79)
--   docs/07_SECURITY_MODEL.md (§15–§32, §42, §61–§74, §85–§90)
--   docs/08_DEVELOPMENT_RULES.md (§30–§33, §50–§55, §84–§85)
--
-- Scope (Milestone 11-A & 11-B):
--   1. Career Data Sources (public.career_sources)
--   2. Career Source Links (public.career_source_links)
--   3. Verification Records (public.verification_records)
--   4. Student Career Targets (public.student_career_targets)
--   5. Append-Only Audit Logs (public.audit_logs) with Mutation Blocker
--   6. Ingestion Batch Tracking (public.ingestion_batches)
--   7. Secure Helper Functions & RPCs:
--      - record_audit_event (actor-spoofing protected)
--      - verify_career_requirement (verifier/admin only)
--      - verify_job_opening (verifier/admin only)
--      - mark_stale_job_openings (deterministic expiration)
--   8. Row-Level Security & Grants
-- ============================================================================

-- ── 1. Career Data Sources (public.career_sources) ──────────────────────────
-- Stores external career data publishers and capture provenance.
-- Spec ref: docs/05_DATABASE_SPEC.md §38–§39, docs/01_PRODUCT_SPEC.md §16
CREATE TABLE IF NOT EXISTS public.career_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  publisher TEXT NOT NULL CHECK (char_length(trim(publisher)) > 0),
  source_type VARCHAR(40) NOT NULL CHECK (
    source_type IN (
      'official_careers_page',
      'official_job_posting',
      'official_company_page',
      'public_job_board',
      'public_recruitment_post',
      'other_public_source',
      'discovery_source'
    )
  ),
  url TEXT CHECK (url IS NULL OR url ~* '^https?://[^\s]+$'),
  trust_tier VARCHAR(30) NOT NULL DEFAULT 'tier_4_unverified' CHECK (
    trust_tier IN (
      'tier_1_official',
      'tier_2_verified_job_board',
      'tier_3_public_curated',
      'tier_4_unverified'
    )
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_career_sources_updated_at
  BEFORE UPDATE ON public.career_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_career_sources_type ON public.career_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_career_sources_trust_tier ON public.career_sources(trust_tier);
CREATE INDEX IF NOT EXISTS idx_career_sources_status ON public.career_sources(status);

-- ── 2. Career Source Links (public.career_source_links) ─────────────────────
-- Associates canonical career entities with their supporting sources.
-- Spec ref: docs/05_DATABASE_SPEC.md §39
CREATE TABLE IF NOT EXISTS public.career_source_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.career_sources(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) NOT NULL CHECK (
    entity_type IN ('company', 'role', 'job_opening', 'career_requirement')
  ),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  career_requirement_id UUID REFERENCES public.career_requirements(id) ON DELETE CASCADE,
  extract_snippet TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT career_source_links_entity_check CHECK (
    (entity_type = 'company' AND company_id IS NOT NULL AND role_id IS NULL AND job_opening_id IS NULL AND career_requirement_id IS NULL)
    OR
    (entity_type = 'role' AND role_id IS NOT NULL AND company_id IS NULL AND job_opening_id IS NULL AND career_requirement_id IS NULL)
    OR
    (entity_type = 'job_opening' AND job_opening_id IS NOT NULL AND company_id IS NULL AND role_id IS NULL AND career_requirement_id IS NULL)
    OR
    (entity_type = 'career_requirement' AND career_requirement_id IS NOT NULL AND company_id IS NULL AND role_id IS NULL AND job_opening_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_career_source_links_source_id ON public.career_source_links(source_id);
CREATE INDEX IF NOT EXISTS idx_career_source_links_entity ON public.career_source_links(entity_type);
CREATE INDEX IF NOT EXISTS idx_career_source_links_company ON public.career_source_links(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_source_links_role ON public.career_source_links(role_id) WHERE role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_source_links_job_opening ON public.career_source_links(job_opening_id) WHERE job_opening_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_career_source_links_requirement ON public.career_source_links(career_requirement_id) WHERE career_requirement_id IS NOT NULL;

-- ── 3. Verification Records (public.verification_records) ───────────────────
-- Documents review actions performed by verifiers or administrators.
-- Spec ref: docs/05_DATABASE_SPEC.md §40, docs/07_SECURITY_MODEL.md §18
CREATE TABLE IF NOT EXISTS public.verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL CHECK (
    entity_type IN ('company', 'role', 'job_opening', 'career_requirement', 'skill_evidence')
  ),
  entity_id UUID NOT NULL,
  verifier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  verification_status VARCHAR(20) NOT NULL CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'stale')
  ),
  verification_level VARCHAR(40) NOT NULL CHECK (
    verification_level IN ('official_source', 'official_ats', 'corroborated_public_source', 'manually_curated', 'unverified')
  ),
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_records_entity ON public.verification_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_verifier ON public.verification_records(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_status ON public.verification_records(verification_status);

-- ── 4. Student Career Targets (public.student_career_targets) ───────────────
-- Allows students to designate target roles or specific job openings.
-- Spec ref: docs/01_PRODUCT_SPEC.md §5.1, docs/05_DATABASE_SPEC.md §44, §49
CREATE TABLE IF NOT EXISTS public.student_career_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('role', 'job_opening')),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  job_opening_id UUID REFERENCES public.job_openings(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_career_targets_target_check CHECK (
    (target_type = 'role' AND role_id IS NOT NULL AND job_opening_id IS NULL)
    OR
    (target_type = 'job_opening' AND job_opening_id IS NOT NULL AND role_id IS NULL)
  )
);

CREATE TRIGGER set_student_career_targets_updated_at
  BEFORE UPDATE ON public.student_career_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- At most one active primary target per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_career_targets_primary
  ON public.student_career_targets(student_id)
  WHERE (is_primary = true AND status = 'active');

-- Deduplicate targets per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_career_targets_dedup
  ON public.student_career_targets(
    student_id,
    target_type,
    COALESCE(role_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(job_opening_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

CREATE INDEX IF NOT EXISTS idx_student_career_targets_student_id ON public.student_career_targets(student_id);
CREATE INDEX IF NOT EXISTS idx_student_career_targets_status ON public.student_career_targets(status);

-- ── 5. Append-Only Audit Logs (public.audit_logs) ───────────────────────────
-- Append-only system audit trail tracking privileged and administrative actions.
-- Spec ref: docs/05_DATABASE_SPEC.md §42–§43, docs/07_SECURITY_MODEL.md §36, §87
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL CHECK (
    action IN ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'PUBLISH', 'UNPUBLISH', 'VERIFY', 'REJECT', 'RETIRE')
  ),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  actor_type VARCHAR(30) NOT NULL CHECK (
    actor_type IN ('student', 'data_editor', 'verifier', 'super_admin', 'system')
  ),
  before_state JSONB,
  after_state JSONB,
  changed_fields TEXT[],
  reason TEXT,
  batch_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Database-level immutability enforcement: UPDATE and DELETE are prohibited
CREATE OR REPLACE FUNCTION public.prevent_audit_logs_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is strictly append-only: UPDATE and DELETE operations are prohibited.';
END;
$$;

CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_logs_mutation();

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ── 6. Ingestion Batch Tracking (public.ingestion_batches) ───────────────────
-- Tracks structured career data imports and batch validation health.
-- Spec ref: docs/05_DATABASE_SPEC.md §79, docs/07_SECURITY_MODEL.md §86
CREATE TABLE IF NOT EXISTS public.ingestion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.career_sources(id) ON DELETE SET NULL,
  batch_reference TEXT NOT NULL CHECK (char_length(trim(batch_reference)) > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
  records_processed INT NOT NULL DEFAULT 0 CHECK (records_processed >= 0),
  records_valid INT NOT NULL DEFAULT 0 CHECK (records_valid >= 0),
  records_invalid INT NOT NULL DEFAULT 0 CHECK (records_invalid >= 0),
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_batches_source_id ON public.ingestion_batches(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_status ON public.ingestion_batches(status);

-- ── 7. Secure Functions & RPCs ──────────────────────────────────────────────

-- Helper function to record audit event without allowing actor spoofing
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_before JSONB DEFAULT NULL,
  p_after JSONB DEFAULT NULL,
  p_changed_fields TEXT[] DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_batch_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_actor_type VARCHAR(30);
  v_log_id UUID;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record audit event.';
  END IF;

  -- Server-side determination of actor type to prevent actor spoofing
  IF public.is_admin() THEN
    v_actor_type := 'super_admin';
  ELSIF public.has_role('verifier') THEN
    v_actor_type := 'verifier';
  ELSIF public.has_role('data_editor') THEN
    v_actor_type := 'data_editor';
  ELSE
    v_actor_type := 'student';
  END IF;

  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, actor_type,
    before_state, after_state, changed_fields, reason, batch_id, created_at
  ) VALUES (
    p_entity_type, p_entity_id, p_action, v_actor_id, v_actor_type,
    p_before, p_after, p_changed_fields, p_reason, p_batch_id, now()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Verification RPC for career requirements (Verifier or Super Admin only)
CREATE OR REPLACE FUNCTION public.verify_career_requirement(
  p_requirement_id UUID,
  p_status TEXT,
  p_level TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_rec_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  v_is_authorized := public.is_admin() OR public.has_role('verifier');
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: only verifiers or super admins may verify career requirements.';
  END IF;

  IF p_status NOT IN ('pending', 'verified', 'rejected', 'stale') THEN
    RAISE EXCEPTION 'Invalid verification status: %', p_status;
  END IF;

  IF p_level NOT IN ('official_source', 'official_ats', 'corroborated_public_source', 'manually_curated', 'unverified') THEN
    RAISE EXCEPTION 'Invalid verification level: %', p_level;
  END IF;

  SELECT to_jsonb(cr) INTO v_before
  FROM public.career_requirements cr
  WHERE cr.id = p_requirement_id;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Career requirement with id % not found.', p_requirement_id;
  END IF;

  UPDATE public.career_requirements
  SET verification_status = p_status,
      verification_level = p_level,
      updated_at = now()
  WHERE id = p_requirement_id;

  SELECT to_jsonb(cr) INTO v_after
  FROM public.career_requirements cr
  WHERE cr.id = p_requirement_id;

  -- Record audit event
  PERFORM public.record_audit_event(
    'career_requirement',
    p_requirement_id,
    CASE WHEN p_status = 'verified' THEN 'VERIFY'
         WHEN p_status = 'rejected' THEN 'REJECT'
         ELSE 'UPDATE' END,
    v_before,
    v_after,
    ARRAY['verification_status', 'verification_level'],
    p_notes
  );

  -- Record verification history
  INSERT INTO public.verification_records (
    entity_type, entity_id, verifier_id, verification_status, verification_level, notes, verified_at
  ) VALUES (
    'career_requirement', p_requirement_id, auth.uid(), p_status, p_level, p_notes, now()
  )
  RETURNING id INTO v_rec_id;

  RETURN v_rec_id;
END;
$$;

-- Verification RPC for job openings (Verifier or Super Admin only)
CREATE OR REPLACE FUNCTION public.verify_job_opening(
  p_job_opening_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_rec_id UUID;
  v_before JSONB;
  v_after JSONB;
BEGIN
  v_is_authorized := public.is_admin() OR public.has_role('verifier');
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: only verifiers or super admins may verify job openings.';
  END IF;

  IF p_status NOT IN ('draft', 'published', 'closed', 'archived', 'stale') THEN
    RAISE EXCEPTION 'Invalid job opening status: %', p_status;
  END IF;

  SELECT to_jsonb(jo) INTO v_before
  FROM public.job_openings jo
  WHERE jo.id = p_job_opening_id;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'Job opening with id % not found.', p_job_opening_id;
  END IF;

  UPDATE public.job_openings
  SET status = p_status,
      updated_at = now()
  WHERE id = p_job_opening_id;

  SELECT to_jsonb(jo) INTO v_after
  FROM public.job_openings jo
  WHERE jo.id = p_job_opening_id;

  -- Record audit event
  PERFORM public.record_audit_event(
    'job_opening',
    p_job_opening_id,
    CASE WHEN p_status = 'published' THEN 'PUBLISH'
         WHEN p_status IN ('closed', 'archived') THEN 'ARCHIVE'
         ELSE 'UPDATE' END,
    v_before,
    v_after,
    ARRAY['status'],
    p_notes
  );

  -- Record verification history
  INSERT INTO public.verification_records (
    entity_type, entity_id, verifier_id, verification_status, verification_level, notes, verified_at
  ) VALUES (
    'job_opening',
    p_job_opening_id,
    auth.uid(),
    CASE WHEN p_status = 'published' THEN 'verified'
         WHEN p_status = 'stale' THEN 'stale'
         ELSE 'pending' END,
    'official_source',
    p_notes,
    now()
  )
  RETURNING id INTO v_rec_id;

  RETURN v_rec_id;
END;
$$;

-- Freshness Checker: Deterministic stale job opening transition
CREATE OR REPLACE FUNCTION public.mark_stale_job_openings()
RETURNS INT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_authorized BOOLEAN;
  v_count INT := 0;
BEGIN
  v_is_authorized := public.is_admin() OR public.has_role('data_editor') OR public.has_role('verifier');
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Unauthorized: requires data_editor, verifier, or super_admin role.';
  END IF;

  -- Deterministic transition:
  -- Only job openings where status = 'published' AND closing_date IS NOT NULL AND closing_date < CURRENT_DATE
  -- Openings with NULL closing_date remain untouched.
  WITH updated_rows AS (
    UPDATE public.job_openings
    SET status = 'stale',
        updated_at = now()
    WHERE status = 'published'
      AND closing_date IS NOT NULL
      AND closing_date < CURRENT_DATE
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated_rows;

  RETURN v_count;
END;
$$;

-- ── 8. Row-Level Security & Grants ──────────────────────────────────────────

ALTER TABLE public.career_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_source_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_career_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_batches ENABLE ROW LEVEL SECURITY;

-- career_sources policies
CREATE POLICY "career_sources_select_policy"
  ON public.career_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "career_sources_insert_policy"
  ON public.career_sources FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "career_sources_update_policy"
  ON public.career_sources FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "career_sources_delete_policy"
  ON public.career_sources FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- career_source_links policies
CREATE POLICY "career_source_links_select_policy"
  ON public.career_source_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "career_source_links_insert_policy"
  ON public.career_source_links FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "career_source_links_update_policy"
  ON public.career_source_links FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "career_source_links_delete_policy"
  ON public.career_source_links FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- verification_records policies (append-only review log)
CREATE POLICY "verification_records_select_policy"
  ON public.verification_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "verification_records_insert_policy"
  ON public.verification_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('verifier'));

-- student_career_targets policies (strictly isolated by student_id)
CREATE POLICY "student_career_targets_select_policy"
  ON public.student_career_targets FOR SELECT
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_career_targets_insert_policy"
  ON public.student_career_targets FOR INSERT
  TO authenticated
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_career_targets_update_policy"
  ON public.student_career_targets FOR UPDATE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin())
  WITH CHECK (student_id = public.get_current_student_id() OR public.is_admin());

CREATE POLICY "student_career_targets_delete_policy"
  ON public.student_career_targets FOR DELETE
  TO authenticated
  USING (student_id = public.get_current_student_id() OR public.is_admin());

-- audit_logs policies (strictly viewable by privileged roles, insertable only via SECURITY DEFINER)
CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.has_role('verifier') OR public.has_role('data_editor'));

-- ingestion_batches policies
CREATE POLICY "ingestion_batches_select_policy"
  ON public.ingestion_batches FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "ingestion_batches_insert_policy"
  ON public.ingestion_batches FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "ingestion_batches_update_policy"
  ON public.ingestion_batches FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "ingestion_batches_delete_policy"
  ON public.ingestion_batches FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 9. Grants ───────────────────────────────────────────────────────────────
GRANT SELECT ON public.career_sources TO authenticated;
GRANT SELECT ON public.career_source_links TO authenticated;
GRANT SELECT ON public.verification_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_career_targets TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.ingestion_batches TO authenticated;

-- Explicitly revoke direct mutations on audit_logs from all external callers
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM PUBLIC, authenticated, anon;
-- Explicitly revoke direct UPDATE and DELETE on verification_records
REVOKE UPDATE, DELETE ON public.verification_records FROM PUBLIC, authenticated, anon;

-- Grants on RPCs
REVOKE ALL ON FUNCTION public.record_audit_event(TEXT, UUID, TEXT, JSONB, JSONB, TEXT[], TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_audit_event(TEXT, UUID, TEXT, JSONB, JSONB, TEXT[], TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.verify_career_requirement(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_career_requirement(UUID, TEXT, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.verify_job_opening(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_job_opening(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_stale_job_openings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_stale_job_openings() TO authenticated;
