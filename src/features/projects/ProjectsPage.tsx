import React, { useEffect, useState } from 'react'
import { FolderGit2, ExternalLink, Github } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { studentService } from '@/services/studentService'

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProjects() {
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          const projs = await studentService.getProjects(profile.id)
          setProjects(projs)
        }
      } catch (err) {
        console.warn('Error loading projects', err)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="projects-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="projects-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Project Portfolio"
          subtitle="Verifiable hardware, embedded, and software projects demonstrating skills"
        />
        <Badge variant="default">{projects.length} Total Projects</Badge>
      </div>

      {projects.length === 0 ? (
        <Card className="p-8 text-center space-y-3" data-testid="projects-empty">
          <FolderGit2 className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No projects added to portfolio yet
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Practical projects in embedded systems, RTOS, or circuit design provide critical qualifying
            evidence for career readiness requirements.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <Card key={proj.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {proj.title}
                  </h3>
                  <Badge
                    variant={
                      proj.verification_status === 'verified'
                        ? 'success'
                        : proj.verification_status === 'rejected'
                        ? 'error'
                        : 'default'
                    }
                    className="capitalize shrink-0"
                  >
                    {proj.verification_status}
                  </Badge>
                </div>

                <span className="text-xs font-medium text-primary capitalize block">
                  {proj.project_type} Project
                </span>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {proj.description || 'No detailed description recorded.'}
                </p>
              </div>

              {/* Skills and Links */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {proj.project_skills && proj.project_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.project_skills.map((ps: any) => (
                      <span
                        key={ps.skill_id}
                        className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                      >
                        {ps.skills?.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs pt-1">
                  {proj.repository_url && (
                    <a
                      href={proj.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-primary flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" /> Repository
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Demo Link
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
export default ProjectsPage
