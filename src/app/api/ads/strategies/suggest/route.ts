export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''
import { generateStrategySuggestions } from '@/lib/ads/openai-ads'

export async function POST(req: NextRequest) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { briefId } = body
    if (!briefId) return NextResponse.json({ error: 'briefId requerido' }, { status: 400 })

    // Fetch brief
    const brief = await (prisma as any).businessBrief.findFirst({
        where: { id: briefId, userId: user.id }
    })
    if (!brief) return NextResponse.json({ error: 'Brief no encontrado' }, { status: 404 })

    // Fetch user's OpenAI key
    const openaiConfig = await (prisma as any).openAIConfig.findUnique({ where: { userId: user.id } })
    if (!openaiConfig?.apiKeyEnc) {
        return NextResponse.json({ error: 'Configura tu API key de OpenAI en el panel de configuración.' }, { status: 400 })
    }

    let apiKey: string
    try {
        apiKey = decrypt(openaiConfig.apiKeyEnc, ENC_KEY)
    } catch {
        return NextResponse.json({ error: 'Error al leer tu API key de OpenAI.' }, { status: 500 })
    }

    // Generate AI suggestions using user's configured model
    const suggestions = await generateStrategySuggestions(brief, apiKey, openaiConfig.model || 'gpt-5.1')

    // Delete old AI suggestions for this user to avoid accumulation
    await (prisma as any).adStrategy.deleteMany({
        where: { userId: user.id, isGlobal: false }
    })

    // Save each suggestion to DB (so they have IDs for the existing campaign flow)
    const saved = []
    for (let i = 0; i < suggestions.length; i++) {
        const s = suggestions[i]
        const created = await (prisma as any).adStrategy.create({
            data: {
                name: s.name,
                // Encode reason inside description with separator — parsed on frontend
                description: `${s.description}||REASON:${s.reason}`,
                platform: s.platform,
                objective: s.objective,
                destination: s.destination,
                mediaType: s.mediaType,
                mediaCount: s.mediaCount,
                minBudgetUSD: s.minBudgetUSD,
                advantageType: s.advantageType,
                isGlobal: false,
                userId: user.id,
                sortOrder: i,
                isActive: true,
            }
        })
        saved.push({ ...created, description: s.description, reason: s.reason })
    }

    return NextResponse.json({ strategies: saved })
}
