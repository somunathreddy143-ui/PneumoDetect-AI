import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  Languages,
  Info,
  ShieldCheck,
  Activity,
  Layers,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  User,
} from 'lucide-react'
import { grokChat } from '../services/api'

export default function GrokAIAssistant() {
  const [language, setLanguage] = useState('en') // 'en' | 'te'
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am Grok, your Explainable AI Healthcare & Deep Learning Assistant. I can help explain chest X-ray findings, MobileNetV2 architecture, Grad-CAM decision heatmaps, and diagnostic metrics (Sensitivity, Specificity, F1-score). You can chat with me in English or Telugu (తెలుగు)!',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [quotaNote, setQuotaNote] = useState(null)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Suggested Prompts
  const suggestedPrompts = language === 'te' ? [
    'MobileNetV2 మోడల్ ఛాతీ ఎక్స్-రేలలో న్యుమోనియాను ఎలా గుర్తిస్తుంది?',
    'Grad-CAM హీట్‌మ్యాప్ ఎక్స్-రేలలో ఏమి చూపుతుంది?',
    'న్యుమోనియా నిర్ధారణలో రీకాల్ (Recall) ఎందుకు అంత ముఖ్యం?',
    'సాధారణ ఎక్స్-రే మరియు న్యుమోనియా ఎక్స్-రే మధ్య తేడా ఏమిటి?',
  ] : [
    'How does MobileNetV2 identify pneumonia patterns in chest X-rays?',
    'Explain how Grad-CAM computes gradients from Conv_1 layer.',
    'Why is Recall (Sensitivity) prioritized over Precision in pneumonia screening?',
    'Explain how transfer learning with ImageNet weights works.',
  ]

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage
    if (!text.trim() || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInputMessage('')
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await grokChat(newMessages, language)
      setMessages([...newMessages, { role: 'assistant', content: res.response }])
      if (res.status_note && !res.is_live_api) {
        setQuotaNote(res.status_note)
      } else {
        setQuotaNote(null)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to Grok assistant.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: language === 'te'
          ? 'చాట్ క్లియర్ చేయబడింది. మీరు ఛాతీ ఎక్స్-రేలు, MobileNetV2, లేదా Grad-CAM గురించి ఏదైనా ప్రశ్న అడగవచ్చు.'
          : 'Conversation cleared. How can I assist your pulmonary research today?',
      },
    ])
    setErrorMsg(null)
    setQuotaNote(null)
  }

  const switchLanguage = (lang) => {
    setLanguage(lang)
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: lang === 'te'
          ? 'భాష తెలుగులోకి మార్చబడింది (Language switched to Telugu). ఇప్పుడు మీరు నన్ను తెలుగులో ప్రశ్నలు అడగవచ్చు!'
          : 'Language switched to English. Feel free to ask any questions regarding XAI, CNN architectures, or radiograph predictions!',
      },
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
        
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Grok AI Assistant
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase">
                  <Sparkles className="w-3 h-3" /> xAI LLM
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secondary Generative AI Explainer & Pulmonary Research Educational Companion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => switchLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  language === 'en'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => switchLanguage('te')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  language === 'te'
                    ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quota / Status Notice if live API quota limit is reached */}
        {quotaNote && (
          <div className="mb-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-2xl text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{quotaNote}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded">
              Educational Fallback Mode
            </span>
          </div>
        )}

        {/* Chat History Messages Container */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-800 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700/60 flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1">Grok is synthesizing clinical explanation...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3 h-3" /> Suggestions:
          </span>
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              disabled={loading}
              className="text-xs bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-800 hover:border-blue-300 px-3 py-1.5 rounded-full shrink-0 shadow-2xs transition disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="mt-2 relative shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'te'
                ? 'గ్రోక్ ను ప్రశ్న అడగండి (ఉదా: న్యుమోనియా లక్షణాలు ఏమిటి?)...'
                : 'Ask Grok about pneumonia detection, MobileNetV2, or Grad-CAM heatmaps...'
            }
            disabled={loading}
            className="w-full px-5 py-4 pr-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
          Grok LLM is a secondary generative explanation companion. MobileNetV2 and Grad-CAM remain the primary inference engines.
        </div>
      </div>
    </div>
  )
}

