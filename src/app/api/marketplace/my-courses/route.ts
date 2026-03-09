export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/marketplace/my-courses — mis cursos como vendedor
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const courses = await prisma.marketplaceCourse.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      files: { orderBy: { order: 'asc' } },
      _count: { select: { purchases: true } },
    },
  })

  return NextResponse.json({ courses: courses.map(c => ({ ...c, price: Number(c.price) })) })
}
