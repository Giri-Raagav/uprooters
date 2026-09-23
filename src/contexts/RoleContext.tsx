import React, { createContext, useContext, useState } from 'react'

export type UIRole = 'student' | 'admin' | null

interface RoleContextValue {
  role: UIRole
  setRole: (role: UIRole) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

/**
 * RoleProvider — UI-only role selection context for UPROOTERS.
 *
 * IMPORTANT: This context holds the user's selected interface role for
 * visual routing and shell selection ONLY. It is NOT an authentication
 * or authorization mechanism. Real authentication and role enforcement
 * will be implemented in a later milestone using Supabase Auth and
 * PostgreSQL Row-Level Security. Do not use this for access control.
 *
 * State is in-memory only — not persisted, no Supabase calls.
 */
export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UIRole>(null)

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = (): RoleContextValue => {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
