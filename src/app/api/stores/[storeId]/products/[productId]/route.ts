export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth() {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null
    return verifyToken(token)
}

/** PATCH /api/stores/[storeId]/products/[productId] – update a product */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const auth = getAuth()
        if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { storeId, productId } = params
        const body = await request.json()

        // Verificar propiedad de la tienda
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store || store.userId !== auth.userId) {
            return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
        }

        const updated = await prisma.storeProduct.update({
            where: { id: productId },
            data: {
                name: body.name,
                description: body.description,
                category: body.category,
                price: body.price !== undefined ? Number(body.price) : undefined,
                currency: body.currency,
                points: body.points !== undefined ? Number(body.points) : undefined,
                stock: body.stock !== undefined ? Number(body.stock) : undefined,
                images: body.images,
                active: body.active,
            }
        })

        return NextResponse.json({ product: updated })
    } catch (err) {
        console.error('[PATCH /api/stores/products]', err)
        return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
    }
}

/** DELETE /api/stores/[storeId]/products/[productId] – delete a product */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const auth = getAuth()
        if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const { storeId, productId } = params

        // Verificar propiedad de la tienda
        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })

        if (!store || store.userId !== auth.userId) {
            return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
        }

        await prisma.storeProduct.delete({
            where: { id: productId }
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[DELETE /api/stores/products]', err)
        return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
    }
}
