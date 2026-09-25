-- 012_seed_career_roles.sql
-- Seed the currently documented career-role catalog.
-- Role names are taken from docs/05_DATABASE_SPEC.md.
-- Detailed career requirements are intentionally not seeded here
-- unless explicitly documented by the project specifications.

INSERT INTO public.roles (
  name,
  slug,
  status
)
VALUES
  ('Embedded Systems Engineer', 'embedded-systems-engineer', 'active'),
  ('Firmware Engineer', 'firmware-engineer', 'active'),
  ('VLSI Design Engineer', 'vlsi-design-engineer', 'active'),
  ('Verification Engineer', 'verification-engineer', 'active'),
  ('RF Engineer', 'rf-engineer', 'active'),
  ('IoT Engineer', 'iot-engineer', 'active'),
  ('Hardware Engineer', 'hardware-engineer', 'active')
ON CONFLICT (slug) DO NOTHING;