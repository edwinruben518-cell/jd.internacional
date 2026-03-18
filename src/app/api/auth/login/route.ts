export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'
import { sendDeviceVerificationEmail } from '@/lib/email'
import { parseUserAgent, getIpGeo } from '@/lib/device-utils'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 intentos por IP en 15 minutos
  const ip = getClientIp(request)
  const rl = rateLimit(`login:${ip}`, RATE_LIMITS.login)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuario/correo y contraseña son obligatorios' }, { status: 400 })
    }

    const isEmail = identifier.includes('@')
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { username: identifier.trim() },
    })

    // Tiempo constante aunque no exista el usuario (evita user enumeration)
    if (!user) {
      await new Promise(r => setTimeout(r, 200))
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 })
    }

    // ── Device verification (skip for admins) ──────────────────────────────
    if (!user.isAdmin) {
      const deviceId = request.cookies.get('device_id')?.value ?? null

      if (deviceId) {
        // Check if this device is already trusted
        const trusted = await prisma.trustedDevice.findUnique({
          where: { userId_deviceId: { userId: user.id, deviceId } },
        })

        if (!trusted) {
          // Device not trusted — send verification code
          await issueVerificationCode(user.id, deviceId, user.email, user.fullName)

          const pendingToken = jwt.sign(
            { userId: user.id, deviceId },
            JWT_SECRET,
            { expiresIn: '10m' }
          )

          const res = NextResponse.json({ requiresVerification: true })
          res.cookies.set('device_pending', pendingToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10,
            path: '/',
          })
          return res
        }

        // Trusted — update lastSeen + capture IP/UA
        const ua = request.headers.get('user-agent') || ''
        const { browser, os, deviceType } = parseUserAgent(ua)
        const newIp = ip
        const geo = await getIpGeo(newIp)
        const locationChanged = !!trusted.ip && trusted.ip !== newIp

        await prisma.trustedDevice.update({
          where: { userId_deviceId: { userId: user.id, deviceId } },
          data: {
            lastSeen: new Date(),
            ip: newIp,
            city: geo.city,
            country: geo.country,
            lat: geo.lat,
            lng: geo.lng,
            browser,
            os,
            deviceType,
            ...(locationChanged ? { prevIp: trusted.ip, prevCity: trusted.city, locationChanged: true } : {}),
          },
        })
      } else {
        // No device_id cookie yet — send verification code; device_id will be set after verification
        const tempDeviceId = crypto.randomUUID()
        await issueVerificationCode(user.id, tempDeviceId, user.email, user.fullName)

        const pendingToken = jwt.sign(
          { userId: user.id, deviceId: tempDeviceId },
          JWT_SECRET,
          { expiresIn: '10m' }
        )

        const res = NextResponse.json({ requiresVerification: true })
        res.cookies.set('device_pending', pendingToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 10,
          path: '/',
        })
        return res
      }
    }
    // ── End device verification ────────────────────────────────────────────

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    })

    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        referralCode: user.referralCode,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

async function issueVerificationCode(userId: string, deviceId: string, email: string, fullName: string) {
  // Delete previous unused codes for this user+device
  await prisma.deviceVerifyCode.deleteMany({
    where: { userId, deviceId, used: false },
  })

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.deviceVerifyCode.create({
    data: { userId, deviceId, code, expiresAt },
  })

  // Email is non-fatal — if it fails, user can try logging in again to get a new code
  try {
    await sendDeviceVerificationEmail(email, fullName, code)
  } catch (err) {
    console.error('[DEVICE] Failed to send verification email:', err)
  }
}
