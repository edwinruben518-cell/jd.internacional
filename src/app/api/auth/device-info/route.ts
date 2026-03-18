export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/auth/device-info — update GPS coordinates for the current device
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { lat, lng, deviceId } = await request.json()

    if (
      typeof lat !== 'number' || typeof lng !== 'number' || !deviceId ||
      !isFinite(lat) || !isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const device = await prisma.trustedDevice.findUnique({
      where: { userId_deviceId: { userId: user.id, deviceId } },
    })
    if (!device) return NextResponse.json({ error: 'Dispositivo no encontrado' }, { status: 404 })

    // Detect location change (compare previous GPS)
    // Use null check instead of falsy check — lat/lng 0 is a valid coordinate (equator/meridian)
    const prevLat = device.lat
    const prevLng = device.lng
    const distanceMoved = prevLat !== null && prevLng !== null
      ? Math.sqrt(Math.pow(lat - Number(prevLat), 2) + Math.pow(lng - Number(prevLng), 2))
      : null
    // Mark location changed if moved more than ~0.05 degrees (~5km at equator)
    const locationChanged = distanceMoved !== null && distanceMoved > 0.05

    await prisma.trustedDevice.update({
      where: { userId_deviceId: { userId: user.id, deviceId } },
      data: {
        lat,
        lng,
        locationChanged: locationChanged || device.locationChanged,
      },
    })

    return NextResponse.json({ message: 'Ubicación actualizada' })
  } catch (err) {
    console.error('[DEVICE-INFO]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
