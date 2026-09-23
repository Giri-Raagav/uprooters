import React from 'react'
import { Briefcase, AlertCircle, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

/**
 * ExperiencePage — Work and internship experience tracking.
 *
 * Spec reference: docs/06_READINESS_ENGINE.md §48, docs/01_PRODUCT_SPEC.md §4
 *
 * Invariant:
 * Structured experience schema is deferred.
 * No superficial or fabricated experience records are accepted or implied.
 * In readiness engine evaluations, all experience requirements evaluate deterministically to:
 *   UNKNOWN + evidence_status = 'missing_data'
 */
export const ExperiencePage: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Experience"
        subtitle="Internships, industry apprenticeships, and practical work tracking"
      />

      {/* Honest Status Banner */}
      <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Experience Tracking Status: Deferred
              </h3>
              <Badge variant="warning">Schema Inactive</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              In accordance with the approved product specification, dedicated experience tables have been deferred
              to preserve the integrity of verifiable evidence. No placeholder companies, unverifiable employment
              claims, or mock internships are recorded.
            </p>
          </div>
        </div>
      </Card>

      {/* Readiness Engine Deterministic Behavior */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Readiness Engine Invariant
            </h4>
            <p className="text-xs text-gray-500">
              Deterministic handling of career requirements targeting experience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Evaluation Result
            </span>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="info">UNKNOWN</Badge>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                evidence_status = 'missing_data'
              </span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              When a role or opening specifies experience requirements, the engine flags them as unknown
              rather than fabricating qualification.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recommended Alternative
            </span>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="success">Supported</Badge>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Capstone & Embedded Projects
              </span>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Students can demonstrate technical competence through verifiable projects and accredited certifications.
            </p>
          </div>
        </div>
      </Card>

      {/* Empty State / Guidance */}
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
        <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
          No experience records in college journey
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Once verified institutional internships or verified co-op modules are integrated, validated work history
          will appear here with third-party verification credentials.
        </p>
      </div>
    </div>
  )
}
export default ExperiencePage
