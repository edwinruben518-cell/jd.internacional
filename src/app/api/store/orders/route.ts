import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyBscTransaction } from '@/lib/blockchain'

/** POST /api/store/orders — crear pedido desde carrito */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()

    // Validar datos de entrega
    const { recipientName, phone, address, city, state, country, zipCode, deliveryNotes } = body
    if (!recipientName || !phone || !address || !city || !state || !country) {
      return NextResponse.json({ error: 'Completa todos los datos de entrega requeridos' }, { status: 400 })
    }

    // Validar items del carrito
    const cartItems: { itemId: string; quantity: number; selectedVariants: Record<string, string> }[] = body.items ?? []
    if (!cartItems.length) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }

    const paymentMethod: 'CRYPTO' | 'MANUAL' = body.paymentMethod === 'CRYPTO' ? 'CRYPTO' : 'MANUAL'
    const txHash: string = (body.txHash ?? '').trim()
    const proofUrl: string = (body.proofUrl ?? '').trim()

    if (paymentMethod === 'CRYPTO' && !txHash) {
      return NextResponse.json({ error: 'txHash requerido para pago cripto' }, { status: 400 })
    }
    if (paymentMethod === 'MANUAL' && !proofUrl) {
      return NextResponse.json({ error: 'Sube el comprobante de pago' }, { status: 400 })
    }

    // Verificar que el txHash no esté ya usado
    if (paymentMethod === 'CRYPTO') {
      const txUsed = await prisma.storeOrder.findFirst({ where: { txHash } })
      if (txUsed) return NextResponse.json({ error: 'Esta transacción ya fue usada' }, { status: 409 })
    }

    // Cargar items desde DB y verificar stock
    const dbItems = await prisma.storeItem.findMany({
      where: { id: { in: cartItems.map(c => c.itemId) }, active: true },
    })

    if (dbItems.length !== cartItems.length) {
      return NextResponse.json({ error: 'Uno o más productos no están disponibles' }, { status: 400 })
    }

    for (const ci of cartItems) {
      const db = dbItems.find(d => d.id === ci.itemId)!
      if (db.stock < ci.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para "${db.title}"` }, { status: 400 })
      }
    }

    // Calcular totales
    let totalPrice = 0
    let totalPv = 0
    for (const ci of cartItems) {
      const db = dbItems.find(d => d.id === ci.itemId)!
      totalPrice += Number(db.price) * ci.quantity
      totalPv += Number(db.pv) * ci.quantity
    }

    // Verificación on-chain para CRYPTO
    let cryptoStatus: 'APPROVED' | 'PENDING_VERIFICATION' = 'PENDING_VERIFICATION'
    let blockNumber: bigint | null = null

    if (paymentMethod === 'CRYPTO') {
      const verification = await verifyBscTransaction(txHash, totalPrice)
      if (verification.success) {
        cryptoStatus = 'APPROVED'
        blockNumber = verification.blockNumber ? BigInt(verification.blockNumber) : null
      }
    }

    const finalStatus = paymentMethod === 'CRYPTO' ? cryptoStatus : 'PENDING'

    // Crear orden en transacción
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.storeOrder.create({
        data: {
          userId: user.id,
          totalPrice,
          totalPv,
          status: finalStatus as any,
          paymentMethod,
          proofUrl: paymentMethod === 'MANUAL' ? proofUrl : null,
          txHash: paymentMethod === 'CRYPTO' ? txHash : null,
          blockNumber,
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          zipCode: zipCode?.trim() || null,
          deliveryNotes: deliveryNotes?.trim() || null,
          items: {
            create: cartItems.map(ci => {
              const db = dbItems.find(d => d.id === ci.itemId)!
              return {
                itemId: ci.itemId,
                quantity: ci.quantity,
                priceSnapshot: Number(db.price),
                pvSnapshot: Number(db.pv),
                selectedVariants: ci.selectedVariants ?? {},
              }
            }),
          },
        },
        include: { items: true },
      })

      // Si APPROVED (cripto confirmado): descontar stock + acreditar PV
      if (finalStatus === 'APPROVED') {
        for (const ci of cartItems) {
          await tx.storeItem.update({
            where: { id: ci.itemId },
            data: { stock: { decrement: ci.quantity } },
          })
        }
        if (totalPv > 0) {
          await tx.commission.create({
            data: {
              userId: user.id,
              type: 'SPONSORSHIP_BONUS' as any,
              amount: totalPv,
              description: `PV Tienda — Pedido #${newOrder.id.slice(0, 8).toUpperCase()} — ${totalPv.toFixed(2)} PV`,
            },
          })
        }
      }

      return newOrder
    })

    return NextResponse.json({ order: { ...order, totalPrice: Number(order.totalPrice), totalPv: Number(order.totalPv) }, status: finalStatus }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/store/orders]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** GET /api/store/orders — mis pedidos */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const orders = await prisma.storeOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            item: { select: { id: true, title: true, images: true, category: true } },
          },
        },
      },
    })

    const data = orders.map(o => ({
      ...o,
      totalPrice: Number(o.totalPrice),
      totalPv: Number(o.totalPv),
      items: o.items.map(i => ({
        ...i,
        priceSnapshot: Number(i.priceSnapshot),
        pvSnapshot: Number(i.pvSnapshot),
      })),
    }))

    return NextResponse.json({ orders: data })
  } catch (err) {
    console.error('[GET /api/store/orders]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
