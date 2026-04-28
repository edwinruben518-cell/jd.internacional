export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminUser, unauthorizedAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return unauthorizedAdmin()

  // Get the latest device per user that has GPS coordinates
  const devices = await prisma.trustedDevice.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      userId: true,
      lat: true,
      lng: true,
      address: true,
      city: true,
      country: true,
      lastSeen: true,
      locationChanged: true,
      user: {
        select: {
          username: true,
          fullName: true,
          email: true,
          plan: true,
          isActive: true,
        }
      }
    },
    orderBy: { lastSeen: 'desc' },
  })

  // Deduplicate: keep only latest device per user
  const seen = new Set<string>()
  const unique = devices.filter(d => {
    if (seen.has(d.userId)) return false
    seen.add(d.userId)
    return true
  })

  return NextResponse.json({
    locations: unique.map(d => ({
      userId: d.userId,
      lat: d.lat,
      lng: d.lng,
      address: d.address,
      city: d.city,
      country: d.country,
      lastSeen: d.lastSeen,
      locationChanged: d.locationChanged,
      username: d.user.username,
      fullName: d.user.fullName,
      email: d.user.email,
      plan: d.user.plan,
      isActive: d.user.isActive,
    }))
  })
}
