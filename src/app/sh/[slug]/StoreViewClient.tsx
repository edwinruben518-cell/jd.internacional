'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShoppingBag, Store, Search, Menu, X, ChevronRight } from 'lucide-react'
import { CartProvider, useCart } from './CartContext'
import { CartDrawer } from './CartDrawer'
import { LandingViewClient } from './LandingViewClient'
import { ProductCard } from './ProductCard'

export function StoreViewClient({ store, products, categories, phone, paymentQrUrl }: any) {
    return (
        <CartProvider>
            <StoreViewContent
                store={store}
                products={products}
                categories={categories}
                phone={phone}
                paymentQrUrl={paymentQrUrl}
            />
        </CartProvider>
    )
}

function StoreViewContent({ store, products, categories, phone, paymentQrUrl }: any) {
    const [isCartOpen, setIsCartOpen] = useState(false)
    const { totalItems, totalPoints, totalPrice, cart } = useCart()

    return (
        <div style={{ minHeight: '100vh', background: '#0B0C14', color: '#fff', fontFamily: "'Montserrat', sans-serif" }}>
            {store.type === 'LANDING' ? (
                <LandingViewClient
                    store={store}
                    product={products[0]}
                    phone={phone}
                    onOpenCart={() => setIsCartOpen(true)}
                />
            ) : (
                <CatalogView
                    store={store}
                    products={products}
                    categories={categories}
                    phone={phone}
                    onOpenCart={() => setIsCartOpen(true)}
                    totalItems={totalItems}
                    totalPoints={totalPoints}
                    totalPrice={totalPrice}
                    cart={cart}
                />
            )}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                storeWhatsapp={phone}
                paymentQrUrl={paymentQrUrl}
                isMLM={store.type === 'NETWORK_MARKETING'}
                storeName={store.name}
            />
        </div>
    )
}

function BannerCarousel({ banners }: { banners: string[] }) {
    const [idx, setIdx] = useState(0)

    useEffect(() => {
        if (banners.length < 2) return
        const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 4000)
        return () => clearInterval(t)
    }, [banners.length])

    if (!banners.length) return null

    return (
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 24, border: '1px solid rgba(0,245,255,0.12)' }}>
            {banners.map((url, i) => (
                <img
                    key={url}
                    src={url}
                    alt={`banner-${i}`}
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover',
                        opacity: i === idx ? 0.85 : 0,
                        transition: 'opacity 0.8s ease',
                    }}
                />
            ))}
            {banners.length > 1 && (
                <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIdx(i)}
                            style={{
                                width: i === idx ? 20 : 6, height: 6,
                                borderRadius: 9999, border: 'none', cursor: 'pointer',
                                background: i === idx ? '#00F5FF' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.3s ease', padding: 0,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const CYAN = '#00F5FF'
const GREEN = '#00FF88'
const BORDER = 'rgba(0,245,255,0.12)'

function CatalogView({ store, products, categories, phone, onOpenCart, totalItems, totalPoints, totalPrice, cart }: any) {
    const isMLM = store.type === 'NETWORK_MARKETING'
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [searchQuery, setSearchQuery] = useState('')
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const categoryList = ['Todos', ...Object.keys(categories)]

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [menuOpen])

    const currencySymbol = (currency: string) =>
        currency === 'PEN' ? 'S/' : currency === 'BOB' ? 'Bs' : currency === 'VES' ? 'Bs.S' : currency === 'EUR' ? '€' : '$'

    return (
        <div>
            {/* ── HEADER ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(11,12,20,0.96)', backdropFilter: 'blur(20px)',
                borderBottom: `1px solid ${BORDER}`,
            }}>
                {/* Cyan top line */}
                <div style={{ height: 2, background: `linear-gradient(90deg, ${CYAN}60, rgba(155,0,255,0.4), transparent)` }} />
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {store.logoUrl
                            ? <img src={store.logoUrl} alt={store.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: `1px solid ${BORDER}` }} />
                            : <div style={{ width: 32, height: 32, borderRadius: 8, background: `${CYAN}12`, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Store size={14} color={CYAN} />
                            </div>
                        }
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{store.name}</span>
                    </div>

                    {/* Cart */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isMLM && totalPoints > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>PV</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: CYAN }}>+{totalPoints}</span>
                            </div>
                        )}
                        <button onClick={onOpenCart} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                            background: `${CYAN}10`, border: `1px solid ${CYAN}30`, borderRadius: 10,
                            color: '#fff', cursor: 'pointer', position: 'relative',
                        }}>
                            {totalPrice > 0 && (
                                <span style={{ fontSize: 13, fontWeight: 700, color: CYAN, display: 'none' }} className="sm-show">
                                    {currencySymbol(cart[0]?.currency)}{totalPrice.toLocaleString()}
                                </span>
                            )}
                            <div style={{ position: 'relative' }}>
                                <ShoppingBag size={18} color={CYAN} />
                                {totalItems > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -8, right: -8,
                                        background: GREEN, color: '#000', fontSize: 9, fontWeight: 700,
                                        width: 18, height: 18, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{totalItems}</span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── STORE HERO ── */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 0' }}>
                <BannerCarousel banners={[store.bannerUrl, store.themeConfig?.bannerUrl2].filter(Boolean) as string[]} />
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{store.name}</h1>
                    {store.description && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{store.description}</p>
                    )}
                </div>

                {/* ── SEARCH BAR ── */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={14} color={CYAN} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '9px 12px 9px 34px',
                            background: `${CYAN}06`, border: `1px solid ${CYAN}20`,
                            borderRadius: 10, color: '#fff', fontSize: 13,
                            outline: 'none', fontFamily: 'inherit',
                        }}
                    />
                </div>

                {/* ── CATEGORY HAMBURGER ── */}
                {categoryList.length > 1 && (
                    <div ref={menuRef} style={{ position: 'relative', marginBottom: 16 }}>
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                                background: menuOpen ? `${CYAN}15` : `${CYAN}08`,
                                border: `1px solid ${menuOpen ? CYAN + '50' : CYAN + '20'}`,
                                color: '#fff', fontSize: 12, fontWeight: 600,
                                letterSpacing: '0.05em', transition: 'all 0.2s',
                            }}
                        >
                            {menuOpen ? <X size={15} color={CYAN} /> : <Menu size={15} color={CYAN} />}
                            <span style={{ color: CYAN }}>{activeCategory}</span>
                        </button>

                        {menuOpen && (
                            <div style={{
                                position: 'absolute', top: '110%', left: 0, zIndex: 100,
                                background: '#12131F', border: `1px solid ${BORDER}`,
                                borderRadius: 12, overflow: 'hidden', minWidth: 180,
                                boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
                            }}>
                                {categoryList.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setActiveCategory(cat); setMenuOpen(false) }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 16px', background: 'none',
                                            border: 'none', borderBottom: `1px solid ${BORDER}`,
                                            color: activeCategory === cat ? CYAN : 'rgba(255,255,255,0.65)',
                                            fontSize: 13, fontWeight: activeCategory === cat ? 700 : 400,
                                            cursor: 'pointer', textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = `${CYAN}08`)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        {cat}
                                        {activeCategory === cat && <ChevronRight size={13} color={CYAN} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── PRODUCT GRID ── */}
            <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 20px 60px' }}>
                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.25)' }}>
                        <Store size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p style={{ fontSize: 13 }}>No hay productos disponibles aún.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {(activeCategory === 'Todos'
                            ? (Object.values(categories).flat() as any[])
                            : (categories[activeCategory] || [])
                        ).filter((p: any) =>
                            !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
                        ).map((p: any) => (
                            <ProductCard key={p.id} p={p} whatsappPhone={phone} isMLM={isMLM} />
                        ))}
                    </div>
                )}
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {store.name} · Powered by Jade AI © 2026
                </p>
            </footer>
        </div>
    )
}
