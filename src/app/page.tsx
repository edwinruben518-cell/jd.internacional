'use client'

import Link from 'next/link'
import { Bot, TrendingUp, Megaphone, Store, Layers, ShieldCheck, Zap, Crown } from 'lucide-react'

// ── Color system — same as dashboard ────────────────────────────
const N = {
  bg: '#0B0C14',
  cyan: '#00F5FF',
  green: '#00FF88',
  purple: '#9B00FF',
  white: '#FFFFFF',
  dimText: 'rgba(255,255,255,0.5)',
  border: 'rgba(0,245,255,0.12)',
}

// Replicates services/dashboard card pattern
function card(color: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}08, ${color}04)`,
    border: `1px solid ${color}20`,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  }
}

const FEATURES = [
  { icon: Bot, title: 'Bots de WhatsApp con IA', desc: 'Automatiza tus ventas 24/7 con bots inteligentes que atienden a tus clientes y cierran ventas mientras duermes.', color: N.green },
  { icon: Megaphone, title: 'Publicidad Digital con IA', desc: 'Crea y lanza campañas en Meta, Google y TikTok Ads en minutos usando inteligencia artificial.', color: N.cyan },
  { icon: Store, title: 'Tienda Virtual Propia', desc: 'Tu propia tienda online para vender productos con pasarela de pago integrada. Lista en minutos.', color: N.purple },
  { icon: Layers, title: 'Landing Pages con IA', desc: 'Genera páginas de ventas profesionales con IA. Capta leads y convierte visitas en clientes.', color: N.cyan },
  { icon: TrendingUp, title: 'Panel de Comisiones', desc: 'Visualiza tus ganancias en tiempo real, solicita retiros y gestiona tu billetera digital.', color: N.green },
]

const PLANS = [
  { name: 'Pack Básico', icon: Zap, popular: false, color: N.cyan, features: ['1 Bot de WhatsApp', 'Catálogo 2 productos', '1 Tienda virtual', 'Capacitaciones Zoom'] },
  { name: 'Pack Pro', icon: TrendingUp, popular: true, color: N.green, features: ['2 Bots personalizados', 'Catálogo 20 productos', 'Publicidad Meta / TikTok / Google', 'Landing Pages con IA'] },
  { name: 'Pack Elite', icon: Crown, popular: false, color: N.purple, features: ['Bots ilimitados', 'Productos ilimitados', 'Todo el Pack Pro incluido', 'Manager dedicado 1:1'] },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Regístrate gratis', desc: 'Crea tu cuenta con el código de un miembro activo. El proceso toma menos de 2 minutos.', color: N.cyan },
  { step: '02', title: 'Elige tu pack', desc: 'Selecciona el plan que mejor se adapte a tu negocio. Desde el pack básico hasta el elite.', color: N.green },
  { step: '03', title: 'Activa y escala', desc: 'Configura tus herramientas, invita a tu red y empieza a generar comisiones desde el primer día.', color: N.purple },
]

function TopLine({ color }: { color: string }) {
  return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
}

const font = "'Montserrat', sans-serif"

export default function HomePage() {
  return (
    <div style={{ background: N.bg, fontFamily: font, color: N.white, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{ padding: '64px 20px 56px', textAlign: 'center', position: 'relative', borderBottom: `1px solid ${N.border}` }}>
        {/* Accent line at top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${N.cyan}50, ${N.purple}35, transparent)` }} />

        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: `${N.cyan}08`, border: `1px solid ${N.cyan}20`, marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.cyan, display: 'block' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300, color: N.dimText }}>
              Plataforma activa · LATAM 2026
            </span>
          </div>

          {/* Logo */}
          <div style={{ ...card(N.cyan), padding: 0, width: 112, height: 112, borderRadius: 20, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TopLine color={N.cyan} />
            <img src="/logo.png" alt="JD Internacional" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
            <span style={{ color: N.white }}>El ecosistema digital</span>
            <br />
            <span style={{ color: N.cyan }}>para crecer sin límites</span>
          </h1>

          <p style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 400, color: N.dimText, marginBottom: 32 }}>
            Bots de WhatsApp con IA, publicidad digital, tiendas virtuales, landing pages y un sistema de referidos que trabaja para ti las 24 horas.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px', background: N.cyan, borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', textDecoration: 'none' }}>
              Crear cuenta
            </Link>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px', background: `${N.cyan}08`, border: `1px solid ${N.cyan}25`, borderRadius: 10, fontSize: 12, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: N.cyan, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </div>

          <p style={{ fontSize: 9, marginTop: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 300, color: `rgba(255,255,255,0.2)` }}>
            Sin tarjeta de crédito · Registro en 2 minutos
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '56px 20px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300, color: N.cyan, marginBottom: 8 }}>Todo en un solo lugar</p>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: N.white }}>Herramientas que potencian tu negocio</h2>
          <p style={{ fontSize: 12, marginTop: 8, color: N.dimText }}>Cada herramienta diseñada para vender más, automatizar y escalar.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={card(f.color)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}35`; e.currentTarget.style.boxShadow = `0 0 24px ${f.color}10` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${f.color}20`; e.currentTarget.style.boxShadow = 'none' }}>
              <TopLine color={f.color} />
              <div style={{ padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <f.icon size={16} style={{ color: f.color }} />
                </div>
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: f.color, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 11, lineHeight: 1.7, color: N.dimText }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '56px 20px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300, color: N.green, marginBottom: 8 }}>Sencillo y rápido</p>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: N.white }}>¿Cómo funciona?</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HOW_IT_WORKS.map((h, i) => (
            <div key={i} style={{ ...card(h.color), display: 'flex', gap: 16, alignItems: 'flex-start', padding: 0 }}>
              <TopLine color={h.color} />
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: `${h.color}30`, lineHeight: 1, flexShrink: 0 }}>{h.step}</span>
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: N.white, marginBottom: 4 }}>{h.title}</h3>
                  <p style={{ fontSize: 11, lineHeight: 1.7, color: N.dimText }}>{h.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANS ── */}
      <section style={{ padding: '56px 20px', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300, color: N.purple, marginBottom: 8 }}>Elige tu nivel</p>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, color: N.white }}>Packs disponibles</h2>
          <p style={{ fontSize: 12, marginTop: 8, color: N.dimText }}>Empieza donde quieras y escala cuando estés listo.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{ ...card(p.color), ...(p.popular ? { border: `1px solid ${p.color}40` } : {}) }}>
              <TopLine color={p.color} />
              {p.popular && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: p.color, padding: '2px 12px', borderRadius: '0 0 8px 8px', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>
                  Más popular
                </div>
              )}
              <div style={{ padding: 16, marginTop: p.popular ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${p.color}12`, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p.icon size={12} style={{ color: p.color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.name}</span>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <ShieldCheck size={10} style={{ color: p.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 10, lineHeight: 1.6, color: N.dimText }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px', background: N.cyan, borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', textDecoration: 'none' }}>
            Ver precios y unirme
          </Link>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '56px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', ...card(N.cyan), padding: 40, textAlign: 'center' }}>
          <TopLine color={N.cyan} />
          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', margin: '0 auto 20px', border: `1px solid ${N.cyan}25` }}>
            <img src="/logo.png" alt="JD Internacional" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: N.white, marginBottom: 8 }}>Empieza hoy mismo</h2>
          <p style={{ fontSize: 12, lineHeight: 1.8, color: N.dimText, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
            Únete a emprendedores en toda Latinoamérica que ya están construyendo su negocio digital con JD Internacional.
          </p>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px', background: N.cyan, borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', textDecoration: 'none' }}>
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${N.border}`, padding: '32px 20px', marginTop: 8 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
            {[{ href: '/login', label: 'Iniciar sesión' }, { href: '/register', label: 'Registro' }, { href: '/privacy', label: 'Privacidad' }, { href: '/terms', label: 'Términos' }].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = N.cyan)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                {l.label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 300, color: 'rgba(255,255,255,0.15)' }}>© 2026 JD Internacional</span>
          <p style={{ fontSize: 9, lineHeight: 1.8, textAlign: 'center', maxWidth: 720, color: 'rgba(255,255,255,0.2)' }}>
            <strong style={{ fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Política de Privacidad:</strong>{' '}
            JD Internacional recopila datos personales únicamente para la prestación de sus servicios. Tu información no es vendida ni compartida con terceros sin tu consentimiento explícito. Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'underline' }}>Términos de Uso</Link> y{' '}
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'underline' }}>Política de Privacidad</Link>.
          </p>
        </div>
      </footer>

    </div>
  )
}
