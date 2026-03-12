'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, MessageCircle, Layout, ArrowRight, CheckCircle2, Megaphone, Play, BookOpen, Lock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type UserPlan = 'NONE' | 'BASIC' | 'PRO' | 'ELITE'

const PLAN_RANK: Record<UserPlan, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }
const PLAN_NAMES: Record<UserPlan, string> = { NONE: 'Sin Plan', BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }

// requiredPlan: null = libre para todos
const services = [
  {
    id: 1,
    title: 'Tienda Virtual',
    description: 'Tu propia tienda online lista para vender. Muestra tus productos con estilo, recibe pedidos por WhatsApp y escala sin límites desde el primer día.',
    icon: ShoppingCart,
    from: '#00F5FF', to: '#0066FF',
    features: ['Catálogo profesional personalizado', 'Pedidos directos por WhatsApp', 'Sin comisiones por venta'],
    link: '/dashboard/services/virtual-store',
    requiredPlan: 'BASIC' as UserPlan,
  },
  {
    id: 2,
    title: 'Agentes AI de Ventas',
    description: 'Vende, responde y fideliza clientes las 24 horas sin levantar un dedo. Tu agente AI trabaja mientras tú duermes, con inteligencia artificial de última generación.',
    icon: MessageCircle,
    from: '#00FF88', to: '#00C2FF',
    features: ['Agente AI disponible 24/7', 'Respuestas inteligentes automáticas', 'Seguimientos y cierres de venta'],
    link: '/dashboard/services/whatsapp',
    requiredPlan: 'BASIC' as UserPlan,
  },
  {
    id: 3,
    title: 'Landing Pages con IA',
    description: 'Páginas de venta diseñadas para convertir visitantes en clientes. Genera una landing profesional en segundos usando inteligencia artificial o escribe tu propio HTML.',
    icon: Layout,
    from: '#9B00FF', to: '#FF2DF7',
    features: ['Generación instantánea con IA', 'Editor de código HTML integrado', 'Publicación con un clic'],
    link: '/dashboard/services/landing-pages',
    requiredPlan: 'BASIC' as UserPlan,
  },
  {
    id: 4,
    title: 'Anuncios con IA',
    description: 'Crea campañas publicitarias que convierten en Meta, Google y TikTok. La IA analiza tu negocio y genera el copy, la estrategia y los creativos por ti.',
    icon: Megaphone,
    from: '#FF8800', to: '#FFCC00',
    features: ['Campañas en Meta, Google & TikTok', 'Copy e imágenes generados con IA', 'Métricas y optimización en tiempo real'],
    link: '/dashboard/services/ads',
    requiredPlan: 'BASIC' as UserPlan,
  },
  {
    id: 5,
    title: 'Clipping — Gana por Vistas',
    description: 'Monetiza tu tiempo libre subiendo clips a YouTube y TikTok. Cada mil vistas genera ingresos reales que puedes retirar directamente a tu billetera.',
    icon: Play,
    from: '#FF2D55', to: '#FF6B00',
    features: ['Ingresos por cada 1,000 vistas (CPM)', 'Compatible con YouTube & TikTok', 'Retiros directos a tu wallet'],
    link: '/dashboard/services/clipping',
    requiredPlan: null, // libre para todos
  },
  {
    id: 6,
    title: 'Marketplace de Cursos',
    description: 'Convierte tu conocimiento en dinero. Publica tu curso, fija tu precio y cobra directamente. Sin intermediarios, sin plataformas externas, sin complicaciones.',
    icon: BookOpen,
    from: '#00FF88', to: '#00F5FF',
    features: ['Publica y vende tu propio curso', 'Cobro directo sin comisiones', 'Tú controlas quién accede'],
    link: '/dashboard/services/marketplace',
    requiredPlan: 'BASIC' as UserPlan,
  },
]

export default function ServicesPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<UserPlan>('NONE')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plan-status')
      .then(r => r.json())
      .then(d => {
        setPlan((d.plan ?? 'NONE') as UserPlan)
        setExpired(!!d.expired)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function isUnlocked(requiredPlan: UserPlan | null) {
    if (requiredPlan === null) return true // libre
    if (expired) return false
    return PLAN_RANK[plan] >= PLAN_RANK[requiredPlan]
  }

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-screen-xl mx-auto pb-20">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}>
          <Layout className="w-5 h-5" style={{ color: '#00F5FF' }} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-white uppercase tracking-widest">Servicios</h1>
          <p className="text-xs font-light tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Herramientas para potenciar tu negocio digital
          </p>
        </div>
      </div>

      {/* Línea decorativa */}
      <div className="h-px w-full mb-6" style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.3), rgba(255,45,247,0.2), transparent)' }} />

      {/* Banner plan expirado */}
      {!loading && expired && (
        <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-2xl"
          style={{ background: 'rgba(255,100,0,0.08)', border: '1px solid rgba(255,100,0,0.25)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#FF6400' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#FF6400' }}>Tu plan ha vencido</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,100,0,0.7)' }}>
              Tus servicios están desactivados. Renueva tu plan para seguir usando todas las herramientas.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/planes')}
            className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,100,0,0.3)', color: '#FF6400' }}>
            Renovar
          </button>
        </div>
      )}

      {/* Banner sin plan */}
      {!loading && !expired && plan === 'NONE' && (
        <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-2xl"
          style={{ background: 'rgba(155,0,255,0.07)', border: '1px solid rgba(155,0,255,0.2)' }}>
          <Lock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#9B00FF' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>Activa tu plan para desbloquear los servicios</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Con el Pack Básico desde $49 USD tienes acceso a agentes AI, tienda, landing pages y más.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/planes')}
            className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(155,0,255,0.15)', border: '1px solid rgba(155,0,255,0.3)', color: '#CC44FF' }}>
            Ver Planes
          </button>
        </div>
      )}

      {/* Plan activo badge */}
      {!loading && !expired && plan !== 'NONE' && (
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-bold" style={{ color: '#00FF88' }}>
            {PLAN_NAMES[plan]} activo — servicios desbloqueados
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => {
          const unlocked = isUnlocked(service.requiredPlan)
          const isFree = service.requiredPlan === null

          return (
            <div key={service.id}
              className={`relative rounded-2xl p-6 overflow-hidden transition-all duration-300 group ${unlocked ? 'hover:-translate-y-1' : 'opacity-70'}`}
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${service.from}08, ${service.to}05)`
                  : 'rgba(255,255,255,0.02)',
                border: unlocked ? `1px solid ${service.from}18` : '1px solid rgba(255,255,255,0.06)',
                boxShadow: unlocked ? `0 0 24px ${service.from}08` : 'none',
              }}
              onMouseEnter={e => {
                if (!unlocked) return
                e.currentTarget.style.borderColor = `${service.from}30`
                e.currentTarget.style.boxShadow = `0 0 40px ${service.from}15`
              }}
              onMouseLeave={e => {
                if (!unlocked) return
                e.currentTarget.style.borderColor = `${service.from}18`
                e.currentTarget.style.boxShadow = `0 0 24px ${service.from}08`
              }}>

              {/* Barra neon superior */}
              {unlocked && (
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${service.from}70, ${service.to}50, transparent)` }} />
              )}

              {/* Orbe esquina */}
              {unlocked && (
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: service.from }} />
              )}

              {/* Lock overlay si bloqueado */}
              {!unlocked && (
                <div className="absolute inset-0 rounded-2xl z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-[1px]"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Lock className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {expired ? 'Plan vencido' : `Requiere ${PLAN_NAMES[service.requiredPlan!]}`}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {expired ? 'Renueva para seguir usando este servicio' : 'Activa o mejora tu plan para acceder'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/planes')}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all"
                    style={{ background: 'rgba(155,0,255,0.2)', border: '1px solid rgba(155,0,255,0.3)', color: '#CC44FF' }}>
                    {expired ? 'Renovar Plan' : 'Ver Planes'}
                  </button>
                </div>
              )}

              {/* Header */}
              <div className="relative z-10 flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: unlocked ? `${service.from}12` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${unlocked ? service.from + '25' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <service.icon className="w-5 h-5" style={{ color: unlocked ? service.from : 'rgba(255,255,255,0.2)' }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={
                    isFree
                      ? { background: 'rgba(0,245,255,0.1)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.25)' }
                      : unlocked
                        ? { background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)' }
                  }>
                  {isFree ? 'Gratis' : unlocked ? 'Activo' : expired ? 'Vencido' : PLAN_NAMES[service.requiredPlan!] + '+'}
                </span>
              </div>

              {/* Contenido */}
              <div className="relative z-10">
                <h3 className="text-base font-medium mb-2 tracking-wide"
                  style={{ color: unlocked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}>
                  {service.title}
                </h3>
                <p className="text-xs font-light leading-relaxed mb-5"
                  style={{ color: unlocked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)' }}>
                  {service.description}
                </p>

                <ul className="space-y-2 mb-5">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-[11px] font-light"
                      style={{ color: unlocked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)' }}>
                      <CheckCircle2 className="w-3 h-3 shrink-0"
                        style={{ color: unlocked ? service.from : 'rgba(255,255,255,0.15)' }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {unlocked ? (
                  <Link href={service.link}
                    className="flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300"
                    style={{ background: `${service.from}0A`, border: `1px solid ${service.from}20`, color: 'rgba(255,255,255,0.7)' }}>
                    <span className="text-xs font-medium">Abrir Servicio</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex items-center justify-between w-full p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.15)' }}>
                    <span className="text-xs font-medium">Bloqueado</span>
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
