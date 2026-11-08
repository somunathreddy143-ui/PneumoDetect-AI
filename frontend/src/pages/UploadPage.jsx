import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Image as ImageIcon,
  X,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react'
import { predictImage, predictBatch } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_BATCH_FILES = 10

export default function UploadPage() {
  const [mode, setMode] = useState('single') // 'single' or 'batch'
  const [files, setFiles] = useState([]) // array of File objects
  const [previews, setPreviews] = useState([]) // array of data URLs
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState(null)
  const [batchResults, setBatchResults] = useState(null)

  const inputRef = useRef(null)
  const navigate = useNavigate()

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return `Invalid format for "${f.name}". Only JPG, JPEG, and PNG are supported.`
    }
    if (f.size > MAX_FILE_SIZE) {
      return `"${f.name}" is too large. Maximum size is 10MB.`
    }
    return null
  }

  const addFiles = (selectedFiles) => {
    setError(null)
    const newFiles = Array.from(selectedFiles)

    if (mode === 'single') {
      const f = newFiles[0]
      if (!f) return
      const err = validateFile(f)
      if (err) {
        setError(err)
        return
      }
      setFiles([f])
      const reader = new FileReader()
      reader.onloadend = () => setPreviews([reader.result])
      reader.readAsDataURL(f)
    } else {
      // Batch mode
      if (files.length + newFiles.length > MAX_BATCH_FILES) {
        setError(`Maximum ${MAX_BATCH_FILES} files allowed per batch.`)
        return
      }
      for (const f of newFiles) {
        const err = validateFile(f)
        if (err) {
          setError(err)
          return
        }
      }
      const combined = [...files, ...newFiles]
      setFiles(combined)

      // Generate previews
      const newPreviews = []
      let loaded = 0
      combined.forEach((f, idx) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews[idx] = reader.result
          loaded++
          if (loaded === combined.length) {
            setPreviews([...newPreviews])
          }
        }
        reader.readAsDataURL(f)
      })
    }
  }

  const removeFile = (idx) => {
    const updatedF = files.filter((_, i) => i !== idx)
    const updatedP = previews.filter((_, i) => i !== idx)
    setFiles(updatedF)
    setPreviews(updatedP)
    if (updatedF.length === 0 && inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleAnalyze = async () => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)
    setBatchResults(null)

    try {
      if (mode === 'single') {
        setProgressMsg('Running MobileNetV2 inference & Grad-CAM analysis...')
        const result = await predictImage(files[0])
        navigate('/results', { state: { prediction: result } })
      } else {
        setProgressMsg(`Evaluating batch of ${files.length} radiographs...`)
        const data = await predictBatch(files)
        setBatchResults(data)
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check the server connection.')
    } finally {
      setLoading(false)
      setProgressMsg('')
    }
  }

  const resetAll = () => {
    setFiles([])
    setPreviews([])
    setError(null)
    setBatchResults(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Upload Chest Radiograph
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Deep learning pneumonia classification with MobileNetV2 and real-time Grad-CAM explainability heatmaps.
          </p>

          {/* Mode Switcher */}
          <div className="mt-6 inline-flex rounded-2xl bg-white dark:bg-gray-900 p-1.5 border border-gray-200 dark:border-gray-800 shadow-sm">
            <button
              onClick={() => {
                setMode('single')
                resetAll()
              }}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                mode === 'single'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Single Radiograph
            </button>
            <button
              onClick={() => {
                setMode('batch')
                resetAll()
              }}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                mode === 'batch'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Batch Analysis (Up to 10)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-white dark:bg-gray-900 shadow-sm ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={mode === 'batch'}
            accept=".jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {mode === 'single'
              ? 'Drag & drop your chest X-ray here, or click to browse'
              : 'Drag & drop up to 10 chest X-rays for batch evaluation'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Supports high-resolution PNG, JPG, and JPEG (Up to 10MB per scan)
          </p>
        </div>

        {/* Previews Grid */}
        {files.length > 0 && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Selected Scans ({files.length})
              </span>
              <button
                onClick={resetAll}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center aspect-square p-2"
                >
                  {previews[idx] ? (
                    <img
                      src={previews[idx]}
                      alt={f.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FileImage className="w-8 h-8 text-gray-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(idx)
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 inset-x-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded truncate text-center">
                    {f.name}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{progressMsg || 'Processing inference...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'single' ? 'Analyze Chest Radiograph' : `Run Batch Analysis (${files.length} Scans)`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Batch Results Table (Phase 8) */}
        {batchResults && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Batch Evaluation Outcomes
                </h3>
                <p className="text-xs text-gray-500">
                  {batchResults.successful} of {batchResults.total} radiographs analyzed successfully
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Prediction</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batchResults.results.map((res, idx) => {
                    const isPneu = res.prediction?.toUpperCase() === 'PNEUMONIA'
                    return (
                      <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {res.filename}
                        </td>
                        <td className="py-3 px-4">
                          {res.success ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-xs">
                              <AlertCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {res.prediction ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isPneu
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {res.prediction}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {res.confidence != null ? `${(res.confidence * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {res.success && (
                            <button
                              onClick={() =>
                                navigate('/results', {
                                  state: {
                                    prediction: {
                                      id: res.prediction_id,
                                      filename: res.filename,
                                      prediction: res.prediction,
                                      confidence: res.confidence,
                                      probabilities: res.probabilities,
                                      original_image: res.original_image,
                                      heatmap_image: res.heatmap_image,
                                      overlay_image: res.overlay_image,
                                      explanation: res.explanation,
                                      processing_time: res.processing_time,
                                    },
                                  },
                                })
                              }
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                            >
                              View Heatmaps
                            </button>
                          )}
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
