export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
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
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Find all posts scheduled to publish now
        const due = await (prisma as any).socialPost.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: { lte: new Date() }
            },
            include: {
                networks: { include: { connection: true } }
            }
        })

        if (!due.length) return NextResponse.json({ processed: 0 })

        let processed = 0

        for (const post of due) {
            try {
                await (prisma as any).socialPost.update({
                    where: { id: post.id },
                    data: { status: 'PUBLISHING' }
                })

                const targets = post.networks
                    .filter((n: any) => n.connection)
                    .map((n: any) => ({
                        network: n.network,
                        connectionId: n.connectionId,
                        accountId: n.connection.accountId,
                        accessToken: n.connection.accessToken,
                        pageId: n.connection.pageId || undefined,
                        postType: post.postType
                    }))

                const results = await publishToNetworks({
                    content: post.content,
                    mediaUrl: post.mediaUrl,
                    mediaType: post.mediaType,
                    targets
                })

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

                const anySuccess = results.some(r => r.success)
                const allFailed = results.every(r => !r.success)

                await (prisma as any).socialPost.update({
                    where: { id: post.id },
                    data: {
                        status: allFailed ? 'FAILED' : anySuccess ? 'PUBLISHED' : 'PARTIAL',
                        publishedAt: anySuccess ? new Date() : null
                    }
                })

                if (anySuccess) await deleteMedia(post.mediaUrl)
                processed++
            } catch (err: any) {
                console.error(`[SocialScheduler] Post ${post.id} failed:`, err)
                await (prisma as any).socialPost.update({
                    where: { id: post.id },
                    data: { status: 'FAILED' }
                })
            }
        }

        return NextResponse.json({ processed })
    } catch (err: any) {
        console.error('[SocialScheduler]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
