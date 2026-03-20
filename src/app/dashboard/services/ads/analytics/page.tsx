'use client'

import { useState, useEffect } from 'react'
import {
    ArrowLeft, Loader2, TrendingUp, Eye, MousePointerClick,
    DollarSign, Users, MessageCircle, RefreshCw, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import {
    ResponsiveContainer, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'

interface DayData {
    date: string
    impressions: number
    clicks: number
    spend: number
    reach: number
    conversations: number
}

const PERIODS = [
    { key: '7d',  label: '7 días' },
    { key: '14d', label: '14 días' },
    { key: '30d', label: '30 días' },
]

const METRICS = [
    { key: 'spend',         label: 'Gasto',          color: '#10B981', unit: '$',  icon: DollarSign },
    { key: 'clicks',        label: 'Clics',           color: '#8B5CF6', unit: '',   icon: MousePointerClick },
    { key: 'impressions',   label: 'Impresiones',     color: '#3B82F6', unit: '',   icon: Eye },
    { key: 'reach',         label: 'Alcance',         color: '#F59E0B', unit: '',   icon: Users },
    { key: 'conversations', label: 'Conversaciones',  color: '#EC4899', unit: '',   icon: MessageCircle },
]

function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
}

function fmtDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: '#0D0F1E',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '11px',
        }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 700 }}>
                {fmtDate(label)}
            </p>
            {payload.map((entry: any) => (
                <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.name}:</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>
                        {entry.dataKey === 'spend' ? `$${Number(entry.value).toFixed(2)}` : fmt(Number(entry.value))}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default function AnalyticsPage() {
    const [daily, setDaily] = useState<DayData[]>([])
    const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
    const [period, setPeriod] = useState('30d')
    const [selectedCampaign, setSelectedCampaign] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeMetrics, setActiveMetrics] = useState<Set<string>>(new Set(['spend', 'clicks', 'impressions']))

    useEffect(() => { fetchData(false) }, [period, selectedCampaign])

    async function fetchData(manual: boolean) {
        if (manual) setRefreshing(true)
        else setLoading(true)
        try {
            const params = new URLSearchParams({ period })
            if (selectedCampaign !== 'ALL') params.set('campaignIds', selectedCampaign)
            const res = await fetch(`/api/ads/metrics/daily?${params}`)
            const data = await res.json()
            setDaily(data.daily || [])
            setCampaigns(data.campaigns || [])
        } catch {}
        finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Summary totals
    const totals = daily.reduce((acc, d) => ({
        impressions:   acc.impressions   + d.impressions,
        clicks:        acc.clicks        + d.clicks,
        spend:         acc.spend         + d.spend,
        reach:         acc.reach         + d.reach,
        conversations: acc.conversations + d.conversations,
    }), { impressions: 0, clicks: 0, spend: 0, reach: 0, conversations: 0 })

    const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00'
    const cpm = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000).toFixed(2) : '0.00'

    const hasData = daily.length > 0
    const hasConversations = daily.some(d => d.conversations > 0)

    function toggleMetric(key: string) {
        setActiveMetrics(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                if (next.size === 1) return prev // keep at least 1
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-5xl mx-auto pb-24 text-white">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/services/ads"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft size={15} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter">Analytics de Campañas</h1>
                    <p className="text-[11px] text-white/30">Métricas diarias de tus campañas publicadas</p>
                </div>
                <button onClick={() => fetchData(true)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <RefreshCw size={14} className={refreshing ? 'animate-spin text-purple-400' : ''} />
                </button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2 mb-6">
                {/* Period */}
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${period === p.key ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white/70'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Campaign selector */}
                {campaigns.length > 1 && (
                    <select
                        value={selectedCampaign}
                        onChange={e => setSelectedCampaign(e.target.value)}
                        className="bg-[#0d0d1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 [&>option]:bg-[#0d0d1a]"
                    >
                        <option value="ALL">Todas las campañas</option>
                        {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 size={28} className="animate-spin text-purple-400" />
                    <p className="text-white/30 text-sm">Cargando métricas...</p>
                </div>
            ) : !hasData ? (
                <div className="text-center py-24 bg-white/[0.015] border border-dashed border-white/8 rounded-3xl">
                    <BarChart3 size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 font-bold text-sm">Sin datos para este período</p>
                    <p className="text-white/20 text-xs mt-1">Publica campañas para ver métricas aquí</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: 'Gasto',          value: `$${totals.spend.toFixed(2)}`,   color: 'text-green-400',  icon: DollarSign },
                            { label: 'Clics',          value: fmt(totals.clicks),               color: 'text-purple-400', icon: MousePointerClick },
                            { label: 'Impresiones',    value: fmt(totals.impressions),          color: 'text-blue-400',   icon: Eye },
                            { label: 'Alcance',        value: fmt(totals.reach),               color: 'text-orange-400', icon: Users },
                            { label: 'CTR',            value: `${ctr}%`,                       color: 'text-teal-400',   icon: TrendingUp },
                            { label: 'CPM',            value: `$${cpm}`,                       color: 'text-pink-400',   icon: DollarSign },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-3.5">
                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-1.5 ${color}`}>
                                    <Icon size={11} /> {label}
                                </div>
                                <p className="text-base font-black">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Metric toggles */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {METRICS.filter(m => m.key !== 'conversations' || hasConversations).map(m => (
                            <button
                                key={m.key}
                                onClick={() => toggleMetric(m.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    activeMetrics.has(m.key)
                                        ? 'border-transparent text-white'
                                        : 'bg-white/3 border-white/10 text-white/30 hover:text-white/60'
                                }`}
                                style={activeMetrics.has(m.key) ? { background: m.color + '22', borderColor: m.color + '55', color: m.color } : {}}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeMetrics.has(m.key) ? m.color : 'rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 md:p-6">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    {METRICS.map(m => (
                                        <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={m.color} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDate}
                                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={Math.max(0, Math.floor(daily.length / 6) - 1)}
                                />

                                <YAxis
                                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={v => fmt(Number(v))}
                                    width={40}
                                />

                                <Tooltip content={<CustomTooltip />} />

                                {METRICS
                                    .filter(m => activeMetrics.has(m.key) && (m.key !== 'conversations' || hasConversations))
                                    .map(m => (
                                        <Area
                                            key={m.key}
                                            type="monotone"
                                            dataKey={m.key}
                                            name={m.label}
                                            stroke={m.color}
                                            strokeWidth={2}
                                            fill={`url(#grad-${m.key})`}
                                            dot={false}
                                            activeDot={{ r: 4, strokeWidth: 0 }}
                                        />
                                    ))
                                }
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily table */}
                    <div className="mt-4 bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/6">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Detalle diario</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['Fecha', 'Gasto', 'Clics', 'Impresiones', 'Alcance', 'CTR', ...(hasConversations ? ['Conversaciones'] : [])].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-white/25">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...daily].reverse().map(d => {
                                        const ctrDay = d.impressions > 0 ? ((d.clicks / d.impressions) * 100).toFixed(2) : '0.00'
                                        return (
                                            <tr key={d.date} className="border-b border-white/4 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-2.5 text-white/60 font-medium">{fmtDate(d.date)}</td>
                                                <td className="px-4 py-2.5 text-green-400 font-bold">${d.spend.toFixed(2)}</td>
                                                <td className="px-4 py-2.5 text-purple-400 font-bold">{fmt(d.clicks)}</td>
                                                <td className="px-4 py-2.5 text-blue-400">{fmt(d.impressions)}</td>
                                                <td className="px-4 py-2.5 text-orange-400">{fmt(d.reach)}</td>
                                                <td className="px-4 py-2.5 text-teal-400">{ctrDay}%</td>
                                                {hasConversations && <td className="px-4 py-2.5 text-pink-400">{d.conversations}</td>}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
