import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface JWTPayload {
  userId: string
  username: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) {
      console.log('[AUTH] No auth_token cookie found')
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('[AUTH] Invalid token')
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      console.log('[AUTH] User not found for id:', payload.userId)
      return null
    }

    // Always fetch plan, isAdmin, planExpiresAt via raw SQL to guarantee fresh values
    const extra = await prisma.$queryRaw<Array<{ plan: string; is_admin: boolean; plan_expires_at: Date | null }>>`
      SELECT plan::text, is_admin, plan_expires_at FROM users WHERE id = ${payload.userId}::uuid LIMIT 1
    `
    if (extra[0]) {
      ;(user as any).plan = extra[0].plan
      ;(user as any).isAdmin = extra[0].is_admin
      ;(user as any).planExpiresAt = extra[0].plan_expires_at ?? null
    }

    return user
  } catch (err) {
    console.error('[AUTH] getAuthUser error:', err)
    return null
  }
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
