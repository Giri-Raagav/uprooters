import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * DashboardPage — Student dashboard placeholder.
 * Spec ref: 02_FRONTEND_SPEC §7, 03_UI_UX_SPEC §12
 * Data connections deferred to a later milestone.
 */
export const DashboardPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Dashboard"
      subtitle="Your academic and career status at a glance"
    />
    <EmptyState
      icon={LayoutDashboard}
      title="Your dashboard will appear here"
      description="Once your profile, academics, skills, and career targets are connected, the dashboard will show your current academic status, skill coverage, portfolio highlights, career readiness status, and actionable recommendations."
    />
  </div>
)
