'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onToken: (token: string) => void
  onExpire?: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: object) => string
      reset: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

export default function TurnstileWidget({ onToken, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return // sin clave configurada → no renderizar

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return
      // Evitar renderizar dos veces
      if (widgetId.current) return
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        'expired-callback': () => {
          widgetId.current = null
          onExpire?.()
        },
        theme: 'dark',
        size: 'normal',
      })
    }

    if (window.turnstile) {
      renderWidget()
      return
    }

    const existing = document.querySelector('script[data-turnstile]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.dataset.turnstile = '1'
      script.onload = renderWidget
      document.head.appendChild(script)
    } else {
      // Script ya existe pero no ha cargado — esperar
      existing.addEventListener('load', renderWidget)
    }
  }, [siteKey, onToken, onExpire])

  if (!siteKey) return null

  return <div ref={containerRef} className="mt-3" />
}
