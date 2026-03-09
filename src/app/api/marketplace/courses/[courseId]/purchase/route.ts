export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { verifyBscTransaction } from '@/lib/blockchain'

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/

export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId } = params
  const body = await req.json()
  const proofUrl: string | null = body.proofUrl ?? null
  const txHash: string | null = body.txHash ?? null
  const paymentMethod: 'MANUAL' | 'CRYPTO' = body.paymentMethod === 'CRYPTO' ? 'CRYPTO' : 'MANUAL'

  const course = await prisma.marketplaceCourse.findUnique({
    where: { id: courseId },
    select: { id: true, sellerId: true, status: true, price: true },
  })

  if (!course || course.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  if (course.sellerId === user.id) {
    return NextResponse.json({ error: 'No puedes comprar tu propio curso' }, { status: 400 })
  }

  const existing = await prisma.marketplacePurchase.findUnique({
    where: { buyerId_courseId: { buyerId: user.id, courseId } },
  })

  if (existing?.status === 'APPROVED') {
    return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 400 })
  }

  const existingStatus = (existing as any)?.status
  if (existingStatus === 'PENDING' || existingStatus === 'PENDING_VERIFICATION') {
    return NextResponse.json({ error: 'Ya tienes una compra pendiente de aprobación' }, { status: 400 })
  }

  // --- CRYPTO ---
  if (paymentMethod === 'CRYPTO') {
    if (!txHash || !TX_HASH_REGEX.test(txHash)) {
      return NextResponse.json({ error: 'Hash de transacción inválido' }, { status: 400 })
    }

    const existingTxRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM marketplace_purchases WHERE tx_hash = ${txHash} LIMIT 1
    `
    if (existingTxRows.length > 0) {
      return NextResponse.json({ error: 'Este hash ya fue utilizado' }, { status: 409 })
    }

    const price = Number(course.price)
    const verification = await verifyBscTransaction(txHash, price)
    const newStatus = verification.success ? 'APPROVED' : 'PENDING_VERIFICATION'
    const notes = verification.success
      ? `Auto-aprobado on-chain. USDT: ${verification.amountUsdt?.toFixed(2)}`
      : null

    if (existing) {
      await prisma.$executeRaw`
        UPDATE marketplace_purchases
        SET tx_hash = ${txHash},
            payment_method = 'CRYPTO'::"PaymentMethod",
            status = ${newStatus}::"MarketplacePurchaseStatus",
            notes = ${notes},
            updated_at = NOW()
        WHERE buyer_id = ${user.id}::uuid AND course_id = ${courseId}::uuid
      `
    } else {
      await prisma.$executeRaw`
        INSERT INTO marketplace_purchases (id, buyer_id, course_id, tx_hash, payment_method, status, notes, created_at, updated_at)
        VALUES (gen_random_uuid(), ${user.id}::uuid, ${courseId}::uuid, ${txHash}, 'CRYPTO'::"PaymentMethod", ${newStatus}::"MarketplacePurchaseStatus", ${notes}, NOW(), NOW())
      `
    }

    return NextResponse.json({ status: newStatus === 'APPROVED' ? 'approved' : 'pending_verification' }, { status: 201 })
  }

  // --- MANUAL ---
  if (!proofUrl) {
    return NextResponse.json({ error: 'Debes subir un comprobante de pago' }, { status: 400 })
  }

  if (existing) {
    await prisma.$executeRaw`
      UPDATE marketplace_purchases
      SET proof_url = ${proofUrl},
          payment_method = 'MANUAL'::"PaymentMethod",
          status = 'PENDING'::"MarketplacePurchaseStatus",
          notes = NULL,
          tx_hash = NULL,
          updated_at = NOW()
      WHERE buyer_id = ${user.id}::uuid AND course_id = ${courseId}::uuid
    `
  } else {
    await prisma.$executeRaw`
      INSERT INTO marketplace_purchases (id, buyer_id, course_id, proof_url, payment_method, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${user.id}::uuid, ${courseId}::uuid, ${proofUrl}, 'MANUAL'::"PaymentMethod", 'PENDING'::"MarketplacePurchaseStatus", NOW(), NOW())
    `
  }

  return NextResponse.json({ status: 'pending' }, { status: 201 })
}
