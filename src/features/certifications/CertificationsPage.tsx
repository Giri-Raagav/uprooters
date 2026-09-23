import React, { useEffect, useState } from 'react'
import { Award, ExternalLink, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { studentService } from '@/services/studentService'

export const CertificationsPage: React.FC = () => {
  const [certifications, setCertifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCerts() {
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          const certs = await studentService.getCertifications(profile.id)
          setCertifications(certs)
        }
      } catch (err) {
        console.warn('Error loading certifications', err)
      } finally {
        setLoading(false)
      }
    }
    loadCerts()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="certifications-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-36 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-36 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="certifications-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Certifications"
          subtitle="Accredited technical credentials validating proficiency in canonical skills"
        />
        <Badge variant="default">{certifications.length} Credentials</Badge>
      </div>

      {certifications.length === 0 ? (
        <Card className="p-8 text-center space-y-3" data-testid="certifications-empty">
          <Award className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No certifications uploaded yet
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Accredited credentials from recognized providers (e.g. ARM, IEEE, NPTEL, Coursera)
            qualify as verifiable evidence for career requirements.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((cert) => (
            <Card key={cert.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {cert.name}
                  </h3>
                  <Badge
                    variant={
                      cert.verification_status === 'verified'
                        ? 'success'
                        : cert.verification_status === 'rejected'
                        ? 'error'
                        : 'default'
                    }
                    className="capitalize shrink-0"
                  >
                    {cert.verification_status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span>{cert.issuing_organization}</span>
                  {cert.issue_date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Issued {cert.issue_date}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Skills and Credential Link */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {cert.certification_skills && cert.certification_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cert.certification_skills.map((cs: any) => (
                      <span
                        key={cs.skill_id}
                        className="px-2 py-0.5 text-[11px] rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                      >
                        {cs.skills?.name}
                      </span>
                    ))}
                  </div>
                )}

                {cert.credential_url && (
                  <div className="text-xs pt-1">
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Verify Credential
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
export default CertificationsPage
