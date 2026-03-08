'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PrismLoader from '@/components/PrismLoader'

interface NetworkMember {
  id: string
  username: string
  fullName: string
  isActive: boolean
  plan: string
  level: number
}

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
  tree: NetworkMember[]
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

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [uploading, setUploading] = useState(false)
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

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !data) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/users/avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) return
      setData(prev => prev ? { ...prev, user: { ...prev.user, avatarUrl: json.avatarUrl } } : prev)
    } catch { /**/ } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Update sidebar user info (name, handle, avatar)
  useEffect(() => {
    if (!data?.user) return
    const nameEl = document.querySelector('.sidebar__user-name')
    const roleEl = document.querySelector('.sidebar__user-role')
    if (nameEl) nameEl.textContent = data.user.fullName
    if (roleEl) roleEl.innerHTML = `@${data.user.username} · <span style="color:var(--clr-accent-lt)">Activo</span>`
    if (data.user.avatarUrl) {
      const sidebarAv = document.getElementById('dAvatar')
      if (sidebarAv) sidebarAv.innerHTML = `<img src="${data.user.avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
    }
  }, [data])

  if (loading) return <PrismLoader />
  if (!data) return (
    <div style={{ minHeight: '100vh', display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
      Error al cargar datos
    </div>
  )

  const earnings = {
    today: data.stats.earningsToday,
    yesterday: data.stats.earningsYesterday,
    week: data.stats.earningsWeek,
    total: data.stats.totalCommissions,
    patrocinio: data.stats.sponsorshipBonus,
    extra: data.stats.extraBonus,
    direct: data.stats.directBonus,
  }

  const todayVsYesterday = earnings.yesterday > 0
    ? ((earnings.today - earnings.yesterday) / earnings.yesterday * 100)
    : earnings.today > 0 ? 100 : 0
  const todayUp = earnings.today >= earnings.yesterday
  const weekUp = earnings.week > 0

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
           MOBILE VIEW
      ═══════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen w-full" style={{ position:'relative' }}>

        {/* Cover Photo */}
        <div className="cover" id="cover">
          {IMAGES.map((img, i) => (
            <div key={i} className={`cover__slide ${imgIdx === i ? 'cover__slide--active' : ''}`} style={{ backgroundImage: `url('${img}')` }}></div>
          ))}
          <div className="cover__dots">
            {IMAGES.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`cover__dot ${imgIdx === i ? 'cover__dot--active' : ''}`} aria-label={`Slide ${i + 1}`}></button>
            ))}
          </div>
          {/* Botones esquinas */}
          <Link href="/dashboard/settings" style={{ position:'absolute', top:8, left:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)', fontSize:13, zIndex:10 }}>
            <i className="fa-solid fa-gear"></i>
          </Link>
          <button onClick={async()=>{ await fetch('/api/auth/logout',{method:'POST'}); window.location.href='/login' }} style={{ position:'absolute', top:8, right:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,80,80,0.3)', cursor:'pointer', color:'rgba(255,90,90,1)', fontSize:13, zIndex:10 }}>
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>

        {/* Profile */}
        <div className="profile">
          <div className="avatar-wrap">
            <div className="avatar-ring"></div>
            <label htmlFor="avatar-file-mobile" className="avatar" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
              <input id="avatar-file-mobile" type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={uploadAvatar} />
              {data.user.avatarUrl
                ? <img src={data.user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <i className="fa-solid fa-user" aria-hidden="true"></i>}
            </label>
            <div className="avatar__status" title="En línea"></div>
          </div>
          <p className="profile__name">
            {data.user.fullName}
            <span className="u-pill u-pill--accent">{data.user.rank || 'PRO'}</span>
          </p>
          <p className="profile__handle">@{data.user.username} · JD Internacional</p>
          <span className="u-pill u-pill--accent" style={{ marginTop: '4px', fontSize: '.74rem', padding: '5px 14px' }}>
            <span className="u-live-dot"></span>&nbsp;{data.user.rank || 'Plan'} · {data.user.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Plan CTA — mobile */}
        <div style={{ padding: '0 16px 4px' }}>
          <Link
            href="/dashboard/planes"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px 0', borderRadius: 12, textDecoration: 'none',
              fontWeight: 700, fontSize: 13, letterSpacing: '0.04em',
              background: data.user.rank && data.user.rank !== 'NONE'
                ? 'linear-gradient(135deg, rgba(0,245,255,0.12) 0%, rgba(0,255,136,0.08) 100%)'
                : 'linear-gradient(135deg, #00F5FF 0%, #00FF88 100%)',
              border: data.user.rank && data.user.rank !== 'NONE'
                ? '1px solid rgba(0,245,255,0.25)'
                : 'none',
              color: data.user.rank && data.user.rank !== 'NONE'
                ? '#00F5FF'
                : '#000',
            }}
          >
            <i className={`fa-solid ${data.user.rank && data.user.rank !== 'NONE' ? 'fa-rotate' : 'fa-crown'}`}></i>
            {data.user.rank && data.user.rank !== 'NONE' ? 'Renovar Plan' : 'Comprar Plan'}
          </Link>
        </div>

        {/* Feed */}
        <main className="feed" id="feed">
          {/* Hero total */}
          <div className="grid-2">
            <div className="d-card-comp metric metric--hero col-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="icon-chip chip--green"><i className="fa-solid fa-chart-line"></i></div>
                <span className="u-pill u-pill--up"><i className="fa-solid fa-arrow-trend-up"></i>+${earnings.total.toFixed(2)}</span>
              </div>
              <div>
                <p className="metric__label">Ganancias Acumuladas · Total</p>
                <p className="metric__value metric__value--hero">${earnings.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <p className="section-label"><i className="fa-solid fa-chart-bar"></i>Ganancias</p>
          <div className="grid-2">

            <div className="d-card-comp metric">
              <div className="icon-chip chip--rose"><i className="fa-solid fa-sun"></i></div>
              <p className="metric__label">Hoy</p>
              <p className="metric__value metric__value--dim">${earnings.today.toFixed(2)}</p>
              {todayVsYesterday !== 0
                ? <p className={`metric__delta ${todayUp ? 'u-up' : 'u-down'}`}><i className={`fa-solid fa-arrow-${todayUp ? 'up' : 'down'}`}></i> {todayUp ? '+' : ''}{todayVsYesterday.toFixed(1)}% vs ayer</p>
                : <p className="metric__delta u-flat">Sin cambio vs ayer</p>
              }
            </div>

            <div className="d-card-comp metric">
              <div className="icon-chip chip--accent"><i className="fa-solid fa-moon"></i></div>
              <p className="metric__label">Ayer</p>
              <p className="metric__value">${earnings.yesterday.toFixed(2)}</p>
              <p className="metric__delta u-flat">Día anterior</p>
            </div>

            <div className="d-card-comp metric col-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="metric__label">Semana</p>
                  <p className="metric__value">${earnings.week.toFixed(2)}</p>
                </div>
                <div className="icon-chip chip--green" style={{ width: '46px', height: '46px', fontSize: '1.1rem' }}>
                  <i className="fa-solid fa-calendar-week"></i>
                </div>
              </div>
              <p className={`metric__delta ${weekUp ? 'u-up' : 'u-flat'}`}><i className={`fa-solid fa-arrow-trend-${weekUp ? 'up' : 'right'}`}></i></p>
            </div>

          </div>

          {/* Distribution */}
          <p className="section-label"><i className="fa-solid fa-coins"></i>Distribución</p>
          <div className="grid-3">

            <div className="d-card-comp metric">
              <div className="icon-chip chip--amber"><i className="fa-solid fa-handshake"></i></div>
              <p className="metric__label">Patrocinio</p>
              <p className="metric__value metric__value--amber">${earnings.patrocinio.toFixed(0)}</p>
              <p className="metric__delta u-up"><i className="fa-solid fa-check"></i> Comisión directa</p>
            </div>

            <div className="d-card-comp metric">
              <div className="icon-chip chip--cyan"><i className="fa-solid fa-bolt"></i></div>
              <p className="metric__label">Directo</p>
              <p className="metric__value metric__value--dim">${earnings.direct.toFixed(0)}</p>
              <p className="metric__delta u-flat">Bono directo</p>
            </div>

            <div className="d-card-comp metric">
              <div className="icon-chip chip--pink"><i className="fa-solid fa-gift"></i></div>
              <p className="metric__label">B. Extra</p>
              <p className="metric__value metric__value--dim">${earnings.extra.toFixed(0)}</p>
              <p className="metric__delta u-flat">Bono extra</p>
            </div>

          </div>

          {/* Network */}
          <p className="section-label"><i className="fa-solid fa-network-wired"></i>Mi Red</p>
          <div className="grid-2">

            <Link href="/dashboard/network" className="d-card-comp metric" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="icon-chip chip--accent"><i className="fa-solid fa-diagram-project"></i></div>
              <p className="metric__label">Total Red</p>
              <p className="metric__value metric__value--net">{data.stats.totalNetwork}</p>
              <p className="metric__delta u-flat">miembros</p>
            </Link>

            <Link href="/dashboard/network" className="d-card-comp metric" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="icon-chip chip--cyan"><i className="fa-solid fa-user-group"></i></div>
              <p className="metric__label">Directos</p>
              <p className="metric__value metric__value--net-cyan">{data.stats.directReferrals}</p>
              <p className="metric__delta u-flat">nivel 1</p>
            </Link>

          </div>

          {/* Marketplace — mobile */}
          <p className="section-label"><i className="fa-solid fa-store"></i>Marketplace</p>
          <div className="grid-2">
            <Link href="/marketplace" className="d-card-comp metric" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <div className="icon-chip chip--cyan"><i className="fa-solid fa-graduation-cap"></i></div>
              <p className="metric__label">Marketplace</p>
              <p className="metric__delta u-flat">Explorar cursos</p>
            </Link>
            <div className="d-card-comp metric" style={{ cursor: 'default' }}>
              <div className="icon-chip chip--rose"><i className="fa-solid fa-bag-shopping"></i></div>
              <p className="metric__label">Mis Pedidos</p>
              <p className="metric__delta u-flat">Próximamente</p>
            </div>
          </div>

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           DESKTOP VIEW
      ═══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-full flex-1">

        {/* Main content */}
        <main className="d-main">

          {/* Banner + Profile */}
          <div style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', height: '200px', flexShrink: 0 }}>
            {IMAGES.map((img, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: `url('${img}')`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: imgIdx === i ? 1 : 0, transition: 'opacity 1.3s ease' }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11,11,18,0.88) 0%, rgba(11,11,18,0.25) 100%)' }} />
            {/* Profile overlay */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '20px', padding: '0 28px' }}>
              <div className="avatar-wrap" style={{ marginTop: 0 }}>
                <div className="avatar-ring" />
                <label htmlFor="avatar-file-desktop" className="avatar" style={{ cursor: uploading ? 'not-allowed' : 'pointer', width: 80, height: 80 }}>
                  <input id="avatar-file-desktop" type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={uploadAvatar} />
                  {data.user.avatarUrl
                    ? <img src={data.user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <i className="fa-solid fa-user" style={{ fontSize: '1.8rem' }} />}
                </label>
                <div className="avatar__status" />
              </div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>{data.user.fullName}</p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '5px 0 10px' }}>@{data.user.username} · JD Internacional</p>
                <span className="u-pill u-pill--accent" style={{ fontSize: '.72rem' }}>
                  <span className="u-live-dot" />&nbsp;{data.user.rank || 'Plan'} · {data.user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            {/* Dots */}
            <div className="cover__dots">
              {IMAGES.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`cover__dot ${imgIdx === i ? 'cover__dot--active' : ''}`} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Topbar */}
          <header className="topbar">
            <div>
              <h1 className="topbar__title">Dashboard</h1>
              <p className="topbar__sub">JD Internacional &nbsp;·&nbsp; <span className="tag-active"><span className="u-live-dot"></span>&nbsp;{data.user.rank || 'Plan'} {data.user.isActive ? 'Activo' : 'Inactivo'}</span></p>
            </div>
            <div className="period-toggle" role="group" aria-label="Período">
              <button className="period-btn period-btn--active">Total</button>
              <button className="period-btn">30 días</button>
              <button className="period-btn">7 días</button>
            </div>
          </header>

          {/* Countdown / CTA Plan */}
          {data.user.rank && data.user.rank !== 'NONE' && data.user.planExpiresAt ? (
            <div className="d-card-comp countdown-row">
              <div>
                <p className="d-card__label" style={{ marginBottom: 'var(--sp-3)' }}>
                  <i className="fa-solid fa-clock" style={{ color: 'var(--clr-accent-lt)' }}></i>&nbsp; Plan {data.user.rank} · Vence en
                </p>
                <div className="countdown-units">
                  <div className="countdown-unit">
                    <span className="countdown-num">{countdown ? String(countdown.d).padStart(2, '0') : '00'}</span>
                    <span className="countdown-lbl">Días</span>
                  </div>
                  <span className="countdown-sep">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{countdown ? String(countdown.h).padStart(2, '0') : '00'}</span>
                    <span className="countdown-lbl">Horas</span>
                  </div>
                  <span className="countdown-sep">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{countdown ? String(countdown.m).padStart(2, '0') : '00'}</span>
                    <span className="countdown-lbl">Min</span>
                  </div>
                  <span className="countdown-sep">:</span>
                  <div className="countdown-unit">
                    <span className="countdown-num">{countdown ? String(countdown.s).padStart(2, '0') : '00'}</span>
                    <span className="countdown-lbl">Seg</span>
                  </div>
                </div>
              </div>
              <Link href="/dashboard/planes" className="renew-btn"><i className="fa-solid fa-rotate"></i> Renovar Plan</Link>
            </div>
          ) : (
            <div className="d-card-comp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, background: 'linear-gradient(135deg, rgba(0,245,255,0.08) 0%, rgba(0,255,136,0.05) 100%)', border: '1px solid rgba(0,245,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="icon-chip chip--accent" style={{ width: 50, height: 50, fontSize: '1.3rem', flexShrink: 0 }}>
                  <i className="fa-solid fa-crown"></i>
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>¡Activa tu Plan JD Internacional!</p>
                  <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Desbloquea comisiones, bonos y acceso completo a la red.</p>
                </div>
              </div>
              <Link href="/dashboard/planes" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #00F5FF 0%, #00FF88 100%)', color: '#000', fontWeight: 800, fontSize: '.85rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <i className="fa-solid fa-crown"></i> Comprar Plan
              </Link>
            </div>
          )}

          {/* Earnings section */}
          <section>
            <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}><i className="fa-solid fa-chart-line"></i>Resumen de Ganancias</p>
            <div className="d-grid d-grid-4">

              {/* Hero */}
              <div className="d-card-comp card--accent d-card d-col-2">
                <div className="d-card__top">
                  <div>
                    <p className="d-card__label" style={{ marginBottom: 'var(--sp-2)' }}>Acumulado Total</p>
                    <p className="d-card__value d-card__value--lg">${earnings.total.toFixed(2)}</p>
                  </div>
                  <div className="icon-chip chip--green" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                    <i className="fa-solid fa-trophy"></i>
                  </div>
                </div>
                <span className="u-pill u-pill--up"><i className="fa-solid fa-arrow-trend-up"></i> +${earnings.week.toFixed(2)} en 7 días</span>
              </div>

              <div className="d-card-comp d-card">
                <div className="d-card__top">
                  <div className="icon-chip chip--rose"><i className="fa-solid fa-sun"></i></div>
                  <span className={`u-pill ${todayVsYesterday > 0 ? 'u-pill--up' : todayVsYesterday < 0 ? 'u-pill--down' : 'u-pill--flat'}`}>
                    {todayVsYesterday !== 0 && <i className={`fa-solid fa-arrow-${todayVsYesterday > 0 ? 'up' : 'down'}`}></i>}
                    {' '}{todayVsYesterday > 0 ? '+' : ''}{todayVsYesterday.toFixed(0)}% vs ayer
                  </span>
                </div>
                <p className="d-card__label">Hoy</p>
                <p className="d-card__value d-card__value--dim" style={{ fontSize: '1.9rem' }}>${earnings.today.toFixed(2)}</p>
              </div>

              <div className="d-card-comp d-card">
                <div className="d-card__top">
                  <div className="icon-chip chip--accent"><i className="fa-solid fa-moon"></i></div>
                  <span className="u-pill u-pill--flat">Día anterior</span>
                </div>
                <p className="d-card__label">Ayer</p>
                <p className="d-card__value d-card__value--accent" style={{ fontSize: '1.9rem' }}>${earnings.yesterday.toFixed(2)}</p>
              </div>

            </div>
          </section>

          {/* Semana + Distribution */}
          <div className="d-grid d-grid-2-1">

            <div className="d-card-comp d-card">
              <div className="d-card__top">
                <div>
                  <p className="d-card__label" style={{ marginBottom: 'var(--sp-2)' }}>Semana</p>
                  <p className="d-card__value">${earnings.week.toFixed(2)}</p>
                </div>
                <div className="icon-chip chip--green"><i className="fa-solid fa-calendar-week"></i></div>
              </div>
              <span className="u-pill u-pill--up"><i className="fa-solid fa-arrow-trend-up"></i> Semana en curso</span>
            </div>

            <div className="d-card-comp d-card">
              <p className="d-card__label" style={{ marginBottom: 'var(--sp-3)' }}>Distribución</p>
              <div className="dist-list">
                <div className="dist-row">
                  <span className="dist-row__label"><i className="fa-solid fa-handshake" style={{ color: 'var(--clr-amber)' }}></i> Patrocinio</span>
                  <span className="dist-row__val" style={{ color: 'var(--clr-amber)' }}>${earnings.patrocinio.toFixed(0)}</span>
                </div>
                <div className="dist-row">
                  <span className="dist-row__label"><i className="fa-solid fa-bolt" style={{ color: 'var(--clr-cyan)' }}></i> Directo</span>
                  <span className="dist-row__val" style={{ color: 'var(--clr-cyan)' }}>${earnings.direct.toFixed(0)}</span>
                </div>
                <div className="dist-row">
                  <span className="dist-row__label"><i className="fa-solid fa-gift" style={{ color: 'var(--clr-pink)' }}></i> B. Extra</span>
                  <span className="dist-row__val" style={{ color: 'var(--clr-muted)' }}>${earnings.extra.toFixed(0)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Network */}
          <section>
            <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}><i className="fa-solid fa-network-wired"></i>Mi Red</p>
            <div className="d-grid d-grid-3">

              <Link href="/dashboard/network" className="d-card-comp d-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div className="d-card__top">
                  <div className="icon-chip chip--accent"><i className="fa-solid fa-diagram-project"></i></div>
                  <span className="u-pill u-pill--accent">Red total</span>
                </div>
                <p className="d-card__label">Mi Red</p>
                <p className="d-card__value d-card__value--lg">{data.stats.totalNetwork}</p>
                <p style={{ fontSize: '.76rem', color: 'var(--clr-muted)' }}>miembros totales</p>
              </Link>

              <Link href="/dashboard/network" className="d-card-comp d-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div className="d-card__top">
                  <div className="icon-chip chip--cyan"><i className="fa-solid fa-user-group"></i></div>
                  <span className="u-pill" style={{ background: 'var(--clr-cyan-bg)', color: 'var(--clr-cyan)' }}>Nivel 1</span>
                </div>
                <p className="d-card__label">Directos</p>
                <p className="d-card__value d-card__value--cyan" style={{ fontSize: '3.2rem' }}>{data.stats.directReferrals}</p>
                <p style={{ fontSize: '.76rem', color: 'var(--clr-muted)' }}>referidos directos</p>
              </Link>

              <div className="d-card-comp d-card" style={{ overflowY: 'auto', maxHeight: '220px' }}>
                <p className="d-card__label" style={{ marginBottom: 'var(--sp-3)' }}>Frontales</p>
                {data.tree.length === 0
                  ? <p style={{ fontSize: '.76rem', color: 'var(--clr-muted)', textAlign: 'center', padding: '16px 0' }}>Sin referidos directos aún</p>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {data.tree.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.isActive ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, color: m.isActive ? 'var(--clr-accent-lt)' : 'var(--clr-muted)', flexShrink: 0 }}>
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '.75rem', fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fullName}</p>
                            <p style={{ fontSize: '.65rem', color: 'var(--clr-muted)', margin: 0 }}>@{m.username}</p>
                          </div>
                          <span style={{ fontSize: '.6rem', padding: '2px 7px', borderRadius: '99px', background: m.isActive ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.06)', color: m.isActive ? 'var(--clr-accent-lt)' : 'var(--clr-muted)', flexShrink: 0 }}>
                            {m.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ))}
                    </div>
                }
              </div>

            </div>
          </section>

          {/* Marketplace */}
          <section>
            <p className="section-label" style={{ marginBottom: 'var(--sp-4)' }}><i className="fa-solid fa-store"></i>Marketplace</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <Link href="/marketplace" className="d-card-comp d-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div className="d-card__top">
                  <div className="icon-chip chip--cyan"><i className="fa-solid fa-graduation-cap"></i></div>
                </div>
                <p className="d-card__label">Explorar</p>
                <p style={{ fontSize: '.8rem', color: 'var(--clr-muted)', marginTop: '4px' }}>Marketplace de Cursos</p>
              </Link>
              <div className="d-card-comp d-card" style={{ cursor: 'default' }}>
                <div className="d-card__top">
                  <div className="icon-chip chip--rose"><i className="fa-solid fa-bag-shopping"></i></div>
                </div>
                <p className="d-card__label">Mis Pedidos</p>
                <p style={{ fontSize: '.8rem', color: 'var(--clr-muted)', marginTop: '4px' }}>Próximamente</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

