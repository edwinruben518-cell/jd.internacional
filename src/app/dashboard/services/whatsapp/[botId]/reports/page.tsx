'use client'

import { useEffect, useState, useMemo } from 'react'
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

// ── Gráfica SVG pura ──────────────────────────────────────────────────────────
function LineChart({ days, metric }: { days: DayData[]; metric: 'conversations' | 'sales' }) {
  const W = 600
  const H = 160
  const padL = 32
  const padR = 12
  const padT = 12
  const padB = 28

  const values = days.map(d => d[metric])
  const maxVal = Math.max(...values, 1)

  const points = days.map((d, i) => {
    const x = padL + (i / (days.length - 1)) * (W - padL - padR)
    const y = padT + (1 - d[metric] / maxVal) * (H - padT - padB)
    return { x, y, d }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x.toFixed(1)} ${(H - padB).toFixed(1)} L ${points[0].x.toFixed(1)} ${(H - padB).toFixed(1)} Z`

  const color = metric === 'sales' ? '#00FF88' : '#00F5FF'
  const colorFade = metric === 'sales' ? 'rgba(0,255,136,0.12)' : 'rgba(0,245,255,0.1)'
  const gradId = `grad-${metric}`

  // Y axis labels
  const yLabels = [0, Math.round(maxVal / 2), maxVal]

  // X axis: show only first, middle, last date labels
  const xLabels = [0, Math.floor(days.length / 2), days.length - 1]

  function fmtDate(iso: string) {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = padT + (1 - v / maxVal) * (H - padT - padB)
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.25)">{v}</text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        p.d[metric] > 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#0d0d15" strokeWidth="1.5" />
        ) : null
      ))}

      {/* X axis labels */}
      {xLabels.map(i => (
        <text key={i} x={points[i].x} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)">
          {fmtDate(days[i].date)}
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
