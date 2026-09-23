import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { studentService } from '@/services/studentService'
import { readinessService } from '@/services/readinessService'
import { recommendationsService } from '@/services/recommendationsService'
import type { StudentProfileViewRow } from '@/types/database.types'

interface DashboardStats {
  profile: StudentProfileViewRow | null
  skillsCount: number
  evidenceCount: number
  projectsCount: number
  primaryTarget: {
    id: string
    title: string
    type: 'role' | 'job_opening'
  } | null
  latestEvaluation: {
    id: string
    overallScore: number
    isEligible: boolean
    hasBlocking: boolean
    targetTitle: string
    calculatedAt: string
  } | null
  activeRecommendationsCount: number
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    profile: null,
    skillsCount: 0,
    evidenceCount: 0,
    projectsCount: 0,
    primaryTarget: null,
    latestEvaluation: null,
    activeRecommendationsCount: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          const [skills, evidence, projects, targets, latestEval] = await Promise.all([
            studentService.getSkills(profile.id),
            studentService.getSkillEvidence(profile.id),
            studentService.getProjects(profile.id),
            studentService.getCareerTargets(profile.id),
            readinessService.getLatestEvaluation(profile.id),
          ])

          const primary = (targets as any[]).find((t: any) => t.is_primary && t.status === 'active') || targets[0]
          let primaryTargetInfo = null
          if (primary) {
            primaryTargetInfo = {
              id: (primary as any).id,
              title: (primary as any).target_type === 'role' ? (primary as any).roles?.name || 'Target Role' : (primary as any).job_openings?.title || 'Job Opening',
              type: (primary as any).target_type as 'role' | 'job_opening',
            }
          }

          let evalInfo = null
          if (latestEval) {
            evalInfo = {
              id: (latestEval as any).id,
              overallScore: Number((latestEval as any).overall_score),
              isEligible: (latestEval as any).is_eligible,
              hasBlocking: (latestEval as any).has_unresolved_blocking,
              targetTitle:
                (latestEval as any).target_type === 'role'
                  ? (latestEval as any).roles?.name || 'Target Role'
                  : (latestEval as any).job_openings?.title || 'Job Opening',
              calculatedAt: (latestEval as any).calculated_at,
            }
          }

          const recs = await recommendationsService.getStudentRecommendations(profile.id)

          setStats({
            profile,
            skillsCount: skills.length,
            evidenceCount: evidence.length,
            projectsCount: projects.length,
            primaryTarget: primaryTargetInfo,
            latestEvaluation: evalInfo,
            activeRecommendationsCount: recs.length,
          })
        }
      } catch (err) {
        console.warn('Dashboard data load exception (normal if unauthenticated or offline)', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse" data-testid="dashboard-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
          <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  // Graceful empty state when no student profile exists
  if (!stats.profile) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in" data-testid="dashboard-empty">
        <PageHeader
          title="Dashboard"
          subtitle="Your academic and career status at a glance"
        />

        <Card className="p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your dashboard will appear here
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Connect your college journey to real career readiness. Complete your profile, add academic records, and explore career targets.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/app/profile">
              <Button variant="primary">Set Up Profile</Button>
            </Link>
            <Link to="/app/companies">
              <Button variant="secondary">Explore Careers</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in" data-testid="dashboard-content">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title={`Welcome back, ${stats.profile.first_name || stats.profile.display_name}`}
          subtitle={`${stats.profile.degree} in ${stats.profile.branch} • ${stats.profile.college_name}`}
        />
        <div className="flex items-center gap-2">
          <Badge variant="info">Semester {stats.profile.current_semester}</Badge>
          <Badge variant="default">{stats.profile.expected_graduation_year} Batch</Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Claimed Skills */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Skills Claimed
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.skillsCount}
            </div>
            <Link to="/app/skills" className="text-xs text-primary hover:underline flex items-center gap-1">
              View taxonomy <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 2: Verified Evidence */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Skill Evidence
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.evidenceCount}
            </div>
            <span className="text-xs text-gray-500">
              {stats.projectsCount} project{stats.projectsCount !== 1 ? 's' : ''} linked
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 3: Active Target */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Career Target
            </span>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
              {stats.primaryTarget ? stats.primaryTarget.title : 'None Selected'}
            </div>
            <Link to="/app/companies" className="text-xs text-primary hover:underline flex items-center gap-1">
              {stats.primaryTarget ? 'Change target' : 'Explore targets'} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Target className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 4: Recommendations */}
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending Actions
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.activeRecommendationsCount}
            </div>
            <Link to="/app/recommendations" className="text-xs text-primary hover:underline flex items-center gap-1">
              Review gaps <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Readiness Snapshot Card */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Career Readiness Evaluation
            </h3>
          </div>
          <Link to="/app/readiness">
            <Button variant="secondary" size="sm">
              Open Full Evaluation
            </Button>
          </Link>
        </div>

        {stats.latestEvaluation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="flex flex-col justify-center space-y-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Overall Readiness
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-primary">
                  {stats.latestEvaluation.overallScore}%
                </span>
                <span className="text-xs text-gray-400">calculated by Engine v1.0.0</span>
              </div>
              <p className="text-xs text-gray-500">
                Deterministic score based on documented requirements
              </p>
            </div>

            <div className="space-y-2 border-y md:border-y-0 md:border-x border-gray-100 dark:border-gray-800 py-3 md:py-0 md:px-6">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Target Alignment
              </span>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {stats.latestEvaluation.targetTitle}
              </div>
              <div className="flex items-center gap-2">
                {stats.latestEvaluation.isEligible ? (
                  <Badge variant="success">Eligible</Badge>
                ) : (
                  <Badge variant="warning">Criteria Unmet</Badge>
                )}
                {stats.latestEvaluation.hasBlocking && (
                  <Badge variant="error" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Blocking Gaps
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Next Best Step
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Address critical gaps identified in your evaluation to systematically improve readiness.
              </p>
              <Link to="/app/recommendations">
                <Button variant="primary" size="sm" className="w-fit">
                  View Recommendations
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              No readiness evaluation snapshot calculated yet.
            </p>
            <Link to="/app/readiness">
              <Button variant="primary" size="sm">
                Run First Readiness Check
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
export default DashboardPage
