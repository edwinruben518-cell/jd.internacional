import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const [commissionsAgg, committedAgg, withdrawals] = await Promise.all([
      prisma.commission.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { userId: user.id, status: { in: ['PAID', 'APPROVED', 'PENDING'] } },
        _sum: { amount: true },
      }),
      prisma.withdrawalRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const totalEarned = Number(commissionsAgg._sum.amount ?? 0)
    const totalCommitted = Number(committedAgg._sum.amount ?? 0)
    const available = Math.max(0, totalEarned - totalCommitted)

    return NextResponse.json({
      balance: { totalEarned, available },
      withdrawals: withdrawals.map(w => ({ ...w, amount: Number(w.amount) })),
    })
  } catch (err) {
    console.error('[GET /api/withdrawals]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { amount, walletAddress, walletQrUrl } = body

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    if (!walletAddress && !walletQrUrl) {
      return NextResponse.json({
        error: 'Debes ingresar tu dirección de wallet o subir un QR',
      }, { status: 400 })
    }

    // Validación + creación en transacción para evitar race conditions
    const withdrawal = await prisma.$transaction(async (tx) => {
      const [commissionsAgg, committedAgg] = await Promise.all([
        tx.commission.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: { userId: user.id, status: { in: ['PAID', 'APPROVED', 'PENDING'] } },
          _sum: { amount: true },
        }),
      ])

      const totalEarned = Number(commissionsAgg._sum.amount ?? 0)
      const totalCommitted = Number(committedAgg._sum.amount ?? 0)
      const available = Math.max(0, totalEarned - totalCommitted)

      if (Number(amount) > available) {
        throw new Error(`Saldo insuficiente. Disponible: $${available.toFixed(2)}`)
      }

      return tx.withdrawalRequest.create({
        data: {
          userId: user.id,
          amount: Number(amount),
          walletAddress: walletAddress ?? null,
          walletQrUrl: walletQrUrl ?? null,
          status: 'PENDING',
        },
      })
    }).catch((err: Error) => {
      if (err.message.startsWith('Saldo insuficiente')) throw err
      throw new Error('Error interno')
    })

    return NextResponse.json({ success: true, withdrawal: { ...withdrawal, amount: Number(withdrawal.amount) } })
  } catch (err: any) {
    if (err?.message?.startsWith('Saldo insuficiente')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[POST /api/withdrawals]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
