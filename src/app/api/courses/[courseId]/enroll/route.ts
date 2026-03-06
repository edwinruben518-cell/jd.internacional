import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** POST /api/courses/[courseId]/enroll — solicitar acceso con comprobante de pago */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const proofUrl: string = body.proofUrl ?? ''

    // Bloquear si el usuario no tiene plan
    if (user.plan === 'NONE') {
      return NextResponse.json({ error: 'Necesitas un plan activo para acceder a los cursos' }, { status: 403 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { id: true, active: true, freeForPlan: true },
    })

    if (!course || !course.active) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    // Upsert — si ya existe en REJECTED permite reintentar
    const existing = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: params.courseId } },
    })

    // Si el curso es gratis para planes y el usuario tiene plan → auto-aprobado
    const autoApprove = course.freeForPlan

    if (existing) {
      if (existing.status === 'PENDING' || existing.status === 'APPROVED') {
        return NextResponse.json({ error: 'Ya tienes una solicitud activa para este curso' }, { status: 409 })
      }
      const updated = await prisma.courseEnrollment.update({
        where: { id: existing.id },
        data: {
          status: autoApprove ? 'APPROVED' : 'PENDING',
          proofUrl: autoApprove ? null : proofUrl.trim(),
          notes: null,
        },
      })
      return NextResponse.json({ enrollment: updated })
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: user.id,
        courseId: params.courseId,
        proofUrl: autoApprove ? null : proofUrl.trim(),
        status: autoApprove ? 'APPROVED' : 'PENDING',
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/courses/[courseId]/enroll]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
