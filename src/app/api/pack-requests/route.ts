import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'

const DEFAULT_PRICES: Record<string, number> = {
  BASIC: 49,
  PRO: 99,
  ELITE: 199,
}

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const requests = await prisma.packPurchaseRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      requests: requests.map(r => ({ ...r, price: Number(r.price), blockNumber: r.blockNumber?.toString() ?? null })),
    })
  } catch (err) {
    console.error('[GET /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const plan = (body.plan as string)?.toUpperCase()
    const paymentMethod: 'MANUAL' | 'CRYPTO' = body.paymentMethod === 'CRYPTO' ? 'CRYPTO' : 'MANUAL'
    const paymentProofUrl = (body.paymentProofUrl as string) ?? null
    const txHash = (body.txHash as string) ?? null

    if (!plan || !['BASIC', 'PRO', 'ELITE'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }

    // Validaciones según método de pago
    if (paymentMethod === 'MANUAL' && !paymentProofUrl) {
      return NextResponse.json({ error: 'Debes subir tu comprobante de pago.' }, { status: 400 })
    }

    if (paymentMethod === 'CRYPTO') {
      if (!txHash || !TX_HASH_REGEX.test(txHash)) {
        return NextResponse.json({ error: 'Hash de transacción inválido.' }, { status: 400 })
      }
      // Verificar unicidad del txHash (evitar double-spend)
      const existingTx = await prisma.packPurchaseRequest.findUnique({ where: { txHash } })
      if (existingTx) {
        return NextResponse.json({ error: 'Este hash de transacción ya fue utilizado.' }, { status: 409 })
      }
    }

    // No puede haber solicitud PENDING o PENDING_VERIFICATION activa
    const existing = await prisma.packPurchaseRequest.findFirst({
      where: { userId: user.id, status: { in: ['PENDING', 'PENDING_VERIFICATION'] } },
    })
    if (existing) {
      return NextResponse.json({
        error: 'Ya tienes una solicitud pendiente. Espera que sea procesada.',
      }, { status: 400 })
    }

    // Precio del plan
    const priceSetting = await prisma.appSetting.findUnique({ where: { key: `PRICE_${plan}` } })
    const price = priceSetting ? parseFloat(priceSetting.value) : DEFAULT_PRICES[plan]

    // --- Lógica de upgrade: calcular diferencia si ya tiene plan activo ---
    const currentUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
    const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }
    const currentRank = PLAN_RANK[currentUser?.plan ?? 'NONE'] ?? 0
    const newRank = PLAN_RANK[plan] ?? 0

    if (newRank <= currentRank) {
      return NextResponse.json({ error: 'Ya tienes este plan o uno superior.' }, { status: 400 })
    }

    let currentPrice = 0
    if (currentRank > 0 && currentUser?.plan) {
      const currentPriceSetting = await prisma.appSetting.findUnique({ where: { key: `PRICE_${currentUser.plan}` } })
      currentPrice = currentPriceSetting
        ? parseFloat(currentPriceSetting.value)
        : DEFAULT_PRICES[currentUser.plan] ?? 0
    }
    const effectivePrice = currentPrice > 0 ? Math.max(price - currentPrice, 1) : price

    // --- Para CRYPTO: verificar on-chain ---
    if (paymentMethod === 'CRYPTO' && txHash) {
      const verification = await verifyBscTransaction(txHash, effectivePrice)

      if (verification.success) {
        // Verificación inmediata exitosa → activar directamente en transacción
        const req = await prisma.$transaction(async (tx) => {
          const newReq = await tx.packPurchaseRequest.create({
            data: {
              userId: user.id,
              plan: plan as any,
              price: effectivePrice,
              paymentMethod: 'CRYPTO',
              txHash,
              blockNumber: verification.blockNumber ?? null,
              status: 'APPROVED',
              reviewedAt: new Date(),
              notes: `Auto-aprobado on-chain. USDT recibido: ${verification.amountUsdt?.toFixed(2)}`,
            },
          })

          await tx.$executeRaw`
            UPDATE users
            SET plan = ${plan}::\"UserPlan\",
                is_active = true,
                plan_expires_at = NOW() + INTERVAL '30 days'
            WHERE id = ${user.id}::uuid
          `

          await tx.auditLog.create({
            data: {
              userId: user.id,
              actorUserId: user.id,
              action: 'PURCHASE_CRYPTO_AUTO_APPROVED',
              entityType: 'PackPurchaseRequest',
              entityId: newReq.id,
              payload: { plan, price: effectivePrice, txHash, amountUsdt: verification.amountUsdt, blockNumber: verification.blockNumber?.toString() },
            },
          })

          return newReq
        })

        return NextResponse.json({
          success: true,
          status: 'approved',
          message: '¡Plan activado correctamente! La transacción fue verificada on-chain.',
          request: { ...req, price: Number(req.price) },
        })
      }

      // Verificación fallida por latencia → PENDING_VERIFICATION para el cron
      const req = await prisma.packPurchaseRequest.create({
        data: {
          userId: user.id,
          plan: plan as any,
          price: effectivePrice,
          paymentMethod: 'CRYPTO',
          txHash,
          status: 'PENDING_VERIFICATION',
        },
      })

      return NextResponse.json({
        success: true,
        status: 'pending_verification',
        message: 'Transacción recibida. Verificando en la blockchain, puede tardar unos minutos.',
        request: { ...req, price: Number(req.price) },
      })
    }

    // --- Pago MANUAL ---
    const req = await prisma.packPurchaseRequest.create({
      data: {
        userId: user.id,
        plan: plan as any,
        price: effectivePrice,
        paymentProofUrl,
        paymentMethod: 'MANUAL',
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, status: 'pending', request: { ...req, price: Number(req.price) } })
  } catch (err) {
    console.error('[POST /api/pack-requests]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
