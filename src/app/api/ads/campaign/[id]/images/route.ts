export const dynamic = 'force-dynamic'
export const maxDuration = 180 // vision (20s) + parallel direction+overlay (15s) + gpt-image-2 premium (90s) = ~125s
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'
import { generateAdImage, editAdImageWithReference, analyzeProductImageForAd, generateCreativeDirection, generateTextOverlay, type ImageQuality, type ImageSize } from '@/lib/ads/openai-ads'
import { supabaseAdmin } from '@/lib/supabase'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''
const BUCKET = 'ad-creatives'

const VALID_SIZES: ImageSize[] = ['1024x1024', '1024x1536', '1536x1024']
const VALID_QUALITIES: ImageQuality[] = ['fast', 'standard', 'premium']

function toEditSize(size: string): '1024x1024' | '1024x1536' | '1536x1024' {
    if (size === '1024x1536') return '1024x1536'
    if (size === '1536x1024') return '1536x1024'
    return '1024x1024'
}

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
        referenceImageUrl,
    } = body

    const brief = {
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
    }

    try {
        let imageUrl: string

        if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.startsWith('http')) {
            const colors = ((brief.brandColors as string[]) || []).slice(0, 3).join(', ') || 'clean neutral tones'
            const style = ((brief.visualStyle as string[]) || []).slice(0, 3).join(', ') || 'modern, professional'
            const value = brief.valueProposition?.substring(0, 120) || ''
            const keyMessages = (brief.keyMessages as string[]) || []
            const keyMsg = keyMessages[slotIndex] || keyMessages[0] || ''

            // Step 1: analyze the product photo and generate creative direction + text overlay in parallel
            const [productDescription, creativeSceneRaw, textOverlayRaw] = await Promise.allSettled([
                analyzeProductImageForAd({ imageUrl: referenceImageUrl, apiKey }),
                generateCreativeDirection({ brief, productDescription: '', slotIndex, apiKey }),
                generateTextOverlay({
                    brief, slotIndex,
                    objective: campaign.strategy.objective || 'conversions',
                    destination: campaign.strategy.destination || 'website',
                    apiKey,
                }),
            ])

            const productDesc = productDescription.status === 'fulfilled' ? productDescription.value : ''
            let creativeScene = creativeSceneRaw.status === 'fulfilled' ? creativeSceneRaw.value : ''
            let textOverlay = textOverlayRaw.status === 'fulfilled' ? textOverlayRaw.value : ''

            if (!creativeScene) {
                creativeScene = `the product as the absolute hero, placed in a stunning ${brief.industry} scene — cinematic lighting, ${colors} color palette, ${style} aesthetic`
            }
            if (!textOverlay) {
                textOverlay = `a single bold 3D text overlay that reads "${(keyMsg || value).substring(0, 20)}" in a prominent position`
            }

            // Human-style product fidelity instruction
            const productFidelity = productDesc
                ? `The product in the reference photo must appear exactly as it is — same ${productDesc.substring(0, 200)}. Do not redesign or alter the product in any way. Only place it in a new creative scene.`
                : `The product from the reference photo must be kept pixel-perfect — exact same shape, label, colors and proportions. Only the background and scene around it should change.`

            // Assemble final prompt in the style of high-performing image generation prompts
            const prompt = customPrompt
                ? `${productFidelity} ${customPrompt}, ${textOverlay}, ultra realistic, 4k hyper detailed, advertising agency quality, designed for social media conversion`
                : `${creativeScene}, ${productFidelity} ${colors} color scheme, ${style}, ${textOverlay}, ultra realistic, 4k hyper detailed, cinematic lighting, depth of field, advertising agency production quality, designed for social media high conversion, no watermarks`

            const imgBuffer = await editAdImageWithReference({
                imageUrl: referenceImageUrl,
                prompt,
                apiKey,
                size: toEditSize(VALID_SIZES.includes(size as ImageSize) ? size : '1024x1024'),
            })

            // Upload the result to Supabase Storage
            const path = `ads/${user.id}/${params.id}/slot-${slotIndex}-edit-${Date.now()}.png`
            const { error: uploadErr } = await supabaseAdmin.storage
                .from(BUCKET)
                .upload(path, imgBuffer, { contentType: 'image/png', upsert: true })
            if (uploadErr) throw new Error(uploadErr.message)

            const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
            imageUrl = urlData.publicUrl
        } else {
            // No reference image → use gpt-image-2 to generate from scratch
            imageUrl = await generateAdImage({
                brief,
                mediaType: campaign.strategy.mediaType,
                slotIndex,
                apiKey,
                customPrompt: customPrompt || undefined,
                quality: VALID_QUALITIES.includes(quality) ? quality : 'standard',
                size: VALID_SIZES.includes(size) ? size : '1024x1024',
            })
        }

        // Persist to DB if creativeId given
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
