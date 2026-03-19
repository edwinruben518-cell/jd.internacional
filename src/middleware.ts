import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

// Rate limiter inline para Edge Runtime (no setInterval, no Node.js APIs)
// Clave: primeros 32 chars del JWT → 1 entrada por usuario
const _apiStore = new Map<string, { count: number; resetAt: number }>()

function dashboardRateLimit(token: string): boolean {
  const key = token.slice(0, 32)
  const now = Date.now()
  const entry = _apiStore.get(key)

  if (!entry || entry.resetAt < now) {
    _apiStore.set(key, { count: 1, resetAt: now + 10_000 }) // ventana 10s
    return true
  }
  if (entry.count >= 10) return false // bloqueado: 10 requests / 10s
  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Rutas protegidas — requieren sesión
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya tiene sesión y va a login/registro → dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Rate limiting en todas las rutas /api/ autenticadas
  // Excluir: auth, webhooks (no tienen token → excluidos naturalmente)
  if (pathname.startsWith('/api/') && token &&
      !pathname.startsWith('/api/auth/') &&
      !pathname.startsWith('/api/webhooks/')) {
    if (!dashboardRateLimit(token)) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes. Espera 10 segundos.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '10' } }
      )
    }
  }

  // Admin panel — requiere admin_session además de auth_token
  // Excluir /admin/verify (es donde el admin obtiene el código)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/verify')) {
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/verify', request.url))
    }
    // Validate the admin_session JWT
    try {
      jwt.verify(adminSession, JWT_SECRET)
    } catch {
      // Expired or invalid — redirect to verify
      const res = NextResponse.redirect(new URL('/admin/verify', request.url))
      res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register', '/verify-device', '/api/:path*'],
}
