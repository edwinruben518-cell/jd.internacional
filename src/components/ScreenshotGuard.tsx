'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'

export default function ScreenshotGuard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen'
      // Mac: Cmd+Shift+3 / Cmd+Shift+4 / Cmd+Shift+5
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)

      if (isPrintScreen || isMacScreenshot) {
        e.preventDefault()
        setVisible(true)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#0D0F1E', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        {/* Top accent */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.9) 50%, transparent)' }} />

        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <ShieldAlert size={26} className="text-red-400" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400/70 mb-1">
              Acción bloqueada
            </p>
            <h2 className="text-base font-black text-white mb-2">
              Capturas no permitidas
            </h2>
            <p className="text-[12px] text-white/40 leading-relaxed">
              La captura de pantalla está restringida en esta plataforma. Esta acción ha sido registrada y tu cuenta podría ser <span className="text-red-400 font-bold">suspendida</span> si continúas.
            </p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
              color: '#fff',
              border: '1px solid rgba(239,68,68,0.25)',
              boxShadow: '0 6px 24px rgba(239,68,68,0.2)',
            }}
          >
            Entendido
          </button>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-white/20 hover:text-white/60 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
