import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AcademicsPage } from '@/features/academics/AcademicsPage'
import { SkillsPage } from '@/features/skills/SkillsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { CertificationsPage } from '@/features/certifications/CertificationsPage'
import { ExperiencePage } from '@/features/experience/ExperiencePage'
import { ReadinessPage } from '@/features/readiness/ReadinessPage'
import { CompaniesPage } from '@/features/companies/CompaniesPage'
import { RecommendationsPage } from '@/features/recommendations/RecommendationsPage'
import { Navigate } from 'react-router-dom'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'academics', element: <AcademicsPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'certifications', element: <CertificationsPage /> },
      { path: 'experience', element: <ExperiencePage /> },
      { path: 'readiness', element: <ReadinessPage /> },
      { path: 'companies', element: <CompaniesPage /> },
      { path: 'recommendations', element: <RecommendationsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
