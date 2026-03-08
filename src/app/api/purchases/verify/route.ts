import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'
import { sendOrderConfirmedEmail } from '@/lib/email'

const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }

/**
 * GET /api/purchases/verify
 * Cron job protegido por CRON_SECRET.
 * Busca compras PENDING_VERIFICATION y las verifica on-chain.
 * Configurar en Render como cron job cada 2 minutos.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let pending: Awaited<ReturnType<typeof prisma.packPurchaseRequest.findMany>>
  try {
    pending = await prisma.packPurchaseRequest.findMany({
      where: { status: 'PENDING_VERIFICATION', paymentMethod: 'CRYPTO', txHash: { not: null } },
      include: { user: { select: { id: true, sponsorId: true, fullName: true, plan: true } } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
  } catch (err) {
    console.error('[cron/verify] Error fetching pending purchases:', err)
    return NextResponse.json({ error: 'Error consultando compras pendientes' }, { status: 500 })
  }

  const results = { verified: 0, failed: 0, pending: pending.length }

  for (const req of pending) {
    const verification = await verifyBscTransaction(req.txHash!, Number(req.price))

    if (!verification.success) {
      // Si lleva más de 30 minutos sin confirmarse, rechazar
      const ageMinutes = (Date.now() - req.createdAt.getTime()) / 60000
      if (ageMinutes > 30) {
        await prisma.packPurchaseRequest.update({
          where: { id: req.id },
          data: { status: 'REJECTED', notes: `Timeout verificación: ${verification.error}` },
        })
        results.failed++
      }
      continue
    }

    // Verificado — activar plan en transacción
    try {
      const newPlan = req.plan as string
      const currentRank = PLAN_RANK[req.user.plan ?? 'NONE'] ?? 0
      const newRank = PLAN_RANK[newPlan] ?? 0

      await prisma.$transaction(async (tx) => {
        await tx.packPurchaseRequest.update({
          where: { id: req.id },
          data: {
            status: 'APPROVED',
            blockNumber: verification.blockNumber ?? null,
            reviewedAt: new Date(),
            notes: `Auto-aprobado por cron. USDT: ${verification.amountUsdt?.toFixed(2)}`,
          },
        })

        if (newRank > currentRank) {
          await tx.$executeRaw`
            UPDATE users
            SET plan = ${newPlan}::\"UserPlan\",
                is_active = true,
                plan_expires_at = NOW() + INTERVAL '30 days'
            WHERE id = ${req.userId}::uuid
          `
        }

        // Comisión de patrocinio 20%
        if (req.user.sponsorId) {
          const SPONSORSHIP_PCT = 0.20
          const bonus = parseFloat((Number(req.price) * SPONSORSHIP_PCT).toFixed(2))
          const planLabel = { BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite' }[newPlan] ?? newPlan

          const existingCommission = await tx.commission.findFirst({
            where: { fromUserId: req.userId, type: 'SPONSORSHIP_BONUS', description: { contains: req.id } },
          })

          if (!existingCommission) {
            await tx.commission.create({
              data: {
                userId: req.user.sponsorId,
                fromUserId: req.userId,
                type: 'SPONSORSHIP_BONUS',
                amount: bonus,
                description: `Bono patrocinio 20% — ${req.user.fullName} activó ${planLabel} vía USDT [req:${req.id}]`,
              },
            })
          }
        }

        await tx.auditLog.create({
          data: {
            userId: req.userId,
            actorUserId: req.userId,
            action: 'PURCHASE_CRYPTO_CRON_APPROVED',
            entityType: 'PackPurchaseRequest',
            entityId: req.id,
            payload: { plan: newPlan, txHash: req.txHash, amountUsdt: verification.amountUsdt },
          },
        })
      })

      results.verified++
    } catch (err) {
      console.error('[cron/verify] Error activando plan:', req.id, err)
      results.failed++
    }
  }

  // ── Course enrollment crypto verification ──────────────────────────────────
  let pendingEnrollments: Awaited<ReturnType<typeof prisma.courseEnrollment.findMany>>
  try {
    pendingEnrollments = await prisma.courseEnrollment.findMany({
      where: { status: 'PENDING_VERIFICATION' as any, paymentMethod: 'CRYPTO', txHash: { not: null } },
      include: { course: { select: { id: true, price: true } } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
  } catch (err) {
    console.error('[cron/verify] Error fetching pending enrollments:', err)
    return NextResponse.json({ success: true, ...results, enrollments: { verified: 0, failed: 0 } })
  }

  const enrollResults = { verified: 0, failed: 0 }

  for (const enr of pendingEnrollments) {
    const verification = await verifyBscTransaction(enr.txHash!, Number(enr.course.price))

    if (!verification.success) {
      const ageMinutes = (Date.now() - enr.createdAt.getTime()) / 60000
      if (ageMinutes > 30) {
        await prisma.courseEnrollment.update({
          where: { id: enr.id },
          data: { status: 'REJECTED' as any, notes: `Timeout verificación: ${verification.error}` },
        })
        enrollResults.failed++
      }
      continue
    }

    try {
      await prisma.courseEnrollment.update({
        where: { id: enr.id },
        data: {
          status: 'APPROVED' as any,
          blockNumber: verification.blockNumber ? BigInt(verification.blockNumber) : null,
          notes: `Auto-aprobado por cron. USDT: ${verification.amountUsdt?.toFixed(2)}`,
        },
      })
      enrollResults.verified++
    } catch (err) {
      console.error('[cron/verify] Error aprobando enrollment:', enr.id, err)
      enrollResults.failed++
    }
  }

  // ── Store order crypto verification ────────────────────────────────────────
  let pendingStoreOrders: Awaited<ReturnType<typeof prisma.storeOrder.findMany>>
  try {
    pendingStoreOrders = await prisma.storeOrder.findMany({
      where: { status: 'PENDING_VERIFICATION' as any, paymentMethod: 'CRYPTO', txHash: { not: null } },
      include: {
        items: { include: { item: { select: { title: true } } } },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })
  } catch (err) {
    console.error('[cron/verify] Error fetching pending store orders:', err)
    return NextResponse.json({ success: true, ...results, enrollments: enrollResults, storeOrders: { verified: 0, failed: 0 } })
  }

  const storeResults = { verified: 0, failed: 0 }

  for (const so of pendingStoreOrders) {
    const verification = await verifyBscTransaction(so.txHash!, Number(so.totalPrice))

    if (!verification.success) {
      const ageMinutes = (Date.now() - so.createdAt.getTime()) / 60000
      if (ageMinutes > 30) {
        await prisma.storeOrder.update({
          where: { id: so.id },
          data: { status: 'REJECTED' as any, notes: `Timeout verificación: ${verification.error}` },
        })
        storeResults.failed++
      }
      continue
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.storeOrder.update({
          where: { id: so.id },
          data: {
            status: 'APPROVED' as any,
            blockNumber: verification.blockNumber ? BigInt(verification.blockNumber) : null,
            notes: `Auto-aprobado por cron. USDT: ${verification.amountUsdt?.toFixed(2)}`,
          },
        })
        // Descontar stock
        for (const oi of so.items) {
          await tx.storeItem.update({
            where: { id: oi.itemId },
            data: { stock: { decrement: oi.quantity } },
          })
        }
        // Acreditar PV
        const totalPv = Number(so.totalPv)
        if (totalPv > 0) {
          await tx.commission.create({
            data: {
              userId: so.userId,
              type: 'SPONSORSHIP_BONUS' as any,
              amount: totalPv,
              description: `PV Tienda — Pedido #${so.id.slice(0, 8).toUpperCase()} — ${totalPv.toFixed(2)} PV`,
            },
          })
        }
      })
      // Enviar email de confirmación
      sendOrderConfirmedEmail(so.user.email, so.user.fullName, {
        id: so.id,
        totalPrice: Number(so.totalPrice),
        totalPv: Number(so.totalPv),
        recipientName: so.recipientName,
        address: so.address,
        city: so.city,
        state: so.state,
        country: so.country,
        zipCode: so.zipCode,
        createdAt: so.createdAt,
        txHash: so.txHash,
        items: so.items.map((oi: any) => ({
          title: oi.item.title,
          quantity: oi.quantity,
          priceSnapshot: Number(oi.priceSnapshot),
          pvSnapshot: Number(oi.pvSnapshot),
          selectedVariants: oi.selectedVariants as Record<string, string>,
        })),
      }).catch(e => console.error('[email] cron store order confirmed:', e))

      storeResults.verified++
    } catch (err) {
      console.error('[cron/verify] Error aprobando store order:', so.id, err)
      storeResults.failed++
    }
  }

  return NextResponse.json({ success: true, ...results, enrollments: enrollResults, storeOrders: storeResults })
}
