'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [proofPreview, setProofPreview] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const proofInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/marketplace/courses/${courseId}`)
      .then(r => r.json())
      .then(d => {
        if (d.course) { setCourse(d.course); setPurchase(d.purchase) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [courseId])

  async function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProofPreview(URL.createObjectURL(file))
    setUploadingProof(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploadingProof(false)
    if (data.url) setProofUrl(data.url)
    else setError('Error al subir el comprobante')
  }

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
          {/* Left */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
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
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 340 }}>
            <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', padding: 22, position: 'sticky', top: 24, overflow: 'hidden' }}>

              {/* Price block */}
              <div style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,245,255,0.05))', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 12, padding: '16px 18px', marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Precio</p>
                <p style={{ fontWeight: 900, fontSize: 34, color: '#00FF88', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  ${Number(course.price).toFixed(2)}
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '5px 0 0' }}>Pago único · Acceso de por vida</p>
              </div>

              {/* Seller info */}
              {course.whatsapp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', marginBottom: 18 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.532 5.87L.073 23.927l6.244-1.636A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.044-1.396l-.361-.215-3.737.979.997-3.645-.236-.374A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vendedor</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#25d366', fontWeight: 700 }}>{course.whatsapp}</p>
                  </div>
                </div>
              )}

              {success && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88', fontSize: 12, marginBottom: 14 }}>
                  {success}
                </div>
              )}

              {isApproved ? (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                  <p style={{ margin: 0, fontWeight: 800, color: '#00FF88', fontSize: 14 }}>Acceso aprobado</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Revisa los archivos arriba</p>
                </div>
              ) : isPending ? (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>⏳</div>
                  <p style={{ margin: 0, fontWeight: 800, color: '#f97316', fontSize: 14 }}>Pago en revisión</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>El vendedor revisará tu comprobante pronto</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {isRejected && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12 }}>
                      Tu comprobante fue rechazado. Puedes intentar de nuevo.
                    </div>
                  )}
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 800, fontSize: 15,
                      cursor: 'pointer', border: 'none', letterSpacing: '0.04em', color: '#0a0a0f',
                      background: 'linear-gradient(135deg, #00F5FF 0%, #00FF88 100%)',
                      boxShadow: '0 4px 24px rgba(0,245,255,0.25)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,245,255,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,245,255,0.25)' }}
                  >
                    🛒 Comprar curso
                  </button>
                  {course.whatsapp && (
                    <a href={`https://wa.me/${course.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <button style={{
                        width: '100%', padding: '12px 0', borderRadius: 12, fontWeight: 700, fontSize: 13,
                        cursor: 'pointer', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)',
                        color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.532 5.87L.073 23.927l6.244-1.636A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.044-1.396l-.361-.215-3.737.979.997-3.645-.236-.374A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                        Contactar por WhatsApp
                      </button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal comprobante */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Enviar comprobante de pago</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Realiza tu pago de <strong style={{ color: '#00FF88' }}>${Number(course.price).toFixed(2)}</strong> al vendedor y sube la foto o captura de tu comprobante.
            </p>

            {error && (
              <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}

            {/* Upload area */}
            <div
              onClick={() => proofInputRef.current?.click()}
              style={{
                width: '100%', borderRadius: 12, cursor: 'pointer', marginBottom: 16,
                background: proofPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
                border: proofPreview ? 'none' : '2px dashed rgba(255,255,255,0.12)',
                overflow: 'hidden', position: 'relative',
                minHeight: proofPreview ? 'auto' : 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {proofPreview ? (
                <>
                  <img src={proofPreview} alt="comprobante" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', borderRadius: 12 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', borderRadius: 12 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: '4px 0 0' }}>Cambiar imagen</p>
                  </div>
                </>
              ) : uploadingProof ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24 }}>
                  <div style={{ width: 22, height: 22, border: '2px solid #00F5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Subiendo imagen...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24 }}>
                  <span style={{ fontSize: 32 }}>🧾</span>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>Toca para subir comprobante</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Foto, captura de pantalla o QR</p>
                </div>
              )}
            </div>
            <input ref={proofInputRef} type="file" accept="image/*" onChange={handleProofFile} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowModal(false); setProofPreview(''); setProofUrl('') }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePurchase}
                disabled={submitting || !proofUrl || uploadingProof}
                style={{ flex: 2, padding: '12px 0', borderRadius: 10, background: submitting || !proofUrl || uploadingProof ? 'rgba(0,245,255,0.3)' : '#00F5FF', border: 'none', color: '#0a0a0f', fontWeight: 700, fontSize: 13, cursor: submitting || !proofUrl || uploadingProof ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Enviando...' : uploadingProof ? 'Subiendo...' : 'Enviar comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
