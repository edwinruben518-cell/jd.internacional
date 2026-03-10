'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Purchase {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  proofUrl: string | null
  notes: string | null
  createdAt: string
  buyer: { id: string; fullName: string; username: string; email: string }
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:  { label: 'Pendiente',  color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
  APPROVED: { label: 'Aprobado',   color: '#00FF88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)' },
  REJECTED: { label: 'Rechazado',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
}

export default function CoursePurchasesPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/marketplace/my-courses/${courseId}/purchases`)
      .then(r => r.json())
      .then(d => { setPurchases(d.purchases ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  async function handleAction(purchaseId: string, status: 'APPROVED' | 'REJECTED') {
    setProcessing(purchaseId)
    const res = await fetch(`/api/marketplace/my-courses/${courseId}/purchases/${purchaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes: rejectNotes[purchaseId] || null }),
    })
    if (res.ok) {
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status, notes: rejectNotes[purchaseId] || null } : p))
    }
    setProcessing(null)
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/services/marketplace" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 13 }}>← Mis cursos</Link>
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Compras del Curso</h1>
          <div className="h-px w-20 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-24 text-white/40 text-sm">Aún no hay compras para este curso.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {purchases.map(purchase => {
            const st = STATUS_STYLE[purchase.status]
            return (
              <div key={purchase.id} style={{
                borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#fff', margin: '0 0 2px' }}>{purchase.buyer.fullName}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>@{purchase.buyer.username} · {purchase.buyer.email}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0' }}>
                      {new Date(purchase.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </div>

                {purchase.proofUrl && (
                  <div style={{ marginTop: 12 }}>
                    <a href={purchase.proofUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                      color: '#00F5FF', textDecoration: 'none', padding: '6px 12px', borderRadius: 8,
                      background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.2)',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ver comprobante de pago
                    </a>
                  </div>
                )}

                {purchase.notes && (
                  <p style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>Nota: {purchase.notes}</p>
                )}

                {purchase.status === 'PENDING' && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Motivo de rechazo (opcional)"
                      value={rejectNotes[purchase.id] || ''}
                      onChange={e => setRejectNotes(prev => ({ ...prev, [purchase.id]: e.target.value }))}
                      style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, outline: 'none' }}
                    />
                    <button
                      onClick={() => handleAction(purchase.id, 'APPROVED')}
                      disabled={processing === purchase.id}
                      style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none', background: '#00FF88', color: '#0a0a0f' }}
                    >
                      {processing === purchase.id ? '...' : 'Aprobar'}
                    </button>
                    <button
                      onClick={() => handleAction(purchase.id, 'REJECTED')}
                      disabled={processing === purchase.id}
                      style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                    >
                      {processing === purchase.id ? '...' : 'Rechazar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
