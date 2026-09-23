import React, { useEffect, useState } from 'react'
import { GraduationCap, Award, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { studentService } from '@/services/studentService'

export const AcademicsPage: React.FC = () => {
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    cgpa: 0,
    totalCredits: 0,
    activeArrears: 0,
  })

  useEffect(() => {
    async function loadAcademics() {
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          const sems = await studentService.getSemesters(profile.id)
          setSemesters(sems)

          let credits = 0
          let arrears = 0
          let latestCgpa = 0

          sems.forEach((s: any) => {
            const summary = s.semester_summaries?.[0]
            if (summary) {
              credits += summary.total_credits_earned || 0
              arrears += summary.active_arrear_count || 0
              if (summary.cumulative_gpa) {
                latestCgpa = Number(summary.cumulative_gpa)
              }
            }
          })

          setStats({
            cgpa: latestCgpa,
            totalCredits: credits,
            activeArrears: arrears,
          })
        }
      } catch (err) {
        console.warn('Error loading academic records', err)
      } finally {
        setLoading(false)
      }
    }
    loadAcademics()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="academics-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="academics-content">
      <PageHeader
        title="Academics"
        subtitle="Semester-by-semester coursework, credits, and CGPA tracking"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cumulative GPA
            </span>
            <div className="text-3xl font-extrabold text-primary">
              {stats.cgpa ? stats.cgpa.toFixed(2) : '—'}
            </div>
            <span className="text-xs text-gray-400">Scale of 10.00</span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Award className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Earned Credits
            </span>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              {stats.totalCredits}
            </div>
            <span className="text-xs text-gray-400">Degree Requirements</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Backlogs / Arrears
            </span>
            <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              {stats.activeArrears}
            </div>
            <span className="text-xs text-gray-400">
              {stats.activeArrears === 0 ? 'Clear Academic Standing' : 'Requires Clearance'}
            </span>
          </div>
          <div
            className={`p-3 rounded-xl ${
              stats.activeArrears === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}
          >
            {stats.activeArrears === 0 ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
        </Card>
      </div>

      {/* Semester Breakdown List */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Semester Journey
        </h3>

        {semesters.length === 0 ? (
          <Card className="p-8 text-center space-y-3" data-testid="academics-empty">
            <GraduationCap className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              No semester records synced yet
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Once academic marks and semester transcripts are uploaded or verified by your department,
              your course attempts and grade breakdown will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {semesters.map((sem) => {
              const summary = sem.semester_summaries?.[0]
              return (
                <Card key={sem.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        Semester {sem.semester_number}
                      </span>
                      <Badge
                        variant={sem.status === 'completed' ? 'success' : 'default'}
                      >
                        {sem.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Academic Year {sem.academic_year}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    {summary ? (
                      <>
                        <div>
                          <span className="text-xs text-gray-400 block">SGPA</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {summary.sgpa ? Number(summary.sgpa).toFixed(2) : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Credits</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {summary.total_credits_earned || 0} / {summary.total_credits_attempted || 0}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">In Progress</span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default AcademicsPage
