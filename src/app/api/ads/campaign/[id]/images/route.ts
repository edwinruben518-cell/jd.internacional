export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'
import { generateAdImage, type ImageQuality, type ImageSize } from '@/lib/ads/openai-ads'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''

const VALID_SIZES: ImageSize[] = ['1024x1024', '1024x1792', '1792x1024']
const VALID_QUALITIES: ImageQuality[] = ['fast', 'standard', 'premium']

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const oaiConfig = await (prisma as any).openAIConfig.findUnique({ where: { userId: user.id } })
    if (!oaiConfig?.isValid) {
        return NextResponse.json({ error: 'Configura tu OpenAI API Key primero' }, { status: 400 })
    }
    const apiKey = decrypt(oaiConfig.apiKeyEnc, ENC_KEY)

    const campaign = await (prisma as any).adCampaignV2.findFirst({
        where: { id: params.id, userId: user.id },
        include: { brief: true, strategy: true }
    })
    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

    const body = await req.json()
    const {
        slotIndex = 0,
        creativeId,
        customPrompt,
        quality = 'standard',
        size = '1024x1024',
    } = body

    try {
        const imageUrl = await generateAdImage({
            brief: {
                name: campaign.brief.name,
                industry: campaign.brief.industry,
                description: campaign.brief.description,
                valueProposition: campaign.brief.valueProposition,
                painPoints: campaign.brief.painPoints,
                interests: campaign.brief.interests,
                brandVoice: campaign.brief.brandVoice,
                brandColors: campaign.brief.brandColors,
                visualStyle: campaign.brief.visualStyle,
                primaryObjective: campaign.brief.primaryObjective,
                mainCTA: campaign.brief.mainCTA,
                targetLocations: campaign.brief.targetLocations,
                keyMessages: campaign.brief.keyMessages,
                personalityTraits: campaign.brief.personalityTraits,
                contentThemes: campaign.brief.contentThemes,
                engagementLevel: campaign.brief.engagementLevel || 'medio'
            },
            mediaType: campaign.strategy.mediaType,
            slotIndex,
            apiKey,
            customPrompt: customPrompt || undefined,
            quality: VALID_QUALITIES.includes(quality) ? quality : 'standard',
            size: VALID_SIZES.includes(size) ? size : '1024x1024',
        })

        // Update creative if creativeId provided
        if (creativeId) {
            await (prisma as any).adCreative.update({
                where: { id: creativeId },
                data: { mediaUrl: imageUrl, mediaType: 'image', aiGenerated: true }
            })
        }

        return NextResponse.json({ imageUrl })
    } catch (err: any) {
        console.error('[GenerateImage]', err)
        return NextResponse.json({ error: err.message || 'Error al generar la imagen' }, { status: 500 })
    }
}
