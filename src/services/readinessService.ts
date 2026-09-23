import { supabase } from '@/lib/supabase'
import type { TargetType, Json } from '@/types/database.types'

/**
 * readinessService — Authoritative client service for Career Readiness evaluations.
 * Strictly executes the canonical database RPC:
 *   evaluate_student_readiness(UUID, VARCHAR, UUID, JSONB)
 *
 * Invariant: Never calculates readiness scores or hiring probability on the client.
 * Consumes deterministic database snapshot results.
 */
export const readinessService = {
  /**
   * Evaluate readiness on demand using the canonical M09 database function.
   * Signature: evaluate_student_readiness(p_student_id, p_target_type, p_target_id, p_engine_config)
   */
  async evaluateReadiness(
    studentId: string,
    targetType: TargetType,
    targetId: string,
    engineConfig?: Json
  ): Promise<string> {
    const { data, error } = await (supabase as any).rpc('evaluate_student_readiness', {
      p_student_id: studentId,
      p_target_type: targetType,
      p_target_id: targetId,
      p_engine_config: engineConfig,
    })

    if (error) {
      console.error('readinessService.evaluateReadiness failed', error)
      throw error
    }

    return data as string
  },

  /**
   * Fetch the latest readiness evaluation for a student and target.
   */
  async getLatestEvaluation(studentId: string, targetType?: TargetType, targetId?: string) {
    let q = supabase
      .from('readiness_evaluations')
      .select(`
        *,
        roles (*),
        job_openings (
          *,
          companies (*)
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('calculated_at', { ascending: false })
      .limit(1)

    if (targetType && targetId) {
      q = q.eq('target_type', targetType)
      if (targetType === 'role') {
        q = q.eq('role_id', targetId)
      } else {
        q = q.eq('job_opening_id', targetId)
      }
    }

    const { data, error } = await q.maybeSingle()
    if (error) {
      console.warn('readinessService.getLatestEvaluation error', error)
      return null
    }
    return data || null
  },

  /**
   * Fetch requirement-level results for a specific completed evaluation snapshot.
   */
  async getRequirementResults(evaluationId: string) {
    const { data, error } = await supabase
      .from('readiness_requirement_results')
      .select(`
        *,
        career_requirements (*)
      `)
      .eq('evaluation_id', evaluationId)
      .order('weight', { ascending: false })

    if (error) {
      console.warn('readinessService.getRequirementResults error', error)
      return []
    }
    return data || []
  },

  /**
   * Fetch full evaluation history for a student.
   */
  async getEvaluationHistory(studentId: string, limit = 10) {
    const { data, error } = await supabase
      .from('readiness_evaluations')
      .select(`
        *,
        roles (name),
        job_openings (title)
      `)
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('calculated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('readinessService.getEvaluationHistory error', error)
      return []
    }
    return data || []
  },
}
