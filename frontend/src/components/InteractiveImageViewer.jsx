import { useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react'

export default function InteractiveImageViewer({ isOpen, onClose, title, imageSrc, downloadFilename }) {
  const [zoom, setZoom] = useState(1)

  if (!isOpen) return null

  const handleDownload = () => {
    if (!imageSrc) return
    const link = document.createElement('a')
    link.href = imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`
    link.download = downloadFilename || 'radiograph.png'
    link.click()
  }

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))
  const resetZoom = () => setZoom(1)

  const src = imageSrc?.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">{title}</h3>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={zoomOut}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1 text-gray-700 dark:text-gray-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={resetZoom}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                title="Reset Fit"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-6 min-h-[400px]">
          <img
            src={src}
            alt={title}
            className="max-h-[65vh] w-auto object-contain transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
          MobileNetV2 feature map extraction and JET gradient activations.
        </div>
      </div>
    </div>
  )
}

