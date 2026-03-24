'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
    id: string
    name: string
    price: number
    currency: string
    quantity: number
    points?: number
    image?: string
}

interface CartContextType {
    cart: CartItem[]
    addToCart: (item: CartItem) => void
    removeFromCart: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalPrice: number
    totalPoints: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('jd_cart')
        if (saved) {
            try {
                setCart(JSON.parse(saved))
            } catch (e) {
                console.error('Error parsing cart', e)
            }
        }
    }, [])

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('jd_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (item: CartItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id)
            if (existing) {
                return prev.map(i => i.id === item.id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                )
            }
            return [...prev, item]
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id))
    }

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return
        setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
    }

    const clearCart = () => setCart([])

    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0)
    const totalPrice = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)
    const totalPoints = Math.round(cart.reduce((acc, i) => acc + (Number(i.points || 0) * i.quantity), 0) * 100) / 100

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            totalPrice,
            totalPoints
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart must be used within CartProvider')
    return context
}
