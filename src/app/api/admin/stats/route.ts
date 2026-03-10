export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  const [
    totalUsers,
    activeUsers,
    pendingPurchases,
    pendingWithdrawals,
    totalCommissions,
    recentPurchases,
    recentWithdrawals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.packPurchaseRequest.count({ where: { status: 'PENDING' } }),
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    prisma.commission.aggregate({ _sum: { amount: true } }),
    prisma.packPurchaseRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.withdrawalRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers,
      activeUsers,
      pendingPurchases,
      pendingWithdrawals,
      totalCommissions: Number(totalCommissions._sum.amount ?? 0),
    },
    recentPurchases: recentPurchases.map(r => ({ ...r, price: Number(r.price) })),
    recentWithdrawals: recentWithdrawals.map(r => ({ ...r, amount: Number(r.amount) })),
  })
}
