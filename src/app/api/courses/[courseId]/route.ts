export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/courses/[courseId] — detalle del curso; incluye videos solo si APPROVED */
export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        videos: { orderBy: { order: 'asc' } },
        enrollments: { where: { userId: user.id } },
      },
    })

    if (!course || !course.active) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    const hasPlan = user.plan !== 'NONE'
    const enrollment = course.enrollments[0] ?? null
    const approved = enrollment?.status === 'APPROVED'

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        coverUrl: course.coverUrl,
        price: Number(course.price),
        freeForPlan: course.freeForPlan,
        createdAt: course.createdAt,
        videos: approved ? course.videos : [],
        videosCount: course.videos.length,
        locked: !hasPlan,
        enrollment,
      },
    })
  } catch (err) {
    console.error('[GET /api/courses/[courseId]]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
