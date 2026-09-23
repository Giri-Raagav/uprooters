import { supabase } from '@/lib/supabase'

/**
 * adminService — Client service for Data Editor, Verifier, and Super Admin workflows.
 * All mutations execute via secure database RPCs enforcing role checks.
 */
export const adminService = {
  /**
   * Verify a career requirement (Verifier or Super Admin only).
   */
  async verifyCareerRequirement(
    requirementId: string,
    status: 'pending' | 'verified' | 'rejected' | 'stale',
    level: 'official_source' | 'official_ats' | 'corroborated_public_source' | 'manually_curated' | 'unverified',
    notes?: string
  ): Promise<string> {
    const { data, error } = await (supabase as any).rpc('verify_career_requirement', {
      p_requirement_id: requirementId,
      p_status: status,
      p_level: level,
      p_notes: notes,
    })

    if (error) {
      console.error('adminService.verifyCareerRequirement failed', error)
      throw error
    }
    return data as string
  },

  /**
   * Verify a job opening status (Verifier or Super Admin only).
   */
  async verifyJobOpening(
    jobOpeningId: string,
    status: 'draft' | 'published' | 'closed' | 'archived' | 'stale',
    notes?: string
  ): Promise<string> {
    const { data, error } = await (supabase as any).rpc('verify_job_opening', {
      p_job_opening_id: jobOpeningId,
      p_status: status,
      p_notes: notes,
    })

    if (error) {
      console.error('adminService.verifyJobOpening failed', error)
      throw error
    }
    return data as string
  },

  /**
   * Run the deterministic freshness checker to mark expired job openings as stale.
   */
  async markStaleJobOpenings(): Promise<number> {
    const { data, error } = await (supabase as any).rpc('mark_stale_job_openings')

    if (error) {
      console.error('adminService.markStaleJobOpenings failed', error)
      throw error
    }
    return (data as number) || 0
  },

  /**
   * Fetch append-only audit logs (Privileged roles only).
   */
  async getAuditLogs(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('adminService.getAuditLogs error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch verification history records.
   */
  async getVerificationRecords(limit = 50) {
    const { data, error } = await supabase
      .from('verification_records')
      .select('*')
      .order('verified_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('adminService.getVerificationRecords error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch ingestion batch history.
   */
  async getIngestionBatches(limit = 20) {
    const { data, error } = await supabase
      .from('ingestion_batches')
      .select(`
        *,
        career_sources (name, publisher)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('adminService.getIngestionBatches error', error)
      return []
    }
    return data || []
  },
}
