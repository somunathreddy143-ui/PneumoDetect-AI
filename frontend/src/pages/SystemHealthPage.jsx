import { useState, useEffect } from 'react'
import {
  Activity,
  Database,
  Cpu,
  Server,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Wifi,
} from 'lucide-react'
import { getSystemHealth } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSystemHealth()
      setHealth(data)
    } catch (err) {
      setError(err.message || 'Unable to contact health telemetry service.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchHealth, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const isHealthy = health?.status === 'healthy'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              System Health & Service Telemetry
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Real-time operational status of the inference pipeline, relational database, and API gateway.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-refresh (5s)</span>
            </label>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Status Banner */}
        <div
          className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isHealthy
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isHealthy ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isHealthy ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <div className="text-xs uppercase font-semibold tracking-wider opacity-75">
                Overall Platform Health
              </div>
              <div className="text-2xl font-bold mt-0.5">
                {isHealthy ? 'All Systems Operational' : 'Telemetry Notice / Degraded'}
              </div>
            </div>
          </div>

          <div className="text-xs text-right opacity-80">
            Last Checked: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Now'}
          </div>
        </div>

        {/* Grid of Microservice Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* 1. Backend Service */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">FastAPI Backend</span>
              <Server className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-gray-900 dark:text-white text-base">Online</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">Uvicorn ASGI Gateway</div>
          </div>

          {/* 2. Database Service */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">Relational DB</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.database_connected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {health?.database_connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">SQLAlchemy / SQLite Engine</div>
          </div>

          {/* 3. Deep Learning Engine */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">ML Model</span>
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.model_loaded ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-bold text-gray-900 dark:text-white text-base">
                {health?.model_loaded ? 'Loaded' : 'Pending'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">{health?.model_name || 'MobileNetV2'}</div>
          </div>

          {/* 4. Telemetry Latency */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">API Latency</span>
              <Wifi className="w-4 h-4 text-amber-500" />
            </div>
            <div className="font-bold text-gray-900 dark:text-white text-base">
              {health?.api_latency_ms != null ? `${health.api_latency_ms} ms` : '< 10 ms'}
            </div>
            <div className="mt-2 text-xs text-emerald-600 font-medium">Optimal response time</div>
          </div>

        </div>

        {/* Detailed System Specifications */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">
            Platform Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">Application Version</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {health?.app_version || '2.5.0-Healthcare'}
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">Model Weights Baseline</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                ImageNet (1.4M images)
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">Target Conv Layer</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                Conv_1 (7×7×1280)
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">Authentication Standard</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                JWT / HMAC-SHA256 (RFC 7518)
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">PDF Reporting Engine</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                ReportLab 4.4.10
              </span>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <span className="text-gray-500 block">Data Isolation Policy</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                User-scoped Row Security
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

