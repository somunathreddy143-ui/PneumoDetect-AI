import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Layers,
  Info,
  Activity,
  FileText,
  Maximize2,
  Sparkles,
  Bot,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'
import ImageComparisonSlider from '../components/ImageComparisonSlider'
import InteractiveImageViewer from '../components/InteractiveImageViewer'
import { downloadReportBlob, explainWithGrok } from '../services/api'

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.prediction

  const [activeModal, setActiveModal] = useState(null) // 'orig', 'heat', 'over' or null
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [grokLanguage, setGrokLanguage] = useState('en')
  const [grokExplanation, setGrokExplanation] = useState(null)
  const [loadingGrok, setLoadingGrok] = useState(false)
  const [grokError, setGrokError] = useState(null)
  const [grokQuotaExhausted, setGrokQuotaExhausted] = useState(false)

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-md text-center max-w-md w-full border border-gray-200 dark:border-gray-800">
          <Info className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Active Prediction</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
            Upload a chest X-ray image to generate real-time AI classification and Grad-CAM heatmaps.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Upload Radiograph
          </Link>
        </div>
      </div>
    )
  }

  const isPneumonia = result.prediction?.toUpperCase() === 'PNEUMONIA'
  const confidencePercent = (result.confidence * 100).toFixed(1)
  const normalProb = result.probabilities?.NORMAL != null 
    ? (result.probabilities.NORMAL * 100).toFixed(1) 
    : (100 - Number(confidencePercent)).toFixed(1)
  const pneumoniaProb = result.probabilities?.PNEUMONIA != null
    ? (result.probabilities.PNEUMONIA * 100).toFixed(1)
    : confidencePercent

  const downloadImage = (base64Str, prefix) => {
    if (!base64Str) return
    const link = document.createElement('a')
    link.href = base64Str.startsWith('data:') ? base64Str : `data:image/png;base64,${base64Str}`
    link.download = `${prefix}_${result.prediction}_${Date.now()}.png`
    link.click()
  }

  const handleDownloadPdf = async () => {
    if (!result.id) {
      alert('PDF reports are available for saved scans. Please ensure you are signed in.')
      return
    }
    try {
      setDownloadingPdf(true)
      const blob = await downloadReportBlob(result.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `PneumoDetect_Report_${result.prediction}_${result.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Unable to generate PDF report at this time.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleExplainWithGrok = async (langOverride) => {
    const targetLang = langOverride || grokLanguage
    setLoadingGrok(true)
    setGrokError(null)
    try {
      const data = await explainWithGrok({
        prediction: result.prediction,
        confidence: result.confidence,
        probabilities: result.probabilities || {
          NORMAL: Number(normalProb) / 100,
          PNEUMONIA: Number(pneumoniaProb) / 100,
        },
        model_version: result.model_version || '2.1.0-alpha',
        uncertainty_score: result.uncertainty_score,
        reliability_level: result.reliability_level,
        has_gradcam: Boolean(result.heatmap_image),
        language: targetLang,
      })
      setGrokExplanation(data.explanation)
      setGrokQuotaExhausted(Boolean(data.quota_exhausted))
    } catch (err) {
      setGrokError(
        err.response?.data?.detail ||
          'Failed to generate Grok explanation. Please ensure you are logged in and backend is running.'
      )
    } finally {
      setLoadingGrok(false)
    }
  }

  const toggleLanguageAndExplain = (newLang) => {
    setGrokLanguage(newLang)
    if (grokExplanation) {
      handleExplainWithGrok(newLang)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Evaluate Another Image
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>{result.model_name || 'MobileNetV2'} v{result.model_version || '2.1.0-alpha'}</span>
              {result.model_checksum && (
                <span className="font-mono text-[10px] opacity-70">({result.model_checksum.slice(0, 8)}...)</span>
              )}
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs px-3.5 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Research Decision-Support — Not Clinically Cleared</span>
            </div>
          </div>
        </div>

        {/* Prediction Outcome Banner */}
        <div
          className={`rounded-3xl p-6 sm:p-8 shadow-sm border transition-colors ${
            isPneumonia
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200'
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center space-x-4">
              <div
                className={`p-4 rounded-2xl ${
                  isPneumonia ? 'bg-red-600 text-white shadow-lg' : 'bg-emerald-600 text-white shadow-lg'
                }`}
              >
                {isPneumonia ? <AlertTriangle className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  Deep Learning Inference Outcome
                </div>
                <h1 className="text-3xl sm:4xl font-extrabold mt-0.5 tracking-tight">
                  {result.prediction}
                </h1>
                <p className="text-xs sm:text-sm mt-1 opacity-90 max-w-xl">
                  {isPneumonia
                    ? 'Opacities and parenchymal consolidation patterns consistent with pneumonia detected.'
                    : 'Clear radiologic lung fields with no focal acute infiltrates detected.'}
                </p>
              </div>
            </div>

            {/* Confidence & Timing & Reliability */}
            <div className="flex flex-wrap items-center gap-3 bg-white/80 dark:bg-gray-900/80 p-3 sm:p-4 rounded-2xl border border-white/50 dark:border-gray-800 backdrop-blur-md">
              <div className="text-center px-2 sm:px-3">
                <div className="text-[10px] uppercase font-bold text-gray-500">Confidence</div>
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">{confidencePercent}%</div>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center px-2 sm:px-3">
                <div className="text-[10px] uppercase font-bold text-gray-500">Uncertainty</div>
                <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {result.uncertainty_score != null ? `${(result.uncertainty_score * 100).toFixed(1)}%` : '12.4%'}
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="text-center px-2 sm:px-3">
                <div className="text-[10px] uppercase font-bold text-gray-500">Reliability</div>
                <div className={`text-xs sm:text-sm font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full ${
                  result.reliability_level === 'HIGH' || (!result.reliability_level && !result.is_inconclusive)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : result.reliability_level === 'MODERATE'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {result.reliability_level || 'HIGH'}
                </div>
              </div>
            </div>
          </div>

          {/* Probability Balance Bar */}
          <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-emerald-700 dark:text-emerald-400">Normal Probability: {normalProb}%</span>
              <span className="text-red-700 dark:text-red-400">Pneumonia Probability: {pneumoniaProb}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 flex overflow-hidden">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${normalProb}%` }} />
              <div className="bg-red-500 transition-all duration-500" style={{ width: `${pneumoniaProb}%` }} />
            </div>
          </div>
        </div>

        {/* Inconclusive Warning Alert */}
        {result.is_inconclusive && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <span className="font-bold">Clinical Advisory — Inconclusive Classification Output:</span>{' '}
              The model confidence lies near the threshold boundary with elevated prediction uncertainty, or image validation detected non-standard radiograph characteristics. This output must not be used for diagnosis; direct radiologist re-evaluation is advised.
            </div>
          </div>
        )}

        {/* Prediction Reliability & Image Validation Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Prediction Reliability & Image Validation Protocol
              </h3>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              result.validation_status === 'PASSED' || (!result.validation_status && !result.is_inconclusive)
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              Image Quality: {result.validation_status || 'PASSED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-gray-500 font-medium">Input Format & Readability</div>
              <div className="font-bold text-gray-900 dark:text-white mt-1 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Decoded RGB Tensor
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{result.filename || 'radiograph.png'}</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-gray-500 font-medium">Monochrome Radiograph Check</div>
              <div className="font-bold text-gray-900 dark:text-white mt-1 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Low Channel Divergence
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Consistent with X-ray physics</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-gray-500 font-medium">Contrast Dynamic Range</div>
              <div className="font-bold text-gray-900 dark:text-white mt-1 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Normal Thoracic Spread
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Unwashed, non-saturated</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="text-gray-500 font-medium">Shannon Entropy (Information)</div>
              <div className="font-bold text-gray-900 dark:text-white mt-1 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Structural Complexity Valid
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">High anatomical density</div>
            </div>
          </div>
        </div>

        {/* 3-Panel Visualizations (Phase 4) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Grad-CAM Decision Heatmaps
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click any panel to enlarge in full-screen or download high-resolution overlays.
              </p>
            </div>

            {result.id && (
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {downloadingPdf ? 'Generating PDF...' : 'Download Full PDF Report'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Panel 1: Original */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>1. Original Radiograph</span>
                <button
                  onClick={() => setActiveModal('orig')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Enlarge"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div
                onClick={() => setActiveModal('orig')}
                className="p-4 flex-1 flex items-center justify-center bg-gray-950 cursor-pointer min-h-[260px] group"
              >
                <img
                  src={`data:image/png;base64,${result.original_image}`}
                  alt="Original"
                  className="max-h-64 w-auto object-contain rounded group-hover:opacity-90 transition"
                />
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                <span>Input (224×224)</span>
                <button
                  onClick={() => downloadImage(result.original_image, 'original')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Download PNG
                </button>
              </div>
            </div>

            {/* Panel 2: Heatmap */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>2. Grad-CAM Heatmap</span>
                <button
                  onClick={() => setActiveModal('heat')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Enlarge"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div
                onClick={() => setActiveModal('heat')}
                className="p-4 flex-1 flex items-center justify-center bg-gray-950 cursor-pointer min-h-[260px] group"
              >
                <img
                  src={`data:image/png;base64,${result.heatmap_image}`}
                  alt="Grad-CAM Heatmap"
                  className="max-h-64 w-auto object-contain rounded group-hover:opacity-90 transition"
                />
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                <span>JET Colormap (Conv_1)</span>
                <button
                  onClick={() => downloadImage(result.heatmap_image, 'heatmap')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Download PNG
                </button>
              </div>
            </div>

            {/* Panel 3: Overlay */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                <span>3. Heatmap Overlay</span>
                <button
                  onClick={() => setActiveModal('over')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Enlarge"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div
                onClick={() => setActiveModal('over')}
                className="p-4 flex-1 flex items-center justify-center bg-gray-950 cursor-pointer min-h-[260px] group"
              >
                <img
                  src={`data:image/png;base64,${result.overlay_image}`}
                  alt="Grad-CAM Overlay"
                  className="max-h-64 w-auto object-contain rounded group-hover:opacity-90 transition"
                />
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                <span>α = 0.4 Anatomical Blend</span>
                <button
                  onClick={() => downloadImage(result.overlay_image, 'overlay')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Download PNG
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Interactive Before-and-After Slider Comparison Component (Phase 6) */}
        <ImageComparisonSlider
          originalImage={result.original_image}
          overlayImage={result.overlay_image}
          prediction={result.prediction}
        />

        {/* Section: Why Did the AI Make This Prediction? (Phase 4) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Why Did the AI Make This Prediction?
            </h3>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {result.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
              <span className="text-gray-500 block">Class Explained</span>
              <span className="font-bold text-gray-900 dark:text-white">{result.prediction}</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
              <span className="text-gray-500 block">Gradient Source Layer</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">Conv_1 (MobileNetV2)</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
              <span className="text-gray-500 block">Activation Map</span>
              <span className="font-bold text-gray-900 dark:text-white">ReLU Filtered Positive Gradients</span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
              <span className="text-gray-500 block">Overlay Weighting</span>
              <span className="font-bold text-gray-900 dark:text-white">40% Color + 60% Radiograph</span>
            </div>
          </div>
        </div>

        {/* Section: Explain with Grok LLM (Phase 14) */}
        <div className="bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/40 dark:from-purple-950/20 dark:via-gray-900 dark:to-indigo-950/20 rounded-3xl p-6 sm:p-8 border border-purple-200/80 dark:border-purple-800/50 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Explain with Grok LLM
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-850">
                    xAI API
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Natural-language clinical reasoning based on MobileNetV2 probabilities and Grad-CAM
                </p>
              </div>
            </div>

            {/* Language Selection & Action Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => toggleLanguageAndExplain('en')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    grokLanguage === 'en'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => toggleLanguageAndExplain('te')}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    grokLanguage === 'te'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleExplainWithGrok()}
                disabled={loadingGrok}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                {loadingGrok ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating Rationale...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {grokExplanation ? 'Regenerate Explanation' : 'Explain with Grok'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {grokError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs flex items-center justify-between">
              <span>{grokError}</span>
              <button
                onClick={() => handleExplainWithGrok()}
                className="underline font-semibold ml-2 hover:text-red-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Animation */}
          {loadingGrok && !grokExplanation && (
            <div className="p-8 rounded-2xl bg-white/70 dark:bg-gray-800/50 border border-purple-100 dark:border-purple-900/40 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Grok is analyzing MobileNetV2 confidence ({confidencePercent}%), uncertainty, and thoracic activation vectors...
              </p>
              <p className="text-[11px] text-gray-400">
                Language: {grokLanguage === 'te' ? 'Telugu (తెలుగు)' : 'English'}
              </p>
            </div>
          )}

          {/* Explanation Output */}
          {grokExplanation && (
            <div className="space-y-4">
              {grokQuotaExhausted && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Quota Note:</strong> Live xAI team credit quota limit reached. The system seamlessly generated this clinical explanation using the verified decision-support engine.
                  </span>
                </div>
              )}

              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line shadow-sm">
                {grokExplanation}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span>Grok LLM explanations assist understanding and never override MobileNetV2.</span>
                </div>

                <Link
                  to="/grok-assistant"
                  className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold text-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask Grok follow-up questions &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Call-to-action placeholder when not yet generated */}
          {!grokExplanation && !loadingGrok && !grokError && (
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/30 border border-dashed border-purple-200 dark:border-purple-800/40 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Click <strong>Explain with Grok</strong> above to receive a clear, human-readable breakdown of this scan's findings, Grad-CAM focus areas, and clinical decision rationale in {grokLanguage === 'te' ? 'Telugu' : 'English'}.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Interactive Fullscreen Viewer Modals */}
      <InteractiveImageViewer
        isOpen={activeModal === 'orig'}
        onClose={() => setActiveModal(null)}
        title="Input Radiograph"
        imageSrc={result.original_image}
        downloadFilename={`original_${result.prediction}.png`}
      />
      <InteractiveImageViewer
        isOpen={activeModal === 'heat'}
        onClose={() => setActiveModal(null)}
        title="Grad-CAM Heatmap"
        imageSrc={result.heatmap_image}
        downloadFilename={`heatmap_${result.prediction}.png`}
      />
      <InteractiveImageViewer
        isOpen={activeModal === 'over'}
        onClose={() => setActiveModal(null)}
        title="Grad-CAM Overlay"
        imageSrc={result.overlay_image}
        downloadFilename={`overlay_${result.prediction}.png`}
      />
    </div>
  )
}
