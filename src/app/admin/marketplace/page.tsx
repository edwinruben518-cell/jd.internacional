'use client'

import { useEffect, useState } from 'react'

interface CourseFile {
  id: string
  title: string
  driveUrl: string
  order: number
}

interface Course {
  id: string
  title: string
  description: string
  coverUrl: string | null
  qrImageUrl: string | null
  price: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: string | null
  createdAt: string
  category: { name: string } | null
  seller: { id: string; fullName: string; username: string; email: string }
  files: CourseFile[]
  _count: { purchases: number }
}

const STATUS_TABS = [
  { key: 'PENDING',  label: 'Pendientes',  color: '#f97316' },
  { key: 'APPROVED', label: 'Aprobados',   color: '#00FF88' },
  { key: 'REJECTED', label: 'Rechazados',  color: '#ef4444' },
]

export default function AdminMarketplacePage() {
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/marketplace?status=${tab}`)
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  async function handleAction(courseId: string, status: 'APPROVED' | 'REJECTED') {
    setProcessing(courseId)
    const res = await fetch(`/api/admin/marketplace/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: notes[courseId] || null }),
    })
    if (res.ok) {
      setCourses(prev => prev.filter(c => c.id !== courseId))
    }
    setProcessing(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Marketplace de Cursos</h1>
        <div className="h-px w-28 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #9B00FF, #00F5FF, transparent)' }} />
        <p className="text-xs text-white/30 mt-2">Revisa y aprueba los cursos publicados por usuarios.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'PENDING' | 'APPROVED' | 'REJECTED')}
            style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: tab === t.key ? `rgba(${t.key === 'PENDING' ? '249,115,22' : t.key === 'APPROVED' ? '0,255,136' : '239,68,68'},0.12)` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t.key ? `rgba(${t.key === 'PENDING' ? '249,115,22' : t.key === 'APPROVED' ? '0,255,136' : '239,68,68'},0.35)` : 'rgba(255,255,255,0.08)'}`,
              color: tab === t.key ? t.color : 'rgba(255,255,255,0.4)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-white/30 text-sm">No hay cursos en esta sección.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(course => (
            <div key={course.id} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                {/* Cover */}
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                  {course.coverUrl
                    ? <img src={course.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📚</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>
                    {course.seller.fullName} (@{course.seller.username}) · {course.seller.email}
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#00FF88' }}>${Number(course.price).toFixed(2)}</span>
                    {course.category && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {course.category.name}</span>}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {course.files.length} archivos</span>
                    <span style={{ fontSize: 10, color: course.qrImageUrl ? '#00FF88' : '#ef4444' }}>· QR: {course.qrImageUrl ? '✓' : '✗'}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {new Date(course.createdAt).toLocaleDateString('es')}</span>
                  </div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpanded(expanded === course.id ? null : course.id)}
                  style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}
                >
                  {expanded === course.id ? 'Ocultar' : 'Ver detalle'}
                </button>
              </div>

              {/* Expanded detail */}
              {expanded === course.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 14, lineHeight: 1.6 }}>{course.description}</p>

                  {/* QR preview */}
                  {course.qrImageUrl && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>QR de pago del vendedor</p>
                      <img src={course.qrImageUrl} alt="QR" style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  )}

                  {course.files.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Archivos del curso</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {course.files.map((f, i) => (
                          <a key={f.id} href={f.driveUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#00F5FF', width: 18, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: 12, color: '#fff', flex: 1 }}>{f.title}</span>
                            <span style={{ fontSize: 10, color: '#00F5FF' }}>Abrir →</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab === 'PENDING' && (
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Nota de rechazo (opcional)"
                        value={notes[course.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [course.id]: e.target.value }))}
                        style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, outline: 'none' }}
                      />
                      <button
                        onClick={() => handleAction(course.id, 'APPROVED')}
                        disabled={processing === course.id}
                        style={{ padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none', background: '#00FF88', color: '#0a0a0f' }}
                      >
                        {processing === course.id ? '...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleAction(course.id, 'REJECTED')}
                        disabled={processing === course.id}
                        style={{ padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                      >
                        {processing === course.id ? '...' : 'Rechazar'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
