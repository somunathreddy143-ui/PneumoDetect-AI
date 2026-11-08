import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Activity,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserDropdown(false)
    setMobileOpen(false)
    await logout()
    navigate('/login')
  }

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
    <nav className="sticky top-0 z-50 bg-white/85 dark:bg-gray-900/85 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-800/60 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PneumoDetect AI
            </span>
          </Link>

          {/* Public Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/explainable-ai"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`
              }
            >
              Explainable AI
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`
              }
            >
              About
            </NavLink>
          </div>

          {/* Right Controls: Theme Toggle & Auth Buttons */}
          <div className="flex items-center gap-3">
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

            {isAuthenticated ? (
              /* If Authenticated: Direct link to Dashboard + Profile Dropdown */
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Open Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {getInitials(user?.full_name)}
                    </div>
                  </button>

                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {user?.full_name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </Link>

                      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Public Auth Buttons */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Public Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-2 pb-4 space-y-1.5 text-xs">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 font-semibold"
          >
            Home
          </Link>
          <Link
            to="/explainable-ai"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 font-semibold"
          >
            Explainable AI
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 font-semibold"
          >
            About
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-2" />

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-center"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-red-600 font-semibold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-center rounded-xl bg-blue-600 text-white font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
