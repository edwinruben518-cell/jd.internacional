export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/admin/marketplace/purchases/[purchaseId] — aprobar o rechazar compra
export async function PATCH(
  req: NextRequest,
  { params }: { params: { purchaseId: string } }
) {
  const user = await getAuthUser()
  if (!user?.isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { status, notes } = await req.json()
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const purchase = await prisma.marketplacePurchase.update({
    where: { id: params.purchaseId },
    data: { status, notes: notes || null },
  })

  return NextResponse.json({ purchase })
}
