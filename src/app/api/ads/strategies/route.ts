import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STRATEGIES_SEED } from '@/lib/ads/strategies-seed'

async function ensureStrategiesSeeded() {
    const count = await (prisma as any).adStrategy.count({ where: { isGlobal: true } })

    // Already up to date
    if (count >= STRATEGIES_SEED.length) return

    // Get existing names to avoid duplicates (safe for concurrent requests)
    const existing = await (prisma as any).adStrategy.findMany({
        where: { isGlobal: true },
        select: { name: true }
    })
    const existingNames = new Set(existing.map((s: any) => s.name))

    const toInsert = STRATEGIES_SEED.filter(s => !existingNames.has(s.name))
    if (toInsert.length === 0) return

    await (prisma as any).adStrategy.createMany({
        data: toInsert.map(s => ({
            name: s.name,
            description: s.description,
            platform: s.platform,
            objective: s.objective,
            destination: s.destination,
            mediaType: s.mediaType,
            mediaCount: s.mediaCount,
            minBudgetUSD: s.minBudgetUSD,
            advantageType: s.advantageType,
            isGlobal: true,
            sortOrder: s.sortOrder,
            isActive: true
        })),
        skipDuplicates: true
    })
}

export async function GET(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await ensureStrategiesSeeded()

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform')
    const destination = searchParams.get('destination')
    const mediaType = searchParams.get('mediaType')
    const objective = searchParams.get('objective')

    const where: any = {
        isActive: true,
        OR: [{ isGlobal: true }, { userId: user.id }]
    }

    if (platform && platform !== 'ALL') where.platform = platform
    if (destination && destination !== 'ALL') where.destination = destination
    if (mediaType && mediaType !== 'ALL') where.mediaType = mediaType
    if (objective && objective !== 'ALL') where.objective = objective

    const strategies = await (prisma as any).adStrategy.findMany({
        where,
        orderBy: [{ platform: 'asc' }, { sortOrder: 'asc' }]
    })

    return NextResponse.json({ strategies })
}
