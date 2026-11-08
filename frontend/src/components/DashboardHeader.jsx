import { useState, useRef, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function DashboardHeader({
  isCollapsed,
  setIsCollapsed,
  setMobileOpen,
}) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  const getPageMeta = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return { title: 'Dashboard Overview', breadcrumb: 'Platform / Overview' }
      case '/upload':
        return { title: 'Analyze Chest X-ray', breadcrumb: 'Deep Learning / Single & Batch Upload' }
      case '/results':
        return { title: 'AI Inference Outcome', breadcrumb: 'Decision Support / Grad-CAM Results' }
      case '/history':
        return { title: 'Scan History Archive', breadcrumb: 'Audit Trail / Radiograph Logs' }
      case '/reports':
        return { title: 'Medical PDF Reports', breadcrumb: 'Clinical Records / AI Summaries' }
      case '/performance':
        return { title: 'Model Performance & Comparison', breadcrumb: 'Evaluation / MobileNetV2 vs EfficientNetB0' }
      case '/health':
        return { title: 'System Health & Hardware Telemetry', breadcrumb: 'Architecture / Service Status' }
      case '/grok':
      case '/grok-assistant':
        return { title: 'Grok AI Assistant', breadcrumb: 'xAI API / Multi-Lingual Decision Support' }
      case '/profile':
        return { title: 'User Profile', breadcrumb: 'Account / Clinical Credentials' }
      case '/settings':
        return { title: 'Settings', breadcrumb: 'Account / Platform Preferences' }
      default:
        return { title: 'Clinical Decision Support', breadcrumb: 'PneumoDetect AI' }
    }
  }

  const meta = getPageMeta(location.pathname)

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
    <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left: Mobile Drawer Trigger, Desktop Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Page Titles & Breadcrumb */}
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:block">
            {meta.breadcrumb}
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right Controls: Model Pill, Theme Toggle, Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Active Model Status Indicator Pill */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MobileNetV2 Online</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {getInitials(user?.full_name)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight max-w-[120px] truncate">
                {user?.full_name || 'Physician'}
              </span>
              <span className="text-[10px] text-gray-400 truncate">
                Doctor
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 text-xs">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="font-bold text-gray-900 dark:text-white truncate">
                  {user?.full_name || 'Physician'}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {user?.email || 'user@hospital.org'}
                </p>
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <UserIcon className="w-4 h-4 text-gray-400" />
                User Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </Link>

              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

