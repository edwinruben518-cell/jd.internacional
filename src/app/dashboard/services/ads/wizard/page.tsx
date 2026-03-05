'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ArrowLeft, ArrowRight, Building2, Sparkles, Loader2,
    CheckCircle2, AlertCircle, Plus, Zap, Target, Globe,
    MessageCircle, TrendingUp, Eye, ShoppingCart, DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface Brief { id: string; name: string; industry: string; description: string }
interface Strategy {
    id: string; name: string; description: string; platform: string
    objective: string; destination: string; mediaType: string; mediaCount: number
    minBudgetUSD: number; advantageType: string
}

const PLATFORM_LABELS: Record<string, { label: string; letter: string; color: string; bg: string }> = {
    META: { label: 'Meta Ads', letter: 'f', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
    TIKTOK: { label: 'TikTok Ads', letter: 'T', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25' },
    GOOGLE_ADS: { label: 'Google Ads', letter: 'G', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/25' },
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
    conversion: <ShoppingCart size={14} />,
    leads: <MessageCircle size={14} />,
    traffic: <Globe size={14} />,
    awareness: <Eye size={14} />,
    engagement: <TrendingUp size={14} />,
}

function WizardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialBriefId = searchParams.get('briefId')

    const [step, setStep] = useState<1 | 2 | 3>(initialBriefId ? 2 : 1)
    const [briefs, setBriefs] = useState<Brief[]>([])
    const [strategies, setStrategies] = useState<Strategy[]>([])
    const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null)
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null)
    const [platformFilter, setPlatformFilter] = useState<string>('META')
    const [campaignName, setCampaignName] = useState('')
    const [dailyBudget, setDailyBudget] = useState('5')
    const [loadingBriefs, setLoadingBriefs] = useState(true)
    const [loadingStrategies, setLoadingStrategies] = useState(false)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load briefs on mount
    useEffect(() => {
        fetch('/api/ads/brief').then(r => r.json()).then(data => {
            const allBriefs: Brief[] = data.briefs || []
            setBriefs(allBriefs)
            if (initialBriefId) {
                const found = allBriefs.find(b => b.id === initialBriefId)
                if (found) { setSelectedBrief(found); setStep(2) }
            }
            setLoadingBriefs(false)
        }).catch(() => setLoadingBriefs(false))
    }, [initialBriefId])

    // Load strategies when platform filter changes
    useEffect(() => {
        if (step !== 2) return
        setLoadingStrategies(true)
        fetch(`/api/ads/strategies?platform=${platformFilter}`)
            .then(r => r.json())
            .then(data => { setStrategies(data.strategies || []); setLoadingStrategies(false) })
            .catch(() => setLoadingStrategies(false))
    }, [step, platformFilter])

    // Auto-generate campaign name
    useEffect(() => {
        if (selectedBrief && selectedStrategy) {
            setCampaignName(`${selectedBrief.name} · ${selectedStrategy.name}`)
        }
    }, [selectedBrief, selectedStrategy])

    async function createCampaign() {
        if (!selectedBrief || !selectedStrategy) return
        setCreating(true); setError(null)
        try {
            const res = await fetch('/api/ads/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    briefId: selectedBrief.id,
                    strategyId: selectedStrategy.id,
                    name: campaignName.trim() || `${selectedBrief.name} · ${selectedStrategy.name}`,
                    dailyBudgetUSD: parseFloat(dailyBudget) || 5,
                })
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Error al crear campaña')
                setCreating(false)
                return
            }
            router.push(`/dashboard/services/ads/campaign/${selectedStrategy.id}?edit=${data.campaign.id}`)
        } catch {
            setError('Error de conexión')
            setCreating(false)
        }
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-2xl mx-auto pb-24 text-white">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/services/ads" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={16} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black uppercase tracking-tighter">Nueva Campaña</h1>
                    <p className="text-xs text-white/30">3 pasos para lanzar tu anuncio</p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-8">
                {([1, 2, 3] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 ${step === s ? 'flex-1' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${step > s ? 'bg-green-500 text-white' : step === s ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/5 border border-white/10 text-white/30'}`}>
                                {step > s ? <CheckCircle2 size={14} /> : s}
                            </div>
                            {step === s && (
                                <span className="text-xs font-bold text-white/70 whitespace-nowrap hidden sm:block">
                                    {s === 1 ? 'Negocio' : s === 2 ? 'Estrategia' : 'Configurar'}
                                </span>
                            )}
                        </div>
                        {i < 2 && <div className={`flex-1 h-px transition-all ${step > s ? 'bg-green-500/40' : 'bg-white/8'}`} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="font-bold text-xs">✕</button>
                </div>
            )}

            {/* ── Step 1: Select Brief ────────────────────────────────────── */}
            {step === 1 && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-lg font-black">¿Para qué negocio?</h2>
                        <p className="text-xs text-white/30 mt-1">Selecciona el negocio que quieres anunciar</p>
                    </div>

                    {loadingBriefs ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <Loader2 className="animate-spin text-purple-400" size={24} />
                        </div>
                    ) : briefs.length === 0 ? (
                        <div className="text-center py-16 bg-white/[0.015] border border-dashed border-white/10 rounded-3xl">
                            <Building2 size={28} className="text-white/20 mx-auto mb-3" />
                            <p className="text-white/40 font-bold mb-1">Sin negocios</p>
                            <p className="text-white/20 text-xs mb-5">Crea primero el perfil de tu negocio</p>
                            <Link href="/dashboard/services/ads/brief"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-500 transition-all">
                                <Plus size={14} /> Crear negocio
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {briefs.map(brief => (
                                <button key={brief.id} onClick={() => { setSelectedBrief(brief); setStep(2) }}
                                    className="w-full text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                                            <Building2 size={18} className="text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{brief.name}</p>
                                            <p className="text-xs text-white/40">{brief.industry}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-white/20 group-hover:text-purple-400 transition-all" />
                                    </div>
                                </button>
                            ))}

                            <Link href="/dashboard/services/ads/brief"
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-white/10 text-white/30 hover:border-white/25 hover:text-white/50 text-sm font-bold transition-all">
                                <Plus size={15} /> Agregar otro negocio
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 2: Select Strategy ─────────────────────────────────── */}
            {step === 2 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(1)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black">¿Qué tipo de campaña?</h2>
                            {selectedBrief && <p className="text-xs text-white/30 mt-0.5">Para: <span className="text-purple-400">{selectedBrief.name}</span></p>}
                        </div>
                    </div>

                    {/* Platform tabs */}
                    <div className="flex gap-2 mb-5 bg-white/5 p-1 rounded-2xl border border-white/8">
                        {Object.entries(PLATFORM_LABELS).map(([key, val]) => (
                            <button key={key} onClick={() => { setPlatformFilter(key); setSelectedStrategy(null) }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${platformFilter === key ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'}`}>
                                <span className={platformFilter === key ? 'text-black' : val.color}>{val.letter}</span>
                                <span className="hidden sm:block">{val.label}</span>
                            </button>
                        ))}
                    </div>

                    {loadingStrategies ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <Loader2 className="animate-spin text-purple-400" size={24} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {strategies.map(strategy => {
                                const isSelected = selectedStrategy?.id === strategy.id
                                return (
                                    <button key={strategy.id} onClick={() => setSelectedStrategy(isSelected ? null : strategy)}
                                        className={`w-full text-left rounded-2xl p-4 border transition-all ${isSelected ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${PLATFORM_LABELS[strategy.platform]?.bg || 'bg-white/5 border-white/10'} border`}>
                                                <span className={`font-black text-sm ${PLATFORM_LABELS[strategy.platform]?.color}`}>
                                                    {PLATFORM_LABELS[strategy.platform]?.letter}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2">
                                                    <p className="font-bold text-sm flex-1">{strategy.name}</p>
                                                    {isSelected && <CheckCircle2 size={16} className="text-purple-400 shrink-0" />}
                                                </div>
                                                {strategy.description && (
                                                    <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{strategy.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                                    <span className="flex items-center gap-1 text-[10px] text-white/40">
                                                        {OBJECTIVE_ICONS[strategy.objective] || <Target size={11} />}
                                                        {strategy.objective}
                                                    </span>
                                                    <span className="text-[10px] text-white/25">{strategy.mediaCount} anuncios · {strategy.mediaType}</span>
                                                    <span className="flex items-center gap-0.5 text-[10px] text-white/25">
                                                        <DollarSign size={10} /> desde ${strategy.minBudgetUSD}/día
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <div className="mt-6">
                        <button onClick={() => setStep(3)} disabled={!selectedStrategy}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <ArrowRight size={18} /> Continuar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Configure ───────────────────────────────────────── */}
            {step === 3 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(2)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black">Configura tu campaña</h2>
                            <p className="text-xs text-white/30 mt-0.5">Casi listo</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6 space-y-2">
                        <div className="flex items-center gap-3">
                            <Building2 size={14} className="text-purple-400 shrink-0" />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold">Negocio</p>
                                <p className="text-sm font-bold">{selectedBrief?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap size={14} className="text-blue-400 shrink-0" />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold">Estrategia</p>
                                <p className="text-sm font-bold">{selectedStrategy?.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Nombre de la Campaña</label>
                            <input
                                value={campaignName}
                                onChange={e => setCampaignName(e.target.value)}
                                placeholder="Ej: Campaña verano 2026"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Presupuesto Diario (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">$</span>
                                <input
                                    type="number"
                                    value={dailyBudget}
                                    onChange={e => setDailyBudget(e.target.value)}
                                    min="1"
                                    step="1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">/día</span>
                            </div>
                            {selectedStrategy && parseFloat(dailyBudget) < selectedStrategy.minBudgetUSD && (
                                <p className="text-xs text-amber-400/70 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={11} /> Mínimo recomendado: ${selectedStrategy.minBudgetUSD}/día
                                </p>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-white/20 mt-5 leading-relaxed text-center">
                        Después podrás configurar cuenta publicitaria, páginas, píxeles y creativos.
                    </p>

                    <button onClick={createCampaign} disabled={creating || !campaignName.trim()}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                        {creating
                            ? <><Loader2 size={18} className="animate-spin" /> Creando campaña...</>
                            : <><Sparkles size={18} /> Crear Campaña y Continuar</>
                        }
                    </button>
                </div>
            )}
        </div>
    )
}

export default function WizardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-purple-400" size={28} />
            </div>
        }>
            <WizardContent />
        </Suspense>
    )
}
