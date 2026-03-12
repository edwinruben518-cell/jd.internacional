'use client'

import { ShoppingCart, MessageCircle, Layout, ArrowRight, CheckCircle2, Megaphone, Play, BookOpen } from 'lucide-react'
import Link from 'next/link'

const services = [
  {
    id: 1,
    title: 'Tienda Virtual',
    description: 'Tu propia tienda online lista para vender. Muestra tus productos con estilo, recibe pedidos por WhatsApp y escala sin límites desde el primer día.',
    icon: ShoppingCart,
    from: '#00F5FF', to: '#0066FF',
    features: ['Catálogo profesional personalizado', 'Pedidos directos por WhatsApp', 'Sin comisiones por venta'],
    link: '/dashboard/services/virtual-store',
    available: true,
  },
  {
    id: 2,
    title: 'Agentes AI de Ventas',
    description: 'Vende, responde y fideliza clientes las 24 horas sin levantar un dedo. Tu agente AI trabaja mientras tú duermes, con inteligencia artificial de última generación.',
    icon: MessageCircle,
    from: '#00FF88', to: '#00C2FF',
    features: ['Agente AI disponible 24/7', 'Respuestas inteligentes automáticas', 'Seguimientos y cierres de venta'],
    link: '/dashboard/services/whatsapp',
    available: true,
  },
  {
    id: 3,
    title: 'Landing Pages con IA',
    description: 'Páginas de venta diseñadas para convertir visitantes en clientes. Genera una landing profesional en segundos usando inteligencia artificial o escribe tu propio HTML.',
    icon: Layout,
    from: '#9B00FF', to: '#FF2DF7',
    features: ['Generación instantánea con IA', 'Editor de código HTML integrado', 'Publicación con un clic'],
    link: '/dashboard/services/landing-pages',
    available: true,
  },
  {
    id: 4,
    title: 'Anuncios con IA',
    description: 'Crea campañas publicitarias que convierten en Meta, Google y TikTok. La IA analiza tu negocio y genera el copy, la estrategia y los creativos por ti.',
    icon: Megaphone,
    from: '#FF8800', to: '#FFCC00',
    features: ['Campañas en Meta, Google & TikTok', 'Copy e imágenes generados con IA', 'Métricas y optimización en tiempo real'],
    link: '/dashboard/services/ads',
    available: true,
  },
  {
    id: 5,
    title: 'Clipping — Gana por Vistas',
    description: 'Monetiza tu tiempo libre subiendo clips a YouTube y TikTok. Cada mil vistas genera ingresos reales que puedes retirar directamente a tu billetera.',
    icon: Play,
    from: '#FF2D55', to: '#FF6B00',
    features: ['Ingresos por cada 1,000 vistas (CPM)', 'Compatible con YouTube & TikTok', 'Retiros directos a tu wallet'],
    link: '/dashboard/services/clipping',
    available: true,
  },
  {
    id: 6,
    title: 'Marketplace de Cursos',
    description: 'Convierte tu conocimiento en dinero. Publica tu curso, fija tu precio y cobra directamente. Sin intermediarios, sin plataformas externas, sin complicaciones.',
    icon: BookOpen,
    from: '#00FF88', to: '#00F5FF',
    features: ['Publica y vende tu propio curso', 'Cobro directo sin comisiones', 'Tú controlas quién accede'],
    link: '/dashboard/services/marketplace',
    available: true,
  }
]

export default function ServicesPage() {
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
      <div className="h-px w-full mb-8" style={{ background: 'linear-gradient(90deg, rgba(0,245,255,0.3), rgba(255,45,247,0.2), transparent)' }} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => (
          <div key={service.id} className="relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
            style={{
              background: `linear-gradient(135deg, ${service.from}08, ${service.to}05)`,
              border: `1px solid ${service.from}18`,
              boxShadow: `0 0 24px ${service.from}08`,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${service.from}30`
              e.currentTarget.style.boxShadow = `0 0 40px ${service.from}15`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${service.from}18`
              e.currentTarget.style.boxShadow = `0 0 24px ${service.from}08`
            }}>

            {/* Barra neon superior */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${service.from}70, ${service.to}50, transparent)` }} />
            {/* Orbe esquina */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: service.from }} />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${service.from}12`, border: `1px solid ${service.from}25` }}>
                <service.icon className="w-5 h-5" style={{ color: service.from }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={service.available
                  ? { background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {service.available ? 'Disponible' : 'Próximamente'}
              </span>
            </div>

            {/* Contenido */}
            <div className="relative z-10">
              <h3 className="text-base font-medium text-white mb-2 tracking-wide transition-colors duration-300"
                style={{ color: 'rgba(255,255,255,0.9)' }}>
                {service.title}
              </h3>
              <p className="text-xs font-light leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {service.description}
              </p>

              <ul className="space-y-2 mb-5">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: service.from }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={service.link}
                className="flex items-center justify-between w-full p-3 rounded-xl transition-all duration-300"
                style={service.available
                  ? { background: `${service.from}0A`, border: `1px solid ${service.from}20`, color: 'rgba(255,255,255,0.7)' }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' as const }}>
                <span className="text-xs font-medium">Ver Detalles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
