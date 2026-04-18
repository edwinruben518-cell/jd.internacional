export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Keys that are safe to expose publicly (no auth required)
const PUBLIC_KEYS = ['WHATSAPP_GROUP_LINK']

export async function GET() {
    const settings = await prisma.appSetting.findMany({
        where: { key: { in: PUBLIC_KEYS } },
    })
    const map: Record<string, string> = {}
    settings.forEach(s => { map[s.key] = s.value })
    return NextResponse.json(map)
}
