import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { StoreViewClient } from './StoreViewClient'

interface PublicStorePageProps {
    params: { slug: string }
}

export default async function PublicStorePage({ params }: PublicStorePageProps) {
    const { slug } = params

    const store = await (prisma as any).store.findUnique({
        where: { slug },
        include: {
            products: {
                where: { active: true },
                orderBy: { createdAt: 'desc' }
            },
            bot: {
                include: {
                    secret: { select: { whatsappInstanceNumber: true } }
                }
            }
        }
    })

    if (!store || !store.active) return notFound()

    const products = (store.products || []).map((p: any) => ({
        ...p,
        price: Number(p.price),
        points: Number(p.points ?? 0),
    })) as any[]

    // Group by category
    const categories = products.reduce((acc: any, p: any) => {
        const cat = p.category || 'General'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(p)
        return acc
    }, {})

    // Extract phones
    const botPhone = store.bot?.baileysPhone || store.bot?.secret?.whatsappInstanceNumber || ''
    const cleanPhone = botPhone.replace(/\D/g, '')
    const finalPhone = store.whatsappNumber ? store.whatsappNumber.replace(/\D/g, '') : cleanPhone

    return (
        <StoreViewClient
            store={store}
            products={products}
            categories={categories}
            phone={finalPhone}
            paymentQrUrl={store.paymentQrUrl}
        />
    )
}
