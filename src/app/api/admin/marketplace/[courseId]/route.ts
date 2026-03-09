export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/admin/marketplace/[courseId] — aprobar o rechazar curso
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user?.isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { courseId } = params
  const { status, adminNotes } = await req.json()

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const course = await prisma.marketplaceCourse.update({
    where: { id: courseId },
    data: { status, adminNotes: adminNotes || null },
  })

  return NextResponse.json({ course })
}
