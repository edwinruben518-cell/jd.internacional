import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthUser } from './auth'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

/** Validates auth_token (admin) + admin_session (2FA) */
export async function getAdminUser() {
  const user = await getAuthUser()
  if (!user) return null
  if (!(user as any).isAdmin) return null

  // Also require a valid admin_session (OTP verified)
  try {
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin_session')?.value
    if (!adminSession) return null
    jwt.verify(adminSession, JWT_SECRET)
  } catch {
    return null
  }

  return user
}

export function unauthorizedAdmin() {
  return NextResponse.json({ error: 'Acceso denegado. Solo administradores.' }, { status: 403 })
}
