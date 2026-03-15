export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishToNetworks } from '@/lib/social/publisher'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET = 'social-media'

async function deleteMedia(mediaUrl: string | null) {
    if (!mediaUrl) return
    const marker = `/object/public/${BUCKET}/`
    const idx = mediaUrl.indexOf(marker)
    if (idx === -1) return
    const path = mediaUrl.slice(idx + marker.length).split('?')[0]
    try { await supabaseAdmin.storage.from(BUCKET).remove([path]) } catch {}
}

export async function GET(req: Request) {
    try {
        const user = await getAuthUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        const where: any = { userId: user.id }
        if (status) where.status = status
        if (from || to) {
            where.scheduledAt = {}
            if (from) where.scheduledAt.gte = new Date(from)
            if (to) where.scheduledAt.lte = new Date(to)
        }

        const posts = await (prisma as any).socialPost.findMany({
            where,
            include: { networks: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        return NextResponse.json({ posts })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const user = await getAuthUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Plan check — ELITE only
        if (!['ELITE', 'PRO'].includes(user.plan)) {
            return NextResponse.json({ error: 'Este servicio requiere plan PRO o ELITE' }, { status: 403 })
        }

        const body = await req.json()
        const { content, mediaUrl, mediaType, postType = 'feed', scheduledAt, networks: selectedNetworks } = body

        if (!content?.trim()) return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 })
        if (content.length > 5000) return NextResponse.json({ error: 'El contenido no puede superar los 5000 caracteres' }, { status: 400 })
        if (!selectedNetworks?.length) return NextResponse.json({ error: 'Selecciona al menos una red social' }, { status: 400 })
        if (!Array.isArray(selectedNetworks) || selectedNetworks.some((n: any) => typeof n !== 'string')) {
            return NextResponse.json({ error: 'Redes sociales inválidas' }, { status: 400 })
        }

        // Get user's connections for selected networks
        const connections = await (prisma as any).socialConnection.findMany({
            where: { userId: user.id, network: { in: selectedNetworks } }
        })

        if (!connections.length) return NextResponse.json({ error: 'No tienes cuentas conectadas para las redes seleccionadas' }, { status: 400 })

        const schedDate = scheduledAt ? new Date(scheduledAt) : null
        const isScheduled = schedDate && schedDate > new Date()

        // Create post record
        const post = await (prisma as any).socialPost.create({
            data: {
                userId: user.id,
                content,
                mediaUrl: mediaUrl || null,
                mediaType: mediaType || null,
                postType,
                status: isScheduled ? 'SCHEDULED' : 'PUBLISHING',
                scheduledAt: schedDate,
                networks: {
                    create: connections.map((c: any) => ({
                        connectionId: c.id,
                        network: c.network,
                        status: 'PENDING'
                    }))
                }
            },
            include: { networks: true }
        })

        if (isScheduled) {
            return NextResponse.json({ post, scheduled: true })
        }

        // Publish now
        const targets = connections.map((c: any) => ({
            network: c.network,
            connectionId: c.id,
            accountId: c.accountId,
            accessToken: c.accessToken,
            pageId: c.pageId || undefined,
            postType
        }))

        const results = await publishToNetworks({ content, mediaUrl, mediaType, targets })

        // Update each network result
        for (const result of results) {
            await (prisma as any).socialPostNetwork.updateMany({
                where: { postId: post.id, connectionId: result.connectionId },
                data: {
                    status: result.success ? 'PUBLISHED' : 'FAILED',
                    providerPostId: result.providerPostId || null,
                    error: result.error || null,
                    publishedAt: result.success ? new Date() : null
                }
            })
        }

        const allFailed = results.every(r => !r.success)
        const anySuccess = results.some(r => r.success)

        await (prisma as any).socialPost.update({
            where: { id: post.id },
            data: {
                status: allFailed ? 'FAILED' : anySuccess ? 'PUBLISHED' : 'PARTIAL',
                publishedAt: anySuccess ? new Date() : null
            }
        })

        // Delete media from storage after publish attempt (no longer needed)
        await deleteMedia(mediaUrl)

        return NextResponse.json({ post, results })
    } catch (err: any) {
        console.error('[SocialPost]', err)
        return NextResponse.json({ error: err.message || 'Error al publicar' }, { status: 500 })
    }
}
