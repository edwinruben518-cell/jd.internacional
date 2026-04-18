export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

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
          metaPageTokenEnc: true,
          metaPhoneNumberId: true,
          metaWabaId: true,
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
    hasMetaToken: !!bot.secret?.metaPageTokenEnc,
    metaPageTokenHint: (() => {
      try {
        return bot.secret?.metaPageTokenEnc
          ? decrypt(bot.secret.metaPageTokenEnc).slice(0, 8) + '...'
          : ''
      } catch { return '' }
    })(),
    metaPhoneNumberId: bot.secret?.metaPhoneNumberId ?? '',
    metaWabaId: bot.secret?.metaWabaId ?? '',
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
    include: { secret: { select: { ycloudApiKeyEnc: true, openaiApiKeyEnc: true, metaPageTokenEnc: true } } },
  })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  const isBaileys    = bot.type === 'BAILEYS'
  const isMeta       = bot.type === 'META'
  const isWaCloud    = bot.type === 'WHATSAPP_CLOUD'

  const body = await request.json() as Record<string, string>
  const { ycloudApiKey, openaiApiKey, whatsappInstanceNumber, reportPhone, metaPageToken, metaPhoneNumberId, metaWabaId } = body

  // Validaciones según tipo de bot
  if (!isBaileys && !isMeta && !isWaCloud && !whatsappInstanceNumber?.trim()) {
    return NextResponse.json({ error: 'El número de WhatsApp es requerido' }, { status: 400 })
  }
  if (!isMeta && !isWaCloud && !reportPhone?.trim()) {
    return NextResponse.json({ error: 'El número de reporte es requerido' }, { status: 400 })
  }
  if (isMeta && !metaPageToken?.trim() && !bot.secret?.metaPageTokenEnc) {
    return NextResponse.json({ error: 'El Page Access Token de Meta es requerido' }, { status: 400 })
  }
  if (isWaCloud && !metaPageToken?.trim() && !bot.secret?.metaPageTokenEnc) {
    return NextResponse.json({ error: 'El Access Token de WhatsApp Cloud es requerido' }, { status: 400 })
  }

  const existingYcloud    = bot.secret?.ycloudApiKeyEnc
  const existingOpenai    = bot.secret?.openaiApiKeyEnc
  const existingMetaToken = bot.secret?.metaPageTokenEnc

  const ycloudEnc = ycloudApiKey?.trim()
    ? encrypt(ycloudApiKey.trim())
    : existingYcloud ?? (isBaileys || isMeta || isWaCloud ? 'N/A' : '')

  const openaiEnc = openaiApiKey?.trim()
    ? encrypt(openaiApiKey.trim())
    : existingOpenai ?? ''

  const metaTokenEnc = metaPageToken?.trim()
    ? encrypt(metaPageToken.trim())
    : existingMetaToken ?? null

  if (!openaiEnc) {
    return NextResponse.json(
      { error: 'La API key de OpenAI es requerida la primera vez' },
      { status: 400 },
    )
  }
  if (!isBaileys && !isMeta && !isWaCloud && !ycloudEnc) {
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
      whatsappInstanceNumber: (isBaileys || isMeta || isWaCloud) ? '' : whatsappInstanceNumber?.trim() ?? '',
      reportPhone: (isMeta || isWaCloud) ? '' : reportPhone.trim(),
      ...(metaTokenEnc && { metaPageTokenEnc: metaTokenEnc }),
      ...(isWaCloud && metaPhoneNumberId?.trim() && { metaPhoneNumberId: metaPhoneNumberId.trim() }),
      ...(isWaCloud && metaWabaId?.trim() && { metaWabaId: metaWabaId.trim() }),
    },
    update: {
      ycloudApiKeyEnc: ycloudEnc,
      openaiApiKeyEnc: openaiEnc,
      ...(!isBaileys && !isMeta && !isWaCloud && whatsappInstanceNumber?.trim() && {
        whatsappInstanceNumber: whatsappInstanceNumber.trim(),
      }),
      ...(!isMeta && !isWaCloud && { reportPhone: reportPhone.trim() }),
      ...(metaTokenEnc && { metaPageTokenEnc: metaTokenEnc }),
      ...(isWaCloud && metaPhoneNumberId?.trim() && { metaPhoneNumberId: metaPhoneNumberId.trim() }),
      ...(isWaCloud && metaWabaId?.trim() && { metaWabaId: metaWabaId.trim() }),
    },
  })

  return NextResponse.json({ ok: true })
}

