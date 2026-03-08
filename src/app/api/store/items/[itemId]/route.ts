import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/store/items/[itemId] — detalle del item */
export async function GET(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const item = await prisma.storeItem.findUnique({
      where: { id: params.itemId },
    })

    if (!item || !item.active) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      item: { ...item, price: Number(item.price), pv: Number(item.pv) },
    })
  } catch (err) {
    console.error('[GET /api/store/items/[itemId]]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
