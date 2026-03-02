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
            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Name */}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                    {p.name}
                </h3>

                {/* Description */}
                {p.description && (
                    <div>
                        <p style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0,
                            display: '-webkit-box', WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: showFullDesc ? 'unset' : 2, overflow: 'hidden',
                        } as any}>
                            {p.description}
                        </p>
                        {p.description.length > 80 && (
                            <button onClick={() => setShowFullDesc(!showFullDesc)} style={{
                                fontSize: 10, fontWeight: 600, color: `${CYAN}90`, marginTop: 4,
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                {showFullDesc ? 'Ver menos' : 'Ver más'}
                                {showFullDesc ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                        )}
                    </div>
                )}

                {/* Bottom section */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Quantity */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                        <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Cantidad</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{
                                width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Minus size={12} />
                            </button>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', width: 20, textAlign: 'center' }}>{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} style={{
                                width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Price + Add to cart */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Price */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Total</span>
                            <span style={{ fontSize: 22, fontWeight: 700, color: GREEN, lineHeight: 1, letterSpacing: '-0.01em' }}>
                                {currencySymbol(p.currency)}{(p.price * quantity).toLocaleString()}
                            </span>
                            {isMLM && p.points > 0 && (
                                <span style={{ fontSize: 9, fontWeight: 600, color: `${CYAN}90`, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Star size={9} fill="currentColor" /> +{p.points * quantity} PV
                                </span>
                            )}
                        </div>

                        {/* Add button */}
                        <button onClick={handleAddToCart} style={{
                            flex: 1, height: 44, borderRadius: 10, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            background: added ? GREEN : CYAN,
                            color: '#000', border: 'none',
                            transition: 'all 0.2s',
                        }}>
                            <ShoppingCart size={15} />
                            {added ? '¡Añadido!' : 'Añadir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
