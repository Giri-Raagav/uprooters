import React from 'react'
import { Briefcase } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * ExperiencePage — Work/internship experience placeholder.
 * Spec ref: 02_FRONTEND_SPEC §13
 * Data connections deferred to a later milestone.
 */
export const ExperiencePage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Experience"
      subtitle="Your internships and practical work experience"
    />
    <EmptyState
      icon={Briefcase}
      title="Your experience will appear here"
      description="Your experience section will show internships, work experience, apprenticeships, and practical experience — with organization, role, duration, description, associated skills, evidence, and verification state."
    />
  </div>
)
