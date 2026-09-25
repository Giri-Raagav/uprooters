-- 013_seed_firmware_requirements.sql
-- Seed the explicitly documented Firmware Engineer requirements.
-- Source: docs/05_DATABASE_SPEC.md §35.
-- These requirements are intentionally left unverified because the
-- project specification documents the relationship but does not provide
-- an external verification source URL.

DO $$
DECLARE
  v_role_id UUID;
  v_embedded_c UUID;
  v_microcontrollers UUID;
  v_rtos UUID;
  v_git UUID;
BEGIN
  SELECT id
  INTO v_role_id
  FROM public.roles
  WHERE slug = 'firmware-engineer';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Firmware Engineer role not found.';
  END IF;

  SELECT id INTO v_embedded_c
  FROM public.skills
  WHERE normalized_name = 'embedded c';

  SELECT id INTO v_microcontrollers
  FROM public.skills
  WHERE normalized_name = 'microcontrollers';

  SELECT id INTO v_rtos
  FROM public.skills
  WHERE normalized_name = 'rtos';

  SELECT id INTO v_git
  FROM public.skills
  WHERE normalized_name = 'git';

  IF v_embedded_c IS NULL
     OR v_microcontrollers IS NULL
     OR v_rtos IS NULL
     OR v_git IS NULL THEN
    RAISE EXCEPTION 'One or more documented Firmware Engineer skills are missing.';
  END IF;

  INSERT INTO public.career_requirements (
  target_type,
  role_id,
  requirement_type,
  skill_id,
  requirement_scope,
    is_blocking,
    title,
    description,
    required_value,
    weight,
    verification_status,
    verification_level
  )
  SELECT
  'role',
  v_role_id,
  'skill',
  v.skill_id,
  v.scope,
    false,
    v.title,
    'Documented in docs/05_DATABASE_SPEC.md §35.',
    NULL,
    1.0,
    'unverified',
    'unverified'
  FROM (
    VALUES
      (v_embedded_c, 'required'::VARCHAR, 'Embedded C'),
      (v_microcontrollers, 'required'::VARCHAR, 'Microcontrollers'),
      (v_rtos, 'preferred'::VARCHAR, 'RTOS'),
      (v_git, 'required'::VARCHAR, 'Git')
  ) AS v(skill_id, scope, title)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.career_requirements cr
    WHERE cr.target_type = 'role'
      AND cr.role_id = v_role_id
      AND cr.requirement_type = 'skill'
      AND cr.skill_id = v.skill_id
  );
END $$;