-- ============================================================================
-- UPROOTERS — Migration 011: Verified Institutional Seed Data
-- Spec references:
--   docs/01_PRODUCT_SPEC.md (§1)
--   docs/05_DATABASE_SPEC.md (§10, §11)
--   docs/07_SECURITY_MODEL.md (§25)
--   docs/08_DEVELOPMENT_RULES.md (§4 No Fabricated Career Data, §5 Data Provenance)
--   .agents/rules/uprooters.md (§1, §4, §5)
--
-- Scope:
--   - Seed verified pilot institution: Rajalakshmi Institute of Technology
--   - Seed verified pilot department: Electronics and Communication Engineering (ECE)
--   - Completely idempotent execution (safe re-run without duplicate creation)
--   - Resolves foreign key dynamically via college normalized_name lookup
-- ============================================================================

-- ── 1. Seed Verified Pilot College ──────────────────────────────────────────
-- Verified public record:
--   Name: Rajalakshmi Institute of Technology
--   Website: https://ritchennai.org
--   Location: Chennai, Tamil Nadu, India
--   Counseling Code: 1432 | AISHE Code: C-16584
INSERT INTO public.colleges (
  name,
  normalized_name,
  slug,
  website,
  city,
  state,
  country,
  status
)
VALUES (
  'Rajalakshmi Institute of Technology',
  'rajalakshmi institute of technology',
  'rajalakshmi-institute-of-technology',
  'https://ritchennai.org',
  'Chennai',
  'Tamil Nadu',
  'India',
  'active'
)
ON CONFLICT (normalized_name) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  website = EXCLUDED.website,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  status = EXCLUDED.status,
  updated_at = now();

-- ── 2. Seed Verified ECE Department for Rajalakshmi Institute of Technology ──
-- Verified public record:
--   Name: Electronics and Communication Engineering
--   Short Name: ECE
--   Parent Institution: Rajalakshmi Institute of Technology
INSERT INTO public.departments (
  college_id,
  name,
  normalized_name,
  short_name,
  status
)
SELECT
  c.id AS college_id,
  'Electronics and Communication Engineering' AS name,
  'electronics and communication engineering' AS normalized_name,
  'ECE' AS short_name,
  'active' AS status
FROM public.colleges c
WHERE c.normalized_name = 'rajalakshmi institute of technology'
ON CONFLICT (college_id, normalized_name) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  status = EXCLUDED.status,
  updated_at = now();
