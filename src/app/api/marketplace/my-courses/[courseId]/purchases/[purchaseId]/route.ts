export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH — aprobar o rechazar compra
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; purchaseId: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId, purchaseId } = params
  const course = await prisma.marketplaceCourse.findUnique({ where: { id: courseId } })
  if (!course || course.sellerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const { status, notes } = await req.json()
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const existingPurchase = await prisma.marketplacePurchase.findUnique({ where: { id: purchaseId } })
  if (!existingPurchase || existingPurchase.courseId !== courseId) {
    return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
  }

  const purchase = await prisma.marketplacePurchase.update({
    where: { id: purchaseId },
    data: { status, notes: notes || null },
  })

  return NextResponse.json({ purchase })
}
