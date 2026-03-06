import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/marketplace/courses/[courseId] — detalle del curso
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  const { courseId } = params
  const user = await getAuthUser(req)

  const course = await prisma.marketplaceCourse.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      seller: { select: { id: true, fullName: true, username: true, avatarUrl: true, referralCode: true } },
      files: { orderBy: { order: 'asc' } },
    },
  })

  if (!course || course.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  // Check if buyer has approved purchase
  let purchase = null
  if (user) {
    purchase = await prisma.marketplacePurchase.findUnique({
      where: { buyerId_courseId: { buyerId: user.id, courseId } },
      select: { status: true },
    })
  }

  const isApproved = purchase?.status === 'APPROVED'
  const isSeller = user?.id === course.sellerId

  return NextResponse.json({
    course: {
      ...course,
      price: Number(course.price),
      files: (isApproved || isSeller) ? course.files : [],
    },
    purchase,
    isAuthenticated: !!user,
  })
}
