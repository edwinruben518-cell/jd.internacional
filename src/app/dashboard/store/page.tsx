'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface StoreItem {
  id: string
  title: string
  description: string
  category: string
  price: number
  pv: number
  images: string[]
  stock: number
  variants: { name: string; options: string[] }[]
}

function useCartCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const update = () => {
      try {
        const c = JSON.parse(localStorage.getItem('store_cart') ?? '[]')
        setCount(c.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0))
      } catch { setCount(0) }
    }
    update()
    window.addEventListener('storage', update)
    window.addEventListener('cart_updated', update)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('cart_updated', update) }
  }, [])
  return count
}

export default function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const cartCount = useCartCount()

  useEffect(() => {
    fetch('/api/store/items')
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setCategories(d.categories ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleCategory = (cat: string) => {
    setActiveCategory(cat)
    const url = cat === 'Todas' ? '/api/store/items' : `/api/store/items?category=${encodeURIComponent(cat)}`
    fetch(url).then(r => r.json()).then(d => setItems(d.items ?? [])).catch(() => {})
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Tienda</h1>
          <div className="h-px w-20 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
          <p className="text-xs text-white/30 mt-2">Productos exclusivos de JD Internacional.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/dashboard/store/my-orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#00F5FF', background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
            📦 Mis pedidos
          </Link>
          <Link href="/dashboard/store/cart" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', textDecoration: 'none' }}>
            🛒 Carrito
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -7, right: -7, background: '#FF2DF7', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category pills */}
      {!loading && categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {['Todas', ...categories].map(cat => (
            <button key={cat} onClick={() => handleCategory(cat)}
              style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', background: 'transparent',
                borderColor: activeCategory === cat ? 'rgba(0,245,255,0.5)' : 'rgba(255,255,255,0.1)',
                color: activeCategory === cat ? '#00F5FF' : 'rgba(255,255,255,0.4)' }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-white/40">No hay productos disponibles{activeCategory !== 'Todas' ? ` en "${activeCategory}"` : ''}.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map(item => {
            const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null
            const outOfStock = item.stock === 0
            return (
              <Link key={item.id} href={`/dashboard/store/${item.id}`} style={{ textDecoration: 'none' }}>
                <div className="hover:border-white/20" style={{ borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', opacity: outOfStock ? 0.6 : 1, transition: 'border-color 0.2s' }}>
                  <div style={{ aspectRatio: '1/1', background: 'rgba(0,245,255,0.04)', position: 'relative', overflow: 'hidden' }}>
                    {img ? (
                      <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="none" stroke="#00F5FF" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                      </div>
                    )}
                    {outOfStock && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sin stock</span>
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '2px 7px' }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <p style={{ fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-[11px] sm:text-sm">{item.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontWeight: 800, color: '#F5A623' }} className="text-[11px] sm:text-sm">{item.price.toFixed(2)} USDT</span>
                      {item.pv > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#00FF88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 6, padding: '1px 6px' }}>{item.pv} PV</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
