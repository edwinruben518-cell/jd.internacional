'use client'

import { useEffect, useRef } from 'react'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/** Sends GPS position to server and keeps updating in real-time via watchPosition */
export default function GpsUpdater() {
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    if (!navigator.geolocation) return
    const deviceId = getCookie('device_id')
    if (!deviceId) return

    function post(pos: GeolocationPosition) {
      const now = Date.now()
      // Throttle: send at most once every 60 seconds even if watchPosition fires faster
      if (now - lastSentRef.current < 60_000) return
      lastSentRef.current = now
      fetch('/api/auth/device-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, deviceId }),
      }).catch(() => {})
    }

    // Initial position immediately
    navigator.geolocation.getCurrentPosition(
      pos => { lastSentRef.current = 0; post(pos) },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )

    // Continuous real-time tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => post(pos),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return null
}
