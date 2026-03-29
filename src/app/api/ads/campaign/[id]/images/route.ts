export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/ads/encryption'
import { generateAdImage, editAdImageWithReference, analyzeProductImageForAd, type ImageQuality, type ImageSize } from '@/lib/ads/openai-ads'
import { supabaseAdmin } from '@/lib/supabase'

const ENC_KEY = process.env.ADS_ENCRYPTION_KEY || ''
const BUCKET = 'ad-creatives'

const VALID_SIZES: ImageSize[] = ['1024x1024', '1024x1792', '1792x1024']
const VALID_QUALITIES: ImageQuality[] = ['fast', 'standard', 'premium']

// Map DALL-E size → gpt-image-1 size (closest equivalent)
function toEditSize(size: string): '1024x1024' | '1024x1536' | '1536x1024' {
    if (size === '1024x1792') return '1024x1536'
    if (size === '1792x1024') return '1536x1024'
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

        if (referenceImageUrl) {
            // Step 1: Analyze the product with GPT-4o Vision to get an exact description.
            // This prevents gpt-image-1 from "inventing" a different product.
            let productDescription = ''
            try {
                productDescription = await analyzeProductImageForAd({ imageUrl: referenceImageUrl, apiKey })
            } catch { /* non-fatal — continue with generic prompt */ }

            // Step 2: Build a product-preserving edit prompt.
            const colors = (brief.brandColors as string[]).slice(0, 2).join(' and ') || 'clean neutral tones'
            const style = (brief.visualStyle as string[]).slice(0, 2).join(', ') || 'modern, professional'
            const value = brief.valueProposition?.substring(0, 100) || ''

            const preserveInstruction = productDescription
                ? `STRICTLY PRESERVE the following product EXACTLY as it appears — do NOT redraw, replace, or alter it in any way: "${productDescription}".`
                : 'STRICTLY PRESERVE the product in this photo exactly as-is. Do NOT change, redraw, or replace the product.'

            const prompt = customPrompt || `Professional advertising image for ${brief.name}, a ${brief.industry} brand. ${preserveInstruction} ONLY MODIFY: replace the background with a ${style} studio or lifestyle setting that uses the brand color palette (${colors}). Add cinematic lighting, soft drop shadows under the product, and a clean aspirational composition. The product must remain the undisputed hero of the image. Visual message: "${value}". Output: commercial photography quality, no text overlays, no watermarks, no logos.`

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
            // No reference image → use DALL-E 3 to generate from scratch
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
