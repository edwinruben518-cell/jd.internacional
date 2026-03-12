export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdPlatform } from '@prisma/client'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const campaign = await (prisma as any).adCampaignV2.findFirst({
        where: { id: params.id, userId: user.id },
        include: {
            brief: true,
            strategy: true,
            creatives: { orderBy: { slotIndex: 'asc' } }
        }
    })
    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

    return NextResponse.json({ campaign })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const campaign = await (prisma as any).adCampaignV2.findFirst({
        where: { id: params.id, userId: user.id },
        include: { strategy: true }
    })
    if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

    const body = await req.json()
    const {
        name, providerAccountId, providerAccountName,
        dailyBudgetUSD, locations,
        pageId, whatsappNumber, pixelId, destinationUrl
    } = body

    // Auto-upsert AdConnectedAccount from live providerAccountId
    let connectedAccountId: string | null = campaign.connectedAccountId ?? null
    if (providerAccountId) {
        const integration = await prisma.adIntegration.findUnique({
            where: { userId_platform: { userId: user.id, platform: campaign.strategy.platform as AdPlatform } }
        })
        if (integration) {
            const connectedAccount = await prisma.adConnectedAccount.upsert({
                where: { integrationId: integration.id },
                create: {
                    integrationId: integration.id,
                    providerAccountId: String(providerAccountId),
                    displayName: providerAccountName || String(providerAccountId)
                },
                update: {
                    providerAccountId: String(providerAccountId),
                    displayName: providerAccountName || String(providerAccountId)
                }
            })
            connectedAccountId = connectedAccount.id
        }
    }

    const updated = await (prisma as any).adCampaignV2.update({
        where: { id: params.id },
        data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(dailyBudgetUSD !== undefined && { dailyBudgetUSD: parseFloat(dailyBudgetUSD) }),
            ...(locations !== undefined && { locations }),
            ...(connectedAccountId !== null && { connectedAccountId }),
            ...(pageId !== undefined && { pageId: pageId || null }),
            ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
            ...(pixelId !== undefined && { pixelId: pixelId || null }),
            ...(destinationUrl !== undefined && { destinationUrl: destinationUrl || null }),
        },
        include: { brief: true, strategy: true }
    })

    return NextResponse.json({ campaign: updated })
}
