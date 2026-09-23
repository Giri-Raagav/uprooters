import React from 'react'
import { GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * AcademicsPage — Academic journey placeholder.
 * Spec ref: 02_FRONTEND_SPEC §9
 * Data connections deferred to a later milestone.
 */
export const AcademicsPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Academics"
      subtitle="Your semester-by-semester academic journey"
    />
    <EmptyState
      icon={GraduationCap}
      title="Your academic history will appear here"
      description="Your academic journey will show semesters, subjects, grades, credits, SGPA, CGPA, arrears, retakes, and academic progress — and how your academic history contributes to career readiness."
    />
  </div>
)
