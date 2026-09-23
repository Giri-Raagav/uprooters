import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  Info,
  Play,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { studentService } from '@/services/studentService'
import { recommendationsService } from '@/services/recommendationsService'
import type { RecommendationPriority } from '@/types/database.types'

export const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true)
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          setCurrentStudentId(profile.id)
          const recs = await recommendationsService.getStudentRecommendations(profile.id)
          setRecommendations(recs)
        }
      } catch (err) {
        console.warn('Error loading student recommendations', err)
      } finally {
        setLoading(false)
      }
    }
    loadRecommendations()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'completed' | 'dismissed') => {
    if (!currentStudentId) return
    try {
      await recommendationsService.updateStatus(id, currentStudentId, newStatus)
      if (newStatus === 'completed' || newStatus === 'dismissed') {
        setRecommendations((prev) => prev.filter((r) => r.id !== id))
        setActionNotice(
          newStatus === 'completed'
            ? 'Action marked as completed. Remember to add verifiable project/cert evidence and recalculate readiness!'
            : 'Recommendation dismissed.'
        )
      } else {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        )
        setActionNotice('Action started.')
      }
      setTimeout(() => setActionNotice(null), 5000)
    } catch (err) {
      console.error('Failed to update recommendation status', err)
    }
  }

  const getPriorityBadge = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'critical':
        return (
          <Badge variant="error" className="uppercase text-[10px] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Critical
          </Badge>
        )
      case 'high':
        return (
          <Badge variant="warning" className="uppercase text-[10px]">
            High Priority
          </Badge>
        )
      case 'medium':
        return (
          <Badge variant="info" className="uppercase text-[10px]">
            Medium
          </Badge>
        )
      case 'low':
      default:
        return (
          <Badge variant="default" className="uppercase text-[10px]">
            Low
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="recommendations-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="recommendations-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Action Recommendations"
          subtitle="Targeted interventions grounded in your evaluated readiness gaps"
        />
        <Badge variant="default">{recommendations.length} Active Recommendations</Badge>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <p>{actionNotice}</p>
        </div>
      )}

      {/* Crucial Invariant Disclaimer Banner */}
      <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong className="block font-semibold">Important Readiness Invariant:</strong>
          Recommendations are action guides addressing identified student gaps. Completing an action here
          does <strong>not</strong> automatically alter readiness or grant skill proficiency. You must submit
          qualifying evidence (such as a capstone project or verified certification) and recalculate readiness.
        </div>
      </Card>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card className="p-8 text-center space-y-3" data-testid="recommendations-empty">
          <Lightbulb className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No active recommendations pending
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Recommendations are generated from evaluation gaps against your selected career target. Run an
            evaluation in Career Readiness to discover actionable steps.
          </p>
          <div className="pt-2">
            <Link to="/app/readiness">
              <Button variant="primary" size="sm">
                Go to Readiness Engine
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const gap = rec.gap_snapshot || {}
            return (
              <Card key={rec.id} className="p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(rec.priority)}
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider capitalize">
                          {rec.recommendations?.recommendation_type?.replace('_', ' ')}
                        </span>
                        {rec.roles?.name && (
                          <Badge variant="default" className="text-[10px]">
                            {rec.roles.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {rec.recommendations?.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {rec.status === 'generated' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(rec.id, 'active')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Play className="w-3 h-3" /> Start Action
                        </Button>
                      ) : (
                        <Badge variant="info">In Progress</Badge>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(rec.id, 'completed')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                      </Button>

                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'dismissed')}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Dismiss recommendation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {rec.recommendations?.description || rec.reason}
                  </p>
                </div>

                {/* Gap Snapshot / Explainability Card */}
                {gap.title && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-500 space-y-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                      Why was this recommended?
                    </span>
                    <p>
                      Triggered by gap on requirement: <strong>{gap.title}</strong> (
                      <span className="capitalize">{gap.result_status?.replace('_', ' ')}</span> •{' '}
                      <span className="capitalize">{gap.evidence_status?.replace('_', ' ')}</span>).
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default RecommendationsPage
