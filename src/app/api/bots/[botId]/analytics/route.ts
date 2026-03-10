export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { botId: string } }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = verifyToken(token)
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { botId } = params

  const bot = await prisma.bot.findFirst({ where: { id: botId, userId: user.userId } })
  if (!bot) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

  // Últimos 30 días
  const since = new Date()
  since.setDate(since.getDate() - 29)
  since.setHours(0, 0, 0, 0)

  const [allConversations, soldConversations] = await Promise.all([
    prisma.conversation.findMany({
      where: { botId, createdAt: { gte: since } },
      select: { createdAt: true, sold: true, soldAt: true },
    }),
    prisma.conversation.findMany({
      where: { botId, sold: true },
      select: { soldAt: true, userName: true, userPhone: true, createdAt: true },
      orderBy: { soldAt: 'desc' },
      take: 50,
    }),
  ])

  // Total general (sin filtro de fecha)
  const [totalConversations, totalSales] = await Promise.all([
    prisma.conversation.count({ where: { botId } }),
    prisma.conversation.count({ where: { botId, sold: true } }),
  ])

  // Construir array de 30 días
  const days: { date: string; conversations: number; sales: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dEnd = new Date(d)
    dEnd.setHours(23, 59, 59, 999)
    const label = d.toISOString().slice(0, 10) // YYYY-MM-DD

    const convCount = allConversations.filter(c => {
      const cd = new Date(c.createdAt)
      return cd >= d && cd <= dEnd
    }).length

    const salesCount = allConversations.filter(c => {
      if (!c.soldAt) return false
      const sd = new Date(c.soldAt)
      return sd >= d && sd <= dEnd
    }).length

    days.push({ date: label, conversations: convCount, sales: salesCount })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const salesToday = soldConversations.filter(c => c.soldAt && new Date(c.soldAt) >= today).length
  const salesThisWeek = soldConversations.filter(c => c.soldAt && new Date(c.soldAt) >= weekAgo).length
  const conversionRate = totalConversations > 0
    ? Math.round((totalSales / totalConversations) * 100)
    : 0

  return NextResponse.json({
    botName: bot.name,
    stats: {
      totalConversations,
      totalSales,
      salesToday,
      salesThisWeek,
      conversionRate,
    },
    days,
    recentSales: soldConversations.slice(0, 20).map(c => ({
      userName: c.userName || null,
      userPhone: c.userPhone,
      soldAt: c.soldAt,
    })),
  })
}
