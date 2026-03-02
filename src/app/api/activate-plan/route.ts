import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type UserPlan } from '@/lib/plan-limits'

// Precio de cada pack y el bono de patrocinio (20%)
const PACK_CONFIG: Record<string, { price: number; label: string }> = {
  BASIC: { price: 49,  label: 'Pack Básico' },
  PRO:   { price: 99,  label: 'Pack Pro' },
  ELITE: { price: 199, label: 'Pack Elite' },
}

const SPONSORSHIP_PCT = 0.20  // 20% solo nivel 1

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const plan = (body.plan as string)?.toUpperCase()

    if (!plan || !PACK_CONFIG[plan]) {
      return NextResponse.json({ error: 'Plan inválido. Usa BASIC o PRO.' }, { status: 400 })
    }

    // No permitir "bajar" de plan
    const PLAN_RANK: Record<string, number> = { NONE: 0, BASIC: 1, PRO: 2, ELITE: 3 }
    const currentRank = PLAN_RANK[(user as any).plan ?? 'NONE'] ?? 0
    const newRank = PLAN_RANK[plan] ?? 0

    if (newRank <= currentRank) {
      return NextResponse.json({
        error: `Ya tienes el ${(user as any).plan === plan ? 'mismo plan' : 'un plan superior'} activo.`
      }, { status: 400 })
    }

    const config = PACK_CONFIG[plan]

    // Activar el plan con fecha de vencimiento a 30 días
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: plan as UserPlan, planExpiresAt },
    })

    // Bono de patrocinio: 20% al patrocinador directo (nivel 1 únicamente)
    if (user.sponsorId) {
      const sponsorBonus = parseFloat((config.price * SPONSORSHIP_PCT).toFixed(2))

      await prisma.commission.create({
        data: {
          userId:      user.sponsorId,
          fromUserId:  user.id,
          type:        'SPONSORSHIP_BONUS',
          amount:      sponsorBonus,
          description: `Bono de patrocinio 20% — ${user.fullName} activó ${config.label} ($${config.price} USD)`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      plan,
      message: `¡${config.label} activado correctamente!`,
    })
  } catch (err) {
    console.error('[POST /api/activate-plan]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// GET: devuelve el plan actual y el historial de activaciones del usuario
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const commissions = await prisma.commission.findMany({
      where: { userId: user.id, type: 'SPONSORSHIP_BONUS' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      currentPlan: (user as any).plan ?? 'NONE',
      sponsorshipBonuses: commissions,
    })
  } catch (err) {
    console.error('[GET /api/activate-plan]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
