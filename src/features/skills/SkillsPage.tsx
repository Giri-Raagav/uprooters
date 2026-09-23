import React from 'react'
import { Wrench } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * SkillsPage — Skill inventory placeholder.
 * Spec ref: 02_FRONTEND_SPEC §10
 * Data connections deferred to a later milestone.
 */
export const SkillsPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Skills"
      subtitle="Your tracked and evidenced skill inventory"
    />
    <EmptyState
      icon={Wrench}
      title="Your skill inventory will appear here"
      description="Your skills will be shown with category, proficiency, evidence count, related projects, certifications, experience, and verification state. The system distinguishes claimed, supported, and verified skills."
    />
  </div>
)
