export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getAuthUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { userId: user.id, network: 'FACEBOOK' }
        })
        if (!connection) return NextResponse.json({ error: 'Facebook no conectado' }, { status: 404 })

        // Fetch all pages the user manages + their linked Instagram Business accounts
        const res = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${connection.accessToken}`,
            { signal: AbortSignal.timeout(8000) }
        )
        const data = await res.json()

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 })
        }

        const pages = (data.data || []).map((p: any) => ({
            pageId: p.id,
            pageName: p.name,
            pageAccessToken: p.access_token,
            instagram: p.instagram_business_account ? {
                accountId: p.instagram_business_account.id,
                username: p.instagram_business_account.username,
                avatar: p.instagram_business_account.profile_picture_url || null,
            } : null,
        }))

        return NextResponse.json({ pages })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
