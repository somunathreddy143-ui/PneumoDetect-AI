import { Sun, Moon, Sliders, Shield, Cpu, Bell, Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System & Workspace Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure visual appearance, neural model telemetry, and reporting parameters.
          </p>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Appearance & Interface Theme
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose your preferred display aesthetic for optimal radiologic viewing contrast.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            {/* Light Mode Option */}
            <div
              onClick={() => isDark && toggleTheme()}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                !isDark
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Light Clinical</div>
                  <div className="text-xs text-gray-500">Bright, high-clarity view</div>
                </div>
              </div>
              {!isDark && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Dark Mode Option */}
            <div
              onClick={() => !isDark && toggleTheme()}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                isDark
                  ? 'border-blue-600 bg-blue-950/40 text-white'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-300 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Dark Radiologic</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Low-glare reading environment</div>
                </div>
              </div>
              {isDark && (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Neural Network & Explainability Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Neural Model & Grad-CAM Telemetry
          </h2>
          
          <div className="space-y-4 max-w-xl text-sm">
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white block">Backbone Architecture</span>
                <span className="text-xs text-gray-500">MobileNetV2 (17 Inverted Bottlenecks)</span>
              </div>
              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white block">Target Convolution Layer</span>
                <span className="text-xs text-gray-500">Layer name: Conv_1 (1280 Channels)</span>
              </div>
              <span className="text-xs font-mono bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-md">
                7 × 7 Grid
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <span className="font-semibold text-gray-900 dark:text-white block">Overlay Alpha Blending</span>
                <span className="text-xs text-gray-500">Standard 40% heatmap + 60% radiograph</span>
              </div>
              <span className="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                α = 0.4
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

