import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const SPONSORSHIP_PCT = 0.20

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const body = await request.json()
  const { action, notes } = body // action: 'approve' | 'reject'

  // Fetch request + user data via raw SQL to bypass stale Prisma client
  const purchaseRequest = await prisma.packPurchaseRequest.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, sponsorId: true, fullName: true } },
    },
  })

  if (!purchaseRequest) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }

  if (purchaseRequest.status !== 'PENDING') {
    return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 400 })
  }

  if (action === 'approve') {
    // Get current plan via raw SQL to guarantee correctness
    const currentUserData = await prisma.$queryRaw<Array<{ plan: string }>>`
      SELECT plan::text FROM users WHERE id = ${purchaseRequest.userId}::uuid LIMIT 1
    `
    const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }
    const currentRank = PLAN_RANK[currentUserData[0]?.plan ?? 'NONE'] ?? 0
    const newRank = PLAN_RANK[purchaseRequest.plan] ?? 0

    if (newRank <= currentRank) {
      return NextResponse.json({
        error: 'El usuario ya tiene este plan o uno superior activo.',
      }, { status: 400 })
    }

    const newPlan = purchaseRequest.plan as string

    await prisma.$transaction(async (tx) => {
      // Update purchase request status
      await tx.packPurchaseRequest.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          notes: notes ?? null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      })

      // Update user plan + expiry via raw SQL
      await tx.$executeRaw`
        UPDATE users SET plan = ${newPlan}::"UserPlan", is_active = true,
          plan_expires_at = NOW() + INTERVAL '30 days'
        WHERE id = ${purchaseRequest.userId}::uuid
      `

      // Create sponsorship commission if user has a sponsor
      if (purchaseRequest.user.sponsorId) {
        const bonus = parseFloat((Number(purchaseRequest.price) * SPONSORSHIP_PCT).toFixed(2))
        const planLabel = { BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }[newPlan] ?? newPlan
        await tx.commission.create({
          data: {
            userId: purchaseRequest.user.sponsorId,
            fromUserId: purchaseRequest.userId,
            type: 'SPONSORSHIP_BONUS',
            amount: bonus,
            description: `Bono de patrocinio 20% — ${purchaseRequest.user.fullName} activó ${planLabel} ($${Number(purchaseRequest.price)} USD)`,
          },
        })
      }
    })

    return NextResponse.json({ success: true, action: 'approved' })
  }

  if (action === 'reject') {
    await prisma.packPurchaseRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        notes: notes ?? null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })
    return NextResponse.json({ success: true, action: 'rejected' })
  }

  return NextResponse.json({ error: 'Acción inválida. Usa approve o reject.' }, { status: 400 })
}
