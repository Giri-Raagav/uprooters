import React from 'react'
import { FolderGit2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * ProjectsPage — Projects portfolio placeholder.
 * Spec ref: 02_FRONTEND_SPEC §11
 * Data connections deferred to a later milestone.
 */
export const ProjectsPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Projects"
      subtitle="Your project portfolio and skill evidence"
    />
    <EmptyState
      icon={FolderGit2}
      title="Your projects will appear here"
      description="Your projects will be shown with title, description, technologies, project type, duration, role, evidence links, and verification state. Projects provide skill evidence connected to the canonical skill taxonomy."
    />
  </div>
)
