'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Loader2, Plus, Trash2, Edit2, X } from 'lucide-react'

interface StoreItem {
  id: string; title: string; description: string; category: string
  price: number; pv: number; images: string[]; stock: number
  variants: { name: string; options: string[] }[]; active: boolean
}

interface OrderItem {
  id: string; quantity: number; priceSnapshot: number; pvSnapshot: number
  selectedVariants: Record<string, string>
  item: { id: string; title: string; images: any; category: string }
}

interface StoreOrder {
  id: string; totalPrice: number; totalPv: number; status: string
  paymentMethod: string; proofUrl: string | null; txHash: string | null
  recipientName: string; phone: string; address: string; city: string
  state: string; country: string; zipCode: string | null; deliveryNotes: string | null
  notes: string | null; createdAt: string
  user: { id: string; username: string; fullName: string; email: string }
  items: OrderItem[]
}

const ORDER_STATUSES = ['ALL', 'PENDING', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED'] as const
type OrderStatusFilter = typeof ORDER_STATUSES[number]

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', PENDING_VERIFICATION: 'Verificando cripto',
  APPROVED: 'Aprobado', REJECTED: 'Rechazado', SHIPPED: 'Enviado', DELIVERED: 'Entregado',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  PENDING_VERIFICATION: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  APPROVED: 'text-green-400 border-green-500/30 bg-green-500/10',
  REJECTED: 'text-red-400 border-red-500/30 bg-red-500/10',
  SHIPPED: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  DELIVERED: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
}

const EMPTY_ITEM = { title: '', description: '', category: 'General', price: '', pv: '0', stock: '0', images: [''], variants: [] as { name: string; options: string }[], active: true }

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none'
const LABEL = 'block text-[11px] text-white/40 mb-1'

export default function AdminStorePage() {
  const [activeTab, setActiveTab] = useState<'items' | 'orders'>('items')

  // Items state
  const [items, setItems] = useState<StoreItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemModal, setItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_ITEM })
  const [saving, setSaving] = useState(false)
  const [itemError, setItemError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Orders state
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderTab, setOrderTab] = useState<OrderStatusFilter>('PENDING')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const fetchItems = () => {
    setItemsLoading(true)
    fetch('/api/admin/store/items').then(r => r.json()).then(d => { setItems(d.items ?? []); setItemsLoading(false) }).catch(() => setItemsLoading(false))
  }

  const fetchOrders = () => {
    setOrdersLoading(true)
    const qs = orderTab !== 'ALL' ? `?status=${orderTab}` : ''
    fetch(`/api/admin/store/orders${qs}`).then(r => r.json()).then(d => { setOrders(d.orders ?? []); setOrdersLoading(false) }).catch(() => setOrdersLoading(false))
  }

  useEffect(() => { fetchItems() }, [])
  useEffect(() => { if (activeTab === 'orders') fetchOrders() }, [activeTab, orderTab])

  const openCreate = () => { setEditingItem(null); setForm({ ...EMPTY_ITEM, images: [''], variants: [] }); setItemError(''); setItemModal(true) }
  const openEdit = (item: StoreItem) => {
    setEditingItem(item)
    setForm({
      title: item.title, description: item.description, category: item.category,
      price: String(item.price), pv: String(item.pv), stock: String(item.stock),
      images: item.images.length ? item.images : [''],
      variants: item.variants.map(v => ({ name: v.name, options: v.options.join(', ') })),
      active: item.active,
    })
    setItemError(''); setItemModal(true)
  }

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const addImage = () => setForm(p => ({ ...p, images: [...p.images, ''] }))
  const setImage = (i: number, v: string) => setForm(p => { const imgs = [...p.images]; imgs[i] = v; return { ...p, images: imgs } })
  const removeImage = (i: number) => setForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))

  const addVariant = () => setForm(p => ({ ...p, variants: [...p.variants, { name: '', options: '' }] }))
  const setVariant = (i: number, k: 'name' | 'options', v: string) => setForm(p => { const vs = [...p.variants]; vs[i] = { ...vs[i], [k]: v }; return { ...p, variants: vs } })
  const removeVariant = (i: number) => setForm(p => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }))

  const saveItem = async () => {
    if (!form.title || !form.description || !form.price) { setItemError('Título, descripción y precio son requeridos.'); return }
    setSaving(true); setItemError('')
    const body = {
      title: form.title, description: form.description, category: form.category,
      price: parseFloat(form.price), pv: parseFloat(form.pv || '0'),
      stock: parseInt(form.stock || '0'),
      images: form.images.filter(s => s.trim()),
      variants: form.variants.filter(v => v.name.trim()).map(v => ({ name: v.name.trim(), options: v.options.split(',').map(o => o.trim()).filter(Boolean) })),
      active: form.active,
    }
    const url = editingItem ? `/api/admin/store/items/${editingItem.id}` : '/api/admin/store/items'
    const method = editingItem ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) { setItemError(data.error ?? 'Error al guardar'); setSaving(false); return }
    setSaving(false); setItemModal(false); fetchItems()
  }

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/admin/store/items/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setItemError(data.error ?? 'Error al eliminar el producto')
      setDeleteConfirm(null)
      return
    }
    setDeleteConfirm(null); fetchItems()
  }

  const doOrderAction = async (orderId: string, action: string, notes?: string) => {
    setActionLoading(orderId)
    await fetch(`/api/admin/store/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, notes }) })
    setActionLoading(null); setRejectModal(null); setRejectNotes(''); fetchOrders()
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Tienda Admin</h1>
        <div className="h-px w-20 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {(['items', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              borderColor: activeTab === t ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)',
              background: activeTab === t ? 'rgba(0,245,255,0.08)' : 'transparent',
              color: activeTab === t ? '#00F5FF' : 'rgba(255,255,255,0.4)' }}>
            {t === 'items' ? '🏷️ Productos' : '📦 Pedidos'}
          </button>
        ))}
      </div>

      {/* ═══ TAB: ITEMS ═══ */}
      {activeTab === 'items' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
            <button onClick={fetchItems} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <RefreshCw size={13} className="text-white/40" />
            </button>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #00F5FF, #00FF88)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#000' }}>
              <Plus size={14} /> Nuevo producto
            </button>
          </div>

          {itemsLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-white/30" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">No hay productos. Crea el primero.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(item => {
                const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                      {img && <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{item.category} · {item.price.toFixed(2)} USDT · {item.pv} PV · Stock: {item.stock}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid', ...(item.active ? { color: '#00FF88', borderColor: 'rgba(0,255,136,0.25)', background: 'rgba(0,255,136,0.08)' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }) }}>
                      {item.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(item)} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.15)', cursor: 'pointer', color: '#00F5FF' }}><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteConfirm(item.id)} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: ORDERS ═══ */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {ORDER_STATUSES.map(s => (
              <button key={s} onClick={() => setOrderTab(s)}
                style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: 'transparent',
                  borderColor: orderTab === s ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)',
                  color: orderTab === s ? '#00F5FF' : 'rgba(255,255,255,0.4)' }}>
                {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
              </button>
            ))}
            <button onClick={fetchOrders} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <RefreshCw size={12} className="text-white/40" />
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-white/30" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-white/30 text-sm">No hay pedidos{orderTab !== 'ALL' ? ` con estado "${STATUS_LABEL[orderTab]}"` : ''}.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => {
                const isExp = expandedOrder === order.id
                return (
                  <div key={order.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                    {/* Order header */}
                    <button onClick={() => setExpandedOrder(isExp ? null : order.id)}
                      style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded-md border ${STATUS_BADGE[order.status] ?? ''}`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{order.user.fullName} · {order.user.username} · {order.user.email}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                          {new Date(order.createdAt).toLocaleString('es-CO')} · {order.totalPrice.toFixed(2)} USDT
                          {order.totalPv > 0 ? ` · ${order.totalPv} PV` : ''}
                        </p>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{isExp ? '▲' : '▼'}</span>
                    </button>

                    {isExp && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}>
                        {/* Products */}
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Productos</p>
                          {order.items.map(oi => {
                            const imgs = Array.isArray(oi.item.images) ? oi.item.images : []
                            return (
                              <div key={oi.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.04)' }}>
                                  {imgs[0] && <img src={imgs[0]} alt={oi.item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{oi.item.title}</p>
                                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                                    {Object.entries(oi.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                    {Object.keys(oi.selectedVariants).length > 0 && ' · '}
                                    x{oi.quantity} · {(oi.priceSnapshot * oi.quantity).toFixed(2)} USDT · {(oi.pvSnapshot * oi.quantity)} PV
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8, paddingTop: 8, display: 'flex', gap: 16 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#F5A623' }}>Total: {order.totalPrice.toFixed(2)} USDT</span>
                            {order.totalPv > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#00FF88' }}>+{order.totalPv} PV</span>}
                          </div>
                        </div>

                        {/* Delivery */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📦 Datos de entrega</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
                            <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Destinatario: </span><span style={{ color: '#fff', fontWeight: 600 }}>{order.recipientName}</span></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Teléfono: </span><span style={{ color: '#fff' }}>{order.phone}</span></div>
                            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Dirección: </span><span style={{ color: '#fff' }}>{order.address}</span></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Ciudad: </span><span style={{ color: '#fff' }}>{order.city}</span></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Estado/Dpto: </span><span style={{ color: '#fff' }}>{order.state}</span></div>
                            <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>País: </span><span style={{ color: '#fff' }}>{order.country}</span></div>
                            {order.zipCode && <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>CP: </span><span style={{ color: '#fff' }}>{order.zipCode}</span></div>}
                            {order.deliveryNotes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Notas: </span><span style={{ color: '#fff' }}>{order.deliveryNotes}</span></div>}
                          </div>
                        </div>

                        {/* Payment info */}
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Pago</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Método: <span style={{ color: '#fff', fontWeight: 600 }}>{order.paymentMethod === 'CRYPTO' ? '₮ Cripto (USDT-BEP20)' : '📎 Comprobante manual'}</span></p>
                          {order.txHash && (
                            <p style={{ fontSize: 11, marginTop: 4 }}>
                              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Tx: </span>
                              <a href={`https://bscscan.com/tx/${order.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#00F5FF', wordBreak: 'break-all', textDecoration: 'none' }}>{order.txHash} ↗</a>
                            </p>
                          )}
                          {order.proofUrl && (
                            <a href={order.proofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: '#F5A623', textDecoration: 'none', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 6, padding: '3px 10px' }}>
                              Ver comprobante ↗
                            </a>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {order.status === 'PENDING' && (
                            <>
                              <button onClick={() => doOrderAction(order.id, 'approve')} disabled={actionLoading === order.id}
                                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#000' }}>
                                {actionLoading === order.id ? '...' : '✓ Aprobar'}
                              </button>
                              <button onClick={() => { setRejectModal({ id: order.id }); setRejectNotes('') }}
                                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444' }}>
                                ✕ Rechazar
                              </button>
                            </>
                          )}
                          {order.status === 'PENDING_VERIFICATION' && (
                            <>
                              <button onClick={() => doOrderAction(order.id, 'approve')} disabled={actionLoading === order.id}
                                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#000' }}>
                                {actionLoading === order.id ? '...' : '✓ Aprobar manualmente'}
                              </button>
                              <button onClick={() => { setRejectModal({ id: order.id }); setRejectNotes('') }}
                                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#ef4444' }}>
                                ✕ Rechazar
                              </button>
                              <span style={{ fontSize: 12, color: '#F5A623', alignSelf: 'center' }}>⛓️ Verificando en blockchain...</span>
                            </>
                          )}
                          {order.status === 'APPROVED' && (
                            <button onClick={() => doOrderAction(order.id, 'ship')} disabled={actionLoading === order.id}
                              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.07)', color: '#a78bfa' }}>
                              🚚 Marcar enviado
                            </button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <button onClick={() => doOrderAction(order.id, 'deliver')} disabled={actionLoading === order.id}
                              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #00FF88, #00F5FF)', color: '#000' }}>
                              📦 Marcar entregado
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ITEM MODAL ═══ */}
      {itemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 560, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{editingItem ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
            </div>

            {itemError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 14, background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '7px 12px' }}>{itemError}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className={LABEL}>Título *</label><input className={INPUT} value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Camiseta JD Internacional" /></div>
              <div><label className={LABEL}>Descripción *</label><textarea className={INPUT} rows={3} style={{ resize: 'none' }} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Descripción del producto..." /></div>
              <div><label className={LABEL}>Categoría</label><input className={INPUT} value={form.category} onChange={e => setF('category', e.target.value)} placeholder="Ropa, Suplementos, Accesorios..." /></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div><label className={LABEL}>Precio (USDT) *</label><input className={INPUT} type="number" min="0" step="0.01" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="25.00" /></div>
                <div><label className={LABEL}>PV</label><input className={INPUT} type="number" min="0" step="0.01" value={form.pv} onChange={e => setF('pv', e.target.value)} placeholder="10" /></div>
                <div><label className={LABEL}>Stock</label><input className={INPUT} type="number" min="0" value={form.stock} onChange={e => setF('stock', e.target.value)} placeholder="50" /></div>
              </div>

              {/* Images */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className={LABEL} style={{ margin: 0 }}>Imágenes (URLs)</label>
                  <button onClick={addImage} style={{ fontSize: 11, color: '#00F5FF', background: 'none', border: 'none', cursor: 'pointer' }}>+ Agregar</button>
                </div>
                {form.images.map((img, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input className={INPUT} value={img} onChange={e => setImage(i, e.target.value)} placeholder={`https://ejemplo.com/imagen${i + 1}.jpg`} style={{ flex: 1 }} />
                    {form.images.length > 1 && (
                      <button onClick={() => removeImage(i)} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', color: '#ef4444', padding: '0 8px' }}><X size={12} /></button>
                    )}
                  </div>
                ))}
              </div>

              {/* Variants */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className={LABEL} style={{ margin: 0 }}>Variantes (opcional)</label>
                  <button onClick={addVariant} style={{ fontSize: 11, color: '#00F5FF', background: 'none', border: 'none', cursor: 'pointer' }}>+ Agregar variante</button>
                </div>
                {form.variants.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className={INPUT} value={v.name} onChange={e => setVariant(i, 'name', e.target.value)} placeholder="Talla" style={{ flex: '0 0 100px' }} />
                    <input className={INPUT} value={v.options} onChange={e => setVariant(i, 'options', e.target.value)} placeholder="S, M, L, XL" style={{ flex: 1 }} />
                    <button onClick={() => removeVariant(i)} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, cursor: 'pointer', color: '#ef4444', padding: '0 8px' }}><X size={12} /></button>
                  </div>
                ))}
                {form.variants.length > 0 && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Opciones separadas por coma: "S, M, L"</p>}
              </div>

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="active-toggle" checked={form.active} onChange={e => setF('active', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="active-toggle" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>Producto activo (visible en la tienda)</label>
              </div>

              <button onClick={saveItem} disabled={saving}
                style={{ padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
                  background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00F5FF, #00FF88)', color: saving ? 'rgba(255,255,255,0.3)' : '#000' }}>
                {saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear producto')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>¿Eliminar producto?</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancelar</button>
              <button onClick={() => deleteItem(deleteConfirm)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REJECT MODAL ═══ */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Rechazar pedido</p>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>Motivo (opcional)</label>
            <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none', resize: 'none', marginBottom: 16 }} rows={3}
              placeholder="Ej: Comprobante inválido, monto incorrecto..." />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Cancelar</button>
              <button onClick={() => doOrderAction(rejectModal.id, 'reject', rejectNotes)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
