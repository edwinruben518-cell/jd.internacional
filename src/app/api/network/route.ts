import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface TreeNode {
  id: string
  username: string
  fullName: string
  isActive: boolean
  plan: string
  level: number
  directCount: number   // direct children
  children: TreeNode[]
}

async function buildTree(rootId: string, maxLevels = 50) {
  // BFS — max 5 queries (one per level)
  type Raw = { id: string; username: string; fullName: string; isActive: boolean; plan: string; sponsorId: string | null; level: number; children: Raw[] }
  const map = new Map<string, Raw>()
  let levelIds = [rootId]
  let total = 0, active = 0

  for (let level = 1; level <= maxLevels; level++) {
    const members = await prisma.user.findMany({
      where: { sponsorId: { in: levelIds } },
      select: { id: true, username: true, fullName: true, isActive: true, plan: true, sponsorId: true },
      orderBy: { createdAt: 'asc' },
    })
    if (members.length === 0) break

    for (const m of members) {
      map.set(m.id, { ...m, level, children: [] })
      total++
      if (m.isActive) active++
    }
    levelIds = members.map(m => m.id)
  }

  // Wire up parent → children
  const roots: Raw[] = []
  for (const node of Array.from(map.values())) {
    if (node.sponsorId === rootId) {
      roots.push(node)
    } else if (node.sponsorId && map.has(node.sponsorId)) {
      map.get(node.sponsorId)!.children.push(node)
    }
  }

  function toTree(n: Raw): TreeNode {
    return {
      id: n.id,
      username: n.username,
      fullName: n.fullName,
      isActive: n.isActive,
      plan: n.plan,
      level: n.level,
      directCount: n.children.length,
      children: n.children.map(toTree),
    }
  }

  return { tree: roots.map(toTree), total, active, memberMap: map }
}

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)

    // Queries secuenciales para no saturar el pool de conexiones de Supabase
    const { tree, total, active, memberMap } = await buildTree(user.id)

    const commissionsAgg = await prisma.commission.aggregate({ where: { userId: user.id }, _sum: { amount: true } })
    const todayCommissions = await prisma.commission.aggregate({
      where: { userId: user.id, createdAt: { gte: todayStart } },
      _sum: { amount: true }
    })
    const yesterdayCommissions = await prisma.commission.aggregate({
      where: { userId: user.id, createdAt: { gte: yesterdayStart, lt: todayStart } },
      _sum: { amount: true }
    })
    const weekCommissions = await prisma.commission.aggregate({
      where: { userId: user.id, createdAt: { gte: weekStart } },
      _sum: { amount: true }
    })

    // Raw SQL para evitar errores si el enum no tiene ciertos valores en producción
    const bonusByType = await prisma.$queryRaw<Array<{ type: string; total: string }>>`
      SELECT type::text, SUM(amount)::text AS total
      FROM commissions
      WHERE user_id = ${user.id}::uuid
      GROUP BY type
    `
    const sponsorshipCommissions = await prisma.$queryRaw<Array<{ amount: string; from_user_id: string | null }>>`
      SELECT amount::text, from_user_id::text
      FROM commissions
      WHERE user_id = ${user.id}::uuid
        AND type::text = 'SPONSORSHIP_BONUS'
    `

    const sponsorshipTotal = Number(bonusByType.find(b => b.type === 'SPONSORSHIP_BONUS')?.total ?? 0)
    const directTotal = Number(bonusByType.find(b => b.type === 'DIRECT_BONUS')?.total ?? 0)
    const extraTotal = Number(bonusByType.find(b => b.type === 'EXTRA_BONUS')?.total ?? 0)

    // Calculate sponsorship by level
    const levelBreakdown = {
      level1: 0,
      level2: 0,
      level3: 0,
      other: 0
    }

    for (const comm of sponsorshipCommissions) {
      const amount = Number(comm.amount)
      if (!comm.from_user_id) {
        levelBreakdown.other += amount
        continue
      }
      const member = memberMap.get(comm.from_user_id)
      if (!member) {
        levelBreakdown.other += amount
        continue
      }
      if (member.level === 1) levelBreakdown.level1 += amount
      else if (member.level === 2) levelBreakdown.level2 += amount
      else if (member.level === 3) levelBreakdown.level3 += amount
      else levelBreakdown.other += amount
    }

    const planLabel = (user as any).plan && (user as any).plan !== 'NONE' ? (user as any).plan : undefined

    return NextResponse.json({
      referralCode: user.referralCode,
      user: {
        fullName: user.fullName,
        username: user.username,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl ?? null,
        referralCode: user.referralCode,
        rank: planLabel,
        planExpiresAt: (user as any).planExpiresAt ? new Date((user as any).planExpiresAt).toISOString() : null,
      },
      tree,
      stats: {
        directReferrals: tree.length,
        totalNetwork: total,
        totalActive: active,
        totalCommissions: Number(commissionsAgg._sum.amount ?? 0),
        earningsToday: Number(todayCommissions._sum.amount ?? 0),
        earningsYesterday: Number(yesterdayCommissions._sum.amount ?? 0),
        earningsWeek: Number(weekCommissions._sum.amount ?? 0),
        sponsorshipBonus: sponsorshipTotal,
        sponsorshipLevels: levelBreakdown,
        directBonus: directTotal,
        extraBonus: extraTotal,
        sharedBonus: 0,
        pendingBalance: 0,
      }
    })
  } catch (err) {
    console.error('[GET /api/network]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
