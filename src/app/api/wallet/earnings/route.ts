export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TYPE_LABELS: Record<string, string> = {
  DIRECT_BONUS: 'Bono directo',
  SPONSORSHIP_BONUS: 'Bono de patrocinio',
  EXTRA_BONUS: 'Bono extra',
}

export async function GET(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const [total, commissions] = await Promise.all([
    prisma.commission.count({ where: { userId: user.id } }),
    prisma.commission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ])

  // Fetch fromUser names for commissions that have a fromUserId
  const fromUserIds = Array.from(new Set(commissions.map(c => c.fromUserId).filter(Boolean))) as string[]
  const fromUsers = fromUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: fromUserIds } },
        select: { id: true, fullName: true, email: true },
      })
    : []
  const fromUserMap = Object.fromEntries(fromUsers.map(u => [u.id, u]))

  const rows = commissions.map(c => ({
    id: c.id,
    type: c.type,
    typeLabel: TYPE_LABELS[c.type] ?? c.type,
    amount: Number(c.amount),
    description: c.description,
    createdAt: c.createdAt,
    fromUser: c.fromUserId
      ? (() => { const u = fromUserMap[c.fromUserId!]; return u ? { id: u.id, name: u.fullName, email: u.email } : null })()
      : null,
  }))

  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / limit) })
}
