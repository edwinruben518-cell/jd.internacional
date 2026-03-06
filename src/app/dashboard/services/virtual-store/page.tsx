'use client'

import { useState, useEffect } from 'react'
import {
    ShoppingCart,
    Plus,
    Globe,
    Settings,
    ExternalLink,
    Store,
    Layout as LayoutIcon,
    Trash2,
    Save,
    X,
    Loader2,
    ShoppingBag,
    Package,
    ChevronRight,
    Edit3,
    ArrowLeft,
    Star
} from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    description: string | null
    category: string | null
    price: number
    currency: string
    points: number | null
    stock: number
    images: string[]
    active: boolean
}

interface StoreRecord {
    id: string
    name: string
    slug: string
    type: 'CATALOG' | 'LANDING' | 'NETWORK_MARKETING' | 'GENERAL_BUSINESS'
    whatsappNumber: string | null
    paymentQrUrl: string | null
    active: boolean
    description: string | null
    _count?: { products: number }
}

export default function VirtualStorePage() {
    const [stores, setStores] = useState<StoreRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'STORES' | 'PRODUCTS'>('STORES')
    const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [productsLoading, setProductsLoading] = useState(false)

    const [showStoreModal, setShowStoreModal] = useState(false)
    const [showProductModal, setShowProductModal] = useState(false)
    const [editProduct, setEditProduct] = useState<Product | null>(null)

    // Store Form
    const [storeName, setStoreName] = useState('')
    const [storeSlug, setStoreSlug] = useState('')
    const [storeType, setStoreType] = useState<'CATALOG' | 'LANDING' | 'NETWORK_MARKETING' | 'GENERAL_BUSINESS'>('GENERAL_BUSINESS')
    const [storeWhatsapp, setStoreWhatsapp] = useState('')
    const [storeQr, setStoreQr] = useState('')
    const [editStore, setEditStore] = useState<StoreRecord | null>(null)

    // Product Form
    const [prodName, setProdName] = useState('')
    const [prodPrice, setProdPrice] = useState('')
    const [prodCurrency, setProdCurrency] = useState('USD')
    const [prodPoints, setProdPoints] = useState('0')
    const [prodCategory, setProdCategory] = useState('General')
    const [prodStock, setProdStock] = useState('0')
    const [prodDesc, setProdDesc] = useState('')
    const [prodImages, setProdImages] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetchStores()
    }, [])

    const fetchStores = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/stores')
            const data = await res.json()
            setStores(data.stores || [])
        } catch (err) {
            console.error('Error fetching stores:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async (storeId: string) => {
        setProductsLoading(true)
        try {
            const res = await fetch(`/api/stores/${storeId}/products`)
            const data = await res.json()
            setProducts(data.products || [])
        } catch (err) {
            console.error('Error fetching products:', err)
        } finally {
            setProductsLoading(false)
        }
    }

    const handleSaveStore = async (e: React.FormEvent) => {
        e.preventDefault()
        const method = editStore ? 'PATCH' : 'POST'
        const url = editStore ? `/api/stores/${editStore.id}` : '/api/stores'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: storeName,
                    slug: storeSlug.replace(/\s+/g, '-').toLowerCase(),
                    type: storeType,
                    whatsappNumber: storeWhatsapp,
                    paymentQrUrl: storeQr
                })
            })
            const data = await res.json()
            if (res.ok) {
                if (editStore) {
                    setStores(stores.map(s => s.id === data.store.id ? data.store : s))
                } else {
                    setStores([data.store, ...stores])
                }
                setShowStoreModal(false)
                resetStoreForm()
            } else {
                const msg = data.details ? `${data.error}: ${data.details}` : data.error
                alert(msg)
            }
        } catch (err) { alert('Error al guardar tienda') }
    }

    const resetStoreForm = () => {
        setEditStore(null)
        setStoreName('')
        setStoreSlug('')
        setStoreType('GENERAL_BUSINESS')
        setStoreWhatsapp('')
        setStoreQr('')
    }

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStore) return

        const url = editProduct
            ? `/api/stores/${selectedStore.id}/products/${editProduct.id}`
            : `/api/stores/${selectedStore.id}/products`

        const method = editProduct ? 'PATCH' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: prodName,
                    price: prodPrice,
                    currency: prodCurrency,
                    points: prodPoints,
                    category: prodCategory,
                    stock: prodStock,
                    description: prodDesc,
                    images: prodImages
                })
            })
            const data = await res.json()
            if (res.ok) {
                if (editProduct) {
                    setProducts(products.map(p => p.id === data.product.id ? data.product : p))
                } else {
                    setProducts([data.product, ...products])
                }
                setShowProductModal(false)
                resetProductForm()
            } else alert(data.error)
        } catch (err) { alert('Error al guardar producto') }
    }

    const resetProductForm = () => {
        setEditProduct(null)
        setProdName('')
        setProdPrice('')
        setProdCurrency('USD')
        setProdPoints('0')
        setProdCategory('General')
        setProdStock('0')
        setProdDesc('')
        setProdImages([])
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                setProdImages([...prodImages, data.url].slice(0, 4))
            } else alert(data.error)
        } catch (err) {
            alert('Error al subir imagen')
        } finally {
            setUploading(false)
        }
    }

    const openStoreProducts = (store: StoreRecord) => {
        setSelectedStore(store)
        setView('PRODUCTS')
        fetchProducts(store.id)
    }

    const deleteStore = async (id: string) => {
        if (!confirm('¿Eliminar esta tienda y todos sus productos?')) return
        await fetch(`/api/stores/${id}`, { method: 'DELETE' })
        setStores(stores.filter(s => s.id !== id))
    }

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar producto?')) return
        if (!selectedStore) return
        await fetch(`/api/stores/${selectedStore.id}/products/${id}`, { method: 'DELETE' })
        setProducts(products.filter(p => p.id !== id))
    }

    if (view === 'PRODUCTS' && selectedStore) {
        return (
            <div className="px-4 sm:px-6 pt-6 max-w-6xl mx-auto pb-20 text-white">
                <button
                    onClick={() => setView('STORES')}
                    className="flex items-center gap-2 text-dark-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={18} /> Volver a mis tiendas
                </button>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Inventario: {selectedStore.name}</h1>
                        <p className="text-dark-400 text-sm mt-1">Gestiona los productos exclusivos de esta tienda</p>
                    </div>
                    <button
                        onClick={() => { resetProductForm(); setShowProductModal(true); }}
                        className="bg-neon-blue text-dark-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-neon-blue/90"
                    >
                        <Plus size={20} /> Añadir Producto
                    </button>
                </div>

                {productsLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-neon-blue" /></div>
                ) : products.length === 0 ? (
                    <div className="bg-dark-900/40 border border-white/5 rounded-3xl p-20 text-center">
                        <Package className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No hay productos aún</h3>
                        <p className="text-dark-400 mb-8">Empieza a llenar tu catálogo para que tus clientes puedan comprar.</p>
                        <button onClick={() => setShowProductModal(true)} className="text-neon-blue font-bold border-b border-neon-blue/30">Subir mi primer producto</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                        {products.map(p => (
                            <div key={p.id} className="bg-dark-900 border border-white/5 rounded-2xl overflow-hidden group">
                                <div className="aspect-square bg-dark-800 flex items-center justify-center overflow-hidden">
                                    {p.images?.[0] ? (
                                        <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <Package size={40} className="text-dark-600" />
                                    )}
                                </div>
                                <div className="p-2 sm:p-5">
                                    <div className="flex items-start justify-between mb-1 sm:mb-2 gap-1">
                                        <h3 className="font-bold text-[10px] sm:text-lg leading-tight">{p.name}</h3>
                                        <span className="text-neon-green font-black text-[10px] sm:text-base shrink-0">${p.price}</span>
                                    </div>
                                    <p className="text-dark-400 text-[9px] sm:text-xs mb-2 sm:mb-6 line-clamp-2 hidden sm:block">{p.description || 'Sin descripción'}</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditProduct(p);
                                                setProdName(p.name);
                                                setProdPrice(p.price.toString());
                                                setProdCurrency(p.currency || 'USD');
                                                setProdPoints(p.points?.toString() || '0');
                                                setProdCategory(p.category || 'General');
                                                setProdStock(p.stock.toString());
                                                setProdDesc(p.description || '');
                                                setProdImages(p.images || []);
                                                setShowProductModal(true);
                                            }}
                                            className="flex-1 bg-white/5 hover:bg-white/10 py-1 sm:py-2 rounded-lg text-[9px] sm:text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-1"
                                        >
                                            <Edit3 size={10} /> <span className="hidden sm:inline">Editar</span>
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(p.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/20"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Product Modal */}
                {showProductModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-lg p-5 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <h2 className="text-xl sm:text-2xl font-bold mb-5">{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <form onSubmit={handleSaveProduct} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Nombre</label>
                                    <input required value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Categoría</label>
                                    <div className="flex flex-col gap-3">
                                        <select
                                            value={[
                                                'Electrónica y Tecnología', 'Celulares y Accesorios', 'Computación',
                                                'Hogar y Cocina', 'Decoración', 'Muebles',
                                                'Ropa Mujer', 'Ropa Hombre', 'Ropa Infantil', 'Calzado',
                                                'Belleza y Cuidado Personal', 'Salud', 'Deportes y Fitness',
                                                'Juguetes', 'Bebés', 'Automotriz',
                                                'Herramientas y Ferretería', 'Jardín', 'Mascotas',
                                                'Oficina y Papelería', 'Videojuegos', 'Libros',
                                                'Accesorios y Joyas', 'Viajes y Maletas',
                                                'Ofertas Novedades', 'Más Vendidos', 'Ofertas', 'Liquidación', 'General'
                                            ].includes(prodCategory) ? prodCategory : 'Otra'}
                                            onChange={e => {
                                                if (e.target.value !== 'Otra') setProdCategory(e.target.value)
                                            }}
                                            className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all"
                                        >
                                            <option value="General">General</option>
                                            <option value="Electrónica y Tecnología">Electrónica y Tecnología</option>
                                            <option value="Celulares y Accesorios">Celulares y Accesorios</option>
                                            <option value="Computación">Computación</option>
                                            <option value="Hogar y Cocina">Hogar y Cocina</option>
                                            <option value="Decoración">Decoración</option>
                                            <option value="Muebles">Muebles</option>
                                            <option value="Ropa Mujer">Ropa Mujer</option>
                                            <option value="Ropa Hombre">Ropa Hombre</option>
                                            <option value="Ropa Infantil">Ropa Infantil</option>
                                            <option value="Calzado">Calzado</option>
                                            <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
                                            <option value="Salud">Salud</option>
                                            <option value="Deportes y Fitness">Deportes y Fitness</option>
                                            <option value="Juguetes">Juguetes</option>
                                            <option value="Bebés">Bebés</option>
                                            <option value="Automotriz">Automotriz</option>
                                            <option value="Herramientas y Ferretería">Herramientas y Ferretería</option>
                                            <option value="Jardín">Jardín</option>
                                            <option value="Mascotas">Mascotas</option>
                                            <option value="Oficina y Papelería">Oficina y Papelería</option>
                                            <option value="Videojuegos">Videojuegos</option>
                                            <option value="Libros">Libros</option>
                                            <option value="Accesorios y Joyas">Accesorios y Joyas</option>
                                            <option value="Viajes y Maletas">Viajes y Maletas</option>
                                            <option value="Ofertas Novedades">Ofertas Novedades</option>
                                            <option value="Más Vendidos">Más Vendidos</option>
                                            <option value="Ofertas">Ofertas</option>
                                            <option value="Liquidación">Liquidación</option>
                                            <option value="Otra">Otra (escribir...)</option>
                                        </select>
                                        {(![
                                            'Electrónica y Tecnología', 'Celulares y Accesorios', 'Computación',
                                            'Hogar y Cocina', 'Decoración', 'Muebles',
                                            'Ropa Mujer', 'Ropa Hombre', 'Ropa Infantil', 'Calzado',
                                            'Belleza y Cuidado Personal', 'Salud', 'Deportes y Fitness',
                                            'Juguetes', 'Bebés', 'Automotriz',
                                            'Herramientas y Ferretería', 'Jardín', 'Mascotas',
                                            'Oficina y Papelería', 'Videojuegos', 'Libros',
                                            'Accesorios y Joyas', 'Viajes y Maletas',
                                            'Ofertas Novedades', 'Más Vendidos', 'Ofertas', 'Liquidación', 'General'
                                        ].includes(prodCategory) || prodCategory === 'Otra') && (
                                                <input
                                                    value={prodCategory === 'Otra' ? '' : prodCategory}
                                                    onChange={e => setProdCategory(e.target.value)}
                                                    placeholder="Nombre de categoría personalizada..."
                                                    className="w-full bg-dark-900 border border-neon-blue/20 text-neon-blue rounded-xl px-4 py-3 focus:border-neon-blue outline-none transition-all placeholder:text-neon-blue/30"
                                                />
                                            )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block">Precio</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={prodCurrency}
                                                onChange={e => setProdCurrency(e.target.value)}
                                                className="w-24 bg-dark-900 border border-white/10 rounded-xl px-2 py-3 text-xs text-white focus:border-neon-blue outline-none transition-all"
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="PEN">PEN (S/)</option>
                                                <option value="COP">COP ($)</option>
                                                <option value="MXN">MXN ($)</option>
                                                <option value="ARS">ARS ($)</option>
                                                <option value="CLP">CLP ($)</option>
                                                <option value="BOB">BOB (Bs)</option>
                                                <option value="VES">VES (Bs.S)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                            <input required type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-blue outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-32 space-y-2">
                                        <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block">Stock</label>
                                        <input required type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all" />
                                    </div>
                                </div>
                                {selectedStore.type === 'NETWORK_MARKETING' && (
                                    <div>
                                        <label className="text-xs font-bold text-neon-blue uppercase tracking-widest block mb-2 flex items-center gap-2">
                                            <Star size={12} /> Puntos (PV/BV)
                                        </label>
                                        <input type="number" step="0.01" value={prodPoints} onChange={e => setProdPoints(e.target.value)} className="w-full bg-dark-950 border border-neon-blue/20 text-neon-blue rounded-xl px-4 py-3" />
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Galería de Imágenes (Hasta 4)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {prodImages.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-dark-900 group">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setProdImages(prodImages.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        {prodImages.length < 4 && (
                                            <div className="relative aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-[8px] font-bold text-dark-400 hover:border-neon-blue hover:text-neon-blue transition-all cursor-pointer">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                />
                                                {uploading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Subir</>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            id="urlInput"
                                            placeholder="Pegar URL de imagen..."
                                            className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-sm"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) {
                                                        setProdImages([...prodImages, val].slice(0, 4));
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById('urlInput') as HTMLInputElement;
                                                if (el?.value) {
                                                    setProdImages([...prodImages, el.value].slice(0, 4));
                                                    el.value = '';
                                                }
                                            }}
                                            className="px-4 bg-white/5 rounded-xl border border-white/10 text-xs font-bold"
                                        >
                                            Añadir
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Descripción</label>
                                    <textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={3} className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all resize-y" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 sm:py-4 text-dark-300 font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 py-3 sm:py-4 bg-neon-blue text-dark-950 font-bold rounded-xl shadow-lg shadow-neon-blue/20 transition-all active:scale-95">Guardar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="px-4 sm:px-6 pt-6 max-w-6xl mx-auto pb-20 font-inter text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center border border-neon-blue/20 shadow-[0_0_20px_rgba(var(--neon-blue-rgb),0.2)]">
                        <Store className="w-6 h-6 text-neon-blue" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mis Tiendas Virtuales</h1>
                        <p className="text-dark-400 text-sm mt-1">Crea escaparates digitales independientes de tus bots</p>
                    </div>
                </div>

                <button
                    onClick={() => { resetStoreForm(); setShowStoreModal(true); }}
                    className="flex items-center gap-2 bg-neon-blue hover:bg-neon-blue/90 text-dark-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} /> Nueva Tienda
                </button>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-neon-blue" /></div>
            ) : stores.length === 0 ? (
                <div className="bg-dark-900/40 border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                    <ShoppingBag className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-3">Tu escaparate está vacío</h2>
                    <p className="text-dark-400 mb-8">Crea una tienda para empezar a vender tus propios productos por la web.</p>
                    <button onClick={() => setShowStoreModal(true)} className="bg-neon-blue text-dark-950 px-8 py-3 rounded-xl font-bold transition-all">Crear Tienda</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {stores.map(store => (
                        <div key={store.id} className="group relative bg-[#0f111a] border border-white/10 rounded-3xl p-6 transition-all hover:border-white/20 overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/5 blur-[100px] pointer-events-none" />

                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${store.type === 'NETWORK_MARKETING' ? 'bg-neon-blue/10 border-neon-blue/20' :
                                        store.type === 'GENERAL_BUSINESS' ? 'bg-neon-purple/10 border-neon-purple/20' :
                                            'bg-neon-green/10 border-neon-green/20'
                                        }`}>
                                        {store.type === 'NETWORK_MARKETING' ? <Globe className="text-neon-blue" /> :
                                            store.type === 'GENERAL_BUSINESS' ? <Store className="text-neon-purple" /> :
                                                <ShoppingCart className="text-neon-green" />}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditStore(store);
                                            setStoreName(store.name);
                                            setStoreSlug(store.slug);
                                            setStoreType(store.type);
                                            setStoreWhatsapp(store.whatsappNumber || '');
                                            setStoreQr(store.paymentQrUrl || '');
                                            setShowStoreModal(true);
                                        }}
                                        className="p-2 text-dark-500 hover:text-neon-blue transition-colors"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button onClick={() => deleteStore(store.id)} className="p-2 text-dark-500 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-[10px] text-dark-500 uppercase font-black block mb-1">Productos</span>
                                    <span className="text-xl font-bold">{store._count?.products || 0}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-[10px] text-dark-500 uppercase font-black block mb-1">Visibilidad</span>
                                    <span className={`text-sm font-bold ${store.active ? 'text-neon-green' : 'text-dark-500'}`}>
                                        {store.active ? 'Pública' : 'Borrador'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => openStoreProducts(store)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-neon-blue text-dark-950 rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-neon-blue/10 active:scale-95"
                                >
                                    <Package size={16} /> Gestionar Productos
                                </button>
                                <Link
                                    href={`/sh/${store.slug}`}
                                    target="_blank"
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                                >
                                    <ExternalLink size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showStoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[#0f111a] border border-white/10 rounded-3xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">{editStore ? 'Configurar Tienda' : 'Crear Tienda'}</h2>
                            <button onClick={() => setShowStoreModal(false)}><X size={24} className="text-dark-400" /></button>
                        </div>
                        <form onSubmit={handleSaveStore} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-4">Tipo de Tienda</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setStoreType('GENERAL_BUSINESS')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${storeType === 'GENERAL_BUSINESS'
                                            ? 'border-neon-purple bg-neon-purple/10 text-white shadow-[0_0_20px_rgba(var(--neon-purple-rgb),0.2)]'
                                            : 'border-white/5 bg-dark-900 text-dark-500 hover:border-white/10'
                                            }`}
                                    >
                                        <Store className={storeType === 'GENERAL_BUSINESS' ? 'text-neon-purple' : ''} size={24} />
                                        <div>
                                            <p className="font-bold text-sm">Mi Negocio</p>
                                            <p className="text-[10px] opacity-60">Venta General</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStoreType('NETWORK_MARKETING')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${storeType === 'NETWORK_MARKETING'
                                            ? 'border-neon-blue bg-neon-blue/10 text-white shadow-[0_0_20px_rgba(var(--neon-blue-rgb),0.2)]'
                                            : 'border-white/5 bg-dark-900 text-dark-500 hover:border-white/10'
                                            }`}
                                    >
                                        <Globe className={storeType === 'NETWORK_MARKETING' ? 'text-neon-blue' : ''} size={24} />
                                        <div>
                                            <p className="font-bold text-sm">Network Marketing</p>
                                            <p className="text-[10px] opacity-60">Sistema de Puntos</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Nombre</label>
                                <input required value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ej: Mi Boutique" className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">Slug (URL)</label>
                                <input required value={storeSlug} onChange={e => setStoreSlug(e.target.value)} placeholder="mi-boutique" className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">WhatsApp de Pedidos</label>
                                <input value={storeWhatsapp} onChange={e => setStoreWhatsapp(e.target.value)} placeholder="Ej: 51987654321 (con código de país)" className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:border-neon-blue outline-none transition-all" />
                                <p className="text-[10px] text-dark-500 mt-2">Los pedidos de esta tienda llegarán directamente a este número.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-dark-400 uppercase tracking-widest block mb-2">QR de Pago (Transferencia)</label>
                                <div className="flex items-center gap-4">
                                    {storeQr ? (
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
                                            <img src={storeQr} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setStoreQr('')}
                                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative w-20 h-20 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-[10px] font-bold text-dark-400 hover:border-neon-blue hover:text-neon-blue transition-all cursor-pointer">
                                            <input
                                                type="file"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    setUploading(true)
                                                    const formData = new FormData()
                                                    formData.append('file', file)
                                                    try {
                                                        const res = await fetch('/api/upload', { method: 'POST', body: formData })
                                                        const data = await res.json()
                                                        if (res.ok) setStoreQr(data.url)
                                                        else alert(data.error)
                                                    } catch (err) { alert('Error al subir QR') }
                                                    finally { setUploading(false) }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                            />
                                            {uploading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> QR</>}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-[10px] text-dark-500 leading-relaxed">
                                            Este QR se mostrará a los clientes que elijan pagar por transferencia en tu tienda.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-neon-blue text-dark-950 font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all">
                                {editStore ? 'Guardar Cambios' : 'Crear Tienda'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
