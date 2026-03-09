export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/marketplace/my-courses/[courseId]/purchases — ver compras de mi curso
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId } = params
  const course = await prisma.marketplaceCourse.findUnique({ where: { id: courseId } })
  if (!course || course.sellerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const purchases = await prisma.marketplacePurchase.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    include: { buyer: { select: { id: true, fullName: true, username: true, email: true } } },
  })

  return NextResponse.json({ purchases })
}
