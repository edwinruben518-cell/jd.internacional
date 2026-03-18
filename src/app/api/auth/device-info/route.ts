export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

/** Reverse geocode lat/lng → human-readable address via Nominatim (OpenStreetMap, free) */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'JDInternacional/1.0' }, // Nominatim requires a User-Agent
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    // Build address: road + house number + city/town + country
    const a = data.address ?? {}
    const parts = [
      a.road ?? a.pedestrian ?? a.footway ?? null,
      a.house_number ?? null,
      a.city ?? a.town ?? a.village ?? a.municipality ?? null,
      a.state ?? a.region ?? null,
      a.country ?? null,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null)
  } catch {
    return null
  }
}

// POST /api/auth/device-info — update GPS coordinates + address for the current device
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

    // Detect location change — use null check (0 is a valid coordinate)
    const prevLat = device.lat
    const prevLng = device.lng
    const distanceMoved = prevLat !== null && prevLng !== null
      ? Math.sqrt(Math.pow(lat - Number(prevLat), 2) + Math.pow(lng - Number(prevLng), 2))
      : null
    // Mark location changed if moved more than ~0.05 degrees (~5km at equator)
    const locationChanged = distanceMoved !== null && distanceMoved > 0.05

    // Get human-readable address via Nominatim (run in parallel with DB update)
    const address = await reverseGeocode(lat, lng)

    await prisma.trustedDevice.update({
      where: { userId_deviceId: { userId: user.id, deviceId } },
      data: {
        lat,
        lng,
        ...(address ? { address } : {}),
        locationChanged: locationChanged || device.locationChanged,
      },
    })

    return NextResponse.json({ message: 'Ubicación actualizada', address })
  } catch (err) {
    console.error('[DEVICE-INFO]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
