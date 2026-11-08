import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useTheme } from '../context/ThemeContext'

const DEFAULT_SITE_KEY = '6Ldk-hYuAAAAAO35F0uypYiXqXhpUWJp4nGK_Zst'

const ReCaptchaWidget = forwardRef(function ReCaptchaWidget(
  { onVerify, onExpire, onError },
  ref
) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const { isDark } = useTheme()

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || DEFAULT_SITE_KEY

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        widgetIdRef.current !== null
      ) {
        try {
          window.grecaptcha.reset(widgetIdRef.current)
        } catch {
          // ignore reset error if unmounted
        }
      }
    },
    getResponse: () => {
      if (
        typeof window !== 'undefined' &&
        window.grecaptcha &&
        widgetIdRef.current !== null
      ) {
        return window.grecaptcha.getResponse(widgetIdRef.current)
      }
      return ''
    },
  }))

  useEffect(() => {
    let isMounted = true

    // Function to render the reCAPTCHA widget once the API script is ready
    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.grecaptcha) return

      // If already rendered, do not re-render
      if (widgetIdRef.current !== null) return

      try {
        window.grecaptcha.ready(() => {
          if (!isMounted || !containerRef.current || widgetIdRef.current !== null) return
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              if (onVerify) onVerify(token)
            },
            'expired-callback': () => {
              if (onExpire) onExpire()
            },
            'error-callback': () => {
              if (onError) onError()
            },
            theme: isDark ? 'dark' : 'light',
          })
        })
      } catch (err) {
        // reCAPTCHA render error
      }
    }

    // Check if the script is already present in document
    const scriptId = 'google-recaptcha-v2-script'
    let script = document.getElementById(scriptId)

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget()
    } else {
      script.addEventListener('load', renderWidget)
    }

    return () => {
      isMounted = false
    }
  }, [siteKey, isDark, onVerify, onExpire, onError])

  return (
    <div className="flex flex-col items-center justify-center my-3">
      <div ref={containerRef} className="min-h-[78px] flex items-center justify-center" />
      <span className="text-[10px] text-gray-400 mt-1">
        Protected by Google reCAPTCHA
      </span>
    </div>
  )
})

export default ReCaptchaWidget

