/**
 * Notification system: in-app (DB) + Web Push.
 * Called by bot-engine and meta-engine when a sale is confirmed.
 */

import { prisma } from './prisma'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

/**
 * Creates an in-app notification and sends Web Push to all active
 * subscriptions of the user.
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  try {
    // 1. Save in DB (in-app bell)
    await prisma.notification.create({
      data: { userId, title, body, link: link ?? null },
    })

    // 2. Send Web Push to all subscriptions of the user
    const subs = await prisma.pushSubscription.findMany({ where: { userId } })
    if (!subs.length) return

    const payload = JSON.stringify({ title, body, link: link ?? '/dashboard/services/whatsapp' })

    await Promise.allSettled(
      subs.map(async sub => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          )
        } catch (err: unknown) {
          // Subscription expired or invalid → remove it
          if (err && typeof err === 'object' && 'statusCode' in err && (err.statusCode === 410 || err.statusCode === 404)) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          } else {
            console.error('[PUSH] Send error:', err)
          }
        }
      }),
    )
  } catch (err) {
    console.error('[NOTIFICATIONS] createNotification error:', err)
  }
}
