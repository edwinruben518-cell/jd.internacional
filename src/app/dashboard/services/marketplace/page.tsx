'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  coverUrl: string | null
  price: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: string | null
  category: { name: string } | null
  _count: { purchases: number }
  createdAt: string
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:  { label: 'En revisión', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  APPROVED: { label: 'Publicado',   color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)' },
  REJECTED: { label: 'Rechazado',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
}

export default function MarketplaceDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/marketplace/my-courses')
    const data = await res.json()
    if (data.error) setError(data.error)
    else setCourses(data.courses ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este curso?')) return
    setDeleting(id)
    await fetch(`/api/marketplace/my-courses/${id}`, { method: 'DELETE' })
    setCourses(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Mis Cursos en Venta</h1>
          <div className="h-px w-24 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
          <p className="text-xs text-white/30 mt-2">Vende tus cursos a la comunidad JD Internacional.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/marketplace" target="_blank" rel="noopener noreferrer" style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
          }}>
            Ver marketplace →
          </a>
          <Link href="/dashboard/services/marketplace/create" style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#0a0a0f', textDecoration: 'none',
          }}>
            + Crear curso
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📚</span>
          <p className="text-white/40 text-sm">Aún no tienes cursos publicados.</p>
          <Link href="/dashboard/services/marketplace/create" style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#0a0a0f', textDecoration: 'none',
          }}>
            Crear mi primer curso
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(course => {
            const st = STATUS_STYLE[course.status]
            return (
              <div key={course.id} style={{
                borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16,
              }}>
                {/* Cover */}
                <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                  {course.coverUrl
                    ? <img src={course.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📚</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#00FF88' }}>${Number(course.price).toFixed(2)}</span>
                    {course.category && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {course.category.name}</span>}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {course._count.purchases} compra{course._count.purchases !== 1 ? 's' : ''}</span>
                  </div>
                  {course.adminNotes && course.status === 'REJECTED' && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Nota: {course.adminNotes}</p>
                  )}
                </div>

                {/* Status */}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em', color: st.color, background: st.bg, border: `1px solid ${st.border}`, flexShrink: 0 }}>
                  {st.label}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/dashboard/services/marketplace/${course.id}/purchases`} style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', color: '#00F5FF', textDecoration: 'none',
                  }}>
                    Compras
                  </Link>
                  <Link href={`/dashboard/services/marketplace/${course.id}/edit`} style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
                  }}>
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={deleting === course.id}
                    style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}
                  >
                    {deleting === course.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
