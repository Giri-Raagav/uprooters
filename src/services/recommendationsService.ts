import { supabase } from '@/lib/supabase'
import type { StudentRecommendationStatus, RecommendationPriority } from '@/types/database.types'

/**
 * recommendationsService — Authoritative client service for student recommendations.
 * Strictly executes the canonical database RPC:
 *   generate_recommendations_from_evaluation(UUID)
 *
 * Invariant: Recommendation generation is grounded in evaluation gaps.
 * Completing a recommendation does NOT automatically alter readiness until new evidence is verified.
 */
export const recommendationsService = {
  /**
   * Generate recommendations from a completed evaluation snapshot.
   */
  async generateFromEvaluation(evaluationId: string): Promise<number> {
    const { data, error } = await (supabase as any).rpc('generate_recommendations_from_evaluation', {
      p_evaluation_id: evaluationId,
    })

    if (error) {
      console.error('recommendationsService.generateFromEvaluation failed', error)
      throw error
    }

    return (data as number) || 0
  },

  /**
   * Fetch active recommendations for a student, ordered by priority (critical, high, medium, low).
   */
  async getStudentRecommendations(studentId: string, status?: StudentRecommendationStatus) {
    let q = supabase
      .from('student_recommendations')
      .select(`
        *,
        recommendations (
          title,
          description,
          recommendation_type,
          skill_id,
          skills (*)
        ),
        roles (name),
        job_openings (title)
      `)
      .eq('student_id', studentId)

    if (status) {
      q = q.eq('status', status)
    } else {
      // By default show actionable recommendations
      q = q.in('status', ['generated', 'active'])
    }

    const { data, error } = await q
    if (error) {
      console.warn('recommendationsService.getStudentRecommendations error', error)
      return []
    }

    // Sort by priority order: critical -> high -> medium -> low
    const priorityWeight: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    return (data || []).sort((a: any, b: any) => {
      const wA = priorityWeight[a.priority as RecommendationPriority] || 0
      const wB = priorityWeight[b.priority as RecommendationPriority] || 0
      return wB - wA
    })
  },

  /**
   * Update recommendation status (e.g. mark active, completed, or dismissed).
   */
  async updateStatus(
    recommendationId: string,
    studentId: string,
    status: 'active' | 'completed' | 'dismissed'
  ) {
    const { data, error } = await (supabase.from('student_recommendations') as any)
      .update({ status })
      .eq('id', recommendationId)
      .eq('student_id', studentId)
      .select()
      .single()

    if (error) {
      console.error('recommendationsService.updateStatus error', error)
      throw error
    }
    return data
  },
}
