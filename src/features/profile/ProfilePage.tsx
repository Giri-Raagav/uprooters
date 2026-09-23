import React from 'react'
import { User } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * ProfilePage — Student profile placeholder.
 * Spec ref: 02_FRONTEND_SPEC §8
 * Data connections deferred to a later milestone.
 */
export const ProfilePage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Profile"
      subtitle="Your personal and academic identity"
    />
    <EmptyState
      icon={User}
      title="Your profile will appear here"
      description="Your profile will include your name, college, department, degree, branch, admission year, expected graduation year, current semester, biography, and profile completion status."
    />
  </div>
)
