import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Briefcase,
  Target,
  ExternalLink,
  MapPin,
  Calendar,
  Check,
  Search,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { careerService } from '@/services/careerService'
import { studentService } from '@/services/studentService'

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'companies' | 'roles' | 'openings'>('roles')
  const [companies, setCompanies] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [jobOpenings, setJobOpenings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [profile, comps, rls, openings] = await Promise.all([
          studentService.getCurrentProfile(),
          careerService.getCompanies(),
          careerService.getRoles(),
          careerService.getJobOpenings(),
        ])

        if (profile) setCurrentStudentId(profile.id)
        setCompanies(comps)
        setRoles(rls)
        setJobOpenings(openings)
      } catch (err) {
        console.warn('Error loading career discovery data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSetTarget = async (type: 'role' | 'job_opening', id: string, title: string) => {
    if (!currentStudentId) {
      setActionNotice('Please complete student profile login to set career targets.')
      setTimeout(() => setActionNotice(null), 3000)
      return
    }

    try {
      await studentService.addCareerTarget(currentStudentId, type, id, true)
      setActionNotice(`"${title}" set as primary career target!`)
      setTimeout(() => setActionNotice(null), 4000)
    } catch (err) {
      console.error('Failed to set career target', err)
      setActionNotice('Failed to update career target.')
      setTimeout(() => setActionNotice(null), 3000)
    }
  }

  const filteredRoles = roles.filter(
    (r) =>
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCompanies = companies.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOpenings = jobOpenings.filter(
    (jo) =>
      !searchQuery ||
      jo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jo.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      )
    }

    if (activeTab === 'roles') {
      if (filteredRoles.length === 0) {
        return (
          <Card className="p-8 text-center space-y-3" data-testid="roles-empty">
            <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              No career roles found
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Canonical engineering roles will appear here with domain baselines and skill expectations.
            </p>
          </Card>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {role.name}
                  </h3>
                  <Badge variant="default">{role.domain}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {role.description || 'Canonical ECE role defining verified industry expectations.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-gray-500">
                  <span>Degrees: {role.eligible_degrees?.join(', ')}</span>
                  <span>•</span>
                  <span>Branches: {role.eligible_branches?.join(', ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetTarget('role', role.id, role.name)}
                  className="flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" /> Set as Target
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/app/readiness?targetType=role&targetId=${role.id}`)}
                >
                  Evaluate Readiness
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    if (activeTab === 'companies') {
      if (filteredCompanies.length === 0) {
        return (
          <Card className="p-8 text-center space-y-3" data-testid="companies-empty">
            <Building2 className="w-10 h-10 text-gray-400 mx-auto" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              No companies currently listed
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Verified employer profiles are actively curated with official provenance and ATS source links.
            </p>
          </Card>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCompanies.map((comp) => (
            <Card key={comp.id} className="p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {comp.name}
                  </h3>
                  <Badge variant="default">{comp.industry}</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {comp.description || 'Verified organization hiring engineering graduates.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                <span className="text-gray-500">
                  {comp.job_openings?.length || 0} Open Position{comp.job_openings?.length !== 1 ? 's' : ''}
                </span>
                {comp.website && (
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Official Careers Site
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )
    }

    // Openings tab
    if (filteredOpenings.length === 0) {
      return (
        <Card className="p-8 text-center space-y-3" data-testid="openings-empty">
          <Briefcase className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No active job openings published
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            All published vacancies must satisfy source verification and freshness constraints before
            being presented to students.
          </p>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOpenings.map((jo) => (
          <Card key={jo.id} className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {jo.title}
                  </h3>
                  <span className="text-xs font-medium text-gray-500 block">
                    {jo.companies?.name} • {jo.roles?.name}
                  </span>
                </div>
                <Badge variant="success" className="capitalize shrink-0">
                  {jo.work_mode.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                {jo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {jo.location}
                  </span>
                )}
                {jo.closing_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Closes {jo.closing_date}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSetTarget('job_opening', jo.id, jo.title)}
                className="flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" /> Target Opening
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/app/readiness?targetType=job_opening&targetId=${jo.id}`)}
              >
                Evaluate Readiness
              </Button>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in" data-testid="companies-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Career Discovery"
          subtitle="Explore canonical ECE roles, verified companies, and active job openings"
        />

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'companies'
                ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Companies ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('openings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'openings'
                ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Job Openings ({jobOpenings.length})
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {actionNotice}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {renderContent()}
    </div>
  )
}
export default CompaniesPage
