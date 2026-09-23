import React from 'react'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * CompaniesPage — Companies and job openings placeholder.
 * Spec ref: 02_FRONTEND_SPEC §18-20
 * Career data connections deferred to a later milestone.
 *
 * IMPORTANT: No company or job data is displayed here.
 * All career data must come from verified, provenanced database records.
 */
export const CompaniesPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Companies"
      subtitle="Career-related companies, roles, and job openings"
    />
    <EmptyState
      icon={Building2}
      title="Company and career data will appear here"
      description="Once connected, this page will show companies, relevant roles, active job openings, required skills, source information, and verification state. All data comes from verified, provenanced records — no information is fabricated."
    />
  </div>
)
