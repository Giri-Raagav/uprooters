import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

/**
 * ProtectedRoute — Authoritative route guard for student-authenticated workspaces (/app/*).
 *
 * Rules:
 *   1. While checking session/profile → renders accessible loading spinner.
 *   2. Unauthenticated user → redirects to /login (preserving intended destination).
 *   3. Authenticated but unprovisioned student → redirects to /onboarding.
 *   4. Authenticated & provisioned student → renders protected content.
 *
 * NOTE: Does NOT rely on visual RoleContext toggles. Relies strictly on Supabase Auth
 * and verified public.students database record.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isStudentProvisioned, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 p-6"
        style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
        role="status"
        aria-label="Checking authentication status"
      >
        <Loader2 className="w-8 h-8 animate-spin text-brand-wine" aria-hidden="true" />
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Verifying student authentication...
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isStudentProvisioned) {
    return <Navigate to="/onboarding" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
