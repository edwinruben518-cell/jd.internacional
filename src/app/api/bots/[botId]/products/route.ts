import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { getPlanLimits, PLAN_NAMES, type UserPlan } from '@/lib/plan-limits'

function getAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

function validateUrls(urls: string[], label: string) {
  for (const url of urls) {
    if (!url.startsWith('https://')) {
      return `${label}: todas las URLs deben comenzar con https://`
    }
  }
  return null
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return value
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

/** GET /api/bots/[botId]/products */
export async function GET(
  _request: NextRequest,
  { params }: { params: { botId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await prisma.bot.findFirst({ where: { id: params.botId, userId: auth.userId } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const products = await prisma.product.findMany({
    where: { botId: params.botId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ products })
}

/** POST /api/bots/[botId]/products */
export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await prisma.bot.findFirst({ where: { id: params.botId, userId: auth.userId } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  // Plan limit check
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } })
  const plan = (user?.plan ?? 'NONE') as UserPlan
  const limits = getPlanLimits(plan)

  if (limits.productsPerBot !== Infinity) {
    const productCount = await prisma.product.count({ where: { botId: params.botId } })
    if (productCount >= limits.productsPerBot) {
      return NextResponse.json({
        error: `Tu ${PLAN_NAMES[plan]} permite hasta ${limits.productsPerBot} producto(s) por bot. Actualiza al Pack Pro para agregar más.`,
        limitReached: true,
        plan,
      }, { status: 403 })
    }
  }

  const body = await request.json() as Record<string, unknown>

  const name = (body.name as string)?.trim()
  if (!name) return NextResponse.json({ error: 'El nombre del producto es requerido' }, { status: 400 })

  const imageMainUrls = parseJsonArray(body.imageMainUrls)
  const productVideoUrls = parseJsonArray(body.productVideoUrls)
  const testimonialsVideoUrls = parseJsonArray(body.testimonialsVideoUrls)
  const hooks = parseJsonArray(body.hooks)
  const tags = parseJsonArray(body.tags)

  // Desactivamos validación estricta para mayor flexibilidad
  const urlError = null

  if (urlError) return NextResponse.json({ error: urlError }, { status: 400 })

  const active = body.active !== false
  if (active && imageMainUrls.length === 0) {
    return NextResponse.json(
      { error: 'Un producto activo debe tener al menos 1 imagen principal' },
      { status: 400 },
    )
  }

  const product = await prisma.product.create({
    data: {
      botId: params.botId,
      name,
      category: (body.category as string) || null,
      benefits: (body.benefits as string) || null,
      usage: (body.usage as string) || null,
      warnings: (body.warnings as string) || null,
      priceUnit: (body.priceUnit !== undefined && body.priceUnit !== null && body.priceUnit !== '') ? Number(body.priceUnit) : null,
      pricePromo2: (body.pricePromo2 !== undefined && body.pricePromo2 !== null && body.pricePromo2 !== '') ? Number(body.pricePromo2) : null,
      priceSuper6: (body.priceSuper6 !== undefined && body.priceSuper6 !== null && body.priceSuper6 !== '') ? Number(body.priceSuper6) : null,
      currency: (body.currency as string) || 'USD',
      welcomeMessage: (body.welcomeMessage as string) || null,
      firstMessage: (body.firstMessage as string) || null,
      hooks,
      imageMainUrls,
      imagePriceUnitUrl: (body.imagePriceUnitUrl as string) || null,
      imagePricePromoUrl: (body.imagePricePromoUrl as string) || null,
      imagePriceSuperUrl: (body.imagePriceSuperUrl as string) || null,
      productVideoUrls,
      testimonialsVideoUrls,
      shippingInfo: (body.shippingInfo as string) || null,
      coverage: (body.coverage as string) || null,
      tags,
      active,
    },
  })

  return NextResponse.json({ product }, { status: 201 })
}
