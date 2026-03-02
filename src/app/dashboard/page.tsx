'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, TrendingUp, Settings, LogOut, Layers, ChevronDown, ArrowUpRight, DollarSign } from 'lucide-react'

interface DashboardData {
  user: {
    fullName: string
    username: string
    referralCode: string
    isActive: boolean
    avatarUrl?: string | null
    rank?: string
    planExpiresAt?: string | null
  }
  stats: {
    directReferrals: number
    totalNetwork: number
    totalActive: number
    totalCommissions: number
    earningsToday: number
    earningsYesterday: number
    earningsWeek: number
    sponsorshipBonus: number
    sponsorshipLevels: { level1: number; level2: number; level3: number; other: number }
    directBonus: number
    extraBonus: number
    sharedBonus: number
    pendingBalance: number
  }
}

const IMAGES = [
  'https://i.ibb.co/ksmGqK0R/estrategia-metaverso-de-meta-2025-detalle2-1024x573.jpg',
  'https://i.ibb.co/Z1vWB05C/estrategia-metaverso-de-meta-2025-detalle1-1024x573.jpg',
  'https://i.ibb.co/cK5Wv5yG/estrategia-metaverso-de-meta-2025.jpg',
]

// ─────────────────────────────────────────────────────────────────
// COLOR SYSTEM — extracted from /dashboard/services page
// ─────────────────────────────────────────────────────────────────
const NEON = {
  cyan: '#00F5FF',   // primary accent  (Tienda Virtual)
  green: '#00FF88',   // money / positive (WhatsApp)
  purple: '#9B00FF',   // secondary accent (Landing)
  gold: '#FFCC00',   // premium/plan     (Anuncios)
  red: '#FF2D55',   // alerts           (Clipping)
}

// Replicating the services card pattern
function makeCard(color: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}08, ${color}04)`,
    border: `1px solid ${color}20`,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  }
}

// Top accent line — same as services cards
function TopLine({ from, to }: { from: string; to: string }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg, transparent, ${from}80, ${to}60, transparent)`,
    }} />
  )
}

const font = "'Montserrat', sans-serif"

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [avatarErr, setAvatarErr] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/network')
      if (res.status === 401) { router.push('/login'); return }
      const json = await res.json()
      if (json?.user) setData(json)
    } catch { /**/ } finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const id = setInterval(() => setImgIdx(p => (p + 1) % IMAGES.length), 5000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!data?.user.planExpiresAt) { setCountdown(null); return }
    const target = new Date(data.user.planExpiresAt).getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setCountdown({ d: 0, h: 0, m: 0, s: 0 }); return }
      setCountdown({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [data?.user.planExpiresAt])

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !data) return
    setAvatarErr(''); setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/users/avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setAvatarErr(json.error || 'Error'); return }
      setData(prev => prev ? { ...prev, user: { ...prev.user, avatarUrl: json.avatarUrl } } : prev)
    } catch { setAvatarErr('Error de conexión') } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
      <div style={{ width: 24, height: 24, border: `2px solid rgba(0,245,255,0.15)`, borderTopColor: NEON.cyan, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: font }}>
      Error al cargar datos
    </div>
  )

  const earnings = [
    { label: 'Hoy', val: data.stats.earningsToday },
    { label: 'Ayer', val: data.stats.earningsYesterday },
    { label: 'Semana', val: data.stats.earningsWeek },
    { label: 'Acumulado', val: data.stats.totalCommissions },
  ]

  const bonos = [
    {
      key: 'patroc', label: 'Patrocinio', val: data.stats.sponsorshipBonus, color: NEON.cyan,
      sub: [
        { l: 'Nivel 1 · 20%', v: data.stats.sponsorshipLevels.level1 },
        { l: 'Nivel 2', v: data.stats.sponsorshipLevels.level2 },
        { l: 'Nivel 3', v: data.stats.sponsorshipLevels.level3 },
      ]
    },
    { key: 'shared', label: 'Compartido', val: data.stats.sharedBonus, color: NEON.purple, locked: true },
    { key: 'extra', label: 'B. Extra', val: data.stats.extraBonus, color: NEON.green },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100, color: '#fff', fontFamily: font, background: '#0B0C14' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── BANNER ── */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden', margin: '16px 14px 0', borderRadius: 20, border: `1px solid ${NEON.cyan}20` }}>
        <img src={IMAGES[imgIdx]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.09, transition: 'opacity 1.5s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />
        {/* Cyan accent line — like services decorative line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${NEON.cyan}50, ${NEON.purple}35, transparent)` }} />

        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <Link href="/dashboard/settings"
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${NEON.cyan}08`, border: `1px solid ${NEON.cyan}20`, borderRadius: 10, color: `${NEON.cyan}`, textDecoration: 'none' }}>
            <Settings style={{ width: 15, height: 15 }} />
          </Link>
          <button onClick={logout}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${NEON.red}08`, border: `1px solid ${NEON.red}20`, borderRadius: 10, color: NEON.red, cursor: 'pointer' }}>
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* ── AVATAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -44, paddingBottom: 24, position: 'relative', zIndex: 2 }}>
        <label htmlFor="avatar-file-input" style={{ display: 'block', cursor: uploading ? 'not-allowed' : 'pointer', marginBottom: 12, position: 'relative', width: 88, height: 88 }}>
          <input
            id="avatar-file-input"
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            disabled={uploading}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }}
            onChange={uploadAvatar}
          />
          <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${NEON.cyan}50`, background: '#111', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.user.avatarUrl
              ? <img src={data.user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 30, fontWeight: 700, color: NEON.cyan }}>{data.user.fullName.charAt(0).toUpperCase()}</span>
            }
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, border: `2px solid rgba(0,245,255,0.2)`, borderTopColor: NEON.cyan, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            <span style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: data.user.isActive ? NEON.green : NEON.red, border: '2px solid #000', zIndex: 2 }} />
          </div>
        </label>
        <h1 style={{ margin: '0 0 5px', fontSize: 18, fontWeight: 600, color: '#fff' }}>{data.user.fullName}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>@{data.user.username}</span>
          {data.user.rank && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: `${NEON.cyan}12`, color: NEON.cyan, border: `1px solid ${NEON.cyan}30`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {data.user.rank}
            </span>
          )}
        </div>
        {avatarErr && <p style={{ fontSize: 11, color: NEON.red, marginTop: 6 }}>{avatarErr}</p>}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '0 14px', maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* PLAN */}
        {countdown ? (
          <div style={{ ...makeCard(NEON.cyan), padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <TopLine from={NEON.cyan} to={NEON.purple} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: NEON.cyan }}>Plan · Vence en</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                {[{ v: countdown.d, l: 'días' }, { v: countdown.h, l: 'h' }, { v: countdown.m, l: 'min' }, { v: countdown.s, l: 's' }].map(({ v, l }) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/dashboard/planes"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: NEON.cyan, borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', textDecoration: 'none', flexShrink: 0 }}>
              <Layers style={{ width: 12, height: 12 }} /> Renovar
            </Link>
          </div>
        ) : (
          <Link href="/dashboard/planes" style={{ ...makeCard(NEON.cyan), display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none' }}>
            <TopLine from={NEON.cyan} to={NEON.purple} />
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${NEON.cyan}12`, border: `1px solid ${NEON.cyan}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers style={{ width: 16, height: 16, color: NEON.cyan }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>Ver Planes</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Activa o renueva tu plan</p>
            </div>
            <ArrowUpRight style={{ width: 16, height: 16, color: `${NEON.cyan}80`, flexShrink: 0 }} />
          </Link>
        )}

        {/* GANANCIAS */}
        <div style={{ ...makeCard(NEON.green), padding: 0 }}>
          <TopLine from={NEON.green} to={NEON.cyan} />
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${NEON.green}12`, border: `1px solid ${NEON.green}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign style={{ width: 14, height: 14, color: NEON.green }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Resumen de Ganancias</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 300, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>7 días</span>
          </div>
          {/* Pill-shaped individual cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12 }}>
            {earnings.map((e, i) => (
              <div key={i} style={{
                background: `${NEON.green}08`,
                border: `1px solid ${NEON.green}20`,
                borderRadius: 20,
                padding: '14px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              }}>
                <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{e.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: NEON.green }}>${e.val.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BONOS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {bonos.map(b => (
            <div key={b.key}
              onClick={b.locked ? undefined : () => setExpanded(expanded === b.key ? null : b.key)}
              style={{ ...makeCard(b.color), cursor: b.locked ? 'not-allowed' : 'pointer', opacity: b.locked ? 0.4 : 1 }}
              onMouseEnter={!b.locked ? e => {
                e.currentTarget.style.borderColor = `${b.color}35`
                e.currentTarget.style.boxShadow = `0 0 32px ${b.color}15`
              } : undefined}
              onMouseLeave={!b.locked ? e => {
                e.currentTarget.style.borderColor = `${b.color}20`
                e.currentTarget.style.boxShadow = `0 0 24px ${b.color}08`
              } : undefined}>
              <TopLine from={b.color} to={b.color + '80'} />
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: b.color }}>{b.label}</span>
                  {!b.locked && <ChevronDown style={{ width: 11, height: 11, color: `${b.color}80`, transform: expanded === b.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                </div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>${b.val.toFixed(0)}</p>
                {b.locked && <p style={{ margin: '4px 0 0', fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>Admin</p>}
                {expanded === b.key && b.sub && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${b.color}20`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {b.sub.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{s.l}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>${s.v.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RED */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: Users, label: 'Mi Red', val: data.stats.totalNetwork, href: '/dashboard/network', color: NEON.cyan },
            { icon: TrendingUp, label: 'Directos', val: data.stats.directReferrals, href: '#', color: NEON.purple },
          ].map((s, i) => (
            <Link key={i} href={s.href} style={{ ...makeCard(s.color), padding: '14px 14px', textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}35`; e.currentTarget.style.boxShadow = `0 0 32px ${s.color}15` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}20`; e.currentTarget.style.boxShadow = `0 0 24px ${s.color}08` }}>
              <TopLine from={s.color} to={s.color} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon style={{ width: 18, height: 18, color: s.color }} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>{s.val}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
