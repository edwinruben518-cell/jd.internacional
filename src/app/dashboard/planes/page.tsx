'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Lock, Zap, Sparkles, Crown, X, Layers, MessageCircle, Store, Megaphone, FileText, Users, Video, CheckCircle2, Clock, Timer, RefreshCw } from 'lucide-react'

const PACKS = [
  {
    id: 'basic',
    name: 'Pack Básico',
    tagline: 'Tu primer bot de ventas en WhatsApp',
    pitch: 'Automatiza tus ventas con un bot inteligente personalizado con tu marca, conectado directo a WhatsApp.',
    price: 49,
    planId: 'BASIC',
    icon: Zap,
    accent: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/25',
      btn: 'bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-black font-black',
      glow: '',
      featured: false,
    },
    highlight: null,
    locked: false,
    sections: [
      {
        icon: MessageCircle,
        title: 'Bot de WhatsApp',
        features: [
          '1 bot personalizado con tu marca',
          'Responde y vende por WhatsApp automáticamente',
          'Mensajes ilimitados con tus clientes',
          'IA con el tono y voz de tu negocio',
          'Catálogo con hasta 2 productos',
        ],
      },
      {
        icon: Store,
        title: 'Tienda Virtual',
        features: [
          '1 tienda virtual con tu branding',
          'Integración con tu número de WhatsApp',
          'QR de pago y catálogo online',
        ],
      },
      {
        icon: Video,
        title: 'Capacitaciones',
        features: ['Acceso a capacitaciones en vivo por Zoom'],
      },
    ],
    notIncluded: [
      'Publicidad en Meta, TikTok y Google',
      'Landing Pages con IA',
      'Acceso a nuevos lanzamientos',
    ],
  },
  {
    id: 'pro',
    name: 'Pack Pro',
    tagline: 'Vende, anuncia y escala sin límites',
    pitch: 'Todo lo del Básico más anuncios con IA, landing pages y acceso a los lanzamientos más exclusivos de la plataforma.',
    price: 99,
    planId: 'PRO',
    icon: Sparkles,
    accent: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/40',
      btn: 'bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-black shadow-[0_0_20px_rgba(127,86,239,0.4)]',
      glow: 'shadow-[0_0_50px_rgba(127,86,239,0.18)]',
      featured: true,
    },
    highlight: '⭐ Más Popular',
    locked: false,
    sections: [
      {
        icon: MessageCircle,
        title: 'Bots de WhatsApp',
        features: [
          '2 bots personalizados con tu marca',
          'Responde y vende por WhatsApp automáticamente',
          'Mensajes ilimitados con tus clientes',
          'IA con el tono y voz de tu negocio',
          'Catálogo con hasta 20 productos por bot',
        ],
      },
      {
        icon: Store,
        title: 'Tienda Virtual',
        features: [
          'Tienda virtual con tu branding completo',
          'Integración con WhatsApp para cerrar ventas',
          'QR de pago y catálogo online',
        ],
      },
      {
        icon: Megaphone,
        title: 'Publicidad con IA',
        features: [
          'Crea anuncios en Meta, TikTok y Google',
          'Copies e imágenes generados por IA',
          'Estrategias Advantage+ y Smart Segmentation',
        ],
      },
      {
        icon: FileText,
        title: 'Landing Pages con IA',
        features: [
          'Páginas de captura de alta conversión',
          'Formularios de leads integrados',
          'Slugs personalizados con tu URL',
        ],
      },
      {
        icon: Video,
        title: 'Capacitaciones y Lanzamientos',
        features: [
          'Acceso a capacitaciones en vivo por Zoom',
          'Acceso anticipado a nuevos lanzamientos',
        ],
      },
    ],
    notIncluded: [],
  },
  {
    id: 'elite',
    name: 'Pack Elite',
    tagline: 'El máximo poder — muy pronto',
    pitch: 'La experiencia completa para líderes de red que quieren escalar sin restricciones.',
    price: 199,
    planId: 'ELITE',
    icon: Crown,
    accent: {
      text: 'text-pink-400',
      bg: 'bg-pink-500/8',
      border: 'border-pink-500/15',
      btn: 'bg-white/5 text-white/25 cursor-not-allowed font-black',
      glow: '',
      featured: false,
    },
    highlight: null,
    locked: true,
    sections: [
      {
        icon: MessageCircle,
        title: 'Bots ilimitados',
        features: [
          'Bots de WhatsApp ilimitados con tu marca',
          'Productos ilimitados por bot',
          'Tiendas virtuales ilimitadas',
        ],
      },
      {
        icon: Sparkles,
        title: 'IA Personalizada',
        features: [
          'IA entrenada con la voz de tu negocio',
          'Todo lo del Pack Pro incluido',
          'Funciones exclusivas de automatización',
        ],
      },
      {
        icon: Users,
        title: 'Soporte Elite',
        features: [
          'Manager dedicado 1:1',
          'Acceso exclusivo a funciones premium',
          'Onboarding personalizado con el equipo',
        ],
      },
    ],
    notIncluded: [],
  },
]

const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return }
    const target = new Date(expiresAt).getTime()
    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return remaining
}

export default function PlanesPage() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<string>('NONE')
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const countdown = useCountdown(planExpiresAt)

  useEffect(() => {
    fetch('/api/plan-status')
      .then(r => r.json())
      .then(d => {
        if (d.plan) setCurrentPlan(d.plan)
        if (d.planExpiresAt) setPlanExpiresAt(d.planExpiresAt)
      })
      .catch(() => {})
    fetch('/api/pack-requests')
      .then(r => r.json())
      .then(d => {
        const pending = (d.requests ?? []).find((r: { status: string; plan: string }) => r.status === 'PENDING')
        if (pending) setPendingPlan(pending.plan)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="px-4 md:px-6 pt-6 max-w-5xl mx-auto pb-24 text-white">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
          <Layers size={10} />
          JD Internacional · Planes oficiales
        </div>
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">
          Elige tu Plan
        </h1>
        <p className="text-sm text-white/30 max-w-sm mx-auto leading-relaxed">
          Bots de WhatsApp, tiendas y anuncios con IA — todo personalizado con tu marca.
        </p>
        {currentPlan !== 'NONE' && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold">
            <CheckCircle2 size={12} />
            Plan activo: {currentPlan === 'BASIC' ? 'Pack Básico' : currentPlan === 'PRO' ? 'Pack Pro' : currentPlan === 'ELITE' ? 'Pack Elite' : currentPlan}
          </div>
        )}
      </div>

      {/* Countdown if plan active */}
      {currentPlan !== 'NONE' && countdown && (
        <div className="mb-8 p-4 rounded-2xl border flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.06), rgba(123,0,255,0.04))', borderColor: 'rgba(0,245,255,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}>
            <Timer size={18} style={{ color: '#00F5FF' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Tu plan vence en</p>
            <div className="flex items-center gap-3">
              {[
                { v: countdown.days, l: 'días' },
                { v: countdown.hours, l: 'horas' },
                { v: countdown.minutes, l: 'min' },
                { v: countdown.seconds, l: 'seg' },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <span className="text-xl font-black tabular-nums" style={{ color: '#00F5FF' }}>{String(v).padStart(2, '0')}</span>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {PACKS.map((pack) => {
          const Icon = pack.icon
          return (
            <div
              key={pack.id}
              className={`relative rounded-3xl border flex flex-col transition-all duration-300 ${pack.accent.border} ${pack.accent.glow} ${
                pack.locked
                  ? 'bg-white/[0.015] opacity-60'
                  : pack.accent.featured
                  ? 'bg-gradient-to-b from-purple-900/25 to-dark-900/60 md:-mt-4'
                  : 'bg-dark-900/50 hover:bg-dark-900/70'
              }`}
            >
              {pack.locked && (
                <div className="absolute inset-0 rounded-3xl z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Lock size={20} className="text-white/25" />
                  </div>
                  <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Próximamente</p>
                </div>
              )}

              {pack.highlight && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest">
                    {pack.highlight}
                  </span>
                </div>
              )}

              <div className={`p-5 md:p-6 flex flex-col flex-1 ${pack.accent.featured ? 'pt-8' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${pack.accent.bg} border ${pack.accent.border}`}>
                    <Icon size={18} className={pack.accent.text} />
                  </div>
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-widest ${pack.accent.text}`}>{pack.name}</p>
                    <p className="text-[10px] text-white/30 leading-snug">{pack.tagline}</p>
                  </div>
                </div>

                <p className="text-[11px] text-white/40 leading-relaxed mb-4">{pack.pitch}</p>

                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className="text-[40px] font-black leading-none">${pack.price}</span>
                    <span className="text-sm text-white/30 mb-1">USD</span>
                  </div>
                  <p className="text-[10px] text-white/20 mt-0.5">30 días de acceso · renovable</p>
                </div>

                <div className={`h-px mb-5 ${pack.accent.featured ? 'bg-purple-500/20' : 'bg-white/5'}`} />

                <div className="flex-1 space-y-4 mb-6">
                  {pack.sections.map((section, si) => {
                    const SIcon = section.icon
                    return (
                      <div key={si}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <SIcon size={11} className={pack.locked ? 'text-white/20' : pack.accent.text} />
                          <p className={`text-[10px] font-black uppercase tracking-widest ${pack.locked ? 'text-white/20' : pack.accent.text}`}>
                            {section.title}
                          </p>
                        </div>
                        <ul className="space-y-1.5">
                          {section.features.map((feat, fi) => (
                            <li key={fi} className="flex items-start gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${pack.locked ? 'bg-white/5' : pack.accent.bg}`}>
                                <Check size={8} className={pack.locked ? 'text-white/20' : pack.accent.text} />
                              </div>
                              <span className={`text-[11px] leading-snug ${pack.locked ? 'text-white/25' : 'text-white/55'}`}>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}

                  {pack.notIncluded.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <X size={11} className="text-white/15" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/15">No incluido</p>
                      </div>
                      <ul className="space-y-1.5">
                        {pack.notIncluded.map((feat, fi) => (
                          <li key={fi} className="flex items-start gap-2">
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/3">
                              <X size={7} className="text-white/15" />
                            </div>
                            <span className="text-[11px] leading-snug text-white/20 line-through">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {(() => {
                  if (pack.locked) {
                    return (
                      <button disabled className={`w-full py-3 rounded-2xl text-sm ${pack.accent.btn}`}>
                        Próximamente
                      </button>
                    )
                  }
                  const isActive = currentPlan === pack.planId
                  const isLower = PLAN_RANK[currentPlan] > PLAN_RANK[pack.planId]
                  const isPending = pendingPlan === pack.planId

                  if (isActive) {
                    return (
                      <button
                        onClick={() => router.push(`/dashboard/store/checkout?plan=${pack.planId}&renewal=true`)}
                        disabled={!!pendingPlan}
                        className="w-full py-3 rounded-2xl text-sm font-black bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={14} /> Renovar — $19
                      </button>
                    )
                  }
                  if (isLower) {
                    return (
                      <button disabled className="w-full py-3 rounded-2xl text-sm font-black bg-white/3 text-white/20 border border-white/8">
                        Plan inferior
                      </button>
                    )
                  }
                  if (isPending) {
                    return (
                      <button disabled className="w-full py-3 rounded-2xl text-sm font-black bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center gap-2">
                        <Clock size={14} /> Solicitud pendiente
                      </button>
                    )
                  }
                  return (
                    <button
                      onClick={() => router.push(`/dashboard/store/checkout?plan=${pack.planId}`)}
                      disabled={!!pendingPlan}
                      className={`w-full py-3 rounded-2xl text-sm transition-all ${pack.accent.btn} flex items-center justify-center gap-2`}
                    >
                      {currentPlan !== 'NONE' ? 'Renovar / Actualizar' : `Adquirir ${pack.name}`}
                    </button>
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
          <Layers size={14} className="text-white/30" />
        </div>
        <div>
          <p className="text-xs font-bold text-white/40">Proceso manual · 30 días de acceso</p>
          <p className="text-[11px] text-white/20">Envía tu solicitud. Nuestro equipo la aprobará y activará tu plan en menos de 24h.</p>
        </div>
      </div>
    </div>
  )
}
