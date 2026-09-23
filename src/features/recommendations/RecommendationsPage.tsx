import React from 'react'
import { Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * RecommendationsPage — Career recommendations placeholder.
 * Spec ref: 02_FRONTEND_SPEC §21
 * Recommendation engine deferred to a later milestone.
 */
export const RecommendationsPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Recommendations"
      subtitle="Actionable next steps toward your career targets"
    />
    <EmptyState
      icon={Lightbulb}
      title="Your recommendations will appear here"
      description="Recommendations will be tailored, actionable suggestions connected to your missing skills, career requirements, academic development, and available projects or certifications. No generic motivational content — only evidence-grounded next steps."
    />
  </div>
)
