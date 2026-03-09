export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/admin/marketplace/purchases — lista compras pendientes de cursos de usuarios
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user?.isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'

  const purchases = await prisma.marketplacePurchase.findMany({
    where: status === 'ALL' ? {} : { status: status as any },
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: { select: { id: true, fullName: true, username: true, email: true } },
      course: { select: { id: true, title: true, price: true, seller: { select: { fullName: true, username: true } } } },
    },
  })

  return NextResponse.json({ purchases: purchases.map(p => ({ ...p, course: { ...p.course, price: Number(p.course.price) } })) })
}
