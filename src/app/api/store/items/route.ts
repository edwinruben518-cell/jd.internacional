import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/store/items?category=X — lista items activos */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const where: any = { active: true }
    if (category && category !== 'Todas') where.category = category

    const items = await prisma.storeItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Convertir Decimal a number
    const data = items.map(i => ({
      ...i,
      price: Number(i.price),
      pv: Number(i.pv),
    }))

    // Categorías únicas para los filtros
    const allItems = await prisma.storeItem.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })
    const categories = allItems.map(i => i.category)

    return NextResponse.json({ items: data, categories })
  } catch (err) {
    console.error('[GET /api/store/items]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
