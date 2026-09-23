import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { supabase } from '@/lib/supabase'
import type { Database, SkillCategory } from '@/types/database.types'

const SPEC_PATH = path.resolve(__dirname, '../../docs/05_DATABASE_SPEC.md')
const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/002_seed_phase1_taxonomy.sql')

describe('Milestone 04 — Canonical Skill Taxonomy & Phase 1 ECE Seed Data', () => {
  const specContent = fs.readFileSync(SPEC_PATH, 'utf-8')
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8')

  describe('Safeguard 1: Exact Canonical Skill List & Count (§78)', () => {
    it('migration file exists at supabase/migrations/002_seed_phase1_taxonomy.sql', () => {
      expect(fs.existsSync(MIGRATION_PATH)).toBe(true)
    })

    // Extract exact skills list from docs/05_DATABASE_SPEC.md §78
    const seedSectionMatch = specContent.match(/78\.\s*Seed Data[\s\S]*?Initial skill taxonomy may include:\s*\n+([\s\S]*?)\n+Seed data must be idempotent/i)
    const specSkills = seedSectionMatch
      ? seedSectionMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
      : []

    it('docs/05_DATABASE_SPEC.md §78 specifies exactly 53 canonical skills', () => {
      expect(specSkills.length).toBe(53)
    })

    it('migration seeds every single canonical skill specified in §78 with zero omissions or additions', () => {
      // Parse skill names seeded in migration
      const insertBlockMatch = migrationSql.match(/INSERT INTO public\.skills\s*\([^)]+\)\s*VALUES\s*([\s\S]*?)\s*ON CONFLICT/i)
      expect(insertBlockMatch).toBeDefined()
      const insertBlock = insertBlockMatch![1]

      // Extract ('Skill Name', ...)
      const regex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/g
      const seededSkills: string[] = []
      let match
      while ((match = regex.exec(insertBlock)) !== null) {
        seededSkills.push(match[1])
      }

      expect(seededSkills.length).toBe(53)

      // Verify every skill from the specification exists in the migration seed
      for (const specSkill of specSkills) {
        expect(seededSkills).toContain(specSkill)
      }

      // Verify no extra skills were invented
      for (const seededSkill of seededSkills) {
        expect(specSkills).toContain(seededSkill)
      }
    })
  })

  describe('Safeguard 2: Controlled Categories & Check Constraints (§20)', () => {
    const approvedCategories: SkillCategory[] = [
      'PROGRAMMING',
      'EMBEDDED',
      'RTOS',
      'MICROCONTROLLERS',
      'VLSI',
      'FPGA',
      'SEMICONDUCTOR',
      'ELECTRONICS',
      'HARDWARE',
      'PCB',
      'COMMUNICATION',
      'RF_WIRELESS',
      'IOT',
      'ROBOTICS',
      'SOFTWARE',
      'TOOLS',
      'OTHER',
    ]

    it('enforces check constraint with exactly the 17 approved categories', () => {
      expect(approvedCategories.length).toBe(17)
      for (const cat of approvedCategories) {
        expect(migrationSql).toContain(`'${cat}'`)
      }
    })

    it('every seeded skill is mapped to an approved category', () => {
      const regex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'/g
      let match
      while ((match = regex.exec(migrationSql)) !== null) {
        const category = match[4] as SkillCategory
        expect(approvedCategories).toContain(category)
      }
    })
  })

  describe('Safeguard 3: Skill Aliases & Collision Detection (§22)', () => {
    it('public.skill_aliases has a unique constraint on normalized_alias', () => {
      expect(migrationSql).toContain('normalized_alias TEXT NOT NULL UNIQUE')
      expect(migrationSql).toContain('skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE')
    })

    it('detects alias collisions: every alias in seed data maps to exactly one skill', () => {
      const aliasBlockMatch = migrationSql.match(/INSERT INTO public\.skill_aliases[\s\S]*?VALUES\s*([\s\S]*?)\s*\)\s*AS a/i)
      expect(aliasBlockMatch).toBeDefined()
      const aliasBlock = aliasBlockMatch![1]

      const aliasRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g
      const normalizedAliases = new Set<string>()
      let aliasMatch
      let count = 0
      while ((aliasMatch = aliasRegex.exec(aliasBlock)) !== null) {
        count++
        const normalized = aliasMatch[3]
        expect(normalizedAliases.has(normalized)).toBe(false) // No duplicates
        normalizedAliases.add(normalized)
      }

      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Safeguard 4: Hierarchy Cycle & Self-Parenting Protection (§21)', () => {
    it('implements check_skill_hierarchy trigger function with cycle detection', () => {
      expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.check_skill_hierarchy()')
      expect(migrationSql).toContain('Self-parenting is not permitted')
      expect(migrationSql).toContain('Circular skill hierarchy detected')
      expect(migrationSql).toContain('SET search_path = public, pg_temp')
    })

    it('establishes canonical hierarchy strictly per specification (§21)', () => {
      // Embedded Systems -> Embedded C, Microcontrollers, RTOS -> FreeRTOS
      expect(migrationSql).toContain("s.normalized_name = 'embedded c' AND p.normalized_name = 'embedded systems'")
      expect(migrationSql).toContain("s.normalized_name = 'microcontrollers' AND p.normalized_name = 'embedded systems'")
      expect(migrationSql).toContain("s.normalized_name = 'rtos' AND p.normalized_name = 'embedded systems'")
      expect(migrationSql).toContain("s.normalized_name = 'freertos' AND p.normalized_name = 'rtos'")
    })
  })

  describe('Safeguard 5: Idempotency & Safe Re-execution', () => {
    it('skills insertion uses ON CONFLICT (normalized_name) DO NOTHING', () => {
      expect(migrationSql).toContain('ON CONFLICT (normalized_name) DO NOTHING;')
    })

    it('skill_aliases insertion uses ON CONFLICT (normalized_alias) DO NOTHING', () => {
      expect(migrationSql).toContain('ON CONFLICT (normalized_alias) DO NOTHING;')
    })
  })

  describe('Safeguard 6: Row-Level Security & Role Governance (§17, §24)', () => {
    it('enables Row Level Security on skills and skill_aliases', () => {
      expect(migrationSql).toContain('ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;')
      expect(migrationSql).toContain('ALTER TABLE public.skill_aliases ENABLE ROW LEVEL SECURITY;')
    })

    it('allows authenticated users to view active skills', () => {
      expect(migrationSql).toContain('CREATE POLICY "skills_select_active"')
      expect(migrationSql).toContain("USING (status = 'active' OR public.is_admin() OR public.has_role('data_editor'))")
    })

    it('restricts skill mutations to super_admin or data_editor roles', () => {
      expect(migrationSql).toContain('CREATE POLICY "skills_insert_admin_editor"')
      expect(migrationSql).toContain("WITH CHECK (public.is_admin() OR public.has_role('data_editor'))")
      expect(migrationSql).toContain('CREATE POLICY "skills_update_admin_editor"')
      expect(migrationSql).toContain('CREATE POLICY "skills_delete_admin"')
    })

    it('has no circular RLS evaluation paths', () => {
      // skills policies query public.is_admin() and public.has_role(),
      // which read public.user_roles (which has a direct scalar self-check).
      // Neither public.user_roles nor its helper functions query public.skills.
      expect(migrationSql).not.toContain('FROM public.skills WHERE')
    })
  })

  describe('Safeguard 7: TypeScript Database Types Alignment', () => {
    it('defines Database interface with skills and skill_aliases tables', () => {
      type PublicTables = Database['public']['Tables']
      type SkillsRow = PublicTables['skills']['Row']
      type SkillAliasesRow = PublicTables['skill_aliases']['Row']

      const mockSkill: SkillsRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'ESP32',
        normalized_name: 'esp32',
        slug: 'esp32',
        category: 'MICROCONTROLLERS',
        parent_skill_id: null,
        description: 'Low-cost, low-power system on a chip with integrated Wi-Fi and Bluetooth.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockAlias: SkillAliasesRow = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        skill_id: mockSkill.id,
        alias: 'ESP-32',
        normalized_alias: 'esp-32',
        created_at: new Date().toISOString(),
      }

      expect(mockSkill.category).toBe('MICROCONTROLLERS')
      expect(mockAlias.normalized_alias).toBe('esp-32')
    })

    it('allows querying skills and skill_aliases via Supabase client type contract', () => {
      const skillsQuery = supabase.from('skills')
      const aliasesQuery = supabase.from('skill_aliases')
      expect(skillsQuery).toBeDefined()
      expect(aliasesQuery).toBeDefined()
    })
  })
})
