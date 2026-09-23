import { supabase } from '@/lib/supabase'
import type { TargetType, EffectiveRequirementRow } from '@/types/database.types'

/**
 * careerService — Authoritative client service for canonical career catalog data.
 * Consumes verified companies, career roles, job openings, and career requirements.
 */
export const careerService = {
  /**
   * Fetch canonical companies.
   */
  async getCompanies(filter?: { industry?: string; query?: string }) {
    let q = supabase
      .from('companies')
      .select(`
        *,
        job_openings (
          id,
          title,
          status,
          closing_date
        )
      `)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (filter?.industry && filter.industry !== 'all') {
      q = q.eq('industry', filter.industry)
    }

    if (filter?.query && filter.query.trim().length > 0) {
      q = q.ilike('name', `%${filter.query.trim()}%`)
    }

    const { data, error } = await q
    if (error) {
      console.warn('careerService.getCompanies error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch canonical career roles.
   */
  async getRoles(filter?: { domain?: string; query?: string }) {
    let q = supabase
      .from('roles')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (filter?.domain && filter.domain !== 'all') {
      q = q.eq('domain', filter.domain)
    }

    if (filter?.query && filter.query.trim().length > 0) {
      q = q.ilike('name', `%${filter.query.trim()}%`)
    }

    const { data, error } = await q
    if (error) {
      console.warn('careerService.getRoles error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch published job openings.
   */
  async getJobOpenings(filter?: {
    workMode?: string
    roleId?: string
    companyId?: string
    query?: string
  }) {
    let q = supabase
      .from('job_openings')
      .select(`
        *,
        companies (*),
        roles (*)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (filter?.workMode && filter.workMode !== 'all') {
      q = q.eq('work_mode', filter.workMode)
    }

    if (filter?.roleId) {
      q = q.eq('role_id', filter.roleId)
    }

    if (filter?.companyId) {
      q = q.eq('company_id', filter.companyId)
    }

    if (filter?.query && filter.query.trim().length > 0) {
      q = q.ilike('title', `%${filter.query.trim()}%`)
    }

    const { data, error } = await q
    if (error) {
      console.warn('careerService.getJobOpenings error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch effective requirements for a role or opening using the database RPC.
   */
  async getEffectiveRequirements(targetType: TargetType, targetId: string): Promise<EffectiveRequirementRow[]> {
    const { data, error } = await (supabase as any).rpc('resolve_effective_requirements', {
      p_target_type: targetType,
      p_target_id: targetId,
    })

    if (error) {
      console.warn('careerService.getEffectiveRequirements error', error)
      return []
    }
    return (data as EffectiveRequirementRow[]) || []
  },

  /**
   * Fetch career sources and provenance.
   */
  async getSources() {
    const { data, error } = await supabase
      .from('career_sources')
      .select('*')
      .eq('status', 'active')
      .order('trust_tier', { ascending: true })

    if (error) {
      console.warn('careerService.getSources error', error)
      return []
    }
    return data || []
  },
}
