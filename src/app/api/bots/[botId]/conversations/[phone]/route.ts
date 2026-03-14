import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import { sendText } from '@/lib/ycloud'

type Params = { params: { botId: string; phone: string } }

async function getBotAndConv(botId: string, phone: string, userId: string) {
  const bot = await prisma.bot.findFirst({
    where: { id: botId, userId },
    include: { secret: true },
  })
  if (!bot) return { bot: null, conv: null }
  const decodedPhone = decodeURIComponent(phone)
  const conv = await prisma.conversation.findUnique({
    where: { botId_userPhone: { botId, userPhone: decodedPhone } },
  })
  return { bot, conv }
}

// GET — full message history
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { bot, conv } = await getBotAndConv(params.botId, params.phone, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id, buffered: false },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ conversation: conv, messages })
}

// DELETE — delete messages only, reset bot state
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { bot, conv } = await getBotAndConv(params.botId, params.phone, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  await prisma.message.deleteMany({ where: { conversationId: conv.id } })
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { sold: false, soldAt: null, followUp1At: null, followUp1Sent: false, followUp2At: null, followUp2Sent: false },
  })
  await prisma.botState.upsert({
    where: { conversationId: conv.id },
    update: { welcomeSent: false, welcomeSentAt: null, selectedProductId: null, lastIntent: null },
    create: { conversationId: conv.id, welcomeSent: false },
  })

  return NextResponse.json({ ok: true })
}

// PATCH — toggle botDisabled
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { bot, conv } = await getBotAndConv(params.botId, params.phone, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })

  const body = await req.json() as { botDisabled?: boolean }
  const newVal = typeof body.botDisabled === 'boolean' ? body.botDisabled : !(conv as Record<string, unknown>).botDisabled
  // @ts-expect-error — botDisabled added in latest migration; TS server has stale Prisma cache
  const updated = await prisma.conversation.update({ where: { id: conv.id }, data: { botDisabled: newVal } })

  return NextResponse.json({ conversation: updated })
}

// POST — send a manual text message to the contact via YCloud (only for YCLOUD bots)
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { bot, conv } = await getBotAndConv(params.botId, params.phone, user.id)
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })
  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
  if (!bot.secret) return NextResponse.json({ error: 'Bot sin credenciales' }, { status: 400 })
  if (bot.type !== 'YCLOUD') return NextResponse.json({ error: 'El envío manual solo está disponible para bots YCloud' }, { status: 400 })

  const body = await req.json() as { text?: string }
  const text = body.text?.trim()
  if (!text) return NextResponse.json({ error: 'Texto vacío' }, { status: 400 })

  const apiKey = decrypt(bot.secret.ycloudApiKeyEnc)
  const from = bot.secret.whatsappInstanceNumber
  const to = conv.userPhone.replace(/^\+/, '').replace(/\s/g, '')

  try {
    await sendText(from, to, text, apiKey)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error enviando mensaje'
    return NextResponse.json({ error: `YCloud: ${msg}` }, { status: 502 })
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      type: 'text',
      content: JSON.stringify({ mensaje1: text, mensaje2: null, mensaje3: null, fotos_mensaje1: [], videos_mensaje1: [], reporte: '' }),
      buffered: false,
    },
  })

  return NextResponse.json({ message: msg })
}
