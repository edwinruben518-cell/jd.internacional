'use client'

import React, { useState } from 'react'
import { ShoppingBag, Store } from 'lucide-react'
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
            />
        </div>
    )
}

const CYAN = '#00F5FF'
const GREEN = '#00FF88'
const BORDER = 'rgba(0,245,255,0.12)'

function CatalogView({ store, products, categories, phone, onOpenCart, totalItems, totalPoints, totalPrice, cart }: any) {
    const isMLM = store.type === 'NETWORK_MARKETING'
    const [activeCategory, setActiveCategory] = useState('Todos')
    const categoryList = ['Todos', ...Object.keys(categories)]

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
                {store.bannerUrl && (
                    <div style={{ borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 24, border: `1px solid ${BORDER}` }}>
                        <img src={store.bannerUrl} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                    </div>
                )}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: '#fff', marginBottom: 4, letterSpacing: '-0.01em' }}>{store.name}</h1>
                    {store.description && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{store.description}</p>
                    )}
                </div>

                {/* ── CATEGORY TABS ── */}
                {categoryList.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
                        {categoryList.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                                padding: '6px 16px', borderRadius: 9999, fontSize: 10, fontWeight: 600,
                                letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: activeCategory === cat ? CYAN : `${CYAN}08`,
                                color: activeCategory === cat ? '#000' : 'rgba(255,255,255,0.45)',
                                outline: activeCategory === cat ? 'none' : `1px solid ${CYAN}15`,
                            }}>
                                {cat}
                            </button>
                        ))}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                        {(activeCategory === 'Todos'
                            ? (Object.values(categories).flat() as any[])
                            : (categories[activeCategory] || [])
                        ).map((p: any) => (
                            <ProductCard key={p.id} p={p} whatsappPhone={phone} isMLM={isMLM} />
                        ))}
                    </div>
                )}
            </main>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {store.name} · Powered by JD Internacional © 2026
                </p>
            </footer>
        </div>
    )
}
