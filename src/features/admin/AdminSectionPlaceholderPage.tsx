import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'

interface AdminSectionPlaceholderPageProps {
  title: string
  subtitle: string
  icon: LucideIcon
}

/**
 * AdminSectionPlaceholderPage — visual-only admin section stub (Milestone 02).
 * No database access, auth, or business logic.
 */
export const AdminSectionPlaceholderPage: React.FC<AdminSectionPlaceholderPageProps> = ({
  title,
  subtitle,
  icon: Icon,
}) => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={<Badge variant="emerald">Placeholder</Badge>}
    />
    <EmptyState
      icon={Icon}
      title={`${title} will be available in a later milestone`}
      description="This administrator shell provides navigation and layout only. Data management, verification workflows, and settings will connect to backend authorization when implemented."
    />
  </div>
)
