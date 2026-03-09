export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/admin/marketplace — todos los cursos para revisión
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user?.isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'

  const courses = await prisma.marketplaceCourse.findMany({
    where: status === 'ALL' ? {} : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' },
    orderBy: { createdAt: 'desc' },
    include: {
      seller: { select: { id: true, fullName: true, username: true, email: true } },
      category: true,
      files: { orderBy: { order: 'asc' } },
      _count: { select: { purchases: true } },
    },
  })

  return NextResponse.json({ courses: courses.map(c => ({ ...c, price: Number(c.price) })) })
}
