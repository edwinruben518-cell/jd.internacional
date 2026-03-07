import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/courses/my-enrollments — inscripciones del usuario en cursos del admin
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          coverUrl: true,
          price: true,
          freeForPlan: true,
          _count: { select: { videos: true } },
        },
      },
    },
  })

  return NextResponse.json({ enrollments })
}
