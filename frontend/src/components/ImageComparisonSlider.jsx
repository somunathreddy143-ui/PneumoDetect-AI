import { useState, useRef, useCallback } from 'react'
import {
  SlidersHorizontal,
  Columns,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Layers,
} from 'lucide-react'

export default function ImageComparisonSlider({ originalImage, overlayImage, prediction }) {
  const [sliderPos, setSliderPos] = useState(50) // percentage 0 - 100
  const [mode, setMode] = useState('slider') // 'slider' or 'side-by-side'
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)

  const handleMouseDown = () => {
    isDraggingRef.current = true
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
      setFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setFullscreen(false)
    }
  }

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))
  const resetZoom = () => setZoom(1)

  const origSrc = originalImage?.startsWith('data:') ? originalImage : `data:image/png;base64,${originalImage}`
  const overSrc = overlayImage?.startsWith('data:') ? overlayImage : `data:image/png;base64,${overlayImage}`

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md p-5 transition-colors ${
        fullscreen ? 'p-8 flex flex-col justify-center' : ''
      }`}
    >
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            AI Visual Explanation Comparison
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            <button
              onClick={() => setMode('slider')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                mode === 'slider'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Slider
            </button>
            <button
              onClick={() => setMode('side-by-side')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                mode === 'side-by-side'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Side-by-Side
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={zoomOut}
              title="Zoom out"
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={zoomIn}
              title="Zoom in"
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              title="Reset fit"
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Toggle fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {mode === 'slider' ? (
        <div className="relative overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center select-none min-h-[380px] max-h-[550px]">
          <div
            className="relative transition-transform duration-100 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Background: Grad-CAM Overlay */}
            <img
              src={overSrc}
              alt="Grad-CAM Overlay"
              className="block max-h-[460px] w-auto object-contain pointer-events-none"
            />

            {/* Foreground: Original Image clipped by sliderPos */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
              <img
                src={origSrc}
                alt="Original Radiograph"
                className="block max-h-[460px] w-auto object-contain"
              />
            </div>

            {/* Draggable Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg flex items-center justify-center z-10"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-xl flex items-center justify-center -ml-0.5 border-2 border-blue-600 cursor-ew-resize">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none">
            Original Radiograph
          </div>
          <div className="absolute top-3 right-3 bg-blue-600/80 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm pointer-events-none">
            Grad-CAM Overlay (α=0.4)
          </div>
        </div>
      ) : (
        /* Side by side mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-950 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[320px] p-2 relative">
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
              Original X-ray
            </div>
            <img
              src={origSrc}
              alt="Original Radiograph"
              className="max-h-[360px] w-auto object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>

          <div className="bg-gray-950 rounded-xl overflow-hidden flex flex-col items-center justify-center min-h-[320px] p-2 relative">
            <div className="absolute top-2 left-2 bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
              Grad-CAM Overlay
            </div>
            <img
              src={overSrc}
              alt="Grad-CAM Overlay"
              className="max-h-[360px] w-auto object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      )}

      {/* Helper caption */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>Drag the slider left or right to inspect how activation patterns align with lung parenchyma.</span>
        <span className="font-mono">{sliderPos.toFixed(0)}% Split</span>
      </div>
    </div>
  )
}

