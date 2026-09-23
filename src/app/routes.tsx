import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

// Layouts
import { AppLayout } from '@/layouts/AppLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Landing & Auth
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Student feature pages
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

// Admin pages (visual stubs only — no business logic)
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { AdminSectionPlaceholderPage } from '@/features/admin/AdminSectionPlaceholderPage'
import { Database, ShieldCheck, Settings } from 'lucide-react'

/**
 * Application route configuration for UPROOTERS.
 *
 * Route structure:
 *   /           → Ace&place landing + role selector
 *   /login      → Supabase Auth sign-in
 *   /signup     → Supabase Auth registration
 *   /onboarding → Student profile initialization (complete_student_onboarding RPC)
 *   /app/*      → Protected student shell (AppLayout guarded by ProtectedRoute)
 *   /admin/*    → Administrator shell stub (AdminLayout)
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'profile',          element: <ProfilePage /> },
      { path: 'academics',        element: <AcademicsPage /> },
      { path: 'skills',           element: <SkillsPage /> },
      { path: 'projects',         element: <ProjectsPage /> },
      { path: 'certifications',   element: <CertificationsPage /> },
      { path: 'experience',       element: <ExperiencePage /> },
      { path: 'readiness',        element: <ReadinessPage /> },
      { path: 'companies',        element: <CompaniesPage /> },
      { path: 'recommendations',  element: <RecommendationsPage /> },
      { path: '*', element: <Navigate to="/app" replace /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      {
        path: 'data',
        element: (
          <AdminSectionPlaceholderPage
            title="Data Management"
            subtitle="Career data preparation and maintenance"
            icon={Database}
          />
        ),
      },
      {
        path: 'verification',
        element: (
          <AdminSectionPlaceholderPage
            title="Verification"
            subtitle="Review sources and career requirement evidence"
            icon={ShieldCheck}
          />
        ),
      },
      {
        path: 'settings',
        element: (
          <AdminSectionPlaceholderPage
            title="Settings"
            subtitle="System configuration and administration"
            icon={Settings}
          />
        ),
      },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
  // Catch-all: redirect unknown paths to landing
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]
