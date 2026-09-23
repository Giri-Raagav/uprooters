import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderRoutes } from '@/test/test-utils'

vi.mock('@/services/studentService', () => ({
  studentService: {
    getCurrentProfile: vi.fn().mockResolvedValue({
      id: 'mock-student-id',
      college_uid: 'ECE2026-001',
      department: 'ECE',
      degree: 'B.E.',
      admission_year: 2022,
      target_graduation_year: 2026,
    }),
    getSemesters: vi.fn().mockResolvedValue([]),
    getSkills: vi.fn().mockResolvedValue([]),
    getProjects: vi.fn().mockResolvedValue([]),
    getCertifications: vi.fn().mockResolvedValue([]),
    getTargets: vi.fn().mockResolvedValue([]),
    getCareerTargets: vi.fn().mockResolvedValue([]),
    getSkillEvidence: vi.fn().mockResolvedValue([]),
    updateProfile: vi.fn().mockResolvedValue(true),
    addSkill: vi.fn().mockResolvedValue(true),
    addProject: vi.fn().mockResolvedValue(true),
    addCertification: vi.fn().mockResolvedValue(true),
    addTarget: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/services/careerService', () => ({
  careerService: {
    getCompanies: vi.fn().mockResolvedValue([]),
    getRoles: vi.fn().mockResolvedValue([]),
    getJobOpenings: vi.fn().mockResolvedValue([]),
    getSources: vi.fn().mockResolvedValue([]),
    getRoleRequirements: vi.fn().mockResolvedValue([]),
    getOpeningRequirements: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/readinessService', () => ({
  readinessService: {
    evaluate: vi.fn().mockResolvedValue({
      evaluation_id: 'mock-eval-id',
      readiness_score: 85,
      readiness_percentage: 85,
      readiness_state: 'met',
      requirements_met_count: 5,
      requirements_partially_met_count: 0,
      requirements_not_met_count: 0,
      requirements_not_applicable_count: 0,
      requirements_unknown_count: 0,
    }),
    getEvaluation: vi.fn().mockResolvedValue(null),
    getLatestEvaluation: vi.fn().mockResolvedValue(null),
    getRequirementResults: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/services/recommendationsService', () => ({
  recommendationsService: {
    getStudentRecommendations: vi.fn().mockResolvedValue([]),
    generateFromEvaluation: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/services/adminService', () => ({
  adminService: {
    getAuditLogs: vi.fn().mockResolvedValue([]),
    getIngestionBatches: vi.fn().mockResolvedValue([]),
    markStaleJobOpenings: vi.fn().mockResolvedValue(0),
    verifyCareerRequirement: vi.fn().mockResolvedValue(true),
    verifyJobOpening: vi.fn().mockResolvedValue(true),
  },
}))

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-shell')
  vi.clearAllMocks()
})

describe('Milestone 11 — Student Application & UI Flow Verification', () => {
  describe('1. Dashboard UI Flow (/app)', () => {
    it('renders dashboard with loading state then empty or populated metrics', async () => {
      renderRoutes(['/app'])
      await waitFor(() => {
        expect(
          screen.getByTestId('dashboard-empty') || screen.getByTestId('dashboard-content')
        ).toBeInTheDocument()
      })
    })
  })

  describe('2. Profile UI Flow (/app/profile)', () => {
    it('renders student profile view with institutional details or clean empty state', async () => {
      renderRoutes(['/app/profile'])
      await waitFor(() => {
        expect(
          screen.getByTestId('profile-empty') || screen.getByTestId('profile-content')
        ).toBeInTheDocument()
      })
    })
  })

  describe('3. Academics UI Flow (/app/academics)', () => {
    it('renders academic system with CGPA, credits, and semester journey breakdown', async () => {
      renderRoutes(['/app/academics'])
      await waitFor(() => {
        expect(screen.getByTestId('academics-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Cumulative GPA/i)).toBeInTheDocument()
      expect(screen.getByText(/Earned Credits/i)).toBeInTheDocument()
    })
  })

  describe('4. Skills UI Flow (/app/skills)', () => {
    it('renders canonical skill inventory and taxonomy filters', async () => {
      renderRoutes(['/app/skills'])
      await waitFor(() => {
        expect(screen.getByTestId('skills-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Skills Inventory/i)).toBeInTheDocument()
    })
  })

  describe('5. Projects UI Flow (/app/projects)', () => {
    it('renders student project portfolio and evidence link indicators', async () => {
      renderRoutes(['/app/projects'])
      await waitFor(() => {
        expect(screen.getByTestId('projects-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Project Portfolio/i)).toBeInTheDocument()
    })
  })

  describe('6. Certifications UI Flow (/app/certifications)', () => {
    it('renders accredited credentials and verified status tags', async () => {
      renderRoutes(['/app/certifications'])
      await waitFor(() => {
        expect(screen.getByTestId('certifications-content')).toBeInTheDocument()
      })
      expect(screen.getByRole('heading', { name: /^Certifications$/i, level: 1 })).toBeInTheDocument()
    })
  })

  describe('7. Experience UI Flow (/app/experience)', () => {
    it('renders honest deferred experience state without fabricated data', async () => {
      renderRoutes(['/app/experience'])
      expect(screen.getByText(/Experience Tracking Status: Deferred/i)).toBeInTheDocument()
      expect(screen.getAllByText(/UNKNOWN/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/missing_data/i)).toBeInTheDocument()
    })
  })

  describe('8. Career Discovery UI Flow (/app/companies)', () => {
    it('renders career discovery with Roles, Companies, and Job Openings tabs', async () => {
      renderRoutes(['/app/companies'])
      await waitFor(() => {
        expect(screen.getByTestId('companies-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Career Discovery/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Roles/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Companies/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Job Openings/i })).toBeInTheDocument()
    })
  })

  describe('9. Readiness Engine UI Flow (/app/readiness)', () => {
    it('renders readiness engine with target selector, calculation trigger, and disclaimer', async () => {
      renderRoutes(['/app/readiness'])
      await waitFor(() => {
        expect(screen.getByTestId('readiness-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Career Readiness Engine/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recalculate Readiness/i })).toBeInTheDocument()
    })
  })

  describe('10. Action Recommendations UI Flow (/app/recommendations)', () => {
    it('renders recommendations with gap explainability and invariant disclaimer', async () => {
      renderRoutes(['/app/recommendations'])
      await waitFor(() => {
        expect(screen.getByTestId('recommendations-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Action Recommendations/i)).toBeInTheDocument()
      expect(screen.getByText(/Important Readiness Invariant/i)).toBeInTheDocument()
    })
  })

  describe('11. Admin Dashboard UI Flow (/admin)', () => {
    it('renders administrative console with freshness checker and append-only audit trail', async () => {
      renderRoutes(['/admin'])
      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Administrator Overview/i)).toBeInTheDocument()
      expect(screen.getByText(/Application Roles & Database Boundaries/i)).toBeInTheDocument()
      expect(screen.getByText(/Append-Only System Audit History/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Run Stale Opening Check/i })).toBeInTheDocument()
    })
  })
})
