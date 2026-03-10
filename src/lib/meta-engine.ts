/**
 * MetaBotEngine – handles incoming Facebook Messenger events.
 * Mirrors the logic of bot-engine.ts but uses the Meta Graph API for sending.
 */

import { prisma } from './prisma'
import { decrypt } from './crypto'
import { transcribeAudio, analyzeImage, chat, ChatMessage } from './openai'
import { sendMetaText, sendMetaImage, sendMetaVideo, markMetaAsRead } from './meta'
import { buildSystemPrompt } from './bot-engine'

const BUFFER_DELAY_MS = 15_000
const MAX_HISTORY_MESSAGES = 20
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ─── Normalize Meta event ─────────────────────────────────────────────────────

interface NormalizedMeta {
  msgId: string
  senderId: string   // Meta PSID (page-scoped user ID)
  userName: string
  type: 'text' | 'audio' | 'image'
  text?: string
  audioUrl?: string
  imageUrl?: string
}

function normalizeMetaEvent(event: Record<string, unknown>): NormalizedMeta | null {
  try {
    const sender  = (event.sender  as Record<string, unknown>)
    const msg     = (event.message as Record<string, unknown>)
    const senderId = (sender?.id ?? '') as string
    if (!senderId) return null

    const msgId    = (msg.mid ?? '') as string
    const userName = '' // Meta doesn't send name in webhook; would need Graph API call

    // Text
    if (msg.text && !msg.attachments) {
      return { msgId, senderId, userName, type: 'text', text: msg.text as string }
    }

    // Attachments (audio / image / video)
    const attachments = (msg.attachments as Array<Record<string, unknown>>) ?? []
    const att = attachments[0]
    if (!att) return { msgId, senderId, userName, type: 'text', text: '' }

    const attType    = att.type as string
    const payload    = (att.payload as Record<string, unknown>) ?? {}
    const url        = (payload.url ?? '') as string

    if (attType === 'audio') {
      return { msgId, senderId, userName, type: 'audio', audioUrl: url }
    }
    if (attType === 'image') {
      return { msgId, senderId, userName, type: 'image', imageUrl: url }
    }
    if (attType === 'video') {
      return { msgId, senderId, userName, type: 'image', imageUrl: url } // treat as image for analysis
    }

    return { msgId, senderId, userName, type: 'text', text: `[Adjunto: ${attType}]` }
  } catch {
    return null
  }
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class MetaBotEngine {
  static async handleEvent(botId: string, event: Record<string, unknown>): Promise<void> {
    // 1. Load bot + secret
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { secret: true },
    })
    if (!bot || bot.status !== 'ACTIVE' || !bot.secret) {
      console.warn(`[META] Bot ${botId} no activo o sin credenciales`)
      return
    }
    if (!bot.secret.metaPageTokenEnc) {
      console.warn(`[META] Bot ${botId} sin Page Access Token`)
      return
    }

    const pageToken = decrypt(bot.secret.metaPageTokenEnc)
    const openaiKey = decrypt(bot.secret.openaiApiKeyEnc)
    const reportPhone = bot.secret.reportPhone

    // 2. Normalize event
    const norm = normalizeMetaEvent(event)
    if (!norm) return

    const { msgId, senderId, type } = norm

    // 3. Dedup by messageId
    if (msgId) {
      const exists = await prisma.message.findUnique({ where: { messageId: msgId } })
      if (exists) { console.log(`[META] Duplicado ${msgId}, omitiendo`); return }
    }

    // 4. Check if already sold
    const existingConv = await prisma.conversation.findUnique({
      where: { botId_userPhone: { botId, userPhone: senderId } },
      select: { sold: true },
    })
    if (existingConv?.sold) {
      console.log(`[META] Usuario ${senderId} ya compró, ignorando`)
      return
    }

    // 5. Mark as read
    markMetaAsRead(senderId, pageToken).catch(() => {})

    // 6. Process message content
    let userText = ''
    let resolvedType: 'text' | 'audio' | 'image' = 'text'

    try {
      if (type === 'text') {
        userText = norm.text || ''
        resolvedType = 'text'
      } else if (type === 'audio' && norm.audioUrl) {
        resolvedType = 'audio'
        userText = await transcribeAudio(norm.audioUrl, openaiKey)
      } else if (type === 'image' && norm.imageUrl) {
        resolvedType = 'image'
        userText = `[Imagen enviada] ${await analyzeImage(norm.imageUrl, openaiKey)}`
      }
    } catch (e) {
      console.error('[META] Error procesando contenido:', e)
      userText = norm.text || '[Mensaje recibido]'
    }

    // 7. Upsert conversation (userPhone = senderId for Meta)
    const conv = await prisma.conversation.upsert({
      where: { botId_userPhone: { botId, userPhone: senderId } },
      create: { botId, userPhone: senderId, userName: norm.userName || null },
      update: { ...(norm.userName && { userName: norm.userName }) },
    })
    const conversationId = conv.id

    // 8. Save incoming message
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        type: resolvedType,
        content: userText,
        messageId: msgId || undefined,
        buffered: true,
      },
    })

    // 9. Buffer: wait and check if we're the last message
    await sleep(BUFFER_DELAY_MS)

    const bufferedMsgs = await prisma.message.findMany({
      where: { conversationId, buffered: true },
      orderBy: { createdAt: 'asc' },
    })
    if (!bufferedMsgs.length) return

    const lastBuffered = bufferedMsgs[bufferedMsgs.length - 1]
    if (lastBuffered.messageId !== (msgId || null) && lastBuffered.content !== userText) {
      console.log(`[META] No soy el último mensaje del buffer, saliendo`)
      return
    }

    // 10. Combine buffered messages
    const combinedText = bufferedMsgs
      .map(m => {
        switch (m.type) {
          case 'audio': return `🎙️ (audio transcrito): ${m.content}`
          case 'image': return `📷 (imagen analizada): ${m.content}`
          default:      return `📝 (texto): ${m.content}`
        }
      })
      .join('\n')

    // Delete buffered, save as single user message
    await prisma.message.deleteMany({ where: { conversationId, buffered: true } })
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        type: resolvedType,
        content: combinedText,
        messageId: msgId || undefined,
        buffered: false,
      },
    })

    // 11. Load history
    const recentMessages = await prisma.message.findMany({
      where: { conversationId, buffered: false },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_MESSAGES,
    })
    recentMessages.reverse()

    const chatHistory: ChatMessage[] = recentMessages.map(m => {
      if (m.role === 'assistant') {
        try {
          const parsed = JSON.parse(m.content) as Record<string, unknown>
          const parts = [parsed.mensaje1, parsed.mensaje2, parsed.mensaje3].filter(Boolean).join('\n')
          return { role: 'assistant' as const, content: parts || m.content }
        } catch {
          return { role: 'assistant' as const, content: m.content }
        }
      }
      return { role: m.role as 'user', content: m.content }
    })

    // 12. Load products + build prompt
    const products = await prisma.product.findMany({
      where: { bots: { some: { botId } }, active: true },
    })
    const systemPrompt = buildSystemPrompt(
      bot,
      products as Array<Record<string, unknown>>,
      conv.userName,
      senderId,
    )

    // 13. Call OpenAI
    const response = await chat(systemPrompt, chatHistory, openaiKey)

    // 14. Send responses via Meta
    console.log(`[META] Enviando respuesta → ${senderId}`)

    if (response.mensaje1) {
      await sendMetaText(senderId, response.mensaje1, pageToken).catch(e =>
        console.error('[META] sendText m1 ERROR:', e),
      )
      await sleep(Math.floor(Math.random() * 1000) + 1000)
    }

    for (const photoUrl of response.fotos_mensaje1 ?? []) {
      if (typeof photoUrl === 'string' && photoUrl.startsWith('https://')) {
        await sendMetaImage(senderId, photoUrl, pageToken).catch(e =>
          console.error('[META] sendImage ERROR:', e),
        )
        await sleep(800)
      }
    }

    for (const videoUrl of (response.videos_mensaje1 ?? []) as string[]) {
      if (videoUrl.startsWith('https://')) {
        await sendMetaVideo(senderId, videoUrl, pageToken).catch(e =>
          console.error('[META] sendVideo ERROR:', e),
        )
        await sleep(1200)
      }
    }

    if (response.mensaje2) {
      await sendMetaText(senderId, response.mensaje2, pageToken).catch(e =>
        console.error('[META] sendText m2 ERROR:', e),
      )
      await sleep(Math.floor(Math.random() * 1000) + 1000)
    }

    if (response.mensaje3) {
      await sendMetaText(senderId, response.mensaje3, pageToken).catch(e =>
        console.error('[META] sendText m3 ERROR:', e),
      )
    }

    // 15. Handle reporte (sale)
    if (response.reporte && reportPhone) {
      // Send report via Meta text to the reportPhone (if it's a PSID) or just log
      console.log(`[META] Reporte de venta para ${senderId}: ${response.reporte}`)
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { sold: true, soldAt: new Date() },
      }).catch(() => {})
    } else {
      const now = new Date()
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          followUp1At: new Date(now.getTime() + (bot.followUp1Delay || 15) * 60 * 1000),
          followUp1Sent: false,
          followUp2At: new Date(now.getTime() + (bot.followUp2Delay || 4320) * 60 * 1000),
          followUp2Sent: false,
        },
      }).catch(() => {})
    }

    // 16. Save assistant response
    await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        type: 'text',
        content: JSON.stringify(response),
        buffered: false,
      },
    })

    console.log(`[META] Respuesta enviada a ${senderId}`)
  }
}
