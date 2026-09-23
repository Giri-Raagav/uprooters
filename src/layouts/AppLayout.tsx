import React, { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Briefcase,
  Compass,
  Building2,
  Lightbulb,
  Menu,
  X,
  BookOpen,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

// Student navigation — spec ref: 02_FRONTEND_SPEC §5, 03_UI_UX_SPEC §10
const studentNavItems = [
  { name: 'Dashboard',        path: '/app',                icon: LayoutDashboard, end: true },
  { name: 'Profile',          path: '/app/profile',        icon: User },
  { name: 'Academics',        path: '/app/academics',      icon: GraduationCap },
  { name: 'Skills',           path: '/app/skills',         icon: Wrench },
  { name: 'Projects',         path: '/app/projects',       icon: FolderGit2 },
  { name: 'Certifications',   path: '/app/certifications', icon: Award },
  { name: 'Experience',       path: '/app/experience',     icon: Briefcase },
  { name: 'Career Readiness', path: '/app/readiness',      icon: Compass },
  { name: 'Companies',        path: '/app/companies',      icon: Building2 },
  { name: 'Recommendations',  path: '/app/recommendations',icon: Lightbulb },
]

// Bottom nav — 5 primary items shown on mobile
const mobileBottomNav = [
  { name: 'Dashboard',  path: '/app',           icon: LayoutDashboard, end: true },
  { name: 'Skills',     path: '/app/skills',    icon: Wrench },
  { name: 'Readiness',  path: '/app/readiness', icon: Compass },
  { name: 'Companies',  path: '/app/companies', icon: Building2 },
  { name: 'More',       path: '/app/recommendations', icon: Lightbulb },
]

/** Current page title derived from path */
const usePageTitle = () => {
  const location = useLocation()
  const item = studentNavItems.find(n =>
    n.end ? location.pathname === n.path : location.pathname.startsWith(n.path)
  )
  return item?.name ?? 'UPROOTERS'
}

// ─── Sidebar Content (shared between desktop and mobile drawer) ───────
interface SidebarContentProps {
  onNavClick?: () => void
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onNavClick }) => (
  <div className="flex flex-col h-full">
    {/* Brand header */}
    <div
      className="h-[60px] flex items-center px-5 gap-3 shrink-0 border-b"
      style={{ borderColor: 'var(--sidebar-border)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0"
        style={{ background: 'var(--brand-wine)', color: 'var(--brand-accent)' }}
        aria-hidden="true"
      >
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div
          className="font-bold text-[15px] tracking-tight leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          UPROOTERS
        </div>
        <div
          className="text-[10px] font-medium tracking-[0.12em] uppercase mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          by Ace&amp;place
        </div>
      </div>
    </div>

    {/* Nav links */}
    <nav
      className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
      role="navigation"
      aria-label="Primary navigation"
    >
      {studentNavItems.map(item => {
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
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)]'
              }`
            }
          >
            <Icon className="sidebar-nav-icon w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{item.name}</span>
          </NavLink>
        )
      })}
    </nav>

    {/* Sidebar footer — theme toggle */}
    <div
      className="px-4 py-4 border-t shrink-0"
      style={{ borderColor: 'var(--sidebar-border)' }}
    >
      <ThemeToggle className="w-full" />
    </div>
  </div>
)

// ─── AppLayout ────────────────────────────────────────────────────────
/**
 * AppLayout — Student application shell.
 *
 * Breakpoints:
 *   lg+ (≥1024px)  Persistent 256px sidebar
 *   <lg (<1024px)  Top header + hamburger + slide-in drawer + mobile bottom nav
 *
 * Spec refs: 02_FRONTEND_SPEC §5, §25, §26 · 03_UI_UX_SPEC §10, §22, §23
 */
export const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pageTitle = usePageTitle()

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Close drawer on resize to desktop
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
      {/* ── Desktop Sidebar (lg+) ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 z-30 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile/Tablet Drawer ──────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={closeDrawer}
          />
          {/* Drawer panel */}
          <aside
            className="relative z-10 flex flex-col w-64 h-full shadow-2xl animate-slide-in-right"
            style={{ background: 'var(--sidebar-bg)' }}
          >
            {/* Close button */}
            <button
              onClick={closeDrawer}
              className="absolute top-3 right-3 p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-wine focus-visible:outline-none"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            <SidebarContent onNavClick={closeDrawer} />
          </aside>
        </div>
      )}

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="lg:ml-64 flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Mobile/Tablet top header */}
        <header
          className="lg:hidden h-14 flex items-center justify-between px-4 border-b sticky top-0 z-40"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              id="mobile-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-wine focus-visible:outline-none"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-wine)', color: 'var(--brand-accent)' }}
                aria-hidden="true"
              >
                <BookOpen className="w-3 h-3" />
              </div>
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {pageTitle}
              </span>
            </div>
          </div>
          <ThemeToggle size="sm" />
        </header>

        {/* Page content */}
        <main className="flex-1 animate-fade-in pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom navigation */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 h-[60px] border-t z-40 flex items-center justify-around px-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          role="navigation"
          aria-label="Mobile primary navigation"
        >
          {mobileBottomNav.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-0 transition-colors ${
                    isActive
                      ? 'text-brand-wine'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
