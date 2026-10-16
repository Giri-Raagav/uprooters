import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderRoutes } from '@/test/test-utils'
import { careerService } from '@/services/careerService'
import { readinessService } from '@/services/readinessService'

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
    getCanonicalSkills: vi.fn().mockResolvedValue([]),
    getProjects: vi.fn().mockResolvedValue([]),
    getCertifications: vi.fn().mockResolvedValue([]),
    getTargets: vi.fn().mockResolvedValue([]),
    getCareerTargets: vi.fn().mockResolvedValue([]),
    getSkillEvidence: vi.fn().mockResolvedValue([]),
    updateProfile: vi.fn().mockResolvedValue(true),
    upsertSkill: vi.fn().mockResolvedValue([]),
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
    evaluateReadiness: vi.fn().mockResolvedValue('mock-eval-id'),
    getEvaluation: vi.fn().mockResolvedValue(null),
    getEvaluationById: vi.fn().mockResolvedValue(null),
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
    const mockRoles = [
      { id: 'role-1', name: 'Embedded Systems Engineer', domain: 'Core Hardware' },
      { id: 'role-2', name: 'Digital Signal Processing Engineer', domain: 'Signal Processing' },
    ]

    const mockOpenings = [
      { id: 'opening-1', title: 'Firmware Engineer Intern', companies: { name: 'Semiconductor Corp' } },
    ]

    const evalRole1 = {
      id: 'eval-role-1',
      student_id: 'mock-student-id',
      target_type: 'role',
      role_id: 'role-1',
      overall_score: 90,
      required_score: 85,
      preferred_score: 95,
      is_eligible: true,
      has_unresolved_blocking: false,
      requirement_count: 4,
      satisfied_count: 4,
      partial_count: 0,
      missing_count: 0,
      unknown_count: 0,
    }

    const evalRole2 = {
      id: 'eval-role-2',
      student_id: 'mock-student-id',
      target_type: 'role',
      role_id: 'role-2',
      overall_score: 65,
      required_score: 80,
      preferred_score: 50,
      is_eligible: false,
      has_unresolved_blocking: true,
      requirement_count: 5,
      satisfied_count: 2,
      partial_count: 1,
      missing_count: 2,
      unknown_count: 0,
    }

    const evalOpening1 = {
      id: 'eval-opening-1',
      student_id: 'mock-student-id',
      target_type: 'job_opening',
      job_opening_id: 'opening-1',
      overall_score: 75,
      required_score: 70,
      preferred_score: 80,
      is_eligible: true,
      has_unresolved_blocking: false,
      requirement_count: 3,
      satisfied_count: 2,
      partial_count: 1,
      missing_count: 0,
      unknown_count: 0,
    }

    const resultsRole1 = [
      {
        id: 'res-r1-1',
        evaluation_id: 'eval-role-1',
        requirement_type: 'skill',
        requirement_scope: 'required',
        result_status: 'met',
        score_contribution: 25,
        is_blocking: false,
        explanation: 'Verified embedded C skills',
        match_type: 'direct',
        evidence_status: 'verified',
        evidence_count: 2,
        verified_evidence_count: 2,
        career_requirements: { title: 'ARM Cortex-M Firmware Development' },
      },
    ]

    const resultsRole2 = [
      {
        id: 'res-r2-1',
        evaluation_id: 'eval-role-2',
        requirement_type: 'skill',
        requirement_scope: 'required',
        result_status: 'not_met',
        score_contribution: 0,
        is_blocking: true,
        explanation: 'Missing MATLAB DSP evidence',
        match_type: 'none',
        evidence_status: 'none',
        evidence_count: 0,
        verified_evidence_count: 0,
        career_requirements: { title: 'Filter Design & MATLAB Simulink' },
      },
    ]

    const resultsOpening1 = [
      {
        id: 'res-op-1',
        evaluation_id: 'eval-opening-1',
        requirement_type: 'skill',
        requirement_scope: 'required',
        result_status: 'met',
        score_contribution: 30,
        is_blocking: false,
        explanation: 'Demonstrated UART/SPI protocols',
        match_type: 'direct',
        evidence_status: 'verified',
        evidence_count: 1,
        verified_evidence_count: 1,
        career_requirements: { title: 'Hardware Bus Protocols (SPI/I2C)' },
      },
    ]

    it('renders readiness engine with target selector, calculation trigger, and disclaimer', async () => {
      renderRoutes(['/app/readiness'])
      await waitFor(() => {
        expect(screen.getByTestId('readiness-content')).toBeInTheDocument()
      })
      expect(screen.getByText(/Career Readiness Engine/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Recalculate Readiness/i })).toBeInTheDocument()
    })

    it('switches between two career roles with different existing evaluations without leaving stale results', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)
      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'role' && targetId === 'role-2') return evalRole2 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          return []
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })
      expect(screen.getByText('ARM Cortex-M Firmware Development')).toBeInTheDocument()

      const targetSelect = screen.getByTestId('target-id-select')
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })
      expect(screen.getByText('Filter Design & MATLAB Simulink')).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
    })

    it('switches from a career role to a job opening cleanly', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)
      vi.mocked(careerService.getJobOpenings).mockResolvedValue(mockOpenings as any)
      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'job_opening' && targetId === 'opening-1') return evalOpening1 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-opening-1') return resultsOpening1 as any
          return []
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })
      expect(screen.getByText('ARM Cortex-M Firmware Development')).toBeInTheDocument()

      const typeSelect = screen.getByTestId('target-type-select')
      fireEvent.change(typeSelect, { target: { value: 'job_opening' } })

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })
      expect(screen.getByText('Hardware Bus Protocols (SPI/I2C)')).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
    })

    it('clears previous evaluation and displays empty state when switching to an unevaluated target', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)
      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          return []
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const targetSelect = screen.getByTestId('target-id-select')
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })

      await waitFor(() => {
        expect(screen.getByTestId('readiness-empty')).toBeInTheDocument()
      })
      expect(screen.getByText(/Ready to evaluate target alignment/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Evaluate Now/i })).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
    })

    it('ignores delayed asynchronous evaluation response for an older target', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let resolveRole1: ((val: any) => void) | null = null
      const role1Promise = new Promise((resolve) => {
        resolveRole1 = resolve
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') {
            return role1Promise as any
          }
          if (targetType === 'role' && targetId === 'role-2') {
            return evalRole2 as any
          }
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          return []
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByTestId('readiness-eval-loading')).toBeInTheDocument()
      })

      const targetSelect = screen.getByTestId('target-id-select')
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })
      expect(screen.getByText('Filter Design & MATLAB Simulink')).toBeInTheDocument()

      await act(async () => {
        resolveRole1!(evalRole1)
        await new Promise((r) => setTimeout(r, 50))
      })
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('Filter Design & MATLAB Simulink')).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
    })

    it('disables selectors during recalculation and prevents stale recalculation results if target changes', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let resolveRecalcRpc: ((val: any) => void) | null = null
      const recalcRpcPromise = new Promise((resolve) => {
        resolveRecalcRpc = resolve
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'role' && targetId === 'role-2') return evalRole2 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          if (evalId === 'recalc-eval-role-1') {
            return [
              {
                ...resultsRole1[0],
                career_requirements: { title: 'Recalculated Role 1 Requirement' },
              },
            ] as any
          }
          return []
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockImplementation(
        async () => {
          await recalcRpcPromise
          return 'recalc-eval-role-1'
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      const typeSelect = screen.getByTestId('target-type-select') as HTMLSelectElement
      const targetSelect = screen.getByTestId('target-id-select') as HTMLSelectElement

      fireEvent.click(recalcButton)

      expect(typeSelect.disabled).toBe(true)
      expect(targetSelect.disabled).toBe(true)
      expect(recalcButton).toBeDisabled()

      fireEvent.change(targetSelect, { target: { value: 'role-2' } })

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })

      await act(async () => {
        resolveRecalcRpc!('recalc-eval-role-1')
        await new Promise((r) => setTimeout(r, 50))
      })

      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('Filter Design & MATLAB Simulink')).toBeInTheDocument()
      expect(screen.queryByText('Recalculated Role 1 Requirement')).not.toBeInTheDocument()
    })

    it('uses the exact evaluation snapshot ID returned by recalculation RPC for both score and requirement results', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      const recalcSnapshotId = 'eval-rpc-snapshot-999'
      const recalcEval = {
        ...evalRole1,
        id: recalcSnapshotId,
        overall_score: 98,
      }
      const recalcResults = [
        {
          ...resultsRole1[0],
          id: 'res-recalc-999',
          evaluation_id: recalcSnapshotId,
          career_requirements: { title: 'Direct Snapshot RPC Match' },
        },
      ]

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === recalcSnapshotId) return recalcResults as any
          return []
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockResolvedValue(recalcSnapshotId)
      vi.mocked(readinessService.getEvaluationById).mockImplementation(
        async (evalId) => {
          if (evalId === recalcSnapshotId) return recalcEval as any
          return null
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })
      expect(screen.getByText('ARM Cortex-M Firmware Development')).toBeInTheDocument()

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      fireEvent.click(recalcButton)

      await waitFor(() => {
        expect(screen.getByText('98%')).toBeInTheDocument()
      })
      expect(screen.getByText('Direct Snapshot RPC Match')).toBeInTheDocument()
      expect(readinessService.getEvaluationById).toHaveBeenCalledWith(recalcSnapshotId)
      expect(readinessService.getRequirementResults).toHaveBeenCalledWith(recalcSnapshotId)
    })

    it('does not display obsolete recalculation errors if the target changed before RPC failure', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let rejectRecalcRpc: ((err: any) => void) | null = null
      const recalcRpcPromise = new Promise((_, reject) => {
        rejectRecalcRpc = reject
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'role' && targetId === 'role-2') return evalRole2 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          return []
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockImplementation(
        async () => {
          await recalcRpcPromise
          return 'unused'
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      const targetSelect = screen.getByTestId('target-id-select') as HTMLSelectElement

      fireEvent.click(recalcButton)
      expect(recalcButton).toBeDisabled()

      // Target switches while recalculation is pending
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })

      // Fail the previous target's recalculation RPC
      await act(async () => {
        rejectRecalcRpc!(new Error('Obsolete calculation timeout'))
        await new Promise((r) => setTimeout(r, 50))
      })

      // Must NOT display the error message on the new target
      expect(screen.queryByText(/Obsolete calculation timeout/i)).not.toBeInTheDocument()
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('Filter Design & MATLAB Simulink')).toBeInTheDocument()
      // Recalculate button is active again and not stuck in evaluating state
      expect(screen.getByRole('button', { name: /Recalculate Readiness/i })).not.toBeDisabled()
    })

    it('handles missing evaluation record after recalculation gracefully without applying requirement results', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      const recalcSnapshotId = 'eval-missing-snapshot-404'

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          return null
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockResolvedValue(recalcSnapshotId)
      vi.mocked(readinessService.getEvaluationById).mockResolvedValue(null)
      vi.mocked(readinessService.getRequirementResults).mockResolvedValue(resultsRole1 as any)

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      fireEvent.click(recalcButton)

      await waitFor(() => {
        expect(screen.getByText(/Unable to retrieve the recalculated evaluation record/i)).toBeInTheDocument()
      })
      expect(screen.getByTestId('readiness-empty')).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
      expect(recalcButton).not.toBeDisabled()
    })

    it('preserves loading state when an older recalculation resolves before a newer recalculation', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let resolveRole1Recalc: ((val: any) => void) | null = null
      const role1RecalcPromise = new Promise((resolve) => {
        resolveRole1Recalc = resolve
      })

      let resolveRole2Recalc: ((val: any) => void) | null = null
      const role2RecalcPromise = new Promise((resolve) => {
        resolveRole2Recalc = resolve
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'role' && targetId === 'role-2') return evalRole2 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          if (evalId === 'recalc-role-1') return [{ ...resultsRole1[0], career_requirements: { title: 'Obsolete Role 1 Results' } }] as any
          if (evalId === 'recalc-role-2') return [{ ...resultsRole2[0], career_requirements: { title: 'Fresh Role 2 Results' } }] as any
          return []
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockImplementation(
        async (_studentId, _targetType, targetId) => {
          if (targetId === 'role-1') {
            await role1RecalcPromise
            return 'recalc-role-1'
          }
          if (targetId === 'role-2') {
            await role2RecalcPromise
            return 'recalc-role-2'
          }
          return 'other'
        }
      )
      vi.mocked(readinessService.getEvaluationById).mockImplementation(
        async (evalId) => {
          if (evalId === 'recalc-role-1') return { ...evalRole1, id: 'recalc-role-1', overall_score: 91 } as any
          if (evalId === 'recalc-role-2') return { ...evalRole2, id: 'recalc-role-2', overall_score: 72 } as any
          return null
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      const targetSelect = screen.getByTestId('target-id-select') as HTMLSelectElement

      // 1. Start recalculation on Role 1
      fireEvent.click(recalcButton)
      expect(recalcButton).toBeDisabled()

      // 2. Switch to Role 2
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })
      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })

      // 3. Start recalculation on Role 2
      fireEvent.click(recalcButton)
      expect(recalcButton).toBeDisabled()

      // 4. Resolve older request (Role 1) FIRST
      await act(async () => {
        resolveRole1Recalc!('recalc-role-1')
        await new Promise((r) => setTimeout(r, 50))
      })

      // Role 2 recalculation MUST still be in progress (evaluating = true, button disabled)
      expect(recalcButton).toBeDisabled()
      expect(screen.queryByText('91%')).not.toBeInTheDocument()
      expect(screen.queryByText('Obsolete Role 1 Results')).not.toBeInTheDocument()

      // 5. Resolve newer request (Role 2)
      await act(async () => {
        resolveRole2Recalc!('recalc-role-2')
        await new Promise((r) => setTimeout(r, 50))
      })

      // Role 2 recalculation completes
      await waitFor(() => {
        expect(screen.getByText('72%')).toBeInTheDocument()
      })
      expect(screen.getByText('Fresh Role 2 Results')).toBeInTheDocument()
      expect(recalcButton).not.toBeDisabled()
    })

    it('does not overwrite current target error or loading state when an obsolete request fails', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let rejectRole1Recalc: ((err: any) => void) | null = null
      const role1RecalcPromise = new Promise((_, reject) => {
        rejectRole1Recalc = reject
      })

      let resolveRole2Recalc: ((val: any) => void) | null = null
      const role2RecalcPromise = new Promise((resolve) => {
        resolveRole2Recalc = resolve
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') return evalRole1 as any
          if (targetType === 'role' && targetId === 'role-2') return evalRole2 as any
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === 'eval-role-2') return resultsRole2 as any
          if (evalId === 'recalc-role-2') return resultsRole2 as any
          return []
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockImplementation(
        async (_studentId, _targetType, targetId) => {
          if (targetId === 'role-1') {
            await role1RecalcPromise
            return 'recalc-role-1'
          }
          if (targetId === 'role-2') {
            await role2RecalcPromise
            return 'recalc-role-2'
          }
          return 'other'
        }
      )
      vi.mocked(readinessService.getEvaluationById).mockImplementation(
        async (evalId) => {
          if (evalId === 'recalc-role-2') return { ...evalRole2, id: 'recalc-role-2', overall_score: 70 } as any
          return null
        }
      )

      renderRoutes(['/app/readiness'])

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })

      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      const targetSelect = screen.getByTestId('target-id-select') as HTMLSelectElement

      // 1. Recalculate Role 1
      fireEvent.click(recalcButton)
      expect(recalcButton).toBeDisabled()

      // 2. Switch to Role 2 and recalculate Role 2
      fireEvent.change(targetSelect, { target: { value: 'role-2' } })
      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument()
      })
      fireEvent.click(recalcButton)
      expect(recalcButton).toBeDisabled()

      // 3. Obsolete request (Role 1) fails
      await act(async () => {
        rejectRole1Recalc!(new Error('Fatal Role 1 Error'))
        await new Promise((r) => setTimeout(r, 50))
      })

      // Error must NOT appear on Role 2, and Role 2 must still be evaluating
      expect(screen.queryByText(/Fatal Role 1 Error/i)).not.toBeInTheDocument()
      expect(recalcButton).toBeDisabled()

      // 4. Newer request (Role 2) finishes successfully
      await act(async () => {
        resolveRole2Recalc!('recalc-role-2')
        await new Promise((r) => setTimeout(r, 50))
      })

      await waitFor(() => {
        expect(screen.getByText('70%')).toBeInTheDocument()
      })
      expect(recalcButton).not.toBeDisabled()
    })

    it('disables recalculation controls while loadingEvaluation is true', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let resolveSavedEval: ((val: any) => void) | null = null
      const savedEvalPromise = new Promise((resolve) => {
        resolveSavedEval = resolve
      })

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') {
            await savedEvalPromise
            return evalRole1 as any
          }
          return null
        }
      )
      vi.mocked(readinessService.getRequirementResults).mockResolvedValue(resultsRole1 as any)

      renderRoutes(['/app/readiness'])

      // While saved evaluation is loading, skeleton is present and recalculate button is disabled
      await waitFor(() => {
        expect(screen.getByTestId('readiness-eval-loading')).toBeInTheDocument()
      })
      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      expect(recalcButton).toBeDisabled()

      // Resolve saved evaluation load
      await act(async () => {
        resolveSavedEval!(evalRole1)
        await new Promise((r) => setTimeout(r, 50))
      })

      await waitFor(() => {
        expect(screen.getByText('90%')).toBeInTheDocument()
      })
      expect(recalcButton).not.toBeDisabled()
    })

    it('invalidates in-flight saved-evaluation load when recalculation starts and preserves recalculated snapshot', async () => {
      vi.mocked(careerService.getRoles).mockResolvedValue(mockRoles as any)

      let resolveSavedEval: ((val: any) => void) | null = null
      const savedEvalPromise = new Promise((resolve) => {
        resolveSavedEval = resolve
      })

      const recalcSnapshotId = 'eval-recalc-race-snapshot'
      const recalcEval = {
        ...evalRole1,
        id: recalcSnapshotId,
        overall_score: 99,
      }
      const recalcResults = [
        {
          ...resultsRole1[0],
          id: 'res-race-99',
          evaluation_id: recalcSnapshotId,
          career_requirements: { title: 'Recalculated Race Snapshot' },
        },
      ]

      vi.mocked(readinessService.getLatestEvaluation).mockImplementation(
        async (_studentId, targetType, targetId) => {
          if (targetType === 'role' && targetId === 'role-1') {
            await savedEvalPromise
            return evalRole1 as any
          }
          return null
        }
      )
      vi.mocked(readinessService.evaluateReadiness).mockResolvedValue(recalcSnapshotId)
      vi.mocked(readinessService.getEvaluationById).mockResolvedValue(recalcEval as any)
      vi.mocked(readinessService.getRequirementResults).mockImplementation(
        async (evalId) => {
          if (evalId === 'eval-role-1') return resultsRole1 as any
          if (evalId === recalcSnapshotId) return recalcResults as any
          return []
        }
      )

      renderRoutes(['/app/readiness'])

      // 1. Saved evaluation load starts and is in flight
      await waitFor(() => {
        expect(screen.getByTestId('readiness-eval-loading')).toBeInTheDocument()
      })
      const recalcButton = screen.getByRole('button', { name: /Recalculate Readiness/i })
      expect(recalcButton).toBeDisabled()

      // 2. Start recalculation for the same target (simulating rapid/concurrent invocation)
      const reactPropsKey = Object.keys(recalcButton).find((k) => k.startsWith('__reactProps'))
      if (reactPropsKey) {
        await act(async () => {
          ;(recalcButton as any)[reactPropsKey].onClick()
        })
      } else {
        fireEvent.click(recalcButton)
      }

      // 3. Recalculation completes first and displays the new snapshot
      await waitFor(() => {
        expect(screen.getByText('99%')).toBeInTheDocument()
      })
      expect(screen.getByText('Recalculated Race Snapshot')).toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()

      // 4. Older saved evaluation finishes afterwards
      await act(async () => {
        resolveSavedEval!(evalRole1)
        await new Promise((r) => setTimeout(r, 50))
      })

      // 5. Recalculated snapshot must remain displayed and NOT be overwritten by the obsolete load
      expect(screen.getByText('99%')).toBeInTheDocument()
      expect(screen.getByText('Recalculated Race Snapshot')).toBeInTheDocument()
      expect(screen.queryByText('90%')).not.toBeInTheDocument()
      expect(screen.queryByText('ARM Cortex-M Firmware Development')).not.toBeInTheDocument()
      expect(recalcButton).not.toBeDisabled()
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
