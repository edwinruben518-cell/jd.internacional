import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const plan = (user as any).plan ?? 'NONE'
    const planExpiresAt: Date | null = (user as any).planExpiresAt ?? null

    // Check if expired
    const now = new Date()
    const expired = plan !== 'NONE' && planExpiresAt !== null && planExpiresAt < now

    if (expired) {
      // Auto-deactivate: plan → NONE, bots → PAUSED, stores → inactive
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`UPDATE users SET plan = 'NONE'::"UserPlan", plan_expires_at = NULL WHERE id = ${user.id}::uuid`
        await tx.$executeRaw`UPDATE bots SET status = 'PAUSED'::"BotStatus" WHERE user_id = ${user.id}::uuid`
        await tx.$executeRaw`UPDATE stores SET active = false WHERE user_id = ${user.id}::uuid`
      })
      return NextResponse.json({ plan: 'NONE', planExpiresAt: null, expired: true })
    }

    return NextResponse.json({
      plan,
      planExpiresAt: planExpiresAt?.toISOString() ?? null,
      expired: false,
    })
  } catch (err) {
    console.error('[GET /api/plan-status]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
