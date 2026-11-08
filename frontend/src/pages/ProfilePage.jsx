import { useState, useEffect } from 'react'
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Key,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Activity,
  FileDown,
  UploadCloud,
  Lock,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword, getUserActivities } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusMsg, setStatusMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  // User Activity Timeline State
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [activityError, setActivityError] = useState(null)

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true)
      setActivityError(null)
      const res = await getUserActivities(1, 20)
      setActivities(res.items || [])
    } catch (err) {
      setActivityError(err.message || 'Unable to load activity logs.')
    } finally {
      setLoadingActivities(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setStatusMsg(null)
    setErrorMsg(null)

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setStatusMsg('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      // Refresh activities to show PASSWORD_CHANGED log
      fetchActivities()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Verify current password.')
    } finally {
      setLoading(false)
    }
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

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { label: 'Login', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 }
      case 'LOGIN_FAILED':
        return { label: 'Failed Login', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300', icon: AlertCircle }
      case 'LOGOUT':
        return { label: 'Sign Out', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: LogOut }
      case 'XRAY_UPLOAD':
        return { label: 'Upload', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300', icon: UploadCloud }
      case 'PREDICTION_GENERATED':
        return { label: 'Inference', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', icon: Activity }
      case 'REPORT_DOWNLOADED':
      case 'REPORT_GENERATED':
        return { label: 'Report PDF', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', icon: FileDown }
      case 'PASSWORD_CHANGED':
        return { label: 'Security', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: Lock }
      default:
        return { label: action, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Clock }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
              {getInitials(user?.full_name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.full_name || 'Healthcare Researcher'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Active Account
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                {user?.email}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Account registered:{' '}
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-800 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Change Password Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Security Credentials & Password
            </h2>
          </div>

          {statusMsg && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Section: User Activity Audit Trail Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  User Activity Audit Trail & Timeline
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Private chronological activity history strictly isolated to your user account.
                </p>
              </div>
            </div>

            <button
              onClick={fetchActivities}
              disabled={loadingActivities}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingActivities ? 'animate-spin' : ''}`} />
              Refresh Log
            </button>
          </div>

          {loadingActivities ? (
            <div className="p-8 text-center">
              <LoadingSpinner text="Loading your audit timeline..." />
            </div>
          ) : activityError ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{activityError}</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No activity logged yet for this account session.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
              {activities.map((act) => {
                const badge = getActionBadge(act.action)
                const BadgeIcon = badge.icon
                return (
                  <div key={act.id} className="relative flex items-start gap-4 text-xs">
                    <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    </div>

                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {act.description}
                          </span>
                        </div>
                        {act.ip_address && (
                          <div className="text-[10px] text-gray-400">
                            Client IP: {act.ip_address}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-400 font-mono shrink-0">
                        {act.created_at ? new Date(act.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
