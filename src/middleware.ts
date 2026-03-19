import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register', '/verify-device'],
}
