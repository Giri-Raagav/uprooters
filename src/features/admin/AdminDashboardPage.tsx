import React from 'react'
import { LayoutDashboard, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

/**
 * AdminDashboardPage — Administrator overview placeholder.
 *
 * Visual stub only. No admin business logic, database access,
 * authentication, or authorization is implemented here.
 * Administrative features are deferred to a later milestone.
 *
 * Spec ref: 03_UI_UX_SPEC §9 (Administrator Theme)
 */
export const AdminDashboardPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Administrator Overview"
      subtitle="Data management, verification, and system monitoring"
      actions={
        <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>
          Admin Shell
        </Badge>
      }
    />
    <EmptyState
      icon={LayoutDashboard}
      title="Administrator features coming in a later milestone"
      description="The administrator interface will provide data management, career data verification, student oversight, and system monitoring capabilities — all enforced by backend authorization and database-level security."
    />
  </div>
)
