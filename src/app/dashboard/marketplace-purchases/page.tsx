'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Clock, CheckCircle, XCircle, ShoppingBag } from 'lucide-react'

interface File {
  id: string
  title: string
  driveUrl: string
}

interface Course {
  id: string
  title: string
  description: string
  coverUrl: string | null
  price: number
  seller: { fullName: string; username: string }
  files: File[]
}

interface Purchase {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  proofUrl: string | null
  notes: string | null
  createdAt: string
  course: Course
}

const statusConfig = {
  PENDING: { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', Icon: Clock },
  APPROVED: { label: 'Aprobado', color: '#10B981', bg: 'rgba(16,185,129,0.1)', Icon: CheckCircle },
  REJECTED: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', Icon: XCircle },
}

export default function MarketplacePurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketplace/my-purchases')
      .then(r => r.json())
      .then(d => { setPurchases(d.purchases ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060710', color: '#fff', fontFamily: 'sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 800, margin: 0, letterSpacing: '0.04em' }}>
            Mis Compras del <span style={{ color: '#00F5FF' }}>Marketplace</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 6, fontSize: 13 }}>
            Cursos que compraste de otros miembros
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0' }}>Cargando...</div>
        ) : purchases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <ShoppingBag size={40} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Aún no has comprado ningún curso del marketplace</p>
            <Link href="/marketplace" style={{ display: 'inline-block', marginTop: 16, color: '#00F5FF', fontSize: 13, textDecoration: 'none', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 8, padding: '8px 20px' }}>
              Ver Marketplace
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {purchases.map(p => {
              const sc = statusConfig[p.status]
              const Icon = sc.Icon
              return (
                <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 16, padding: '16px' }}>
                    {/* Cover */}
                    {p.course.coverUrl ? (
                      <img src={p.course.coverUrl} alt={p.course.title} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 8, background: 'rgba(0,245,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShoppingBag size={28} style={{ color: 'rgba(0,245,255,0.4)' }} />
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', wordBreak: 'break-word' }}>{p.course.title}</h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: sc.color, background: sc.bg, borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <Icon size={11} /> {sc.label}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Vendedor: {p.course.seller.fullName} (@{p.course.seller.username})
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                        {new Date(p.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      {p.status === 'REJECTED' && p.notes && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '6px 10px', wordBreak: 'break-word' }}>
                          Motivo: {p.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Files (only if APPROVED) */}
                  {p.status === 'APPROVED' && p.course.files.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Archivos del curso</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {p.course.files.map(f => (
                          <a key={f.id} href={f.driveUrl} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#00F5FF', textDecoration: 'none', background: 'rgba(0,245,255,0.06)', borderRadius: 8, padding: '7px 12px', maxWidth: '100%', overflow: 'hidden' }}>
                            <ExternalLink size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Retry if REJECTED */}
                  {p.status === 'REJECTED' && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                      <Link href={`/marketplace/${p.course.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#FF2DF7', textDecoration: 'none', background: 'rgba(255,45,247,0.06)', borderRadius: 8, padding: '7px 14px', border: '1px solid rgba(255,45,247,0.2)', whiteSpace: 'nowrap' }}>
                        Reintentar compra
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
