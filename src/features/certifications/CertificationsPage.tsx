import React from 'react'
import { Award } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * CertificationsPage — Certifications portfolio placeholder.
 * Spec ref: 02_FRONTEND_SPEC §12
 * Data connections deferred to a later milestone.
 */
export const CertificationsPage: React.FC = () => (
  <div className="p-6 animate-fade-in">
    <PageHeader
      title="Certifications"
      subtitle="Your verified certifications and credentials"
    />
    <EmptyState
      icon={Award}
      title="Your certifications will appear here"
      description="Your certifications will be shown with name, issuing organization, issue date, expiry date, associated skills, credential evidence, and verification status. Expired or unverifiable certifications are clearly distinguished."
    />
  </div>
)
