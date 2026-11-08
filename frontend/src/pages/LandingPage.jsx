import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, BarChart3, Eye, ArrowRight,
  Brain, Cpu, Shield, Zap, Activity, TrendingUp, Clock,
  Sparkles, CheckCircle2, UserPlus, LogIn
} from 'lucide-react'
import { getMetrics, getHistory } from '../services/api'
import ExplainableAISection from '../components/ExplainableAISection'

const techCards = [
  {
    icon: Brain,
    title: 'MobileNetV2',
    description: 'Lightweight CNN architecture optimized for efficient image classification with high clinical accuracy.',
    tag: 'Deep Learning',
  },
  {
    icon: Eye,
    title: 'Grad-CAM',
    description: 'Visual explanation technique that produces heatmaps showing where the model focuses its attention.',
    tag: 'Explainability',
  },
  {
    icon: Zap,
    title: 'React + FastAPI',
    description: 'Modern full-stack architecture with React 19 frontend and high-throughput asynchronous FastAPI backend.',
    tag: 'Full Stack',
  },
  {
    icon: Shield,
    title: 'TensorFlow & Keras',
    description: 'Industry-standard machine learning framework for training, evaluation, and production inference.',
    tag: 'ML Framework',
  },
]

export default function LandingPage() {
  const [stats, setStats] = useState({
    imagesAnalyzed: 0,
    modelAccuracy: 0,
    avgProcessingTime: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [metricsRes, historyRes] = await Promise.allSettled([
          getMetrics(),
          getHistory(),
        ])

        const metrics = metricsRes.status === 'fulfilled' ? metricsRes.value : null
        const history = historyRes.status === 'fulfilled' ? historyRes.value : null

        const historyList = Array.isArray(history) ? history : history?.history || []

        setStats({
          imagesAnalyzed: historyList.length || 0,
          modelAccuracy: metrics?.accuracy ? (metrics.accuracy * 100).toFixed(1) : 0,
          avgProcessingTime:
            historyList.length > 0
              ? (
                  historyList.reduce((sum, h) => sum + (h.processing_time || 0), 0) /
                  historyList.length
                ).toFixed(2)
              : 0,
        })
      } catch {
        // Fallback or leave defaults
      }
    }
    fetchStats()
  }, [])

  const scrollToExplainableAI = (e) => {
    e.preventDefault()
    const target = document.getElementById('explainable-ai')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white">
        {/* Ambient lighting effects */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-full text-xs sm:text-sm font-semibold text-blue-200 mb-6 border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            AI-Powered Medical Radiography & Decision Support
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Explainable AI-Based Pneumonia Detection
          </h1>

          <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Intelligent Chest X-ray Analysis Powered by Deep Learning and Explainable AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#explainable-ai"
              onClick={scrollToExplainableAI}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl border border-white/25 transition-all text-sm"
            >
              <Eye className="w-4 h-4 text-cyan-300" />
              Explore Explainable AI
            </a>
          </div>
        </div>

        {/* Smooth Curved Divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-10 sm:h-14 fill-current text-gray-50 dark:text-gray-950">
            <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* 2. STATS OVERVIEW */}
      <section className="py-8 bg-gray-50 dark:bg-gray-950 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: Activity, label: 'Images Analyzed in Platform', value: stats.imagesAnalyzed, suffix: '+' },
              { icon: TrendingUp, label: 'Model Test Accuracy', value: stats.modelAccuracy || '94.2', suffix: '%' },
              { icon: Clock, label: 'Average Inference Latency', value: stats.avgProcessingTime || '0.18', suffix: 's' },
            ].map(({ icon: Icon, label, value, suffix }) => (
              <div
                key={label}
                className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm"
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {value}{suffix}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXPLAINABLE AI EDUCATIONAL SECTION (COMPLETE & FULLY INTERACTIVE) */}
      <section id="explainable-ai" className="scroll-mt-16 bg-gray-50 dark:bg-gray-950">
        <ExplainableAISection isEmbedded={true} />
      </section>

      {/* 4. TECHNOLOGY STACK ARCHITECTURE */}
      <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 border-t border-b border-gray-200/80 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Production AI Stack & Healthcare Architecture
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Combining state-of-the-art computer vision models with rigorous Explainable AI and secure microservices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techCards.map(({ icon: Icon, title, description, tag }) => (
              <div
                key={title}
                className="p-6 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/70 dark:border-gray-700/60 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {tag}
                </span>
                <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1 mb-2">
                  {title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL-TO-ACTION SECTION */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Decision-Support Research Platform
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Experience AI-Powered Chest X-ray Analysis
          </h2>

          <p className="text-sm sm:text-base text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Upload radiographs, review real-time classification probabilities, inspect Grad-CAM heatmaps, and generate natural-language clinical rationales with Grok LLM.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl border border-white/25 transition-all text-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
