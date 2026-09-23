import React, { useEffect, useState } from 'react'
import { User, Building, BookOpen, Calendar, Edit3, Check, X, Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { studentService } from '@/services/studentService'
import type { StudentProfileViewRow } from '@/types/database.types'

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfileViewRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await studentService.getCurrentProfile()
        if (data) {
          setProfile(data)
          setFormData({
            bio: data.bio || '',
            location: data.location || '',
            github_url: data.github_url || '',
            linkedin_url: data.linkedin_url || '',
            portfolio_url: data.portfolio_url || '',
          })
        }
      } catch (err) {
        console.warn('Error loading student profile', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      await studentService.updateProfile(profile.id, {
        bio: formData.bio || null,
        location: formData.location || null,
        github_url: formData.github_url || null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
      })
      setProfile({
        ...profile,
        bio: formData.bio || null,
        location: formData.location || null,
        github_url: formData.github_url || null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
      })
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update profile', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse" data-testid="profile-loading">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="profile-empty">
        <PageHeader
          title="Profile"
          subtitle="Your personal and academic identity in UPROOTERS"
        />
        <Card className="p-8 text-center space-y-3">
          <User className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            No active student profile connected
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Please log in with your institutional credentials or complete signup to access your student profile.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in" data-testid="profile-content">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Profile"
          subtitle="Your verified institutional and academic identity"
        />
        {!isEditing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Profile updated successfully.
        </div>
      )}

      {/* Main Profile Header Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
              {profile.first_name ? profile.first_name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.display_name}
                </h2>
                <Badge variant="success" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified Student
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {profile.degree} in {profile.branch} • Batch {profile.admission_year}–{profile.expected_graduation_year}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Profile Completeness
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${profile.profile_completion_percentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {profile.profile_completion_percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Academic Details (Protected/Institutional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" /> Institution
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.college_name}
            </p>
            <p className="text-xs text-gray-500">
              {profile.college_city}, {profile.college_state}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> Department
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.department_name || profile.branch}
            </p>
            <p className="text-xs text-gray-500">
              Current Semester {profile.current_semester}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Graduation Year
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {profile.expected_graduation_year}
            </p>
            <p className="text-xs text-gray-500">
              Admitted {profile.admission_year}
            </p>
          </div>
        </div>

        {/* Editable Student Details */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Bio & Technical Aspirations
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="E.g., ECE student specializing in Embedded C, RTOS, and FPGA systems..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Location (City)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Chennai, India"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Portfolio / Project Site URL
                </label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              About
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {profile.bio || 'No bio provided yet. Click "Edit Profile" to add your technical focus and goals.'}
            </p>
            {profile.github_url && (
              <div className="text-xs text-primary pt-1">
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="hover:underline">
                  GitHub Profile ↗
                </a>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
export default ProfilePage
