import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, Clock, ShieldCheck, AlertTriangle, Search, RefreshCw, Upload, Eye } from 'lucide-react'
import { getUserHistory, downloadReportBlob } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserHistory({ per_page: 50 })
      setReports(data.items || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch generated reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
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
    } catch (err) {
      alert('Failed to download PDF report. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = reports.filter(
    (r) =>
      r.filename.toLowerCase().includes(search.toLowerCase()) ||
      r.prediction.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search)
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              AI Analysis Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Download formal, publication-grade PDF documentation for any completed radiograph scan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              <Upload className="w-3.5 h-3.5" />
              New Scan
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by scan ID, filename, or result..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Reports Table or Empty State */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800">
            <LoadingSpinner text="Loading analysis reports..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-14 text-center border border-gray-200 dark:border-gray-800">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Reports Generated Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
              Upload and evaluate a chest X-ray to generate full PDF reports embedded with Grad-CAM overlays.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              Upload X-ray
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Report ID</th>
                    <th className="py-4 px-6">Radiograph File</th>
                    <th className="py-4 px-6">AI Prediction</th>
                    <th className="py-4 px-6">Confidence</th>
                    <th className="py-4 px-6">Generation Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((r) => {
                    const isPneu = r.prediction?.toUpperCase() === 'PNEUMONIA'
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition">
                        <td className="py-4 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                          AR-{String(r.id).padStart(6, '0')}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {r.filename}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isPneu
                                ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isPneu ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                            {r.prediction}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-200">
                          {(r.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">
                          {r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownloadPdf(r.id, r.prediction)}
                            disabled={downloadingId === r.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                          >
                            <Download className={`w-3.5 h-3.5 ${downloadingId === r.id ? 'animate-bounce' : ''}`} />
                            {downloadingId === r.id ? 'Generating...' : 'PDF Report'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

