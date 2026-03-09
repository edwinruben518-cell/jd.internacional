export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/marketplace/courses — catálogo público de cursos aprobados
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const search = searchParams.get('q') || undefined

  const courses = await prisma.marketplaceCourse.findMany({
    where: {
      status: 'APPROVED',
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      coverUrl: true,
      qrImageUrl: true,
      price: true,
      whatsapp: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, fullName: true, username: true, avatarUrl: true } },
      _count: { select: { files: true } },
    },
  })

  return NextResponse.json({ courses })
}

// POST /api/marketplace/courses — crear curso (usuario con plan activo)
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })
  if (!dbUser || dbUser.plan === 'NONE') {
    return NextResponse.json({ error: 'Necesitas un plan activo para vender cursos' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, coverUrl, qrImageUrl, price, categoryId, whatsapp, files } = body

  if (!title || !description || !price) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const course = await prisma.marketplaceCourse.create({
    data: {
      sellerId: user.id,
      title,
      description,
      coverUrl: coverUrl || null,
      qrImageUrl: qrImageUrl || null,
      price,
      categoryId: categoryId || null,
      whatsapp: whatsapp || null,
      status: 'PENDING',
      files: {
        create: (files ?? []).map((f: { title: string; driveUrl: string }, i: number) => ({
          title: f.title,
          driveUrl: f.driveUrl,
          order: i,
        })),
      },
    },
    include: { files: true, category: true },
  })

  return NextResponse.json({ course }, { status: 201 })
}
