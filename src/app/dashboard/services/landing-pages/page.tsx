'use client'

import { useState, useEffect } from 'react'
import { Layout, Plus, Search, ExternalLink, Edit3, Trash2, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LandingPage {
    id: string
    name: string
    slug: string
    templateId: string
    active: boolean
    updatedAt: string
    _count: {
        leads: number
    }
}

export default function LandingPagesPage() {
    const [pages, setPages] = useState<LandingPage[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPages()
    }, [])

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/landing-pages')
            const data = await res.json()
            if (data.pages) setPages(data.pages)
        } catch (error) {
            console.error('Error fetching pages:', error)
        } finally {
            setLoading(false)
        }
    }

    const deletePage = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta página?')) return
        try {
            await fetch(`/api/landing-pages/${id}`, { method: 'DELETE' })
            setPages(pages.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting page:', error)
        }
    }

    return (
        <div className="px-4 sm:px-6 pt-6 max-w-screen-xl mx-auto pb-20 font-inter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#9B00FF]/10 flex items-center justify-center border border-[#9B00FF]/20 shadow-[0_0_20px_rgba(155,0,255,0.2)]">
                        <Layout className="w-6 h-6 text-[#9B00FF]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Mis Landing Pages</h1>
                        <p className="text-dark-400 text-sm mt-1">Crea y gestiona tus embudos de venta de alta conversión</p>
                    </div>
                </div>

                <Link href="/dashboard/services/landing-pages/create" className="bg-[#9B00FF] hover:bg-[#9B00FF]/90 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(155,0,255,0.3)] hover:scale-[1.02] active:scale-95">
                    <Plus size={20} />
                    Crear Nueva Landing
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#9B00FF] animate-spin" />
                    </div>
                ) : pages.length === 0 ? (
                    <div className="col-span-full bg-dark-900/50 border-2 border-dashed border-white/5 rounded-[32px] p-20 text-center">
                        <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Layout className="w-10 h-10 text-dark-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Aún no tienes Landing Pages</h2>
                        <p className="text-dark-400 mb-8 max-w-sm mx-auto">
                            Comienza creando tu primera página de aterrizaje profesional para capturar nuevos clientes.
                        </p>
                        <Link href="/dashboard/services/landing-pages/create" className="text-[#9B00FF] font-bold hover:underline">
                            Crea tu primera landing ahora
                        </Link>
                    </div>
                ) : (
                    pages.map((page) => (
                        <div key={page.id} className="bg-dark-900/50 border border-white/5 rounded-3xl p-6 hover:border-[#9B00FF]/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#9B00FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-dark-800 rounded-2xl flex items-center justify-center group-hover:bg-[#9B00FF]/10 transition-colors">
                                    <Layout className="w-6 h-6 text-dark-400 group-hover:text-[#9B00FF]" />
                                </div>
                                <div className="bg-[#00FF88]/10 text-[#00FF88] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#00FF88]/20">
                                    {page.active ? 'Activa' : 'Pausada'}
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white mb-1 truncate">{page.name}</h2>
                            <p className="text-dark-400 text-xs mb-6 font-mono">/lp/{page.slug}</p>

                            <div className="flex items-center gap-6 mb-8 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-dark-500 text-[10px] uppercase font-bold tracking-widest">Leads</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Users size={14} className="text-[#9B00FF]" />
                                        <span className="text-white font-bold">{page._count.leads}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-dark-500 text-[10px] uppercase font-bold tracking-widest">Template</span>
                                    <span className="text-white font-medium mt-0.5 capitalize">{page.templateId}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Link href={`/dashboard/services/landing-pages/${page.id}/edit`} className="bg-dark-800 hover:bg-dark-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm">
                                    <Edit3 size={16} />
                                    Editar
                                </Link>
                                <a href={`/lp/${page.slug}`} target="_blank" className="bg-dark-800 hover:bg-dark-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm">
                                    <ExternalLink size={16} />
                                    Ver
                                </a>
                                <button onClick={() => deletePage(page.id)} className="col-span-2 text-dark-500 hover:text-red-400 transition-colors text-xs font-medium py-2 flex items-center justify-center gap-2">
                                    <Trash2 size={12} />
                                    Eliminar permanentemente
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
