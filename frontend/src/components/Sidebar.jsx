import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  Upload,
  Clock,
  FileText,
  BarChart3,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/login')
  }

  const navSections = [
    {
      title: 'MAIN MENU',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Analyze X-ray',
          path: '/upload',
          icon: Upload,
        },
        {
          name: 'Scan History',
          path: '/history',
          icon: Clock,
        },
        {
          name: 'Reports',
          path: '/reports',
          icon: FileText,
        },
      ],
    },
    {
      title: 'AI & ANALYTICS',
      items: [
        {
          name: 'Model Performance',
          path: '/performance',
          icon: BarChart3,
        },
        {
          name: 'System Health',
          path: '/health',
          icon: ShieldCheck,
        },
        {
          name: 'Grok AI Assistant',
          path: '/grok-assistant',
          icon: Sparkles,
          badge: 'xAI',
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          name: 'User Profile',
          path: '/profile',
          icon: UserIcon,
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Settings,
        },
      ],
    },
  ]

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B132B] dark:bg-[#070D1E] text-slate-300 border-r border-slate-800/80 shadow-2xl transition-all duration-300 ease-in-out ${
          /* Mobile slide-in behavior */
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } lg:translate-x-0 ${
          /* Desktop collapsed / expanded widths */
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        }`}
      >
        {/* Top Branding & Collapse Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <NavLink
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>

            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                  PneumoDetect<span className="text-blue-400"> AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase truncate">
                  Clinical Radiography
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* Section Header (hidden in collapsed mode) */}
              {(!isCollapsed || mobileOpen) && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {section.title}
                </div>
              )}

              {/* Items */}
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/grok-assistant' && location.pathname === '/grok')

                return (
                  <div key={item.name} className="relative group">
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      } ${isCollapsed && !mobileOpen ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`} />

                      {(!isCollapsed || mobileOpen) && (
                        <div className="flex-1 flex items-center justify-between truncate">
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && !mobileOpen && (
                      <div className="fixed hidden group-hover:flex items-center left-[82px] px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-lg shadow-xl z-[60] whitespace-nowrap pointer-events-none transition-opacity">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-1.5 text-[9px] font-extrabold px-1 py-0.2 rounded bg-purple-500/30 text-purple-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Logout Action in Account Section */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="relative group">
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors ${
                  isCollapsed && !mobileOpen ? 'justify-center px-0' : ''
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0 text-red-400 group-hover:scale-110 transition-transform" />
                {(!isCollapsed || mobileOpen) && <span>Logout</span>}
              </button>

              {/* Tooltip for collapsed Logout */}
              {isCollapsed && !mobileOpen && (
                <div className="fixed hidden group-hover:flex items-center left-[82px] px-2.5 py-1.5 bg-slate-900 border border-red-900/60 text-red-300 text-xs font-medium rounded-lg shadow-xl z-[60] whitespace-nowrap pointer-events-none">
                  Sign Out
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Card in Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl transition ${
              isCollapsed && !mobileOpen ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(user?.full_name)}
            </div>

            {(!isCollapsed || mobileOpen) && (
              <div className="min-w-0 flex-1 truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.full_name || 'Physician'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'user@hospital.org'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

