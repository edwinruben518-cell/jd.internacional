import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/marketplace/courses/[courseId]/purchase — enviar comprobante de pago
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId } = params
  const { proofUrl } = await req.json()

  const course = await prisma.marketplaceCourse.findUnique({
    where: { id: courseId },
    select: { id: true, sellerId: true, status: true },
  })

  if (!course || course.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  if (course.sellerId === user.id) {
    return NextResponse.json({ error: 'No puedes comprar tu propio curso' }, { status: 400 })
  }

  // Upsert: si ya existe y fue REJECTED, permitir reintentar
  const existing = await prisma.marketplacePurchase.findUnique({
    where: { buyerId_courseId: { buyerId: user.id, courseId } },
  })

  if (existing && existing.status === 'APPROVED') {
    return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 400 })
  }

  if (existing && existing.status === 'PENDING') {
    return NextResponse.json({ error: 'Ya enviaste un comprobante, espera la aprobación' }, { status: 400 })
  }

  const purchase = await prisma.marketplacePurchase.upsert({
    where: { buyerId_courseId: { buyerId: user.id, courseId } },
    create: { buyerId: user.id, courseId, proofUrl: proofUrl || null, status: 'PENDING' },
    update: { proofUrl: proofUrl || null, status: 'PENDING', notes: null },
  })

  return NextResponse.json({ purchase }, { status: 201 })
}
