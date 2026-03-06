'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
  price: number
  whatsapp: string | null
  category: { id: string; name: string } | null
  seller: { id: string; fullName: string; username: string; avatarUrl: string | null }
  files: CourseFile[]
}

interface Purchase {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export default function MarketplaceCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/marketplace/courses/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.course) { setCourse(d.course); setPurchase(d.purchase) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [courseId])

  async function handlePurchase() {
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/marketplace/courses/${courseId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofUrl }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error || 'Error al enviar'); return }
    setPurchase({ status: 'PENDING' })
    setShowModal(false)
    setSuccess('Comprobante enviado. El vendedor revisará tu pago.')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #00F5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!course) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      Curso no encontrado.
    </div>
  )

  const isApproved = purchase?.status === 'APPROVED'
  const isPending = purchase?.status === 'PENDING'
  const isRejected = purchase?.status === 'REJECTED'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Navbar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/marketplace" style={{ textDecoration: 'none', color: '#00F5FF', fontWeight: 800, fontSize: 18, letterSpacing: '0.1em' }}>
          ← Marketplace
        </Link>
        <Link href="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Iniciar sesión</Link>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
          {/* Left */}
          <div>
            {/* Cover */}
            {course.coverUrl && (
              <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24, aspectRatio: '16/9' }}>
                <img src={course.coverUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Category */}
            {course.category && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#00F5FF', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', padding: '3px 10px', borderRadius: 6, letterSpacing: '0.05em' }}>
                {course.category.name}
              </span>
            )}

            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '12px 0 8px', lineHeight: 1.3 }}>{course.title}</h1>

            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: 14, marginBottom: 24 }}>
              {course.description}
            </p>

            {/* Seller info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {course.seller.avatarUrl
                  ? <img src={course.seller.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 14, fontWeight: 700, color: '#00F5FF' }}>{course.seller.fullName[0]}</span>
                }
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{course.seller.fullName}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>@{course.seller.username}</p>
              </div>
            </div>

            {/* Drive links — only if approved */}
            {isApproved && course.files.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#00FF88' }}>Tus archivos del curso</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {course.files.map((file, i) => (
                    <a key={file.id} href={file.driveUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#00FF88', flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#fff' }}>{file.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Abrir en Google Drive →</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — buy card */}
          <div>
            <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: 20, position: 'sticky', top: 24 }}>
              <p style={{ fontWeight: 800, fontSize: 28, color: '#00FF88', margin: '0 0 4px' }}>
                ${Number(course.price).toFixed(2)}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 20px' }}>Pago único</p>

              {success && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', fontSize: 12, marginBottom: 14 }}>
                  {success}
                </div>
              )}

              {isApproved ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', textAlign: 'center' }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#00FF88', fontSize: 13 }}>Acceso aprobado</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Revisa los archivos arriba</p>
                </div>
              ) : isPending ? (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', textAlign: 'center' }}>
                  <span style={{ fontSize: 20 }}>⏳</span>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#f97316', fontSize: 13 }}>Pago en revisión</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>El vendedor revisará tu comprobante</p>
                </div>
              ) : (
                <>
                  {isRejected && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, marginBottom: 14 }}>
                      Tu comprobante fue rechazado. Puedes intentar de nuevo.
                    </div>
                  )}
                  <button
                    onClick={() => setShowModal(true)}
                    style={{ width: '100%', padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#0a0a0f', letterSpacing: '0.04em' }}
                  >
                    Comprar curso
                  </button>
                  {course.whatsapp && (
                    <a href={`https://wa.me/${course.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <button style={{ width: '100%', padding: '11px 0', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', marginTop: 10 }}>
                        Contactar por WhatsApp
                      </button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal comprobante */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Enviar comprobante de pago</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Realiza tu pago de <strong style={{ color: '#00FF88' }}>${Number(course.price).toFixed(2)}</strong> directamente al vendedor y luego pega el enlace de tu comprobante (imagen en Drive, Dropbox, etc.)
            </p>
            {error && (
              <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={proofUrl}
              onChange={e => setProofUrl(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePurchase}
                disabled={submitting || !proofUrl}
                style={{ flex: 2, padding: '11px 0', borderRadius: 10, background: submitting || !proofUrl ? 'rgba(0,245,255,0.3)' : '#00F5FF', border: 'none', color: '#0a0a0f', fontWeight: 700, fontSize: 13, cursor: submitting || !proofUrl ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Enviando...' : 'Enviar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
