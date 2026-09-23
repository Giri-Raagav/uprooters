import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import { studentService } from '@/services/studentService'
import type {
  StudentProfileViewRow,
  ApplicationRole,
} from '@/types/database.types'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  student: StudentProfileViewRow | null
  roles: ApplicationRole[]
  isStudentProvisioned: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface AuthProviderProps {
  children: React.ReactNode
  initialUser?: User | null
  initialSession?: Session | null
  initialStudent?: StudentProfileViewRow | null
  initialRoles?: ApplicationRole[]
  initialLoading?: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider — Authoritative Supabase authentication and student provisioning context.
 *
 * Responsibilities:
 * - Subscribes to auth state changes.
 * - Tracks user identity and session.
 * - Resolves student profile and application roles.
 * - Enforces correct profile state for protected route gating.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialUser,
  initialSession,
  initialStudent,
  initialRoles,
  initialLoading,
}) => {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [student, setStudent] = useState<StudentProfileViewRow | null>(initialStudent ?? null)
  const [roles, setRoles] = useState<ApplicationRole[]>(initialRoles ?? [])
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading ?? (initialUser === undefined))

  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setStudent(null)
      setRoles([])
      return
    }

    try {
      // 1. Fetch user roles under RLS (user_roles_select_own)
      const userRoles = await authService.getUserRoles(currentUser.id)
      setRoles(userRoles)

      // 2. Fetch student profile under RLS (students_select_own_or_admin)
      const profile = await studentService.getCurrentProfile()
      setStudent(profile)
    } catch (err) {
      console.warn('AuthProvider.loadUserData error:', err)
      setStudent(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    await loadUserData(user)
    setIsLoading(false)
  }, [user, loadUserData])

  useEffect(() => {
    // If initialUser was explicitly provided (e.g. testing), bypass Supabase network boot
    if (initialUser !== undefined) {
      return
    }

    let isMounted = true

    // 1. Check existing session on boot
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return
      if (error) {
        console.warn('AuthProvider: getSession error', error)
      }
      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        loadUserData(initialSession.user).finally(() => {
          if (isMounted) setIsLoading(false)
        })
      } else {
        setIsLoading(false)
      }
    })

    // 2. Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await loadUserData(newSession.user)
      } else {
        setStudent(null)
        setRoles([])
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
    } finally {
      setUser(null)
      setSession(null)
      setStudent(null)
      setRoles([])
      setIsLoading(false)
    }
  }, [])

  const isStudentProvisioned = Boolean(student?.id)

  const value: AuthContextValue = {
    user,
    session,
    student,
    roles,
    isStudentProvisioned,
    isLoading,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
