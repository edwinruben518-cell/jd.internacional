'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Plus, Play, Pause, Trash2, Eye,
    Loader2, MessageSquare, AlertCircle,
    Download, Wifi, RotateCcw, Smartphone, Lock,
    Users, CheckCircle, XCircle, TrendingUp, Zap
} from 'lucide-react'

const CRM_LIMITS: Record<string, number> = { NONE: 0, BASIC: 5, PRO: 10, ELITE: 20 }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; stripe: string }> = {
    DRAFT:     { label: 'Borrador',   color: 'text-white/50',   bg: 'bg-white/5',        stripe: '#ffffff18' },
    SCHEDULED: { label: 'Programado', color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   stripe: '#00F5FF' },
    RUNNING:   { label: 'Enviando',   color: 'text-green-400',  bg: 'bg-green-400/10',  stripe: '#00FF88' },
    COMPLETED: { label: 'Completado', color: 'text-purple-400', bg: 'bg-purple-400/10', stripe: '#a855f7' },
    PAUSED:    { label: 'Pausado',    color: 'text-yellow-400', bg: 'bg-yellow-400/10', stripe: '#facc15' },
    FAILED:    { label: 'Fallido',    color: 'text-red-400',    bg: 'bg-red-400/10',    stripe: '#f87171' },
}

export default function CrmPage() {
    const router = useRouter()
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [reenvying, setReenvying] = useState<string | null>(null)
    const [userPlan, setUserPlan] = useState<string>('NONE')

    useEffect(() => {
        fetchCampaigns()
        fetch('/api/plan-status').then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan) }).catch(() => {})
    }, [])

    useEffect(() => {
        const hasRunning = campaigns.some(c => c.status === 'RUNNING')
        if (!hasRunning) return
        const interval = setInterval(fetchCampaigns, 5000)
        return () => clearInterval(interval)
    }, [campaigns])

    async function fetchCampaigns() {
        try {
            const res = await fetch('/api/crm/campaigns')
            const data = await res.json()
            setCampaigns(data.campaigns || [])
        } catch { setError('Error al cargar campañas') }
        finally { setLoading(false) }
    }

    async function deleteCampaign(id: string) {
        if (!confirm('¿Eliminar esta campaña? Se borrarán todos los contactos y logs.')) return
        setDeleting(id)
        try {
            await fetch(`/api/crm/campaigns/${id}`, { method: 'DELETE' })
            setCampaigns(prev => prev.filter(c => c.id !== id))
        } catch { setError('Error al eliminar') }
        finally { setDeleting(null) }
    }

    async function pauseCampaign(id: string) {
        await fetch(`/api/crm/campaigns/${id}/pause`, { method: 'POST' })
        fetchCampaigns()
    }

    async function executeCampaign(id: string) {
        const res = await fetch(`/api/crm/campaigns/${id}/execute`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        fetchCampaigns()
    }

    async function reenviarCampaign(id: string) {
        setReenvying(id)
        try {
            const res = await fetch(`/api/crm/campaigns/${id}/duplicate`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al reenviar'); return }
            router.push(`/dashboard/crm/${data.campaign.id}`)
        } catch { setError('Error al reenviar campaña') }
        finally { setReenvying(null) }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
        </div>
    )

    const limit = CRM_LIMITS[userPlan] ?? 0
    const limitReached = campaigns.length >= limit
    const totalContacts = campaigns.reduce((s, c) => s + (c._count?.contacts ?? c.totalContacts ?? 0), 0)
    const totalSent = campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0)
    const totalFailed = campaigns.reduce((s, c) => s + (c.failedCount ?? 0), 0)
    const overallPct = totalContacts > 0 ? Math.round((totalSent / totalContacts) * 100) : 0

    return (
        <div className="px-4 md:px-6 pt-6 max-w-screen-xl mx-auto pb-24 text-white">

            {/* ── Header ── */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-500/50 mb-1.5">WhatsApp Broadcasting</p>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                            CRM{' '}
                            <span style={{ background: 'linear-gradient(90deg, #00F5FF, #00FF88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Broadcast
                            </span>
                        </h1>
                        {limit > 0 && (
                            <div className="flex items-center gap-3 mt-3">
                                <div className="h-1 w-28 bg-white/8 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (campaigns.length / limit) * 100)}%`, background: 'linear-gradient(90deg, #00F5FF, #00FF88)' }}
                                    />
                                </div>
                                <p className={`text-xs font-bold ${limitReached ? 'text-red-400' : 'text-white/30'}`}>
                                    {campaigns.length}/{limit} campañas
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/dashboard/crm/export"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all"
                        >
                            <Download size={14} /> Exportar
                        </Link>
                        {limitReached ? (
                            <Link
                                href="/dashboard/planes"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-black transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #00F5FF, #00FF88)' }}
                            >
                                <Lock size={14} /> Mejorar plan
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard/crm/new"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide text-black transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #00F5FF, #00FF88)' }}
                            >
                                <Plus size={14} /> Nueva campaña
                            </Link>
                        )}
                    </div>
                </div>

                {/* Aggregate stats */}
                {campaigns.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2 flex items-center gap-1.5">
                                <MessageSquare size={10} /> Campañas
                            </p>
                            <p className="text-2xl font-black text-white">{campaigns.length}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2 flex items-center gap-1.5">
                                <Users size={10} /> Contactos
                            </p>
                            <p className="text-2xl font-black text-white">{totalContacts.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-green-500/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2 flex items-center gap-1.5">
                                <CheckCircle size={10} className="text-green-400/60" /> Enviados
                            </p>
                            <p className="text-2xl font-black text-green-400">{totalSent.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2 flex items-center gap-1.5">
                                <TrendingUp size={10} /> Tasa de éxito
                            </p>
                            <p className="text-2xl font-black" style={overallPct > 0 ? { background: 'linear-gradient(90deg, #00F5FF, #00FF88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: 'rgba(255,255,255,0.2)' }}>
                                {overallPct}%
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="font-bold text-red-400/60 hover:text-red-400 transition-all">✕</button>
                </div>
            )}

            {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="relative mb-6">
                        <div
                            className="w-20 h-20 rounded-3xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.08), rgba(0,255,136,0.08))', border: '1px solid rgba(0,245,255,0.15)' }}
                        >
                            <MessageSquare size={32} className="text-cyan-400" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <Plus size={11} className="text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">Sin campañas todavía</h3>
                    <p className="text-white/30 text-sm mb-7 max-w-xs leading-relaxed">
                        Creá tu primera campaña y enviá mensajes masivos por WhatsApp con IA personalizada
                    </p>
                    <Link
                        href="/dashboard/crm/new"
                        className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black hover:opacity-90 transition-all"
                        style={{ background: 'linear-gradient(135deg, #00F5FF, #00FF88)' }}
                    >
                        <Plus size={15} /> Nueva campaña
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {campaigns.map(c => {
                        const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT
                        const total = c._count?.contacts ?? c.totalContacts ?? 0
                        const pct = total > 0 ? Math.min(100, Math.round((c.sentCount / total) * 100)) : 0
                        const isRunning = c.status === 'RUNNING'

                        return (
                            <div
                                key={c.id}
                                className="relative overflow-hidden flex flex-col rounded-2xl border border-white/8 bg-white/[0.02]"
                                style={{ borderLeft: `3px solid ${sc.stripe}` }}
                            >
                                {/* Glow pulse for running */}
                                {isRunning && (
                                    <div className="absolute top-0 left-0 w-full h-0.5 animate-pulse" style={{ background: 'linear-gradient(90deg, #00FF88, transparent)' }} />
                                )}

                                {/* Card body */}
                                <div className="p-5 flex-1">
                                    {/* Title row */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-white text-[15px] truncate leading-tight">{c.name}</p>
                                            {c.bot?.type === 'WHATSAPP_CLOUD' ? (
                                                <p className="flex items-center gap-1.5 text-[11px] text-green-400 mt-1 font-bold">
                                                    <Wifi size={10} /> Cloud API · {c.bot.name}
                                                </p>
                                            ) : c.bot?.baileysPhone ? (
                                                <p className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-1 font-bold">
                                                    <Smartphone size={10} /> QR · +{c.bot.baileysPhone}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-white/20 mt-1">Sin bot conectado</p>
                                            )}
                                        </div>
                                        <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 ${sc.color} ${sc.bg}`}>
                                            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
                                            {sc.label}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="flex flex-col items-center bg-white/5 rounded-xl py-2.5">
                                            <p className="text-base font-black text-white leading-none">{total}</p>
                                            <p className="text-[9px] text-white/25 uppercase mt-1 font-bold tracking-wider">Total</p>
                                        </div>
                                        <div className="flex flex-col items-center bg-green-500/5 border border-green-500/10 rounded-xl py-2.5">
                                            <p className="text-base font-black text-green-400 leading-none">{c.sentCount}</p>
                                            <p className="text-[9px] text-white/25 uppercase mt-1 font-bold tracking-wider">Enviados</p>
                                        </div>
                                        <div className="flex flex-col items-center bg-red-500/5 border border-red-500/10 rounded-xl py-2.5">
                                            <p className="text-base font-black text-red-400 leading-none">{c.failedCount}</p>
                                            <p className="text-[9px] text-white/25 uppercase mt-1 font-bold tracking-wider">Fallidos</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {total > 0 && (
                                        <div>
                                            <div className="flex justify-between items-center text-[10px] text-white/25 mb-1.5">
                                                <span>Progreso</span>
                                                <span className={`font-black ${pct === 100 ? 'text-green-400' : sc.color}`}>{pct}%</span>
                                            </div>
                                            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: pct === 100 ? '#00FF88' : `linear-gradient(90deg, ${sc.stripe}, ${sc.stripe}80)` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Image previews */}
                                    {c.images?.length > 0 && (
                                        <div className="flex gap-1.5 mt-4">
                                            {c.images.slice(0, 4).map((img: any, i: number) => (
                                                <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {c.images.length > 4 && (
                                                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                                    <span className="text-[9px] text-white/30 font-black">+{c.images.length - 4}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action bar */}
                                <div className="flex gap-1.5 px-4 py-3 border-t border-white/5 bg-white/[0.01]">
                                    <Link
                                        href={`/dashboard/crm/${c.id}`}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-white/50 hover:text-white"
                                    >
                                        <Eye size={12} /> Ver
                                    </Link>

                                    {isRunning ? (
                                        <button
                                            onClick={() => pauseCampaign(c.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition-all border border-yellow-500/15"
                                        >
                                            <Pause size={12} /> Pausar
                                        </button>
                                    ) : c.status === 'COMPLETED' ? (
                                        <button
                                            onClick={() => reenviarCampaign(c.id)}
                                            disabled={reenvying === c.id}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold transition-all border border-purple-500/15 disabled:opacity-50"
                                        >
                                            {reenvying === c.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                            Reenviar
                                        </button>
                                    ) : ['DRAFT', 'SCHEDULED', 'PAUSED', 'FAILED'].includes(c.status) ? (
                                        <button
                                            onClick={() => executeCampaign(c.id)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                                c.status === 'FAILED'
                                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15'
                                                    : 'text-black hover:opacity-90'
                                            }`}
                                            style={c.status !== 'FAILED' ? { background: 'linear-gradient(135deg, #00F5FF, #00FF88)' } : {}}
                                        >
                                            {c.status === 'FAILED' ? <RotateCcw size={12} /> : <Zap size={12} />}
                                            {c.status === 'PAUSED' ? 'Reanudar' : c.status === 'FAILED' ? 'Reintentar' : 'Enviar'}
                                        </button>
                                    ) : null}

                                    {!isRunning && (
                                        <button
                                            onClick={() => deleteCampaign(c.id)}
                                            disabled={deleting === c.id}
                                            className="w-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                                        >
                                            {deleting === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
