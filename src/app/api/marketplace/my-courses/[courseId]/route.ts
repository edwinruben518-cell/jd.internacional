export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/marketplace/my-courses/[courseId] — editar mi curso
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId } = params
  const existing = await prisma.marketplaceCourse.findUnique({ where: { id: courseId } })
  if (!existing || existing.sellerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  const body = await req.json()
  const { title, description, coverUrl, qrImageUrl, price, categoryId, whatsapp, files } = body

  await prisma.marketplaceCourseFile.deleteMany({ where: { courseId } })

  const course = await prisma.marketplaceCourse.update({
    where: { id: courseId },
    data: {
      title,
      description,
      coverUrl: coverUrl || null,
      qrImageUrl: qrImageUrl || null,
      price,
      categoryId: categoryId || null,
      whatsapp: whatsapp || null,
      status: 'PENDING', // vuelve a revisión tras edición
      files: {
        create: (files ?? []).map((f: { title: string; driveUrl: string }, i: number) => ({
          title: f.title,
          driveUrl: f.driveUrl,
          order: i,
        })),
      },
    },
    include: { files: true, category: true },
  })

  return NextResponse.json({ course })
}

// DELETE /api/marketplace/my-courses/[courseId] — eliminar mi curso
export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { courseId } = params
  const existing = await prisma.marketplaceCourse.findUnique({ where: { id: courseId } })
  if (!existing || existing.sellerId !== user.id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await prisma.marketplaceCourse.delete({ where: { id: courseId } })
  return NextResponse.json({ ok: true })
}
