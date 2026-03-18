'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, MapPin, Camera, Mic, Bell, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

const STORAGE_KEY = 'jd_permissions_granted'
// Minimum distance to trigger a GPS update: ~100m (0.001 degrees ≈ 111m)
const MIN_MOVE_DEGREES = 0.001
// Minimum interval between GPS updates sent to server: 5 minutes
const MIN_UPDATE_INTERVAL_MS = 5 * 60 * 1000

type PermState = 'idle' | 'loading' | 'granted' | 'denied'

interface PermStatus {
  geo: PermState
  camera: PermState
  mic: PermState
  notifications: PermState
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function sendGps(lat: number, lng: number, deviceId: string) {
  fetch('/api/auth/device-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, deviceId }),
  }).catch(() => {})
}

/** Start real-time GPS tracking via watchPosition. Returns a cleanup function. */
function startGpsTracking(deviceId: string): () => void {
  if (!navigator.geolocation) return () => {}

  let lastLat: number | null = null
  let lastLng: number | null = null
  let lastSentAt = 0

  const watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      const now = Date.now()

      // Only send if moved enough OR enough time has passed
      const moved = lastLat === null || lastLng === null
        ? true
        : Math.abs(lat - lastLat) > MIN_MOVE_DEGREES || Math.abs(lng - lastLng) > MIN_MOVE_DEGREES
      const timeElapsed = now - lastSentAt > MIN_UPDATE_INTERVAL_MS

      if (moved || timeElapsed) {
        sendGps(lat, lng, deviceId)
        lastLat = lat
        lastLng = lng
        lastSentAt = now
      }
    },
    () => {}, // ignore errors (user may have revoked GPS)
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}

export default function PermissionsModal() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<PermStatus>({ geo: 'idle', camera: 'idle', mic: 'idle', notifications: 'idle' })
  const [requesting, setRequesting] = useState(false)
  const [anyDenied, setAnyDenied] = useState(false)
  const stopTrackingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const hasToken = document.cookie.includes('auth_token')
    const alreadyGranted = localStorage.getItem(STORAGE_KEY) === '1'
    if (hasToken && !alreadyGranted) {
      setVisible(true)
    } else if (hasToken && alreadyGranted) {
      // Already granted in a previous session — start tracking immediately
      const deviceId = getCookie('device_id')
      if (deviceId) {
        stopTrackingRef.current = startGpsTracking(deviceId)
      }
    }
    return () => { stopTrackingRef.current?.() }
  }, [])

  const allGranted = Object.values(status).every(s => s === 'granted')

  useEffect(() => {
    if (!allGranted) return
    localStorage.setItem(STORAGE_KEY, '1')

    const deviceId = getCookie('device_id')
    if (deviceId) {
      // Start real-time tracking (also sends first position immediately)
      stopTrackingRef.current?.()
      stopTrackingRef.current = startGpsTracking(deviceId)
    }

    setTimeout(() => setVisible(false), 800)
  }, [allGranted])

  const requestAll = useCallback(async () => {
    setRequesting(true)
    setAnyDenied(false)
    setStatus({ geo: 'loading', camera: 'loading', mic: 'loading', notifications: 'loading' })

    const results = await Promise.allSettled([
      // Geolocation
      new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('not supported')); return }
        navigator.geolocation.getCurrentPosition(() => resolve(), () => reject())
      }),
      // Camera + Mic together
      (navigator.mediaDevices?.getUserMedia({ video: true, audio: true }) ?? Promise.reject(new Error('not supported')))
        .then(stream => { stream.getTracks().forEach(t => t.stop()) }),
      // Notifications (some iOS browsers don't support it)
      typeof Notification !== 'undefined'
        ? Notification.requestPermission().then(p => { if (p !== 'granted') throw new Error('denied') })
        : Promise.resolve(),
    ])

    const geoOk = results[0].status === 'fulfilled'
    const mediaOk = results[1].status === 'fulfilled'
    const notifOk = results[2].status === 'fulfilled'

    setStatus({
      geo: geoOk ? 'granted' : 'denied',
      camera: mediaOk ? 'granted' : 'denied',
      mic: mediaOk ? 'granted' : 'denied',
      notifications: notifOk ? 'granted' : 'denied',
    })
    setAnyDenied(!geoOk || !mediaOk || !notifOk)
    setRequesting(false)
  }, [])

  if (!visible) return null

  const PERMISSIONS = [
    { key: 'geo', icon: MapPin, label: 'Ubicación GPS', desc: 'Para seguridad y verificación de sesión', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { key: 'camera', icon: Camera, label: 'Cámara', desc: 'Para subir fotos y escanear documentos', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { key: 'mic', icon: Mic, label: 'Micrófono', desc: 'Para notas de voz y grabaciones de audio', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { key: 'notifications', icon: Bell, label: 'Notificaciones', desc: 'Para alertas de comisiones y mensajes', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ] as const

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(7,8,15,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 mb-3 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <img src="/logo.png" alt="JD" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-black tracking-[0.18em] text-white uppercase">JD Internacional</h1>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0D0F1E', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Top accent */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8) 40%, rgba(0,245,255,0.6) 60%, transparent)' }} />

          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Shield size={17} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Acceso requerido</p>
                <p className="text-sm font-black text-white">Activar permisos</p>
              </div>
            </div>

            <p className="text-[12px] text-white/35 leading-relaxed mb-5">
              Para usar la app necesitamos acceso a los siguientes recursos. Todos los permisos son obligatorios.
            </p>

            {/* Permission list */}
            <div className="space-y-2 mb-5">
              {PERMISSIONS.map(({ key, icon: Icon, label, desc, color, bg }) => {
                const s = status[key as keyof PermStatus]
                return (
                  <div key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    s === 'granted' ? 'bg-green-500/8 border-green-500/20' :
                    s === 'denied' ? 'bg-red-500/8 border-red-500/20' :
                    `${bg}`
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s === 'granted' ? 'bg-green-500/15' : s === 'denied' ? 'bg-red-500/15' : 'bg-white/5'}`}>
                      <Icon size={15} className={s === 'granted' ? 'text-green-400' : s === 'denied' ? 'text-red-400' : color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${s === 'granted' ? 'text-green-400' : s === 'denied' ? 'text-red-400' : 'text-white/80'}`}>{label}</p>
                      <p className="text-[10px] text-white/30 leading-snug">{desc}</p>
                    </div>
                    <div className="shrink-0">
                      {s === 'loading' && <Loader2 size={14} className="animate-spin text-white/40" />}
                      {s === 'granted' && <CheckCircle2 size={15} className="text-green-400" />}
                      {s === 'denied' && <AlertCircle size={15} className="text-red-400" />}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Denied message */}
            {anyDenied && (
              <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-400/80 leading-relaxed">
                  Algunos permisos fueron denegados. Ve a la configuración de tu navegador y actívalos manualmente, luego intenta de nuevo.
                </p>
              </div>
            )}

            {/* CTA button */}
            {!allGranted && (
              <button
                onClick={requestAll}
                disabled={requesting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: anyDenied
                    ? 'linear-gradient(135deg, #7f1d1d, #581c87)'
                    : 'linear-gradient(135deg, #7c3aed, #0891b2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 28px rgba(124,58,237,0.3)',
                }}
              >
                {requesting
                  ? <><Loader2 size={15} className="animate-spin" /> Solicitando permisos...</>
                  : anyDenied
                  ? <><RefreshCw size={14} /> Reintentar permisos</>
                  : <><Shield size={14} /> Activar todos los permisos</>
                }
              </button>
            )}

            {allGranted && (
              <div className="flex items-center justify-center gap-2 py-3">
                <CheckCircle2 size={16} className="text-green-400" />
                <p className="text-sm font-bold text-green-400">¡Todo listo! Entrando...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
