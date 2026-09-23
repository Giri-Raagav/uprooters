import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Database,
  ShieldCheck,
  Settings,
  Menu,
  X,
  BookOpen,
  ArrowLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Admin navigation stubs — visual placeholder only, no business logic
const adminNavItems = [
  { name: 'Overview',         path: '/admin',               icon: LayoutDashboard, end: true },
  { name: 'Data Management',  path: '/admin/data',          icon: Database },
  { name: 'Verification',     path: '/admin/verification',  icon: ShieldCheck },
  { name: 'Settings',         path: '/admin/settings',      icon: Settings },
]

const useAdminPageTitle = () => {
  const location = useLocation()
  const item = adminNavItems.find(n =>
    n.end ? location.pathname === n.path : location.pathname.startsWith(n.path)
  )
  return item?.name ?? 'Admin'
}

// ─── Admin Sidebar Content ────────────────────────────────────────────
interface AdminSidebarContentProps {
  onNavClick?: () => void
}

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ onNavClick }) => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-full">
      {/* Brand header — admin palette */}
      <div
        className="h-[60px] flex items-center px-5 gap-3 shrink-0 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 bg-white/15"
          aria-hidden="true"
        >
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[15px] tracking-tight leading-none text-white">
            UPROOTERS
          </div>
          <div className="text-[10px] font-semibold tracking-[0.15em] uppercase mt-0.5 text-white/50">
            Administrator
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        role="navigation"
        aria-label="Administrator navigation"
      >
        {adminNavItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavClick}
              className={({ isActive }) =>
                `sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full ${
                  isActive
                    ? 'bg-[var(--sidebar-active-bg)] text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-[var(--sidebar-item-hover)]'
                }`
              }
            >
              <Icon className="sidebar-nav-icon w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t shrink-0 space-y-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none rounded px-1"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          Back to role selector
        </button>
        <ThemeToggle className="w-full" variant="admin" />
      </div>
    </div>
  )
}

// ─── AdminLayout ──────────────────────────────────────────────────────
/**
 * AdminLayout — Administrator visual shell (Milestone 02 stub).
 *
 * Visual distinction: deep emerald sidebar palette (brand-emerald).
 * Structural layout identical to AppLayout.
 * Contains ONLY visual navigation foundation — no admin business logic,
 * no database access, no authentication, no authorization.
 *
 * Spec ref: 03_UI_UX_SPEC §9 (Administrator Theme)
 */
export const AdminLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pageTitle = useAdminPageTitle()

  useEffect(() => {
    // Apply admin shell attribute for CSS variable override
    document.documentElement.setAttribute('data-shell', 'admin')
    return () => document.documentElement.removeAttribute('data-shell')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 z-30 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
        <AdminSidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Admin navigation menu">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={closeDrawer}
          />
          <aside
            className="relative z-10 flex flex-col w-64 h-full shadow-2xl animate-slide-in-right"
            style={{ background: 'var(--sidebar-bg)' }}
          >
            <button
              onClick={closeDrawer}
              className="absolute top-3 right-3 p-2 rounded-lg text-white/50 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            <AdminSidebarContent onNavClick={closeDrawer} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Mobile header */}
        <header
          className="lg:hidden h-14 flex items-center justify-between px-4 border-b sticky top-0 z-40"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:outline-none"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {pageTitle}
            </span>
          </div>
          <ThemeToggle size="sm" />
        </header>

        <main className="flex-1 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
