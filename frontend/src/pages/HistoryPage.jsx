import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Clock,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  Eye,
  Filter,
  ArrowUpDown,
  Upload,
} from 'lucide-react'
import { getUserHistory, deletePrediction, clearUserHistory, downloadReportBlob, getPredictionById } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HistoryPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [perPage] = useState(10)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserHistory({
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        filter_class: filterClass || undefined,
        sort_order: sortOrder,
      })
      setItems(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to retrieve scan history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [page, filterClass, sortOrder])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHistory()
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Permanently delete scan record #${id} and associated stored visualizations?`)) {
      return
    }
    try {
      await deletePrediction(id)
      fetchHistory()
    } catch (err) {
      alert('Failed to delete scan record.')
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to purge all your scan records? This cannot be undone.')) {
      return
    }
    try {
      await clearUserHistory()
      fetchHistory()
    } catch (err) {
      alert('Failed to clear history.')
    }
  }

  const handleViewResult = async (id) => {
    try {
      setLoading(true)
      const fullData = await getPredictionById(id)
      navigate('/results', { state: { prediction: fullData } })
    } catch {
      alert('Failed to retrieve full scan visualization.')
      setLoading(false)
    }
  }

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
      alert('Failed to download report.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              My Scan History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Private database of your analyzed radiographs, confidence assessments, and PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by filename or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Class:</span>
            <button
              onClick={() => {
                setFilterClass('')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterClass === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilterClass('NORMAL')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterClass === 'NORMAL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => {
                setFilterClass('PNEUMONIA')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterClass === 'PNEUMONIA'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              Pneumonia
            </button>

            {/* Sort Toggle */}
            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-700 flex items-center gap-1">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-medium"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* History Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800">
            <LoadingSpinner text="Retrieving scan history..." />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-14 text-center border border-gray-200 dark:border-gray-800">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Scan Records Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
              {total === 0 ? 'You have not uploaded any radiographs yet.' : 'No records match the active filter.'}
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md transition"
            >
              <Upload className="w-4 h-4" />
              Upload Radiograph
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Scan ID</th>
                    <th className="py-3.5 px-4">Radiograph File</th>
                    <th className="py-3.5 px-4">Prediction</th>
                    <th className="py-3.5 px-4">Confidence</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => {
                    const isPneu = item.prediction?.toUpperCase() === 'PNEUMONIA'
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          #{item.id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {item.filename}
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
                            {item.prediction}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {(item.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 text-xs">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleViewResult(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition"
                            title="View Visualizations"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(item.id, item.prediction)}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-medium transition"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <div>
                  Page {page} of {totalPages} ({total} total scans)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
