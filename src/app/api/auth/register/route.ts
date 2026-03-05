import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken, generateReferralCode } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 5 registros por hora por IP
  const ip = getClientIp(request)
  const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiados registros desde esta dirección. Intenta más tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const {
      username, email, password, confirmPassword,
      fullName, country, city, identityDocument,
      dateOfBirth, referralCode, acceptTerms
    } = body

    // Validaciones básicas
    if (!username || !email || !password || !fullName || !country || !city ||
        !identityDocument || !dateOfBirth || !referralCode || !acceptTerms) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      return NextResponse.json({ error: 'La contraseña debe contener al menos una mayúscula y un número' }, { status: 400 })
    }

    if (!acceptTerms) {
      return NextResponse.json({ error: 'Debe aceptar los términos y condiciones' }, { status: 400 })
    }

    // Validar mayoría de edad (18 años)
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    if (age < 18) {
      return NextResponse.json({ error: 'Debe ser mayor de 18 años' }, { status: 400 })
    }

    // Verificar que usuario y email no existan
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    })
    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'El nombre de usuario ya está registrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 })
    }

    // Verificar código de referido
    const sponsor = await prisma.user.findUnique({ where: { referralCode } })
    if (!sponsor) {
      return NextResponse.json({ error: 'Código de referido inválido' }, { status: 400 })
    }

    // Crear usuario + comisión en una sola transacción (atómico)
    const passwordHash = await hashPassword(password)
    const newReferralCode = generateReferralCode()

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        country,
        city,
        identityDocument,
        dateOfBirth: new Date(dateOfBirth),
        referralCode: newReferralCode,
        sponsorId: sponsor.id,
      }
    })

    // Enviar email de bienvenida
    await sendWelcomeEmail(email, fullName, newReferralCode)

    // Generar token y responder
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
    })

    const response = NextResponse.json({
      message: 'Registro exitoso',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        referralCode: newUser.referralCode,
      }
    }, { status: 201 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
