import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { STRATEGIES_SEED } from '@/lib/ads/strategies-seed'

async function ensureStrategiesSeeded() {
    const count = await (prisma as any).adStrategy.count({ where: { isGlobal: true } })

    // Re-seed if DB has fewer strategies than the seed file (new strategies added)
    if (count >= STRATEGIES_SEED.length) return

    // Delete old global strategies and replace with current seed
    await (prisma as any).adStrategy.deleteMany({ where: { isGlobal: true } })
    await (prisma as any).adStrategy.createMany({
        data: STRATEGIES_SEED.map(s => ({
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
        }))
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
