'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface Course {
  id: string
  title: string
  description: string
  coverUrl: string | null
  price: number
  whatsapp: string | null
  createdAt: string
  category: Category | null
  seller: { id: string; fullName: string; username: string; avatarUrl: string | null }
  _count: { files: number }
}

export default function MarketplacePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory) params.set('categoryId', selectedCategory)
    if (search) params.set('q', search)
    fetch(`/api/marketplace/courses?${params}`)
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedCategory, search])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#00F5FF', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em' }}>
          JD INTERNACIONAL
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Iniciar sesión</Link>
          <Link href="/dashboard/services/marketplace" style={{ textDecoration: 'none', color: '#00F5FF', fontSize: 13, fontWeight: 600 }}>Vender curso</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Title */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
            Marketplace de <span style={{ color: '#00F5FF' }}>Cursos</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 8, fontSize: 14 }}>
            Aprende de los miembros de la comunidad
          </p>
          <div style={{ height: 2, width: 80, background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)', margin: '12px auto 0' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 13, outline: 'none',
            }}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none',
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ width: 28, height: 28, border: '2px solid #00F5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No hay cursos disponibles aún.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="sm:gap-4">
            {courses.map(course => (
              <Link key={course.id} href={`/marketplace/${course.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'border-color 0.2s, transform 0.15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,245,255,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
                >
                  {/* Cover */}
                  <div style={{ aspectRatio: '1/1', background: 'rgba(0,245,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                    {course.coverUrl ? (
                      <img src={course.coverUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 32, opacity: 0.2 }}>📚</span>
                      </div>
                    )}
                    {course.category && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 6, letterSpacing: '0.05em',
                        background: 'rgba(0,0,0,0.6)', color: '#00F5FF', border: '1px solid rgba(0,245,255,0.3)',
                      }}>
                        {course.category.name}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '6px 8px 8px' }} className="sm:p-4">
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 3px', lineHeight: 1.3 }}
                      className="text-[10px] sm:text-sm">
                      {course.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, margin: '0 0 6px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      className="text-[9px] sm:text-xs hidden sm:block">
                      {course.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, color: '#00FF88' }} className="text-[10px] sm:text-sm">
                        ${Number(course.price).toFixed(2)}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.25)' }} className="text-[8px] sm:text-xs hidden sm:block">
                        {course._count.files} arch · {course.seller.fullName}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
