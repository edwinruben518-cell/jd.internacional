'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

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

  const onPosition = (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng } = pos.coords
    const now = Date.now()

    // Always send the very first position for immediate address population
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
  }

  // Get immediate position first (fast, low accuracy — works on desktop/WiFi)
  navigator.geolocation.getCurrentPosition(onPosition, () => {}, {
    enableHighAccuracy: false,
    maximumAge: 60000,
    timeout: 8000,
  })

  // Then watch for movement (lower accuracy = more reliable across all devices)
  const watchId = navigator.geolocation.watchPosition(
    onPosition,
    () => {}, // ignore errors silently (user may have revoked GPS)
    { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
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
    // auth_token is HttpOnly — invisible to JS. We're inside /dashboard so
    // middleware already guarantees the user is authenticated.
    // device_id is NOT HttpOnly — readable by JS.
    const alreadyGranted = localStorage.getItem(STORAGE_KEY) === '1'
    const deviceId = getCookie('device_id')

    if (!alreadyGranted) {
      setVisible(true)
    } else if (deviceId) {
      // Already granted in a previous session — start GPS tracking immediately
      stopTrackingRef.current = startGpsTracking(deviceId)
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(7,8,15,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xs flex flex-col items-center text-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <img src="/logo.png" alt="JD" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-base font-black tracking-[0.18em] text-white uppercase">JD Internacional</h1>
        </div>

        {/* Message */}
        {allGranted ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <p className="text-sm font-bold text-green-400">¡Todo listo! Entrando...</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm font-black text-white">
                {anyDenied ? 'Permisos denegados' : 'Acceso requerido'}
              </p>
              <p className="text-[12px] text-white/35 leading-relaxed">
                {anyDenied
                  ? 'Activa los permisos en la configuración de tu navegador e intenta de nuevo.'
                  : 'Para continuar, acepta los permisos que solicitará el navegador.'}
              </p>
            </div>

            <button
              onClick={requestAll}
              disabled={requesting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: anyDenied
                  ? 'linear-gradient(135deg, #7f1d1d, #581c87)'
                  : 'linear-gradient(135deg, #7c3aed, #0891b2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
              }}
            >
              {requesting
                ? <><Loader2 size={16} className="animate-spin" /> Solicitando...</>
                : anyDenied
                ? <><RefreshCw size={15} /> Reintentar</>
                : <><Shield size={15} /> Dar permisos</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}
