import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
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

async function getBotAndProduct(botId: string, productId: string, userId: string) {
  const bot = await prisma.bot.findFirst({ where: { id: botId, userId } })
  if (!bot) return { error: 'Bot no encontrado', status: 404 }

  const product = await prisma.product.findFirst({ where: { id: productId, botId } })
  if (!product) return { error: 'Producto no encontrado', status: 404 }

  return { bot, product }
}

/** PATCH /api/bots/[botId]/products/[productId] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { botId: string; productId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const result = await getBotAndProduct(params.botId, params.productId, auth.userId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const body = await request.json() as Record<string, unknown>

  const imageMainUrls = body.imageMainUrls !== undefined ? parseJsonArray(body.imageMainUrls) : undefined
  const productVideoUrls = body.productVideoUrls !== undefined ? parseJsonArray(body.productVideoUrls) : undefined
  const testimonialsVideoUrls =
    body.testimonialsVideoUrls !== undefined ? parseJsonArray(body.testimonialsVideoUrls) : undefined
  const hooks = body.hooks !== undefined ? parseJsonArray(body.hooks) : undefined
  const tags = body.tags !== undefined ? parseJsonArray(body.tags) : undefined

  // Desactivamos validación estricta para mayor flexibilidad

  const active = typeof body.active === 'boolean' ? body.active : undefined
  if (active === true && imageMainUrls !== undefined && imageMainUrls.length === 0) {
    return NextResponse.json(
      { error: 'Un producto activo debe tener al menos 1 imagen principal' },
      { status: 400 },
    )
  }

  const updated = await prisma.product.update({
    where: { id: params.productId },
    data: {
      ...(typeof body.name === 'string' ? { name: body.name.trim() } : {}),
      ...(typeof body.category === 'string' ? { category: body.category || null } : {}),
      ...(typeof body.benefits === 'string' ? { benefits: body.benefits || null } : {}),
      ...(typeof body.usage === 'string' ? { usage: body.usage || null } : {}),
      ...(typeof body.warnings === 'string' ? { warnings: body.warnings || null } : {}),
      ...(body.priceUnit !== undefined ? { priceUnit: (body.priceUnit !== null && body.priceUnit !== '') ? Number(body.priceUnit) : null } : {}),
      ...(body.pricePromo2 !== undefined ? { pricePromo2: (body.pricePromo2 !== null && body.pricePromo2 !== '') ? Number(body.pricePromo2) : null } : {}),
      ...(body.priceSuper6 !== undefined ? { priceSuper6: (body.priceSuper6 !== null && body.priceSuper6 !== '') ? Number(body.priceSuper6) : null } : {}),
      ...(typeof body.currency === 'string' ? { currency: body.currency } : {}),
      ...(typeof body.welcomeMessage === 'string' ? { welcomeMessage: body.welcomeMessage || null } : {}),
      ...(typeof body.firstMessage === 'string' ? { firstMessage: body.firstMessage || null } : {}),
      ...(hooks !== undefined ? { hooks } : {}),
      ...(imageMainUrls !== undefined ? { imageMainUrls } : {}),
      ...(typeof body.imagePriceUnitUrl === 'string' ? { imagePriceUnitUrl: body.imagePriceUnitUrl || null } : {}),
      ...(typeof body.imagePricePromoUrl === 'string' ? { imagePricePromoUrl: body.imagePricePromoUrl || null } : {}),
      ...(typeof body.imagePriceSuperUrl === 'string' ? { imagePriceSuperUrl: body.imagePriceSuperUrl || null } : {}),
      ...(productVideoUrls !== undefined ? { productVideoUrls } : {}),
      ...(testimonialsVideoUrls !== undefined ? { testimonialsVideoUrls } : {}),
      ...(typeof body.shippingInfo === 'string' ? { shippingInfo: body.shippingInfo || null } : {}),
      ...(typeof body.coverage === 'string' ? { coverage: body.coverage || null } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(active !== undefined ? { active } : {}),
    },
  })

  return NextResponse.json({ product: updated })
}

/** DELETE /api/bots/[botId]/products/[productId] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { botId: string; productId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const result = await getBotAndProduct(params.botId, params.productId, auth.userId)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  await prisma.product.delete({ where: { id: params.productId } })

  return NextResponse.json({ ok: true })
}
