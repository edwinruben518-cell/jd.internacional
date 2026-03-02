'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, Briefcase, GraduationCap, ShoppingCart } from 'lucide-react'

const N = {
  cyan: '#00F5FF',
  cyanDim: 'rgba(0,245,255,0.2)',
  border: 'rgba(0,245,255,0.12)',
  text: 'rgba(255,255,255,0.85)',
  textDim: 'rgba(255,255,255,0.3)',
}

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/dashboard/services', icon: Briefcase, label: 'Servicios' },
  { href: '/dashboard/courses', icon: GraduationCap, label: 'Cursos' },
  { href: '/dashboard/store', icon: ShoppingCart, label: 'Tienda' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col z-50"
        style={{ background: '#0D0E18', borderRight: `1px solid ${N.border}`, backdropFilter: 'blur(40px)', fontFamily: "'Montserrat', sans-serif" }}>

        <div className="absolute top-20 bottom-20 right-0 w-px"
          style={{ background: `linear-gradient(180deg,transparent,${N.cyan}30,transparent)` }} />

        <div className="px-6 py-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <Link href="/dashboard" className="flex flex-col items-center gap-3 group">
            <div className="relative">
              <img src="/logo.png" alt="Logo" className="relative w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-500" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              <span style={{ color: '#fff' }}>JD </span>
              <span style={{ color: N.cyan }}>INTERNACIONAL</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden"
                style={isActive ? { background: `${N.cyan}08`, border: `1px solid ${N.border}` } : { border: '1px solid transparent' }}>
                {isActive && <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full" style={{ background: N.cyan }} />}
                {!isActive && <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `${N.cyan}04` }} />}
                <item.icon className="w-4 h-4 shrink-0 relative z-10" style={{ color: isActive ? N.cyan : N.textDim }} />
                <span className="text-sm relative z-10" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : N.text }}>
                  {item.label}
                </span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full relative z-10" style={{ background: N.cyan }} />}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: `${N.cyan}06`, border: `1px solid ${N.border}` }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${N.cyan}50,transparent)` }} />
            <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Plan Actual</p>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Premium</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${N.cyan}18`, color: N.cyan, border: `1px solid ${N.cyanDim}` }}>Activo</span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full w-3/4 rounded-full" style={{ background: N.cyan }} />
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 9, fontWeight: 300, textAlign: 'center', color: 'rgba(255,255,255,0.12)' }}>JD INTERNACIONAL © 2026</p>
        </div>
      </aside>

      {/* ── BARRA MÓVIL ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)', fontFamily: "'Montserrat', sans-serif" }}>
        <nav className="relative w-full rounded-t-2xl" style={{ background: '#0D0E18', borderTop: `1px solid ${N.border}`, backdropFilter: 'blur(40px)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${N.cyan}50,transparent)` }} />
          <div className="flex items-center justify-around px-2 py-2.5">
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 flex-1 transition-all duration-200 active:scale-90">
                  <item.icon className="w-5 h-5 transition-all duration-300" style={{ color: isActive ? N.cyan : 'rgba(255,255,255,0.28)' }} />
                  <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? N.cyan : 'rgba(255,255,255,0.2)' }}>{item.label}</span>
                  {isActive && <div style={{ width: 16, height: 2, borderRadius: 1, background: N.cyan }} />}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
