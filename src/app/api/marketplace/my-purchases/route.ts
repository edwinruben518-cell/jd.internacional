export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/marketplace/my-purchases — cursos que el usuario compró en el marketplace
export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const purchases = await prisma.marketplacePurchase.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        include: {
          seller: { select: { id: true, fullName: true, username: true } },
          files: { select: { id: true, title: true, driveUrl: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  })

  return NextResponse.json({ purchases })
}
