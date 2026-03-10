'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface DayData {
  date: string
  conversations: number
  sales: number
}

interface RecentSale {
  userName: string | null
  userPhone: string
  soldAt: string | null
}

interface Analytics {
  botName: string
  stats: {
    totalConversations: number
    totalSales: number
    salesToday: number
    salesThisWeek: number
    conversionRate: number
  }
  days: DayData[]
  recentSales: RecentSale[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function smoothCurve(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const t = 0.25
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// ── Gráfica SVG ───────────────────────────────────────────────────────────────
function LineChart({ days, metric }: { days: DayData[]; metric: 'conversations' | 'sales' }) {
  const W = 620, H = 180, padL = 36, padR = 16, padT = 28, padB = 36

  const values = days.map(d => d[metric])
  const maxVal = Math.max(...values, 1)
  const color  = metric === 'sales' ? '#00FF88' : '#00F5FF'
  const color2 = metric === 'sales' ? '#00E676' : '#00B8D9'
  const uid    = `lc-${metric}`

  const pts = days.map((d, i) => ({
    x: padL + (days.length > 1 ? i / (days.length - 1) : 0.5) * (W - padL - padR),
    y: padT + (1 - d[metric] / maxVal) * (H - padT - padB),
    val: d[metric],
    sales: d.sales,
    date: d.date,
  }))

  const line = smoothCurve(pts)
  const area = line ? `${line} L ${pts[pts.length-1].x.toFixed(1)} ${(H-padB).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H-padB).toFixed(1)} Z` : ''

  // X labels every ~7 days
  const xIdx = Array.from({ length: days.length }, (_, i) => i).filter(i => i % 7 === 0 || i === days.length - 1)
  // Y labels
  const yVals = [0, Math.round(maxVal / 2), maxVal]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        {/* Gradient área */}
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="60%"  stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {/* Gradient línea */}
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={color2} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Glow fuerte para badges */}
        <filter id={`${uid}-dot-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Grid horizontal — líneas punteadas */}
      {yVals.map((v, i) => {
        const y = padT + (1 - v / maxVal) * (H - padT - padB)
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              strokeDasharray={i === 0 ? 'none' : '4 6'} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="8"
              fill="rgba(255,255,255,0.2)" fontFamily="monospace">{v}</text>
          </g>
        )
      })}

      {/* Línea base */}
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Área degradada */}
      {area && <path d={area} fill={`url(#${uid}-area)`} />}

      {/* Línea principal — delgada con glow */}
      {line && (
        <path d={line} fill="none"
          stroke={`url(#${uid}-line)`} strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round"
          filter={`url(#${uid}-glow)`} />
      )}

      {/* Puntos y badges de venta */}
      {pts.map((p, i) => {
        if (p.val === 0) return null
        const isSale = metric === 'sales' && p.sales > 0
        return (
          <g key={i} filter={isSale ? `url(#${uid}-dot-glow)` : undefined}>
            {isSale && (
              <>
                {/* Halo exterior */}
                <circle cx={p.x} cy={p.y} r="10" fill={color} opacity="0.08" />
                {/* Badge número de venta */}
                <rect x={p.x - 10} y={p.y - 28} width="20" height="14" rx="4"
                  fill={color} opacity="0.9" />
                <text x={p.x} y={p.y - 18} textAnchor="middle"
                  fontSize="8" fontWeight="800" fill="#000">{p.sales}</text>
                {/* Línea conectora badge → punto */}
                <line x1={p.x} y1={p.y - 14} x2={p.x} y2={p.y - 5}
                  stroke={color} strokeWidth="1" opacity="0.5" />
              </>
            )}
            {/* Punto principal */}
            <circle cx={p.x} cy={p.y} r={isSale ? 4 : 2.5}
              fill={color} stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
            {/* Halo inner para ventas */}
            {isSale && <circle cx={p.x} cy={p.y} r="2" fill="#fff" opacity="0.6" />}
          </g>
        )
      })}

      {/* Etiquetas X — fechas formateadas */}
      {xIdx.map(i => (
        <text key={i} x={pts[i].x} y={H - 6} textAnchor="middle"
          fontSize="8.5" fill="rgba(255,255,255,0.28)" fontFamily="system-ui">
          {fmtShort(days[i].date)}
        </text>
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BotReportsPage() {
  const { botId } = useParams<{ botId: string }>()
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMetric, setActiveMetric] = useState<'conversations' | 'sales'>('sales')

  useEffect(() => {
    fetch(`/api/bots/${botId}/analytics`)
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error) } else { setData(d) }; setLoading(false) })
      .catch(() => { setError('Error al cargar los datos'); setLoading(false) })
  }, [botId])

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="px-4 sm:px-6 pt-6 max-w-4xl mx-auto">
        <Link href="/dashboard/services/whatsapp" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Volver</Link>
        <p className="text-red-400 text-sm mt-4">{error || 'Error al cargar'}</p>
      </div>
    )
  }

  const { stats, days, recentSales, botName } = data

  return (
    <div className="px-4 sm:px-6 pt-6 pb-12 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/services/whatsapp" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 20 }}>
        ← Volver a bots
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          📊 Reportes
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{botName}</p>
        <div style={{ height: 2, width: 60, marginTop: 10, borderRadius: 99, background: 'linear-gradient(90deg, #00F5FF, #00FF88)' }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }} className="sm:grid-cols-4 sm:gap-3">
        {[
          { label: 'Total personas', value: stats.totalConversations, color: '#00F5FF' },
          { label: 'Total ventas', value: stats.totalSales, color: '#00FF88' },
          { label: 'Ventas hoy', value: stats.salesToday, color: '#F5A623' },
          { label: 'Conversión', value: `${stats.conversionRate}%`, color: '#FF2DF7' },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div style={{ borderRadius: 16, padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Últimos 30 días</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['sales', 'conversations'] as const).map(m => (
              <button key={m} onClick={() => setActiveMetric(m)}
                style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                  background: activeMetric === m ? (m === 'sales' ? 'rgba(0,255,136,0.1)' : 'rgba(0,245,255,0.1)') : 'transparent',
                  borderColor: activeMetric === m ? (m === 'sales' ? 'rgba(0,255,136,0.4)' : 'rgba(0,245,255,0.4)') : 'rgba(255,255,255,0.1)',
                  color: activeMetric === m ? (m === 'sales' ? '#00FF88' : '#00F5FF') : 'rgba(255,255,255,0.4)',
                }}>
                {m === 'sales' ? 'Ventas' : 'Personas'}
              </button>
            ))}
          </div>
        </div>
        <LineChart days={days} metric={activeMetric} />
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>
          {activeMetric === 'sales' ? 'Ventas confirmadas por día' : 'Conversaciones iniciadas por día'}
        </p>
      </div>

      {/* Recent sales */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ padding: '14px 18px', background: 'rgba(0,255,136,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>
            Ventas recientes
            <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>últimas {recentSales.length}</span>
          </p>
        </div>

        {recentSales.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aún no hay ventas registradas.</p>
          </div>
        ) : (
          <div>
            {recentSales.map((sale, i) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < recentSales.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>✓</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sale.userName || 'Sin nombre'}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{sale.userPhone}</p>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(sale.soldAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
