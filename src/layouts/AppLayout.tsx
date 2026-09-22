import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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
  ShieldCheck,
} from 'lucide-react'

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Academics', path: '/academics', icon: GraduationCap },
  { name: 'Skills', path: '/skills', icon: Wrench },
  { name: 'Projects', path: '/projects', icon: FolderGit2 },
  { name: 'Certifications', path: '/certifications', icon: Award },
  { name: 'Experience', path: '/experience', icon: Briefcase },
  { name: 'Career Readiness', path: '/readiness', icon: Compass },
  { name: 'Companies', path: '/companies', icon: Building2 },
  { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
]

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-slate-200">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-wine flex items-center justify-center text-brand-accent font-bold text-base shadow-sm">
            U
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-base leading-none">UPROOTERS</div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">Career Readiness</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-wine text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Foundation Status Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-brand-emerald font-medium bg-brand-emerald-soft p-2.5 rounded-lg border border-brand-emerald/10">
            <ShieldCheck className="w-4 h-4 text-brand-emerald shrink-0" />
            <span>Milestone 01 Foundation</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-16 flex items-center justify-between px-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-wine flex items-center justify-center text-brand-accent font-bold text-sm">
              U
            </div>
            <span className="font-bold text-slate-900 text-sm">UPROOTERS</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-white border-b border-slate-200 px-3 py-3 space-y-1 shadow-md">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-wine text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              )
            })}
          </nav>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
