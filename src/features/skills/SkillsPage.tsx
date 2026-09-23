import React, { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { studentService } from '@/services/studentService'

export const SkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadSkills() {
      try {
        const profile = await studentService.getCurrentProfile()
        if (profile) {
          const studentSkills = await studentService.getSkills(profile.id)
          setSkills(studentSkills)
        }
      } catch (err) {
        console.warn('Error loading student skills', err)
      } finally {
        setLoading(false)
      }
    }
    loadSkills()
  }, [])

  const categories = ['all', ...Array.from(new Set(skills.map((s) => s.skills?.category).filter(Boolean)))]

  const filteredSkills = skills.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.skills?.category === selectedCategory
    const matchesQuery = !searchQuery || s.skills?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesQuery
  })

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="skills-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="skills-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Skills Inventory"
          subtitle="Canonical technical skills grounded in evidence and coursework"
        />
        <div className="flex items-center gap-2">
          <Badge variant="default">{skills.length} Claimed Skills</Badge>
          <Badge variant="success">
            {skills.filter((s) => s.status === 'verified').length} Verified
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <Card className="p-8 text-center space-y-3" data-testid="skills-empty">
          <Tag className="w-10 h-10 text-gray-400 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            No matching skills found
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Technical skills will populate as you complete coursework, link project repositories, or claim
            canonical ECE competencies.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredSkills.map((s) => (
            <Card key={s.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    {s.skills?.name}
                  </h4>
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">
                    {s.skills?.category}
                  </span>
                </div>
                <Badge
                  variant={
                    s.status === 'verified'
                      ? 'success'
                      : s.status === 'supported'
                      ? 'info'
                      : 'default'
                  }
                  className="capitalize"
                >
                  {s.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Proficiency:</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {s.proficiency_level}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
export default SkillsPage
