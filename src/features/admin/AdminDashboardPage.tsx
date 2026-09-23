import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  RefreshCw,
  Clock,
  History,
  Database,
  Layers,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import { careerService } from '@/services/careerService'

export const AdminDashboardPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [ingestionBatches, setIngestionBatches] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [, setLoading] = useState(false)
  const [staleChecking, setStaleChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true)
      try {
        const [logs, batches, srcs] = await Promise.all([
          adminService.getAuditLogs(10),
          adminService.getIngestionBatches(5),
          careerService.getSources(),
        ])
        setAuditLogs(logs)
        setIngestionBatches(batches)
        setSources(srcs)
      } catch (err) {
        console.warn('Admin data load warning', err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminData()
  }, [])

  const handleRunFreshnessCheck = async () => {
    setStaleChecking(true)
    try {
      const count = await adminService.markStaleJobOpenings()
      setNotice(`Freshness check complete: ${count} job opening(s) updated to stale.`)
      setTimeout(() => setNotice(null), 5000)
    } catch (err: any) {
      console.error('Freshness check failed', err)
      setNotice(err.message || 'Freshness check requires privileged role.')
      setTimeout(() => setNotice(null), 5000)
    } finally {
      setStaleChecking(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in" data-testid="admin-dashboard-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Administrator Overview"
          subtitle="Career data provenance, verification reviews, and immutable audit logs"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRunFreshnessCheck}
          disabled={staleChecking}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${staleChecking ? 'animate-spin' : ''}`} />
          {staleChecking ? 'Checking Freshness...' : 'Run Stale Opening Check'}
        </Button>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4" /> {notice}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Verified Sources
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {sources.length}
            </div>
            <span className="text-xs text-gray-400">Provenance Registry</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Database className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ingestion Batches
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ingestionBatches.length}
            </div>
            <span className="text-xs text-gray-400">Structured Imports</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Audit Events
            </span>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {auditLogs.length}
            </div>
            <span className="text-xs text-gray-400">Append-Only Log</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <History className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Role Boundaries Information Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Application Roles & Database Boundaries
            </h3>
            <p className="text-xs text-gray-500">
              Enforced by PostgreSQL Row-Level Security, table grants, and SECURITY DEFINER helpers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1">
            <Badge variant="default" className="text-[10px]">STUDENT</Badge>
            <p className="text-xs text-gray-500 pt-1">
              Private access to own profile, academics, skills, and evidence. Cannot alter career catalogs or audit history.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1">
            <Badge variant="info" className="text-[10px]">DATA_EDITOR</Badge>
            <p className="text-xs text-gray-500 pt-1">
              Curates canonical companies, roles, and sources. Cannot publish unverified requirements as verified.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1">
            <Badge variant="success" className="text-[10px]">VERIFIER</Badge>
            <p className="text-xs text-gray-500 pt-1">
              Reviews external sources, executes verification transitions, and documents verification records.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-1">
            <Badge variant="warning" className="text-[10px]">SUPER_ADMIN</Badge>
            <p className="text-xs text-gray-500 pt-1">
              Manages institutional settings, application roles, and reviews system audit logs.
            </p>
          </div>
        </div>
      </Card>

      {/* Append-Only Audit History Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Append-Only System Audit History
            </h3>
          </div>
          <span className="text-xs text-gray-400">Protected by immutable DB trigger</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">
            No privileged audit events recorded yet. System mutations automatically generate immutable audit entries.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="font-mono text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {log.entity_type}
                  </span>
                  <span className="text-gray-400">by</span>
                  <Badge variant="default" className="text-[10px]">
                    {log.actor_type}
                  </Badge>
                </div>
                <span className="text-gray-400 font-mono">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
export default AdminDashboardPage
