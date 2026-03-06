'use client'

import { useState } from 'react'
import { Plus, Minus, ShoppingCart, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { ProductImageGallery } from './ProductImageGallery'
import { useCart } from './CartContext'

const CYAN = '#00F5FF'
const GREEN = '#00FF88'

const currencySymbol = (c: string) =>
    c === 'PEN' ? 'S/' : c === 'BOB' ? 'Bs' : c === 'VES' ? 'Bs.S' : c === 'EUR' ? '€' : '$'

export function ProductCard({ p, whatsappPhone, isMLM }: any) {
    const [quantity, setQuantity] = useState(1)
    const [showFullDesc, setShowFullDesc] = useState(false)
    const [added, setAdded] = useState(false)
    const { addToCart } = useCart()

    const handleAddToCart = () => {
        addToCart({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            currency: p.currency,
            quantity,
            points: Number(p.points || 0),
            image: p.images?.[0],
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            background: `linear-gradient(135deg, ${CYAN}06, ${CYAN}03)`,
            border: `1px solid ${CYAN}18`,
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: "'Montserrat', sans-serif",
        }}>
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${CYAN}70, transparent)` }} />

            {/* Image */}
            <div style={{ position: 'relative' }}>
                <ProductImageGallery images={p.images} name={p.name} />
                {/* Badges */}
                {isMLM && p.points > 0 && (
                    <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: `${CYAN}CC`, color: '#000',
                        fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 9999,
                        display: 'flex', alignItems: 'center', gap: 4,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                        <Star size={8} fill="currentColor" /> {p.points} PV
                    </div>
                )}
                {p.stock > 0 && p.stock <= 5 && (
                    <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'rgba(11,12,20,0.9)', color: 'rgba(255,255,255,0.8)',
                        fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 9999,
                        border: '1px solid rgba(255,255,255,0.1)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                        Últimos {p.stock}
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>

                {/* Name */}
                <h3 style={{ fontSize: 'clamp(9px, 2.5vw, 13px)', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' } as React.CSSProperties}>
                    {p.name}
                </h3>

                {/* Description — solo en pantallas grandes */}
                {p.description && (
                    <p className="hidden sm:block" style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0,
                        display: '-webkit-box', WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2, overflow: 'hidden',
                    } as any}>
                        {p.description}
                    </p>
                )}

                {/* Bottom section */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>

                    {/* Quantity — solo en pantallas grandes */}
                    <div className="hidden sm:flex" style={{
                        alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '6px 10px',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Cant.</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{
                                width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><Minus size={11} /></button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', width: 18, textAlign: 'center' }}>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} style={{
                                width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}><Plus size={11} /></button>
                        </div>
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span style={{ fontSize: 'clamp(12px, 3vw, 18px)', fontWeight: 800, color: GREEN, lineHeight: 1 }}>
                            {currencySymbol(p.currency)}{Number(p.price * quantity).toLocaleString()}
                        </span>
                        {isMLM && p.points > 0 && (
                            <span className="hidden sm:flex" style={{ fontSize: 9, fontWeight: 600, color: `${CYAN}90`, alignItems: 'center', gap: 3 }}>
                                <Star size={8} fill="currentColor" /> +{p.points * quantity}PV
                            </span>
                        )}
                    </div>

                    {/* Add button */}
                    <button onClick={handleAddToCart} style={{
                        width: '100%', padding: '7px 0',
                        borderRadius: 8, fontSize: 'clamp(8px, 2vw, 10px)', fontWeight: 700,
                        letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        background: added ? GREEN : CYAN,
                        color: '#000', border: 'none', transition: 'all 0.2s',
                    }}>
                        <ShoppingCart size={12} />
                        {added ? '¡Listo!' : 'Añadir'}
                    </button>
                </div>
            </div>
        </div>
    )
}
