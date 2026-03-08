import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth() {
  const token = cookies().get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

async function requireAdmin() {
  const auth = getAuth()
  if (!auth) return false
  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { isAdmin: true } })
  return user?.isAdmin === true
}

/** PATCH /api/admin/store/orders/[orderId]
 * body: { action: 'approve'|'reject'|'ship'|'deliver', notes? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

    const { action, notes } = await req.json()
    if (!['approve', 'reject', 'ship', 'deliver'].includes(action)) {
      return NextResponse.json({ error: 'action inválido' }, { status: 400 })
    }

    const statusMap: Record<string, string> = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      ship: 'SHIPPED',
      deliver: 'DELIVERED',
    }
    const newStatus = statusMap[action]

    const order = await prisma.storeOrder.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.storeOrder.update({
        where: { id: params.orderId },
        data: { status: newStatus as any, notes: notes || null },
      })

      // Al aprobar: descontar stock + acreditar PV
      if (action === 'approve' && order.status !== 'APPROVED') {
        for (const oi of order.items) {
          await tx.storeItem.update({
            where: { id: oi.itemId },
            data: { stock: { decrement: oi.quantity } },
          })
        }
        const totalPv = Number(order.totalPv)
        if (totalPv > 0) {
          await tx.commission.create({
            data: {
              userId: order.userId,
              type: 'SPONSORSHIP_BONUS' as any,
              amount: totalPv,
              description: `PV Tienda — Pedido #${order.id.slice(0, 8).toUpperCase()} — ${totalPv.toFixed(2)} PV`,
            },
          })
        }
      }
    })

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[PATCH /api/admin/store/orders/[orderId]]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
