'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    ArrowLeft, ArrowRight, Building2, Sparkles, Loader2,
    CheckCircle2, AlertCircle, Plus, Target, Globe,
    MessageCircle, TrendingUp, Eye, ShoppingCart, DollarSign,
    Brain, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Brief { id: string; name: string; industry: string; description: string }
interface Strategy {
    id: string; name: string; description: string; reason?: string; platform: string
    objective: string; destination: string; mediaType: string; mediaCount: number
    minBudgetUSD: number; advantageType: string
}

const PLATFORM_LABELS: Record<string, { label: string; letter: string; color: string; bg: string }> = {
    META: { label: 'Meta Ads', letter: 'f', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
    TIKTOK: { label: 'TikTok Ads', letter: 'T', color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/25' },
    GOOGLE_ADS: { label: 'Google Ads', letter: 'G', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/25' },
}

const OBJECTIVE_ICONS: Record<string, React.ReactNode> = {
    conversions: <ShoppingCart size={11} />,
    leads: <MessageCircle size={11} />,
    traffic: <Globe size={11} />,
    awareness: <Eye size={11} />,
    engagement: <TrendingUp size={11} />,
}

const OBJECTIVE_LABELS: Record<string, string> = {
    conversions: 'Conversiones',
    leads: 'Captación de leads',
    traffic: 'Tráfico',
    awareness: 'Reconocimiento',
    engagement: 'Engagement',
}

const DESTINATION_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    website: 'Sitio web',
    messenger: 'Messenger',
    tiktok: 'TikTok',
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
    const [campaignName, setCampaignName] = useState('')
    const [dailyBudget, setDailyBudget] = useState('5')
    const [loadingBriefs, setLoadingBriefs] = useState(true)
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [suggestError, setSuggestError] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/ads/brief').then(r => r.json()).then(data => {
            const allBriefs: Brief[] = data.briefs || []
            setBriefs(allBriefs)
            if (initialBriefId) {
                const found = allBriefs.find(b => b.id === initialBriefId)
                if (found) { setSelectedBrief(found); fetchSuggestions(found.id) }
            }
            setLoadingBriefs(false)
        }).catch(() => setLoadingBriefs(false))
    }, [initialBriefId])

    useEffect(() => {
        if (selectedBrief && selectedStrategy) {
            setCampaignName(`${selectedBrief.name} · ${selectedStrategy.name}`)
        }
    }, [selectedBrief, selectedStrategy])

    async function fetchSuggestions(briefId: string) {
        setStep(2)
        setLoadingSuggestions(true)
        setSuggestError(null)
        setStrategies([])
        setSelectedStrategy(null)
        try {
            const res = await fetch('/api/ads/strategies/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ briefId })
            })
            const data = await res.json()
            if (!res.ok) {
                setSuggestError(data.error || 'Error al generar estrategias')
            } else {
                setStrategies(data.strategies || [])
            }
        } catch {
            setSuggestError('Error de conexión')
        } finally {
            setLoadingSuggestions(false)
        }
    }

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
            if (!res.ok) { setError(data.error || 'Error al crear campaña'); setCreating(false); return }
            router.push(`/dashboard/services/ads/campaign/${selectedStrategy.id}?edit=${data.campaign.id}`)
        } catch {
            setError('Error de conexión'); setCreating(false)
        }
    }

    return (
        <div className="px-4 md:px-6 pt-6 max-w-3xl mx-auto pb-24 text-white">

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
                                    {s === 1 ? 'Negocio' : s === 2 ? 'Estrategia IA' : 'Configurar'}
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

            {/* ── Step 1: Select Brief ── */}
            {step === 1 && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-lg font-black">¿Para qué negocio?</h2>
                        <p className="text-xs text-white/30 mt-1">La IA analizará tu negocio y sugerirá las mejores estrategias</p>
                    </div>

                    {loadingBriefs ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-purple-400" size={24} /></div>
                    ) : briefs.length === 0 ? (
                        <div className="text-center py-16 bg-white/[0.015] border border-dashed border-white/10 rounded-3xl">
                            <Building2 size={28} className="text-white/20 mx-auto mb-3" />
                            <p className="text-white/40 font-bold mb-1">Sin negocios</p>
                            <p className="text-white/20 text-xs mb-5">Crea primero el perfil de tu negocio</p>
                            <Link href="/dashboard/services/ads/brief" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-500 transition-all">
                                <Plus size={14} /> Crear negocio
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {briefs.map(brief => (
                                <button key={brief.id} onClick={() => { setSelectedBrief(brief); fetchSuggestions(brief.id) }}
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

            {/* ── Step 2: AI Strategy Suggestions ── */}
            {step === 2 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setStep(1)} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                            <ArrowLeft size={14} />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-lg font-black">Estrategias recomendadas</h2>
                            {selectedBrief && <p className="text-xs text-white/30 mt-0.5">Para: <span className="text-purple-400">{selectedBrief.name}</span></p>}
                        </div>
                        {!loadingSuggestions && strategies.length > 0 && (
                            <button onClick={() => selectedBrief && fetchSuggestions(selectedBrief.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                                <RefreshCw size={12} /> Regenerar
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {loadingSuggestions && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                <Brain size={20} className="text-purple-400 absolute inset-0 m-auto" />
                            </div>
                            <div className="text-center">
                                <p className="text-white/70 font-bold">La IA está analizando tu negocio...</p>
                                <p className="text-xs text-white/30 mt-1">Generando estrategias personalizadas</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loadingSuggestions && suggestError && (
                        <div className="py-12 text-center">
                            <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 font-bold text-sm mb-1">Error al generar estrategias</p>
                            <p className="text-xs text-white/30 mb-5">{suggestError}</p>
                            <button onClick={() => selectedBrief && fetchSuggestions(selectedBrief.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-xl text-sm font-bold hover:bg-purple-500 transition-all">
                                <RefreshCw size={14} /> Reintentar
                            </button>
                        </div>
                    )}

                    {/* Strategy cards */}
                    {!loadingSuggestions && !suggestError && strategies.length > 0 && (
                        <>
                            <div className="space-y-3 mb-6">
                                {strategies.map(strategy => {
                                    const isSelected = selectedStrategy?.id === strategy.id
                                    const plat = PLATFORM_LABELS[strategy.platform]
                                    return (
                                        <button key={strategy.id} onClick={() => setSelectedStrategy(isSelected ? null : strategy)}
                                            className={`w-full text-left rounded-2xl p-4 border transition-all ${isSelected ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${plat?.bg || 'bg-white/5 border-white/10'}`}>
                                                    <span className={`font-black text-base ${plat?.color}`}>{plat?.letter}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2">
                                                        <p className="font-bold text-sm flex-1 leading-snug">{strategy.name}</p>
                                                        {isSelected && <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />}
                                                    </div>
                                                    <p className="text-xs text-white/40 mt-1 leading-relaxed">{strategy.description}</p>
                                                    {strategy.reason && (
                                                        <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg"
                                                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                                                            <Sparkles size={10} className="text-purple-400 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-purple-300/80 leading-relaxed">{strategy.reason}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                                                        <span className="flex items-center gap-1 text-[10px] text-white/35">
                                                            {OBJECTIVE_ICONS[strategy.objective] || <Target size={10} />}
                                                            {OBJECTIVE_LABELS[strategy.objective] || strategy.objective}
                                                        </span>
                                                        <span className="text-[10px] text-white/25">{DESTINATION_LABELS[strategy.destination] || strategy.destination}</span>
                                                        <span className="text-[10px] text-white/25">{strategy.mediaCount} {strategy.mediaType === 'video' ? 'videos' : 'imágenes'}</span>
                                                        <span className="flex items-center gap-0.5 text-[10px] text-white/25">
                                                            <DollarSign size={9} /> desde ${strategy.minBudgetUSD}/día
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                            <button onClick={() => setStep(3)} disabled={!selectedStrategy}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                <ArrowRight size={18} /> Continuar con esta estrategia
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Step 3: Configure ── */}
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

                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4 mb-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <Building2 size={14} className="text-purple-400 shrink-0" />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase font-bold">Negocio</p>
                                <p className="text-sm font-bold">{selectedBrief?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-white/30 uppercase font-bold">Estrategia</p>
                                <p className="text-sm font-bold">{selectedStrategy?.name}</p>
                                {selectedStrategy?.reason && (
                                    <p className="text-[10px] text-purple-300/70 mt-0.5">{selectedStrategy.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Nombre de la Campaña</label>
                            <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                                placeholder="Ej: Campaña verano 2026"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 placeholder:text-white/20" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Presupuesto Diario (USD)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">$</span>
                                <input type="number" value={dailyBudget} onChange={e => setDailyBudget(e.target.value)}
                                    min="1" step="1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50" />
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
