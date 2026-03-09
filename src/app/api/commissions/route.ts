export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const commissions = await prisma.commission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totals = await prisma.commission.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _sum: { amount: true },
      _count: true,
    })

    const totalAll = await prisma.commission.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    })

    return NextResponse.json({
      commissions: commissions.map(c => ({
        id: c.id,
        type: c.type,
        amount: Number(c.amount),
        description: c.description,
        createdAt: c.createdAt,
      })),
      summary: {
        total: Number(totalAll._sum.amount || 0),
        byType: totals.map(t => ({
          type: t.type,
          total: Number(t._sum.amount || 0),
          count: t._count,
        })),
      },
    })
  } catch (error) {
    console.error('Commissions error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
