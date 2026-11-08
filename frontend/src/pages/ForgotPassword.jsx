import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Mail, ArrowLeft, CheckCircle2, AlertCircle, Key } from 'lucide-react'
import { forgotPassword } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [devToken, setDevToken] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await forgotPassword(email)
      setSubmitted(true)
      if (res.token_for_dev) {
        setDevToken(res.token_for_dev)
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 mb-4">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Instructions Dispatched</span>
              </div>
              <p>
                If <strong>{email}</strong> is registered, password recovery instructions have been initiated.
              </p>
            </div>

            {devToken && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-blue-800 dark:text-blue-300">
                  Development Mode Reset Token:
                </div>
                <code className="block p-2 bg-white dark:bg-gray-800 border rounded font-mono text-[11px] break-all select-all">
                  {devToken}
                </code>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="inline-block mt-1 font-semibold text-blue-600 dark:text-blue-400 underline"
                >
                  Click here to complete password reset &rarr;
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="physician@hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 text-sm font-semibold shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Dispatching...' : 'Send Recovery Token'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}

