'use client'

import { useState, useEffect, Suspense } from 'react'
import {
    Megaphone, Plus, ArrowRight, CheckCircle2,
    Sparkles, FileText, Zap, BarChart3, Settings2,
    AlertCircle, Loader2, Brain, Rocket, TrendingUp,
    Play, Clock, XCircle, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const PLATFORMS = [
    { id: 'META', label: 'Meta Ads', sub: 'Facebook & Instagram', color: '#0081FB', letter: 'f', textColor: 'text-blue-400' },
    { id: 'TIKTOK', label: 'TikTok Ads', sub: 'TikTok for Business', color: '#EE1D52', letter: 'T', textColor: 'text-red-400' },
    { id: 'GOOGLE_ADS', label: 'Google Ads', sub: 'Search & Display', color: '#4285F4', letter: 'G', textColor: 'text-yellow-400' },
]

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
    DRAFT: { label: 'Borrador', color: 'text-white/50 bg-white/5 border-white/10', dot: 'bg-white/30' },
    READY: { label: 'Listo', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
    PUBLISHING: { label: 'Publicando', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400 animate-pulse' },
    PUBLISHED: { label: 'Publicado', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-400' },
    FAILED: { label: 'Fallido', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
    PAUSED: { label: 'Pausado', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
}

export default function AdsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    }>
      <AdsDashboardInner />
    </Suspense>
  )
}

function AdsDashboardInner() {
    const [integrations, setIntegrations] = useState<any[]>([])
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [brief, setBrief] = useState<any>(null)
    const [allBriefs, setAllBriefs] = useState<any[]>([])
    const [openaiConfig, setOpenaiConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        const err = searchParams.get('error')
        if (err) setError(decodeURIComponent(err))
        const connected = searchParams.get('connected')
        fetchAll()
    }, [searchParams])

    async function fetchAll() {
        setLoading(true)
        try {
            const [intRes, campaignRes, briefRes, oaiRes] = await Promise.all([
                fetch('/api/ads/integrations/status'),
                fetch('/api/ads/campaign'),
                fetch('/api/ads/brief'),
                fetch('/api/ads/config/openai')
            ])
            const [iData, cData, bData, oData] = await Promise.all([
                intRes.json(), campaignRes.json(), briefRes.json(), oaiRes.json()
            ])
            setIntegrations(iData.integrations || [])
            setCampaigns(cData.campaigns || [])
            setBrief(bData.brief || null)
            setAllBriefs(bData.briefs || [])
            setOpenaiConfig(oData.config || null)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (platformId: string) => {
        try {
            const res = await fetch(`/api/ads/integrations/${platformId.toLowerCase()}/connect/start`, { method: 'POST' })
            const { authUrl } = await res.json()
            if (authUrl) window.location.href = authUrl
        } catch { alert('Error al conectar plataforma') }
    }

    const hasOpenAI = openaiConfig?.isValid
    // brief here is bData.brief (first brief) — also check briefs array
    const hasBrief = !!brief
    const hasIntegration = integrations.some(i => i.status === 'CONNECTED')
    const allReady = hasOpenAI && hasBrief && hasIntegration
    const stepsCompleted = [hasOpenAI, hasBrief, hasIntegration].filter(Boolean).length

    const stats = [
        { label: 'Total', value: campaigns.length, color: 'text-white', icon: BarChart3 },
        { label: 'Publicadas', value: campaigns.filter(c => c.status === 'PUBLISHED').length, color: 'text-green-400', icon: Play },
        { label: 'Borradores', value: campaigns.filter(c => ['DRAFT', 'READY'].includes(c.status)).length, color: 'text-blue-400', icon: Clock },
        { label: 'Fallidas', value: campaigns.filter(c => c.status === 'FAILED').length, color: 'text-red-400', icon: XCircle },
    ]

    return (
        <div className="px-4 md:px-6 pt-6 max-w-screen-2xl mx-auto pb-28 text-white">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <Megaphone className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">
                                Ads Maestro <span className="text-purple-400 italic">AI</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Publicidad inteligente con IA</p>
                        </div>
                    </div>
                    <p className="text-xs md:text-sm text-white/40 max-w-lg">
                        Crea campañas de alta conversión en Meta, TikTok y Google Ads.
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                    <Link
                        href="/dashboard/services/ads/wizard"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_24px_rgba(139,92,246,0.3)]"
                    >
                        <Plus size={15} />
                        <span className="hidden sm:inline">Nueva</span> Campaña
                    </Link>
                    <Link
                        href="/dashboard/services/ads/analytics"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                    >
                        <TrendingUp size={15} />
                        <span className="hidden sm:inline">Analytics</span>
                    </Link>
                    <Link
                        href="/dashboard/services/ads/history"
                        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                    >
                        <BarChart3 size={15} />
                        <span className="hidden sm:inline">Historial</span>
                    </Link>
                    <button onClick={fetchAll} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="flex-1 text-xs md:text-sm"><b>Error:</b> {error}</p>
                    <button onClick={() => setError(null)} className="text-xs hover:underline shrink-0">✕</button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <Loader2 className="animate-spin text-purple-400" size={32} />
                    <p className="text-white/30 text-sm">Cargando...</p>
                </div>
            ) : (
                <div className="space-y-8">

                    {/* Setup Progress */}
                    {!allReady && (
                        <div className="bg-white/3 border border-white/8 rounded-3xl p-5 md:p-7">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <Rocket className="text-purple-400" size={18} />
                                    <h2 className="font-bold text-sm md:text-base">Configura para empezar</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i < stepsCompleted ? 'bg-purple-400' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                    <span className="text-xs text-white/30 font-bold">{stepsCompleted}/3</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: 1, label: 'API Key de OpenAI', done: hasOpenAI, href: '/dashboard/services/ads/setup', icon: Brain, desc: 'Para generar copies con IA' },
                                    { id: 2, label: 'Perfil de Negocio', done: hasBrief, href: '/dashboard/services/ads/brief', icon: FileText, desc: 'Info de tu negocio' },
                                    { id: 3, label: 'Plataforma conectada', done: hasIntegration, href: '/dashboard/services/ads/setup', icon: Zap, desc: 'Meta, TikTok o Google' },
                                ].map(step => {
                                    const Icon = step.icon
                                    return (
                                        <Link key={step.id} href={step.href}
                                            className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all active:scale-[0.98] ${step.done
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : 'bg-white/3 border-white/8 hover:border-purple-500/40 hover:bg-purple-500/5'
                                            }`}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${step.done ? 'bg-green-500/20' : 'bg-white/5 group-hover:bg-purple-500/15'}`}>
                                                {step.done
                                                    ? <CheckCircle2 size={17} className="text-green-400" />
                                                    : <Icon size={17} className="text-white/40 group-hover:text-purple-400 transition-colors" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{step.label}</p>
                                                <p className="text-[10px] text-white/30 truncate">{step.done ? '✓ Completado' : step.desc}</p>
                                            </div>
                                            {!step.done && <ArrowRight size={13} className="text-white/20 group-hover:text-purple-400 shrink-0 transition-colors" />}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    {campaigns.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map(stat => {
                                const Icon = stat.icon
                                return (
                                    <div key={stat.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                            <Icon size={16} className={stat.color} />
                                        </div>
                                        <div>
                                            <p className={`text-xl font-black leading-none ${stat.color}`}>{stat.value}</p>
                                            <p className="text-[10px] text-white/30 font-medium mt-0.5">{stat.label}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Platforms */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/30">Plataformas conectadas</h2>
                            <Link href="/dashboard/services/ads/setup" className="text-[11px] text-purple-400 hover:underline flex items-center gap-1">
                                <Settings2 size={11} /> Configurar
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {PLATFORMS.map(platform => {
                                const integration = integrations.find(i => i.platform === platform.id)
                                const isConnected = integration?.status === 'CONNECTED'
                                return (
                                    <div key={platform.id}
                                        className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${isConnected ? 'bg-white/3 border-white/10' : 'bg-white/[0.015] border-dashed border-white/8'}`}>
                                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[50px] opacity-[0.07]"
                                            style={{ background: platform.color }} />
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                <span className={`font-black text-base ${platform.textColor}`}>{platform.letter}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm leading-tight">{platform.label}</p>
                                                <p className="text-[10px] text-white/30">{platform.sub}</p>
                                            </div>
                                            {isConnected
                                                ? <span className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                                                    OK
                                                </span>
                                                : <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/25 font-bold">—</span>
                                            }
                                        </div>
                                        {isConnected && integration?.connectedAccount && (
                                            <p className="text-[10px] text-white/35 mb-3 truncate">↳ {integration.connectedAccount.displayName}</p>
                                        )}
                                        <button
                                            onClick={() => handleConnect(platform.id)}
                                            className="w-full text-[11px] font-bold py-2 rounded-xl bg-white/5 border border-white/8 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                        >
                                            {isConnected ? <><Settings2 size={11} /> Reconfigurar</> : <><Zap size={11} /> Conectar</>}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mis Negocios */}
                    {allBriefs.length > 0 && (
                        <div className="bg-white/3 border border-white/8 rounded-3xl p-5 md:p-6">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <FileText size={15} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Mis Negocios</p>
                                        <h3 className="font-black text-sm md:text-base">{allBriefs.length} negocio{allBriefs.length !== 1 ? 's' : ''} creado{allBriefs.length !== 1 ? 's' : ''}</h3>
                                    </div>
                                </div>
                                <Link href="/dashboard/services/ads/brief" className="text-xs text-purple-400 hover:underline flex items-center gap-1 shrink-0">
                                    Gestionar <ArrowRight size={11} />
                                </Link>
                            </div>
                            <div className="flex flex-col gap-2">
                                {allBriefs.slice(0, 3).map((b: any) => (
                                    <div key={b.id} className="flex items-center gap-3 bg-white/3 rounded-xl px-3 py-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                                            <FileText size={12} className="text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{b.name}</p>
                                            <p className="text-[10px] text-white/30 truncate">{b.industry}</p>
                                        </div>
                                        <Link href={`/dashboard/services/ads/wizard?briefId=${b.id}`}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-600/80 text-white hover:bg-purple-500 transition-all shrink-0">
                                            Campaña →
                                        </Link>
                                    </div>
                                ))}
                                {allBriefs.length > 3 && (
                                    <Link href="/dashboard/services/ads/brief" className="text-center text-[11px] text-white/30 hover:text-white/60 py-1 transition-all">
                                        +{allBriefs.length - 3} más →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Campaigns */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                                <TrendingUp size={13} /> Campañas recientes
                            </h2>
                            {campaigns.length > 0 && (
                                <Link href="/dashboard/services/ads/history" className="text-[11px] text-purple-400 hover:underline">Ver todas →</Link>
                            )}
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="bg-white/[0.015] border border-dashed border-white/8 rounded-3xl py-16 md:py-20 text-center px-4">
                                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="text-purple-400" size={24} />
                                </div>
                                <p className="text-white/40 text-sm font-bold mb-1">Sin campañas todavía</p>
                                <p className="text-white/20 text-xs mb-6">Crea tu primera campaña impulsada por IA</p>
                                <Link href="/dashboard/services/ads/wizard"
                                    className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-purple-500 transition-all">
                                    <Plus size={15} /> Crear campaña
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {campaigns.slice(0, 5).map((campaign: any) => {
                                    const status = STATUS_LABELS[campaign.status] || STATUS_LABELS['DRAFT']
                                    const platform = PLATFORMS.find(p => p.id === campaign.platform)
                                    return (
                                        <div key={campaign.id}
                                            className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all group">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                    {platform && <span className={`font-black text-base ${platform.textColor}`}>{platform.letter}</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="font-bold text-sm leading-tight line-clamp-1">{campaign.name}</h4>
                                                        <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${status.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-white/30 truncate">{campaign.strategy?.name}</p>
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        {campaign.status === 'READY' && (
                                                            <Link href={`/dashboard/services/ads/preview/${campaign.id}`}
                                                                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-all">
                                                                Publicar →
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'DRAFT' && (
                                                            <Link href={`/dashboard/services/ads/campaign/${campaign.strategyId}?edit=${campaign.id}`}
                                                                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-white/8 text-white/60 hover:bg-white/15 transition-all">
                                                                Continuar →
                                                            </Link>
                                                        )}
                                                        {campaign.status === 'FAILED' && (
                                                            <Link href={`/dashboard/services/ads/preview/${campaign.id}`}
                                                                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                                                                Reintentar
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <Link href="/dashboard/services/ads/history"
                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/3 border border-white/8 text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all font-bold">
                                    Ver todas las campañas <ArrowRight size={12} />
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    )
}
