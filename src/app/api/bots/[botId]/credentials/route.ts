export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'

function getAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

/** GET /api/bots/[botId]/credentials – returns non-sensitive fields only */
export async function GET(
  _request: NextRequest,
  { params }: { params: { botId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await prisma.bot.findFirst({
    where: { id: params.botId, userId: auth.userId },
    include: {
      secret: {
        select: {
          whatsappInstanceNumber: true,
          reportPhone: true,
          ycloudApiKeyEnc: true,
          openaiApiKeyEnc: true,
        },
      },
    },
  })

  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  return NextResponse.json({
    whatsappInstanceNumber: bot.secret?.whatsappInstanceNumber ?? '',
    reportPhone: bot.secret?.reportPhone ?? '',
    hasYcloudKey: !!bot.secret?.ycloudApiKeyEnc,
    hasOpenAIKey: !!bot.secret?.openaiApiKeyEnc,
  })
}

/** PUT /api/bots/[botId]/credentials – upsert bot credentials */
export async function PUT(
  request: NextRequest,
  { params }: { params: { botId: string } },
) {
  const auth = getAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const bot = await prisma.bot.findFirst({
    where: { id: params.botId, userId: auth.userId },
    include: { secret: { select: { ycloudApiKeyEnc: true, openaiApiKeyEnc: true } } },
  })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const isBaileys = bot.type === 'BAILEYS'

  const body = await request.json() as Record<string, string>
  const { ycloudApiKey, openaiApiKey, whatsappInstanceNumber, reportPhone } = body

  // Validaciones según tipo de bot
  if (!isBaileys && !whatsappInstanceNumber?.trim()) {
    return NextResponse.json({ error: 'El número de WhatsApp es requerido' }, { status: 400 })
  }
  if (!reportPhone?.trim()) {
    return NextResponse.json({ error: 'El número de reporte es requerido' }, { status: 400 })
  }

  // Allow partial updates: if a key field is empty, keep existing encrypted value
  const existingYcloud = bot.secret?.ycloudApiKeyEnc
  const existingOpenai = bot.secret?.openaiApiKeyEnc

  // Para Baileys, ycloud no es necesario — usar placeholder si no existe
  const ycloudEnc = ycloudApiKey?.trim()
    ? encrypt(ycloudApiKey.trim())
    : existingYcloud ?? (isBaileys ? 'N/A' : '')

  const openaiEnc = openaiApiKey?.trim()
    ? encrypt(openaiApiKey.trim())
    : existingOpenai ?? ''

  if (!openaiEnc) {
    return NextResponse.json(
      { error: 'La API key de OpenAI es requerida la primera vez' },
      { status: 400 },
    )
  }
  if (!isBaileys && !ycloudEnc) {
    return NextResponse.json(
      { error: 'La API key de YCloud es requerida la primera vez' },
      { status: 400 },
    )
  }

  await prisma.botSecret.upsert({
    where: { botId: params.botId },
    create: {
      botId: params.botId,
      ycloudApiKeyEnc: ycloudEnc,
      openaiApiKeyEnc: openaiEnc,
      whatsappInstanceNumber: isBaileys ? '' : whatsappInstanceNumber?.trim() ?? '',
      reportPhone: reportPhone.trim(),
    },
    update: {
      ycloudApiKeyEnc: ycloudEnc,
      openaiApiKeyEnc: openaiEnc,
      ...((!isBaileys && whatsappInstanceNumber?.trim()) && {
        whatsappInstanceNumber: whatsappInstanceNumber.trim(),
      }),
      reportPhone: reportPhone.trim(),
    },
  })

  return NextResponse.json({ ok: true })
}

