export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateSecureToken } from '@/lib/crypto'
import { getPlanLimits, PLAN_NAMES, type UserPlan } from '@/lib/plan-limits'

function getAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

/** GET /api/bots – list all bots for the authenticated user */
export async function GET() {
  try {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const bots = await prisma.bot.findMany({
      where: { userId: auth.userId },
      include: {
        secret: {
          select: { whatsappInstanceNumber: true, reportPhone: true },
        },
        _count: { select: { assignedProducts: true, conversations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const salesCounts = await prisma.conversation.groupBy({
      by: ['botId'],
      where: { botId: { in: bots.map(b => b.id) }, sold: true },
      _count: { _all: true },
    })
    const salesMap = Object.fromEntries(salesCounts.map(s => [s.botId, s._count._all]))

    const botsWithSales = bots.map(b => ({ ...b, salesCount: salesMap[b.id] ?? 0 }))

    return NextResponse.json({ bots: botsWithSales })
  } catch (err) {
    console.error('[GET /api/bots]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** POST /api/bots – create a new bot */
export async function POST(request: NextRequest) {
  try {
    const auth = getAuth()
    if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
    }

    const name = (body.name as string)?.trim()
    if (!name) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

    // Plan limit check
    const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } })
    const plan = (user?.plan ?? 'NONE') as UserPlan
    const limits = getPlanLimits(plan)

    if (limits.bots === 0) {
      return NextResponse.json({ error: 'Necesitas un plan activo para crear bots.', limitReached: true, plan }, { status: 403 })
    }

    if (limits.bots !== Infinity) {
      const botCount = await prisma.bot.count({ where: { userId: auth.userId } })
      if (botCount >= limits.bots) {
        return NextResponse.json({
          error: `Tu ${PLAN_NAMES[plan]} solo permite ${limits.bots} bot(s). Actualiza al Pack Pro para crear más.`,
          limitReached: true,
          plan,
        }, { status: 403 })
      }
    }

    const typeStr = body.type as string
    const type = typeStr === 'BAILEYS' ? 'BAILEYS' : typeStr === 'META' ? 'META' : 'YCLOUD'
    const webhookToken = generateSecureToken(32)

    const bot = await prisma.bot.create({
      data: {
        userId: auth.userId,
        name,
        type,
        webhookToken,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-dominio.com'
    const webhookUrl = type === 'META'
      ? `${appUrl}/api/webhooks/meta/${bot.id}`
      : `${appUrl}/api/webhooks/ycloud/whatsapp/${bot.id}?token=${webhookToken}`

    return NextResponse.json({ bot, webhookUrl, webhookToken }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/bots]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
