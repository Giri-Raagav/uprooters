import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  MinusCircle,
  Lightbulb,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { studentService } from '@/services/studentService'
import { careerService } from '@/services/careerService'
import { readinessService } from '@/services/readinessService'
import { recommendationsService } from '@/services/recommendationsService'
import type { TargetType, CanonicalReadinessResultStatus } from '@/types/database.types'

export const ReadinessPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null)
  const [, setTargets] = useState<any[]>([])
  const [selectedTargetType, setSelectedTargetType] = useState<TargetType>(
    (searchParams.get('targetType') as TargetType) || 'role'
  )
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    searchParams.get('targetId') || ''
  )
  const [availableRoles, setAvailableRoles] = useState<any[]>([])
  const [availableOpenings, setAvailableOpenings] = useState<any[]>([])

  const [evaluation, setEvaluation] = useState<any | null>(null)
  const [requirementResults, setRequirementResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [profile, roles, openings] = await Promise.all([
          studentService.getCurrentProfile(),
          careerService.getRoles(),
          careerService.getJobOpenings(),
        ])

        setAvailableRoles(roles)
        setAvailableOpenings(openings)

        if (profile) {
          setCurrentStudentId(profile.id)
          const studentTargets = await studentService.getCareerTargets(profile.id)
          setTargets(studentTargets)

          // If no target specified in URL params, check primary or first target
          let targetType = selectedTargetType
          let targetId = selectedTargetId

          if (!targetId) {
            const primary =
              studentTargets.find((t: any) => t.is_primary && t.status === 'active') ||
              studentTargets[0]
            if (primary) {
              targetType = (primary as any).target_type as TargetType
              targetId =
                ((primary as any).target_type === 'role'
                  ? (primary as any).role_id
                  : (primary as any).job_opening_id) || ''
              setSelectedTargetType(targetType)
              setSelectedTargetId(targetId)
            } else if (roles.length > 0) {
              // Default to first role in catalog
              targetType = 'role'
              targetId = (roles[0] as any).id
              setSelectedTargetType('role')
              setSelectedTargetId(targetId)
            }
          }

          if (targetId) {
            const latest = await readinessService.getLatestEvaluation(profile.id, targetType, targetId)
            if (latest) {
              setEvaluation(latest)
              const results = await readinessService.getRequirementResults((latest as any).id)
              setRequirementResults(results)
            }
          }
        }
      } catch (err) {
        console.warn('Readiness init error', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleEvaluate = async () => {
    if (!currentStudentId || !selectedTargetId) {
      setErrorMsg('Please select a career target to evaluate.')
      return
    }

    setEvaluating(true)
    setErrorMsg(null)
    try {
      const evalId = await readinessService.evaluateReadiness(
        currentStudentId,
        selectedTargetType,
        selectedTargetId
      )

      const latest = await readinessService.getLatestEvaluation(
        currentStudentId,
        selectedTargetType,
        selectedTargetId
      )
      setEvaluation(latest)

      const results = await readinessService.getRequirementResults(evalId)
      setRequirementResults(results)
    } catch (err: any) {
      console.error('Readiness evaluation failed', err)
      setErrorMsg(err.message || 'Evaluation calculation failed. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }

  const handleGenerateRecommendations = async () => {
    if (!evaluation) return
    setGeneratingRecs(true)
    try {
      await recommendationsService.generateFromEvaluation(evaluation.id)
      navigate('/app/recommendations')
    } catch (err) {
      console.error('Failed to generate recommendations', err)
      navigate('/app/recommendations')
    } finally {
      setGeneratingRecs(false)
    }
  }

  const getStatusBadge = (status: CanonicalReadinessResultStatus) => {
    switch (status) {
      case 'met':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> MET
          </Badge>
        )
      case 'partially_met':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> PARTIALLY MET
          </Badge>
        )
      case 'not_met':
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" /> NOT MET
          </Badge>
        )
      case 'not_applicable':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <MinusCircle className="w-3 h-3" /> NOT APPLICABLE
          </Badge>
        )
      case 'unknown':
      default:
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> UNKNOWN
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="readiness-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="readiness-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Career Readiness Engine"
          subtitle="Deterministic requirement-level evaluation grounded in verifiable evidence"
        />

        <Button
          variant="primary"
          onClick={handleEvaluate}
          disabled={evaluating || !selectedTargetId}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
          {evaluating ? 'Calculating...' : 'Recalculate Readiness'}
        </Button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* Target Selector Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Selected Target
            </label>
            <div className="flex items-center gap-3">
              <select
                value={selectedTargetType}
                onChange={(e) => {
                  const newType = e.target.value as TargetType
                  setSelectedTargetType(newType)
                  if (newType === 'role' && availableRoles.length > 0) {
                    setSelectedTargetId(availableRoles[0].id)
                  } else if (newType === 'job_opening' && availableOpenings.length > 0) {
                    setSelectedTargetId(availableOpenings[0].id)
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none"
              >
                <option value="role">Career Role</option>
                <option value="job_opening">Specific Job Opening</option>
              </select>

              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none max-w-xs truncate"
              >
                {selectedTargetType === 'role'
                  ? availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.domain})
                      </option>
                    ))
                  : availableOpenings.map((jo) => (
                      <option key={jo.id} value={jo.id}>
                        {jo.title} - {jo.companies?.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <Link to="/app/companies" className="text-xs text-primary hover:underline self-end">
            Browse All Careers ↗
          </Link>
        </div>
      </Card>

      {/* Main Readiness Score Summary */}
      {evaluation ? (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Readiness Score
                </span>
                <Badge variant="default">Engine v1.0.0</Badge>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-primary">
                  {Number(evaluation.overall_score).toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">
                  (Required: {Number(evaluation.required_score).toFixed(0)}% • Preferred:{' '}
                  {Number(evaluation.preferred_score).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {evaluation.is_eligible ? (
                <Badge variant="success" className="px-3 py-1 text-xs">
                  Criteria Eligible
                </Badge>
              ) : (
                <Badge variant="warning" className="px-3 py-1 text-xs">
                  Ineligible for Target
                </Badge>
              )}

              {evaluation.has_unresolved_blocking && (
                <Badge variant="error" className="px-3 py-1 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Unresolved Blocking Gaps
                </Badge>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateRecommendations}
                disabled={generatingRecs}
                className="flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                {generatingRecs ? 'Generating...' : 'Action Recommendations'}
              </Button>
            </div>
          </div>

          {/* Requirement Count Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
              <span className="text-xs text-gray-500 block">Total</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {evaluation.requirement_count}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block">Met</span>
              <span className="text-lg font-bold">{evaluation.satisfied_count}</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
              <span className="text-xs text-amber-600 dark:text-amber-400 block">Partial</span>
              <span className="text-lg font-bold">{evaluation.partial_count}</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
              <span className="text-xs text-rose-600 dark:text-rose-400 block">Missing</span>
              <span className="text-lg font-bold">{evaluation.missing_count}</span>
            </div>
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
              <span className="text-xs text-blue-600 dark:text-blue-400 block">Unknown</span>
              <span className="text-lg font-bold">{evaluation.unknown_count}</span>
            </div>
          </div>

          {/* Mandatory Specification Disclaimer */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-xs text-gray-500 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p>
              UPROOTERS measures documented readiness against defined criteria, not hiring probability or
              guaranteed employment outcomes. Readiness is deterministic and explainable from student evidence.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-4" data-testid="readiness-empty">
          <Compass className="w-12 h-12 text-gray-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Ready to evaluate target alignment
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Select your target role or opening above and run an on-demand evaluation against canonical
              requirements.
            </p>
          </div>
          <Button variant="primary" onClick={handleEvaluate} disabled={evaluating}>
            {evaluating ? 'Calculating...' : 'Evaluate Now'}
          </Button>
        </Card>
      )}

      {/* Requirement Breakdown Section */}
      {requirementResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Requirement-Level Breakdown ({requirementResults.length})
          </h3>

          <div className="space-y-3">
            {requirementResults.map((res) => (
              <Card key={res.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {res.title}
                      </h4>
                      {res.is_blocking && (
                        <Badge variant="error" className="text-[10px]">
                          BLOCKING
                        </Badge>
                      )}
                      <Badge variant="default" className="text-[10px] uppercase">
                        {res.requirement_scope}
                      </Badge>
                      <span className="text-[11px] text-gray-400 capitalize">
                        {res.requirement_type}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {res.explanation || 'Requirement verified against canonical expectations.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(res.result_status as CanonicalReadinessResultStatus)}
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Score: {Number(res.score_contribution).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Evidence and match details */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span>Match: <strong className="capitalize">{res.match_type}</strong></span>
                  <span>•</span>
                  <span>Evidence: <strong className="capitalize">{res.evidence_status.replace('_', ' ')}</strong> ({res.evidence_count} items)</span>
                  {res.verified_evidence_count > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {res.verified_evidence_count} Verified
                      </span>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default ReadinessPage
