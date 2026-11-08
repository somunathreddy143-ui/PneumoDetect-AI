import { Activity, AlertTriangle, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-t-2 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Educational Disclaimer:</strong> This tool is for educational and research purposes only.
              It is <strong>NOT</strong> intended for clinical diagnosis. Always consult a qualified healthcare
              professional for medical advice and diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">PneumoDetect AI</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              An explainable AI system for pneumonia detection from chest X-rays using
              MobileNetV2 and Grad-CAM visualization.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'FastAPI', 'TensorFlow', 'MobileNetV2', 'Grad-CAM', 'Tailwind CSS'].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded-full border border-gray-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/upload" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Upload X-ray
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 hover:text-blue-400 transition-colors">
                  About Project
                </a>
              </li>
              <li>
                <a href="/performance" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Model Performance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} PneumoDetect AI — Built for educational purposes
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for healthcare AI research
          </p>
        </div>
      </div>
    </footer>
  )
}
