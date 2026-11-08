import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload,
  Clock,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  Cpu,
  ArrowRight,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, downloadReportBlob } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getDashboardStats()
        setStats(data)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard analytics.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleDownloadPdf = async (id, prediction) => {
    try {
      setDownloadingId(id)
      const blob = await downloadReportBlob(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `PneumoDetect_Report_${prediction}_${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download PDF report.')
    } finally {
      setDownloadingId(null)
    }
  }

  const pieData = [
    { name: 'Normal', value: stats?.normal_scans || 0, color: '#10B981' },
    { name: 'Pneumonia', value: stats?.pneumonia_scans || 0, color: '#EF4444' },
  ]
  const hasPieData = (stats?.total_scans || 0) > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Pneumonia Analysis Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome, {user?.full_name || 'Physician'}
            </h1>
            <p className="text-blue-100 text-sm max-w-xl">
              Real-time deep learning radiograph inference paired with Explainable AI (Grad-CAM) gradient visualizations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm rounded-xl shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              Analyze Radiograph
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/30 backdrop-blur-sm transition"
            >
              <Clock className="w-4 h-4" />
              Scan History
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Scans */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Your Total Scans
              </span>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                {loading ? '...' : stats?.total_scans ?? 0}
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 inline-block font-medium">
                Session telemetry
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Normal Predictions */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Normal Scans
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {loading ? '...' : stats?.normal_scans ?? 0}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 mt-1 inline-block font-medium">
                No infiltrates detected
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Pneumonia Predictions */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pneumonia Scans
              </span>
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                {loading ? '...' : stats?.pneumonia_scans ?? 0}
              </div>
              <span className="text-xs text-red-600 dark:text-red-500 mt-1 inline-block font-medium">
                Opacities identified
              </span>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Model Accuracy */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Model Test Accuracy
              </span>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                92.5%
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 mt-1 inline-block font-medium">
                ROC-AUC: 0.97
              </span>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Distribution Pie */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
              Prediction Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-4">Ratio of Normal vs Pneumonia scans</p>

            <div className="flex-1 flex items-center justify-center min-h-[220px]">
              {hasPieData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Perform scans to populate classification distribution.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Weekly Activity Timeline */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Weekly Activity & Scan Trends
              </h3>
              <span className="text-xs text-gray-500 font-mono">Last 7 Days</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Volume of radiographs evaluated per day</p>

            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.weekly_activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="normal" name="Normal" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pneumonia" name="Pneumonia" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Recent Scans Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                Recent Scan Activity
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Your most recently evaluated chest radiographs</p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <LoadingSpinner text="Retrieving recent activity..." />
            </div>
          ) : !stats?.recent_scans?.length ? (
            <div className="py-12 text-center text-xs text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No scans performed yet. Upload an X-ray to start evaluating.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Radiograph File</th>
                    <th className="py-3 px-4">Prediction</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stats.recent_scans.map((scan) => {
                    const isPneu = scan.prediction?.toUpperCase() === 'PNEUMONIA'
                    return (
                      <tr key={scan.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {scan.filename}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isPneu
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isPneu ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {scan.prediction}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {(scan.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">
                          {scan.processing_time ? `${scan.processing_time.toFixed(2)}s` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDownloadPdf(scan.id, scan.prediction)}
                            disabled={downloadingId === scan.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold transition"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
