import React from 'react'
import { Compass } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * ReadinessPage — Career readiness placeholder.
 * Spec ref: 02_FRONTEND_SPEC §14-17, 03_UI_UX_SPEC §13
 * Readiness engine and data connections deferred to a later milestone.
 *
 * IMPORTANT: No readiness scores or calculations are displayed here.
 * All readiness results must come from the backend readiness engine.
 */
export const ReadinessPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Career Readiness"
      subtitle="Your readiness against target companies, roles, and job openings"
    />
    <EmptyState
      icon={Compass}
      title="Your career readiness will appear here"
      description="Once connected, this page will show your selected career targets, readiness evaluations, requirements, satisfied requirements, missing requirements, supporting evidence, and recommended next actions — all traceable to real verified data."
    />
  </div>
)
