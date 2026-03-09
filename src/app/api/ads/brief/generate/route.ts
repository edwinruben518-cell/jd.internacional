export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'
import { generateBusinessBrief } from '@/lib/ads/openai-ads'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const oaiConfig = await (prisma as any).openAIConfig.findUnique({ where: { userId: user.id } })
    if (!oaiConfig?.isValid) {
        return NextResponse.json({ error: 'Configura tu OpenAI API Key primero' }, { status: 400 })
    }
    const apiKey = decrypt(oaiConfig.apiKeyEnc, ENC_KEY)

    const { text } = await req.json()
    if (!text || text.trim().length < 20) {
        return NextResponse.json({ error: 'Describe tu negocio con al menos 20 caracteres' }, { status: 400 })
    }

    try {
        const brief = await generateBusinessBrief(text.trim(), apiKey, oaiConfig.model)
        return NextResponse.json({ brief })
    } catch (err: any) {
        console.error('[GenerateBrief]', err)
        return NextResponse.json({ error: err.message || 'Error al generar el brief' }, { status: 500 })
    }
}
