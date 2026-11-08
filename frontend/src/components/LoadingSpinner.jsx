import { Activity } from 'lucide-react'

export default function LoadingSpinner({ text = 'Analyzing X-ray...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      {/* Spinner rings */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-700 animate-pulse-slow">{text}</p>
        <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          ></div>
        ))}
      </div>
    </div>
  )
}
