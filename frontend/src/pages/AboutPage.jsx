import {
  Brain,
  Layers,
  Activity,
  ShieldAlert,
  Code,
  Database,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            System Design & Medical AI Transparency
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            About the Explainable AI Pneumonia System
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Bridging deep learning radiograph classification with transparent, gradient-weighted visual explanations to address the AI "black box" challenge in healthcare.
          </p>
        </div>

        {/* Problem Statement & Proposed Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The Problem</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Standard deep convolutional neural networks often achieve high nominal benchmark accuracy, but their decision-making rationale remains opaque. In clinical decision-support, unexplainable predictions risk false positive overtreatment, false negative misdiagnoses, and critical trust deficits among healthcare providers.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The Proposed Solution</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By pairing an efficient MobileNetV2 transfer learning architecture with Gradient-weighted Class Activation Mapping (Grad-CAM), the system produces both categorical predictions and heatmaps highlighting specific lung parenchyma regions responsible for the activation.
            </p>
          </div>
        </div>

        {/* System Architecture Flow */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            End-to-End System Pipeline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-bold text-blue-600 mb-1">STAGE 1</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Pre-processing</h3>
              <p className="text-xs text-gray-500">
                Grayscale/RGB conversion, resizing to 224×224, and normalization into [-1, 1].
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-bold text-blue-600 mb-1">STAGE 2</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">MobileNetV2</h3>
              <p className="text-xs text-gray-500">
                17 inverted residual blocks with depthwise separable convs extract deep spatial features.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-bold text-blue-600 mb-1">STAGE 3</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Grad-CAM</h3>
              <p className="text-xs text-gray-500">
                Gradients computed w.r.t layer Conv_1 feature maps generate spatial importance heatmaps.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs font-bold text-blue-600 mb-1">STAGE 4</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">User Interface</h3>
              <p className="text-xs text-gray-500">
                Interactive React web application presents predictions, probabilities, and overlays.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Code className="w-6 h-6 text-indigo-600" />
            Technology Stack
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-base mb-3 text-blue-600">Frontend</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• React 19 with Vite 8</li>
                <li>• Tailwind CSS (Healthcare UI)</li>
                <li>• Lucide React Icons</li>
                <li>• Recharts Data Visualizations</li>
                <li>• Axios HTTP Client</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-base mb-3 text-emerald-600">Backend API</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• FastAPI & Uvicorn ASGI</li>
                <li>• Pydantic v2 Schema Validation</li>
                <li>• OpenCV (JET Heatmap Overlay)</li>
                <li>• Pillow Imaging Library</li>
                <li>• Multi-part Form Processing</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-base mb-3 text-purple-600">Machine Learning</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• TensorFlow 2.22 / Keras 3</li>
                <li>• MobileNetV2 Transfer Learning</li>
                <li>• Grad-CAM Explainability Algorithm</li>
                <li>• Scikit-learn Evaluation Suite</li>
                <li>• Matplotlib / Seaborn</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Limitations & Ethical Disclaimer */}
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 text-amber-950">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                Project Scope & Important Medical Disclaimers
              </h3>
              <p className="text-sm leading-relaxed mb-4 text-amber-800">
                This software is developed strictly for clinical research and decision-support applications. It is <strong>NOT</strong> an FDA/CE-cleared medical device, nor has it been clinically validated as a standalone diagnostic system across diverse hospital radiologic archives.
              </p>
              <ul className="space-y-1.5 text-xs text-amber-900/80 list-disc list-inside">
                <li>Predictions are probability assessments, not clinically confirmed diagnostic reports.</li>
                <li>Heatmaps display model parameter correlations, which should never replace certified radiologist review.</li>
                <li>Accuracy can fluctuate under atypical patient positioning, motion artifacts, or low radiographic quality.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

