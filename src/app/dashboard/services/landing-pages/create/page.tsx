'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, ArrowRight, Sparkles, Loader2,
    Plus, Trash2, Eye, EyeOff, KeyRound,
    Palette, Video, ImageIcon, Check, Zap,
    Users, Briefcase, Target, Globe2
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Acceso & Campaña' },
    { id: 2, label: 'Tu Negocio' },
    { id: 3, label: 'Diseño & Contenido' },
    { id: 4, label: 'Revisar & Generar' },
]

const BUSINESS_TYPES = [
    { id: 'ecommerce', label: '🛍 E-commerce', desc: 'Tienda online / productos físicos' },
    { id: 'servicios', label: '🔧 Servicios', desc: 'Consultoria, diseño, reparación, etc.' },
    { id: 'coaching', label: '🎓 Coaching / Cursos', desc: 'Educación, mentoring, capacitación' },
    { id: 'salud', label: '💊 Salud & Bienestar', desc: 'Suplementos, cremas, clínicas' },
    { id: 'digital', label: '💻 Producto Digital', desc: 'Apps, plantillas, software, ebooks' },
    { id: 'inmobiliaria', label: '🏠 Inmobiliaria', desc: 'Propiedades, renta, construcción' },
    { id: 'restaurante', label: '🍽 Restaurante / Comida', desc: 'Delivery, catering, menú' },
    { id: 'otro', label: '📦 Otro', desc: 'Otro tipo de negocio' },
]

const AUDIENCES = [
    '👩 Mujeres adultas', '👨 Hombres adultos', '👴 Adultos mayores',
    '🧑‍💼 Emprendedores', '🏢 Empresas (B2B)', '🌎 Audiencia LATAM',
    '🇺🇸 Habla inglesa', '🎓 Estudiantes', '🏋️ Deportistas',
]

const TONE_CHIPS = [
    '🔥 Urgente y persuasivo', '😊 Cálido y cercano', '💼 Profesional y formal',
    '🎯 Directo al grano', '✨ Inspirador y motivacional', '🤝 Confianza y tranquilidad',
]

const SECTION_CHIPS = [
    '⭐ Testimonios de clientes', '⏳ Cuenta regresiva / oferta limitada',
    '📋 Garantía o devolución', '🔒 Seguridad y privacidad',
    '📦 Cómo funciona paso a paso', '📱 Botón de WhatsApp directo',
    '💰 Sección de precios', '🏆 Premios y certificaciones',
]

const LOADING_MSGS = [
    'Analizando tu negocio con IA...',
    'Creando el headline perfecto...',
    'Diseñando beneficios clave...',
    'Construyendo las secciones...',
    'Optimizando el copywriting...',
    'Ajustando tonos y colores...',
    'Finalizando tu landing page...',
]

const COLOR_PALETTES = [
    {
        id: 'cyan',
        name: 'Cian Neón',
        desc: 'Tecnología · Digital · Cripto',
        primary: '#00F5FF',
        secondary: '#00FF88',
    },
    {
        id: 'purple',
        name: 'Púrpura Galaxia',
        desc: 'Premium · Lujo · Coaching',
        primary: '#9B00FF',
        secondary: '#FF00CC',
    },
    {
        id: 'orange',
        name: 'Naranja Fuego',
        desc: 'Energía · Salud · Urgente',
        primary: '#FF6B00',
        secondary: '#FFD700',
    },
    {
        id: 'custom',
        name: 'Personalizado',
        desc: 'Elige tus propios colores',
        primary: '',
        secondary: '',
    },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateLandingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [mode, setMode] = useState<'select' | 'ai' | 'html'>('select')
    const [loading, setLoading] = useState(false)
    const [loadingIdx, setLoadingIdx] = useState(0)
    const [error, setError] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [selectedPalette, setSelectedPalette] = useState('cyan')

    // HTML mode state
    const [htmlForm, setHtmlForm] = useState({ name: '', slug: '', html: '' })
    const [htmlSaving, setHtmlSaving] = useState(false)

    const [form, setForm] = useState({
        openaiKey: '',
        name: '',
        slug: '',
        businessType: '',
        audience: [] as string[],
        description: '',
        goalStatement: '',
        tones: [] as string[],
        sections: [] as string[],
        instructions: '',
        primaryColor: '#00F5FF',
        secondaryColor: '#00FF88',
        videoUrl: '',
        buttonText: 'COMENZAR AHORA',
        buttonUrl: '',
    })
    const [imageUrls, setImageUrls] = useState<string[]>([''])

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
    const toggle = (k: 'audience' | 'tones' | 'sections', val: string) =>
        setForm(f => ({
            ...f,
            [k]: (f[k] as string[]).includes(val)
                ? (f[k] as string[]).filter(x => x !== val)
                : [...(f[k] as string[]), val]
        }))

    const applyPalette = (pid: string) => {
        setSelectedPalette(pid)
        const p = COLOR_PALETTES.find(p => p.id === pid)
        if (p && p.id !== 'custom') {
            set('primaryColor', p.primary)
            set('secondaryColor', p.secondary)
        }
    }

    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const canNext = () => {
        if (step === 1) return form.openaiKey.trim().length > 10 && form.name.trim().length > 0
        if (step === 2) return form.businessType !== '' && form.description.trim().length > 20
        if (step === 3) return true
        return true
    }

    const handleHtmlSave = async () => {
        if (!htmlForm.name || !htmlForm.html.trim()) {
            setError('El nombre y el código HTML son obligatorios.')
            return
        }
        setError('')
        setHtmlSaving(true)
        try {
            const res = await fetch('/api/landing-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: htmlForm.name,
                    slug: htmlForm.slug || slug(htmlForm.name),
                    templateId: 'raw-html',
                    sections: [{ id: 'raw-1', type: 'raw_html', content: { html: htmlForm.html }, styles: {} }],
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Error al guardar'); return }
            router.push(`/dashboard/services/landing-pages/${data.page.id}/edit`)
        } catch { setError('Error de conexión.') }
        finally { setHtmlSaving(false) }
    }

    const handleGenerate = async () => {
        setError('')
        setLoading(true)
        setLoadingIdx(0)
        const interval = setInterval(() => setLoadingIdx(i => (i + 1) % LOADING_MSGS.length), 2200)

        try {
            const combinedInstructions = [
                form.tones.length ? `Tono: ${form.tones.join(', ')}.` : '',
                form.sections.length ? `Secciones requeridas: ${form.sections.join(', ')}.` : '',
                form.goalStatement ? `Objetivo principal: ${form.goalStatement}.` : '',
                form.audience.length ? `Audiencia: ${form.audience.join(', ')}.` : '',
                form.instructions,
            ].filter(Boolean).join(' ')

            const genRes = await fetch('/api/landing-pages/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: form.description,
                    instructions: combinedInstructions,
                    openaiKey: form.openaiKey.trim(),
                    businessType: form.businessType,
                    primaryColor: form.primaryColor,
                    secondaryColor: form.secondaryColor,
                    videoUrl: form.videoUrl.trim(),
                    imageUrls: imageUrls.filter(u => u.trim()),
                    buttonUrl: form.buttonUrl.trim() || '#',
                    buttonText: form.buttonText || 'COMENZAR AHORA',
                }),
            })
            const genData = await genRes.json()
            if (!genRes.ok) { setError(genData.error || 'Error generando'); return }

            const createRes = await fetch('/api/landing-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    slug: form.slug || slug(form.name),
                    templateId: 'ndt-elite',
                    sections: genData.blocks,
                }),
            })
            const createData = await createRes.json()
            if (!createRes.ok) { setError(createData.error || 'Error al crear'); return }

            router.push(`/dashboard/services/landing-pages/${createData.page.id}/edit`)
        } catch { setError('Error de conexión. Intenta de nuevo.') }
        finally { clearInterval(interval); setLoading(false) }
    }

    // ── Mode selector screen ─────────────────────────────────────────────────
    if (mode === 'select') return (
        <div style={{ minHeight: '100vh', background: '#07080F', fontFamily: 'system-ui,sans-serif', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
            <Link href="/dashboard/services/landing-pages" style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: 13 }}>
                <ArrowLeft size={16} /> Volver
            </Link>

            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Sparkles size={24} color="#00F5FF" />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Nueva Landing Page</h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>¿Cómo quieres crear tu página?</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 640, width: '100%' }}>
                {/* AI option */}
                <button type="button" onClick={() => setMode('ai')} style={{
                    padding: 28, borderRadius: 20, cursor: 'pointer', textAlign: 'left', border: '1.5px solid rgba(0,245,255,0.2)',
                    background: 'linear-gradient(135deg, rgba(0,245,255,0.06), rgba(0,255,136,0.04))',
                    transition: 'all 0.2s',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,245,255,0.12)', border: '1px solid rgba(0,245,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Sparkles size={20} color="#00F5FF" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Generar con IA</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                        Describe tu negocio y la IA crea todo el contenido automáticamente con copywriting optimizado.
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#00F5FF' }}>
                        Wizard de 4 pasos <ArrowRight size={13} />
                    </div>
                </button>

                {/* HTML option */}
                <button type="button" onClick={() => setMode('html')} style={{
                    padding: 28, borderRadius: 20, cursor: 'pointer', textAlign: 'left', border: '1.5px solid rgba(255,165,0,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,165,0,0.06), rgba(255,100,0,0.04))',
                    transition: 'all 0.2s',
                }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,165,0,0.12)', border: '1px solid rgba(255,165,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 20 }}>{'</>'}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Ya tengo código HTML</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                        Pega tu código HTML y lo publicamos directamente. Ideal si ya tienes tu landing diseñada.
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#FFA500' }}>
                        Solo nombre + HTML <ArrowRight size={13} />
                    </div>
                </button>
            </div>
        </div>
    )

    // ── HTML mode form ───────────────────────────────────────────────────────
    if (mode === 'html') return (
        <div style={{ minHeight: '100vh', background: '#07080F', fontFamily: 'system-ui,sans-serif', color: '#fff' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, background: 'rgba(7,8,15,0.95)', backdropFilter: 'blur(20px)', zIndex: 50 }}>
                <button type="button" onClick={() => { setMode('select'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Subir código HTML</span>
            </div>

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
                {error && <div style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff7070' }}>⚠ {error}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Name + Slug */}
                    <Card>
                        <FieldLabel icon={<Target size={13} />} label="Nombre de la página" required />
                        <input
                            value={htmlForm.name}
                            onChange={e => {
                                const n = e.target.value
                                setHtmlForm(f => ({ ...f, name: n, slug: slug(n) }))
                            }}
                            placeholder="Ej: Landing Black Friday 2024"
                            style={inputSt}
                        />
                        <div style={{ marginTop: 12 }}>
                            <FieldLabel label="URL pública" hint="Generada automáticamente, puedes editarla" />
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                                <span style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.25)', fontSize: 12, borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)' }}>/lp/</span>
                                <input value={htmlForm.slug} onChange={e => setHtmlForm(f => ({ ...f, slug: slug(e.target.value) }))} placeholder="mi-landing" style={{ ...inputSt, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }} />
                            </div>
                        </div>
                    </Card>

                    {/* HTML code */}
                    <Card>
                        <FieldLabel label="Código HTML completo" required hint="Pega aquí el HTML completo de tu landing page (incluyendo <html>, <head>, <body> si quieres)" />
                        <textarea
                            value={htmlForm.html}
                            onChange={e => setHtmlForm(f => ({ ...f, html: e.target.value }))}
                            rows={20}
                            placeholder={'<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <title>Mi Landing</title>\n</head>\n<body>\n  <!-- Tu contenido aquí -->\n</body>\n</html>'}
                            style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6, fontFamily: '"Courier New", monospace', fontSize: 12, color: '#00FF88' }}
                            spellCheck={false}
                        />
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'right' }}>
                            {htmlForm.html.length.toLocaleString()} caracteres
                        </div>
                    </Card>

                    {/* Save button */}
                    <button type="button" onClick={handleHtmlSave} disabled={htmlSaving || !htmlForm.name || !htmlForm.html.trim()} style={{
                        width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: (!htmlForm.name || !htmlForm.html.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #FFA500, #FF6B00)',
                        color: (!htmlForm.name || !htmlForm.html.trim()) ? 'rgba(255,255,255,0.2)' : '#000',
                        fontSize: 13, fontWeight: 800, letterSpacing: '0.07em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}>
                        {htmlSaving ? <><Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} /> Guardando...</> : <>📄 Publicar mi HTML</>}
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    // ── Loading screen ─────────────────────────────────────────────────────
    if (loading) return (
        <div style={{
            position: 'fixed', inset: 0, background: '#050505', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
        }}>
            <div style={{ position: 'absolute', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: `${form.primaryColor}10`, filter: 'blur(100px)' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: `${form.secondaryColor}10`, filter: 'blur(80px)' }} />
            <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 28px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: `2px solid ${form.primaryColor}20`, borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', inset: 0, border: `2px solid transparent`, borderTopColor: form.primaryColor, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 8, border: `2px solid transparent`, borderTopColor: form.secondaryColor, borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
                    <Sparkles size={18} color={form.primaryColor} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                </div>
                <p style={{ color: form.primaryColor, fontSize: 10, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 10 }}>IA GENERANDO TU LANDING</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>{LOADING_MSGS[loadingIdx]}</p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {LOADING_MSGS.map((_, i) => (
                        <div key={i} style={{ height: 4, borderRadius: 9999, transition: 'all 0.35s', width: i === loadingIdx ? 22 : 6, background: i === loadingIdx ? form.primaryColor : 'rgba(255,255,255,0.12)' }} />
                    ))}
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    // ── Main layout ─────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#07080F', fontFamily: 'system-ui,sans-serif', color: '#fff' }}>

            {/* Header bar */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,8,15,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/dashboard/services/landing-pages" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}>
                    <ArrowLeft size={16} />
                </Link>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${form.primaryColor}15`, border: `1px solid ${form.primaryColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={15} color={form.primaryColor} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Crear Landing con IA</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>Paso {step} de {STEPS.length}</div>
                    </div>
                </div>

                {/* Step progress */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {STEPS.map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 800, transition: 'all 0.3s',
                                background: step > s.id ? form.primaryColor : step === s.id ? `${form.primaryColor}20` : 'rgba(255,255,255,0.04)',
                                color: step > s.id ? '#000' : step === s.id ? form.primaryColor : 'rgba(255,255,255,0.25)',
                                border: step >= s.id ? `1.5px solid ${form.primaryColor}` : '1.5px solid rgba(255,255,255,0.08)',
                            }}>
                                {step > s.id ? <Check size={12} strokeWidth={3} /> : s.id}
                            </div>
                            {i < STEPS.length - 1 && <div style={{ width: 24, height: 1.5, borderRadius: 9999, background: step > s.id ? form.primaryColor : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 100px' }}>

                {/* Step label */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: form.primaryColor, textTransform: 'uppercase', marginBottom: 6 }}>
                        Paso {step} — {STEPS[step - 1].label}
                    </div>
                    <div style={{ height: 2, width: 40, borderRadius: 9999, background: `linear-gradient(90deg, ${form.primaryColor}, ${form.secondaryColor})` }} />
                </div>

                {/* Error banner */}
                {error && <div style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff7070', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span>⚠</span>{error}
                </div>}

                {/* ── STEP 1 ─────────────────────────────────────────────── */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* API Key */}
                        <Card accent={form.primaryColor}>
                            <FieldLabel icon={<KeyRound size={13} />} label="API Key de OpenAI" required hint={<>Necesaria para generar el contenido con IA. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: form.primaryColor }}>Obtener key →</a></>} />
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={form.openaiKey}
                                    onChange={e => set('openaiKey', e.target.value)}
                                    placeholder="sk-proj-..."
                                    style={{ ...inputSt, paddingRight: 44, fontFamily: 'monospace', letterSpacing: form.openaiKey && !showKey ? '0.1em' : 'normal' }}
                                />
                                <button type="button" onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {form.openaiKey.length > 5 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: form.openaiKey.startsWith('sk-') ? '#00FF88' : '#ff7070' }} />
                                    <span style={{ color: form.openaiKey.startsWith('sk-') ? '#00FF88' : '#ff7070' }}>
                                        {form.openaiKey.startsWith('sk-') ? 'Formato válido' : 'Debe comenzar con sk-'}
                                    </span>
                                </div>
                            )}
                        </Card>

                        {/* Name + Slug */}
                        <Card>
                            <FieldLabel icon={<Target size={13} />} label="Nombre de la campaña" required />
                            <input
                                value={form.name}
                                onChange={e => { set('name', e.target.value); set('slug', slug(e.target.value)) }}
                                placeholder="Ej: Cremas Naturales Bolivia 2024"
                                style={inputSt}
                            />
                            <div style={{ marginTop: 12 }}>
                                <FieldLabel label="URL pública" hint="Se genera automáticamente, puedes editarla" />
                                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                                    <span style={{ padding: '11px 14px', color: 'rgba(255,255,255,0.25)', fontSize: 12, borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)' }}>/lp/</span>
                                    <input
                                        value={form.slug}
                                        onChange={e => set('slug', slug(e.target.value))}
                                        placeholder="mi-landing-2024"
                                        style={{ ...inputSt, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                                    />
                                </div>
                            </div>
                        </Card>

                    </div>
                )}

                {/* ── STEP 2 ─────────────────────────────────────────────── */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Business type */}
                        <Card>
                            <FieldLabel icon={<Briefcase size={13} />} label="Tipo de negocio" required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {BUSINESS_TYPES.map(bt => (
                                    <button key={bt.id} type="button" onClick={() => set('businessType', bt.id)} style={{
                                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                        background: form.businessType === bt.id ? `${form.primaryColor}15` : 'rgba(255,255,255,0.03)',
                                        border: form.businessType === bt.id ? `1.5px solid ${form.primaryColor}` : '1.5px solid rgba(255,255,255,0.07)',
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{bt.label}</div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{bt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* Target audience */}
                        <Card>
                            <FieldLabel icon={<Users size={13} />} label="Audiencia objetivo" hint="Selecciona todas las que apliquen" />
                            <ChipGroup items={AUDIENCES} active={form.audience} onToggle={v => toggle('audience', v)} color={form.primaryColor} />
                        </Card>

                        {/* Description */}
                        <Card>
                            <FieldLabel icon={<Globe2 size={13} />} label="Descripción del negocio y producto" required hint="Cuanto más detallado, mejor será el resultado" />
                            <textarea
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                rows={6}
                                placeholder="Ej: Vendo cremas naturales para eliminar manchas y melasma. Mi producto es 100% natural sin químicos agresivos. El precio es $35 con envío a toda Bolivia. Tengo más de 200 clientas satisfechas. Incluyo guía de uso gratis con cada compra. El proceso es simple: pedido por WhatsApp → pago → envío en 24h..."
                                style={{ ...inputSt, resize: 'vertical', lineHeight: 1.75 }}
                            />
                            <div style={{ fontSize: 10, color: form.description.length > 500 ? form.secondaryColor : 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: 6 }}>
                                {form.description.length} caracteres {form.description.length < 100 ? '— mínimo recomendado: 100' : '✓'}
                            </div>
                        </Card>

                        {/* Goal */}
                        <Card>
                            <FieldLabel label="¿Cuál es el objetivo principal de la página?" hint="Ej: Capturar leads, vender directamente, agendar llamadas..." />
                            <input
                                value={form.goalStatement}
                                onChange={e => set('goalStatement', e.target.value)}
                                placeholder="Ej: Lograr que el visitante contacte por WhatsApp para comprar"
                                style={inputSt}
                            />
                        </Card>

                    </div>
                )}

                {/* ── STEP 3 ─────────────────────────────────────────────── */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Tone & sections */}
                        <Card>
                            <FieldLabel icon={<Zap size={13} />} label="Tono del copywriting" hint="Elige uno o varios" />
                            <ChipGroup items={TONE_CHIPS} active={form.tones} onToggle={v => toggle('tones', v)} color={form.primaryColor} />

                            <div style={{ marginTop: 20 }}>
                                <FieldLabel label="Secciones adicionales a incluir" hint="La IA añadirá estas secciones automáticamente" />
                                <ChipGroup items={SECTION_CHIPS} active={form.sections} onToggle={v => toggle('sections', v)} color={form.secondaryColor} />
                            </div>

                            <div style={{ marginTop: 20 }}>
                                <FieldLabel label="Instrucciones adicionales libres" hint="Cualquier detalle extra que quieras comunicarle a la IA" />
                                <textarea
                                    value={form.instructions}
                                    onChange={e => set('instructions', e.target.value)}
                                    rows={3}
                                    placeholder="Ej: El título debe mencionar 'sin rebote', la garantía es de 30 días, quiero que el CTA vaya directo a WhatsApp..."
                                    style={{ ...inputSt, resize: 'vertical', lineHeight: 1.7 }}
                                />
                            </div>
                        </Card>

                        {/* Colors */}
                        <Card>
                            <FieldLabel icon={<Palette size={13} />} label="Paleta de colores" hint="Elige un tema o selecciona Personalizado para tus propios colores" />

                            {/* 3 preset palettes + custom */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                {COLOR_PALETTES.map(p => {
                                    const isActive = selectedPalette === p.id
                                    const gradBg = p.primary && p.secondary
                                        ? `linear-gradient(135deg, ${p.primary}30, ${p.secondary}20)`
                                        : 'rgba(255,255,255,0.03)'
                                    const borderColor = isActive
                                        ? (p.primary || form.primaryColor)
                                        : 'rgba(255,255,255,0.07)'
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => applyPalette(p.id)}
                                            style={{
                                                padding: '14px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                                                background: isActive ? gradBg : 'rgba(255,255,255,0.03)',
                                                border: `1.5px solid ${borderColor}`,
                                                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                                            }}
                                        >
                                            {/* Color swatches */}
                                            {p.primary && (
                                                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: p.primary, boxShadow: `0 0 10px ${p.primary}60` }} />
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: p.secondary, boxShadow: `0 0 10px ${p.secondary}60` }} />
                                                </div>
                                            )}
                                            {!p.primary && (
                                                <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: form.primaryColor || '#555' }} />
                                                    <div style={{ width: 20, height: 20, borderRadius: 6, background: form.secondaryColor || '#888' }} />
                                                </div>
                                            )}
                                            <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>{p.name}</div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{p.desc}</div>
                                            {isActive && (
                                                <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: p.primary || form.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={10} strokeWidth={3} color="#000" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Custom fine-tune: only show if 'custom' selected */}
                            {selectedPalette === 'custom' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                    {[
                                        { k: 'primaryColor', label: 'Color Primario', sub: 'Botones, acentos' },
                                        { k: 'secondaryColor', label: 'Color Secundario', sub: 'Gradientes' },
                                    ].map(c => (
                                        <div key={c.k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <label style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: (form as any)[c.k], boxShadow: `0 0 14px ${(form as any)[c.k]}50` }} />
                                                <input type="color" value={(form as any)[c.k]} onChange={e => set(c.k, e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                                            </label>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{c.label}</div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{c.sub}</div>
                                                <div style={{ fontFamily: 'monospace', fontSize: 10, color: (form as any)[c.k], marginTop: 2 }}>{(form as any)[c.k]}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Live gradient preview bar */}
                            <div style={{ height: 6, borderRadius: 9999, background: `linear-gradient(90deg, ${form.primaryColor}, ${form.secondaryColor})`, boxShadow: `0 0 18px ${form.primaryColor}40` }} />
                        </Card>


                        {/* CTA Button */}
                        <Card>
                            <FieldLabel label="Botón de acción (CTA)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Texto del botón</div>
                                    <input
                                        value={form.buttonText}
                                        onChange={e => set('buttonText', e.target.value)}
                                        placeholder="COMENZAR AHORA"
                                        style={inputSt}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>URL destino (WhatsApp, Stripe, etc.)</div>
                                    <input
                                        value={form.buttonUrl}
                                        onChange={e => set('buttonUrl', e.target.value)}
                                        placeholder="https://wa.me/591..."
                                        style={inputSt}
                                    />
                                </div>
                            </div>
                            {/* Preview */}
                            {form.buttonText && (
                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Vista previa:</span>
                                    <div style={{ padding: '7px 18px', borderRadius: 8, background: form.primaryColor, color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {form.buttonText}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Media */}
                        <Card>
                            <FieldLabel icon={<Video size={13} />} label="Video de YouTube (opcional)" />
                            <input
                                value={form.videoUrl}
                                onChange={e => set('videoUrl', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                style={inputSt}
                            />

                            <div style={{ marginTop: 20 }}>
                                <FieldLabel icon={<ImageIcon size={13} />} label="URLs de imágenes (opcional)" hint="La primera imagen aparecerá en el hero" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {imageUrls.map((url, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                value={url}
                                                onChange={e => { const n = [...imageUrls]; n[i] = e.target.value; setImageUrls(n) }}
                                                placeholder={`URL imagen ${i + 1}`}
                                                style={{ ...inputSt, flex: 1 }}
                                            />
                                            {imageUrls.length > 1 && (
                                                <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))} style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'center' }}>
                                                    <Trash2 size={13} color="rgba(255,100,100,0.7)" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setImageUrls([...imageUrls, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                                        <Plus size={12} /> Añadir imagen
                                    </button>
                                </div>
                            </div>
                        </Card>

                    </div>
                )}

                {/* ── STEP 4 ─────────────────────────────────────────────── */}
                {step === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        <Card>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Resumen de configuración</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { label: '🗝 API Key', value: form.openaiKey ? `sk-...${form.openaiKey.slice(-6)}` : '—' },
                                    { label: '📋 Campaña', value: form.name || '—' },
                                    { label: '🌐 URL', value: form.slug ? `/lp/${form.slug}` : '—' },
                                    { label: '🏢 Negocio', value: BUSINESS_TYPES.find(b => b.id === form.businessType)?.label || '—' },
                                    { label: '👥 Audiencia', value: form.audience.join(', ') || '—' },
                                    { label: '🎯 Objetivo', value: form.goalStatement || '—' },
                                    { label: '🎨 Color primario', value: form.primaryColor },
                                    { label: '✨ Color secundario', value: form.secondaryColor },
                                    { label: '🔘 Botón', value: form.buttonText ? `"${form.buttonText}" → ${form.buttonUrl || '#'}` : '—' },
                                    { label: '🎬 Video', value: form.videoUrl || '—' },
                                    { label: '🖼 Imágenes', value: imageUrls.filter(Boolean).length > 0 ? `${imageUrls.filter(Boolean).length} imagen(es)` : '—' },
                                    { label: '🎭 Tono', value: form.tones.join(', ') || '—' },
                                    { label: '📐 Secciones extra', value: form.sections.join(', ') || '—' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', minWidth: 130 }}>{r.label}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: r.value === '—' ? 'rgba(255,255,255,0.2)' : '#fff' }}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div style={{ background: `linear-gradient(135deg, ${form.primaryColor}08, ${form.secondaryColor}08)`, border: `1px solid ${form.primaryColor}20`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                            <Sparkles size={20} color={form.primaryColor} style={{ marginBottom: 10 }} />
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Todo listo para generar</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>GPT-4o-mini analizará tu negocio y creará una landing page futurista optimizada para conversión</div>
                        </div>

                    </div>
                )}

                {/* ── Navigation ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 12, marginTop: 36, position: 'sticky', bottom: 24 }}>
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(s => s - 1)} style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ArrowLeft size={16} /> Anterior
                        </button>
                    )}

                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={() => canNext() && setStep(s => s + 1)}
                            disabled={!canNext()}
                            style={{
                                flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed',
                                background: canNext() ? `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` : 'rgba(255,255,255,0.04)',
                                color: canNext() ? '#000' : 'rgba(255,255,255,0.2)',
                                fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.25s',
                            }}
                        >
                            Siguiente <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={loading}
                            style={{
                                flex: 1, padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
                                color: '#000', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                boxShadow: `0 0 40px ${form.primaryColor}30`, transition: 'all 0.25s',
                            }}
                        >
                            <Sparkles size={18} /> GENERAR LANDING CON IA
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, accent }: { children: React.ReactNode, accent?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${accent ? accent + '25' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 16, padding: 22,
        }}>
            {children}
        </div>
    )
}

function FieldLabel({ icon, label, required, hint }: { icon?: React.ReactNode, label: React.ReactNode, required?: boolean, hint?: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: hint ? 4 : 0 }}>
                {icon && <span style={{ color: 'rgba(255,255,255,0.4)' }}>{icon}</span>}
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                {required && <span style={{ fontSize: 11, color: '#ff7070' }}>*</span>}
            </div>
            {hint && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>{hint}</div>}
        </div>
    )
}

function ChipGroup({ items, active, onToggle, color }: { items: string[], active: string[], onToggle: (v: string) => void, color: string }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {items.map(item => {
                const on = active.includes(item)
                return (
                    <button key={item} type="button" onClick={() => onToggle(item)} style={{
                        padding: '7px 14px', borderRadius: 9999, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s',
                        background: on ? color : 'rgba(255,255,255,0.05)',
                        color: on ? '#000' : 'rgba(255,255,255,0.45)',
                        outline: on ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                        {on && <Check size={10} strokeWidth={3} style={{ display: 'inline', marginRight: 4 }} />}
                        {item}
                    </button>
                )
            })}
        </div>
    )
}

const inputSt: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
}
