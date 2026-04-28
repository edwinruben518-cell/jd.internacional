'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, RefreshCw, X, Users, AlertTriangle } from 'lucide-react'

// Leaflet must be loaded client-side only
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

interface LocationUser {
  userId: string
  lat: number
  lng: number
  address: string | null
  city: string | null
  country: string | null
  lastSeen: string
  locationChanged: boolean
  username: string
  fullName: string
  email: string
  plan: string
  isActive: boolean
}

interface Props {
  onClose: () => void
}

export default function AdminLocationMap({ onClose }: Props) {
  const [locations, setLocations] = useState<LocationUser[]>([])
  const [loading, setLoading] = useState(true)
  const [leafletReady, setLeafletReady] = useState(false)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/locations')
      const data = await res.json()
      setLocations(data.locations || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchLocations()
    // Auto-refresh every 30s
    const interval = setInterval(fetchLocations, 30_000)
    return () => clearInterval(interval)
  }, [fetchLocations])

  // Fix Leaflet default marker icons (Next.js SSR issue)
  useEffect(() => {
    import('leaflet').then(L => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setLeafletReady(true)
    })
    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const changed = locations.filter(l => l.locationChanged)
  const center: [number, number] = locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [4.7110, -74.0721] // Bogotá default

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-[#0d0d1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10" style={{ height: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d0d1a]">
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-green-400" />
            <span className="text-sm font-bold text-white">Mapa de Ubicaciones en Tiempo Real</span>
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
              {locations.length} usuarios con GPS
            </span>
            {changed.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} />
                {changed.length} cambio{changed.length > 1 ? 's' : ''} de ubicación
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLocations}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative" style={{ height: 'calc(100% - 52px)' }}>
          {loading && locations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Cargando ubicaciones...
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
              <Users size={32} />
              <p className="text-sm">Ningún usuario ha compartido su ubicación aún</p>
            </div>
          ) : leafletReady ? (
            <MapContainer
              center={center}
              zoom={5}
              style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {locations.map(loc => (
                <Marker key={loc.userId} position={[loc.lat, loc.lng]}>
                  <Popup>
                    <div style={{ minWidth: 200, fontFamily: 'sans-serif' }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                        {loc.fullName || loc.username}
                        {loc.locationChanged && (
                          <span style={{ color: '#f97316', fontSize: 10, marginLeft: 6 }}>⚠ Cambió ubicación</span>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: 11, marginBottom: 2 }}>@{loc.username}</div>
                      <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{loc.email}</div>
                      {loc.address && (
                        <div style={{ fontSize: 11, color: '#333', marginBottom: 4, padding: '4px 6px', background: '#f5f5f5', borderRadius: 4 }}>
                          📍 {loc.address}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999' }}>
                        <span>Plan: {loc.plan}</span>
                        <span>{new Date(loc.lastSeen).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'block', marginTop: 8, textAlign: 'center', background: '#166534', color: '#4ade80', padding: '4px 8px', borderRadius: 4, fontSize: 11, textDecoration: 'none' }}
                      >
                        Ver en Google Maps →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Cargando mapa...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
