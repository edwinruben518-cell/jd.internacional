'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Upload, X, Loader2, AlertCircle, CheckCircle2,
    Clock, Calendar, Users, Sparkles, Image as ImageIcon, Film,
    Pencil, Trash2, Plus, Phone, FileText, ChevronDown, Mic, Wifi, Smartphone
} from 'lucide-react'

interface ContactEntry {
    phone: string
    name: string | null
}

interface CrmTemplate {
    id: string
    name: string
    description: string | null
    content: string
    usageCount: number
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white/[0.025] border border-white/8 rounded-2xl p-5 ${className}`}>
            {children}
        </div>
    )
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                {icon}
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">{children}</p>
        </div>
    )
}

export default function NewCrmCampaignPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)
    const excelInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        name: '',
        prompt: '',
        messageExample: '',
        delayValue: '30',
        delayUnit: 'seconds',
        scheduledAt: '',
    })
    const [channelType, setChannelType] = useState<'BAILEYS' | 'WHATSAPP_CLOUD'>('BAILEYS')
    const [waCloudBots, setWaCloudBots] = useState<{ id: string; name: string }[]>([])
    const [selectedBotId, setSelectedBotId] = useState('')
    const [waMessageMode, setWaMessageMode] = useState<'ai' | 'template'>('ai')
    const [waTemplates, setWaTemplates] = useState<{ name: string; status: string; bodyText: string; language: string }[]>([])
    const [loadingWaTemplates, setLoadingWaTemplates] = useState(false)
    const [selectedTemplateName, setSelectedTemplateName] = useState('')
    const [selectedTemplateLanguage, setSelectedTemplateLanguage] = useState('es')
    const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; type: 'IMAGE' | 'VIDEO' }[]>([])
    const [audioFiles, setAudioFiles] = useState<{ file: File; name: string }[]>([])

    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const [recordingSeconds, setRecordingSeconds] = useState(0)
    const [audioError, setAudioError] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [contacts, setContacts] = useState<ContactEntry[]>([])
    const [excelFile, setExcelFile] = useState<File | null>(null)
    const [parsingExcel, setParsingExcel] = useState(false)
    const [templates, setTemplates] = useState<CrmTemplate[]>([])
    const [showTemplates, setShowTemplates] = useState(false)
    const [editingIdx, setEditingIdx] = useState<number | null>(null)
    const [editPhone, setEditPhone] = useState('')
    const [editName, setEditName] = useState('')
    const [showAddContact, setShowAddContact] = useState(false)
    const [newPhone, setNewPhone] = useState('')
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploadingImg, setUploadingImg] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { fetchTemplates(); fetchWaCloudBots() }, [])

    async function fetchWaCloudBots() {
        try {
            const res = await fetch('/api/bots')
            if (res.ok) {
                const data = await res.json()
                const bots = (data.bots ?? []).filter((b: any) => b.type === 'WHATSAPP_CLOUD')
                setWaCloudBots(bots.map((b: any) => ({ id: b.id, name: b.name })))
            }
        } catch { setWaCloudBots([]) }
    }

    async function fetchWaTemplates(botId: string) {
        setLoadingWaTemplates(true)
        setWaTemplates([])
        setSelectedTemplateName('')
        setSelectedTemplateLanguage('es')
        try {
            const res = await fetch(`/api/bots/${botId}/wa-templates`)
            if (res.ok) {
                const data = await res.json()
                const EXCLUDED = ['REJECTED', 'DELETED', 'PENDING_DELETION']
                const approved = (data.templates ?? [])
                    .filter((t: any) => !EXCLUDED.includes(t.status))
                    .map((t: any) => ({
                        name: t.name,
                        status: t.status,
                        language: t.language ?? 'es',
                        bodyText: t.components?.find((c: any) => c.type === 'BODY')?.text ?? '',
                    }))
                setWaTemplates(approved)
            }
        } catch { setWaTemplates([]) }
        finally { setLoadingWaTemplates(false) }
    }

    async function fetchTemplates() {
        try {
            const res = await fetch('/api/crm/templates')
            const data = await res.json()
            setTemplates(data.templates || [])
        } catch { setTemplates([]) }
    }

    function applyTemplate(t: CrmTemplate) {
        setForm(f => ({ ...f, prompt: t.content }))
        setShowTemplates(false)
        fetch(`/api/crm/templates/${t.id}/use`, { method: 'POST' }).catch(() => {})
    }

    function isVideoFile(file: File): boolean {
        return file.type.startsWith('video/')
    }

    function handleAudioSelect(files: FileList | null) {
        if (!files) return
        const selected = Array.from(files).filter(f => f.type.startsWith('audio/'))
        setAudioFiles(prev => [...prev, ...selected.map(file => ({ file, name: file.name }))])
    }

    function removeAudio(index: number) {
        setAudioFiles(prev => prev.filter((_, i) => i !== index))
    }

    async function startRecordingAudio() {
        setAudioError(null)
        if (!navigator.mediaDevices?.getUserMedia) {
            setAudioError('Grabación no disponible. Usá Chrome/Firefox en HTTPS.')
            return
        }
        let stream: MediaStream
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (err: unknown) {
            const name = err instanceof Error ? err.name : ''
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setAudioError('Permiso de micrófono denegado. Habilitalo desde la barra del navegador.')
            } else if (name === 'NotFoundError') {
                setAudioError('No se encontró ningún micrófono en este dispositivo.')
            } else {
                setAudioError('No se pudo acceder al micrófono: ' + (err instanceof Error ? err.message : String(err)))
            }
            return
        }
        try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                    ? 'audio/ogg;codecs=opus'
                    : 'audio/webm'
            const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
            const mr = new MediaRecorder(stream, { mimeType })
            audioChunksRef.current = []
            mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            mr.onstop = () => {
                stream.getTracks().forEach(t => t.stop())
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
                const blob = new Blob(audioChunksRef.current, { type: mimeType })
                const file = new File([blob], `nota-voz-${Date.now()}.${ext}`, { type: mimeType.split(';')[0] })
                setAudioFiles(prev => [...prev, { file, name: file.name }])
                setIsRecordingAudio(false)
                setRecordingSeconds(0)
            }
            mr.start(100)
            mediaRecorderRef.current = mr
            setIsRecordingAudio(true)
            setRecordingSeconds(0)
            recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
        } catch (err: unknown) {
            stream.getTracks().forEach(t => t.stop())
            setAudioError('Error al iniciar grabación: ' + (err instanceof Error ? err.message : String(err)))
        }
    }

    function stopRecordingAudio() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        setIsRecordingAudio(false)
        setRecordingSeconds(0)
    }

    function handleMediaSelect(files: FileList | null) {
        if (!files) return
        const selected = Array.from(files)
        const newMedia = selected.map(file => ({
            file,
            preview: isVideoFile(file) ? '' : URL.createObjectURL(file),
            type: (isVideoFile(file) ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
        }))
        setMediaFiles(prev => [...prev, ...newMedia])
    }

    function removeMedia(index: number) {
        setMediaFiles(prev => {
            if (prev[index].preview) URL.revokeObjectURL(prev[index].preview)
            return prev.filter((_, i) => i !== index)
        })
    }

    async function handleExcelSelect(files: FileList | null) {
        if (!files?.[0]) return
        const file = files[0]
        setExcelFile(file)
        setContacts([])
        setParsingExcel(true)
        try {
            const XLSX = await import('xlsx')
            const buffer = await file.arrayBuffer()
            const wb = XLSX.read(buffer, { type: 'array' })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
            if (rows.length < 2) { setParsingExcel(false); return }
            const headers = rows[0].map((h: any) => String(h).toLowerCase().trim())
            const phoneIdx = headers.findIndex((h: string) => /tel[eé]f|phone|cel|m[oó]vil|n[uú]mero|numero|whatsapp/.test(h))
            const nameIdx = headers.findIndex((h: string) => /nombre|name/.test(h))
            const parsed: ContactEntry[] = []
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i]
                let phone = phoneIdx >= 0 ? String(row[phoneIdx] ?? '').replace(/\s+/g, '') : ''
                if (!phone) {
                    for (const cell of row) {
                        const s = String(cell ?? '').replace(/\s+/g, '')
                        if (/^\+?\d{7,15}$/.test(s)) { phone = s; break }
                    }
                }
                if (!phone) continue
                if (/^[67]\d{7}$/.test(phone)) phone = '+591' + phone
                else if (/^\d{8}$/.test(phone) && /^[67]/.test(phone)) phone = '+591' + phone
                if (!/^\+/.test(phone)) phone = '+' + phone
                const name = nameIdx >= 0 ? (String(row[nameIdx] ?? '').trim() || null) : null
                parsed.push({ phone, name })
            }
            setContacts(parsed)
        } catch { /* silent */ }
        finally { setParsingExcel(false) }
    }

    function startEdit(idx: number) {
        setEditingIdx(idx)
        setEditPhone(contacts[idx].phone)
        setEditName(contacts[idx].name || '')
    }

    function saveEdit() {
        if (editingIdx === null || !editPhone.trim()) return
        setContacts(prev => prev.map((c, i) =>
            i === editingIdx ? { phone: editPhone.trim(), name: editName.trim() || null } : c
        ))
        setEditingIdx(null)
    }

    function deleteContact(idx: number) {
        setContacts(prev => prev.filter((_, i) => i !== idx))
    }

    function addManualContact() {
        if (!newPhone.trim()) return
        let phone = newPhone.trim().replace(/\s+/g, '')
        if (/^[67]\d{7}$/.test(phone)) phone = '+591' + phone
        if (!/^\+/.test(phone)) phone = '+' + phone
        setContacts(prev => [...prev, { phone, name: newName.trim() || null }])
        setNewPhone('')
        setNewName('')
        setShowAddContact(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        const isTemplateMode = channelType === 'WHATSAPP_CLOUD' && waMessageMode === 'template'
        if (!isTemplateMode && mediaFiles.length === 0 && audioFiles.length === 0) { setError('Agrega al menos 1 archivo (imagen, video o audio)'); return }
        if (isTemplateMode && !selectedTemplateName) { setError('Seleccioná un template de WhatsApp'); return }
        if (contacts.length === 0) { setError('Agrega contactos (desde Excel o manualmente)'); return }
        if (channelType === 'WHATSAPP_CLOUD' && !selectedBotId) { setError('Seleccioná un bot de WhatsApp Cloud'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/crm/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    channelType,
                    ...(channelType === 'WHATSAPP_CLOUD' && { botId: selectedBotId }),
                    ...(channelType === 'WHATSAPP_CLOUD' && waMessageMode === 'template' && selectedTemplateName && {
                        templateName: selectedTemplateName,
                        templateLanguage: selectedTemplateLanguage,
                    }),
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error); return }
            const campaignId = data.campaign.id
            setUploadingImg(true)
            const failedFiles: string[] = []
            const allFilesToUpload = [...mediaFiles.map(m => m.file), ...audioFiles.map(a => a.file)]
            for (const file of allFilesToUpload) {
                const fd = new FormData()
                fd.append('file', file)
                const mediaRes = await fetch(`/api/crm/campaigns/${campaignId}/images`, { method: 'POST', body: fd })
                if (!mediaRes.ok) {
                    const mediaData = await mediaRes.json()
                    failedFiles.push(mediaData.error || file.name)
                }
            }
            setUploadingImg(false)
            if (failedFiles.length > 0) { setError(`Error subiendo archivos: ${failedFiles.join(', ')}`); return }
            if (excelFile) {
                const excelFd = new FormData()
                excelFd.append('file', excelFile)
                const excelRes = await fetch(`/api/crm/campaigns/${campaignId}/contacts`, { method: 'POST', body: excelFd })
                if (!excelRes.ok) { const d = await excelRes.json(); setError(d.error); return }
            } else {
                const contactRes = await fetch(`/api/crm/campaigns/${campaignId}/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phones: contacts.map(c => c.phone) }),
                })
                if (!contactRes.ok) { const d = await contactRes.json(); setError(d.error); return }
            }
            router.push(`/dashboard/crm/${campaignId}`)
        } catch { setError('Error de conexión') }
        finally { setLoading(false); setUploadingImg(false) }
    }

    const imageCount = mediaFiles.filter(m => m.type === 'IMAGE').length
    const videoCount = mediaFiles.filter(m => m.type === 'VIDEO').length
    const audioCount = audioFiles.length
    const isTemplateMode = channelType === 'WHATSAPP_CLOUD' && waMessageMode === 'template'

    return (
        <div className="px-4 md:px-6 pt-6 max-w-2xl mx-auto pb-24 text-white">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/crm"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/50 hover:text-white"
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500/50 mb-0.5">CRM Broadcast</p>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Nueva campaña</h1>
                </div>
            </div>

            {error && (
                <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="font-bold text-red-400/60 hover:text-red-400">✕</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Nombre ── */}
                <SectionCard>
                    <SectionLabel icon={<FileText size={12} />}>Nombre de la campaña</SectionLabel>
                    <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ej: Promo Navidad 2025"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
                    />
                </SectionCard>

                {/* ── Canal ── */}
                <SectionCard>
                    <SectionLabel icon={<Wifi size={12} />}>Canal de envío</SectionLabel>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setChannelType('BAILEYS')}
                            className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-all text-left ${channelType === 'BAILEYS' ? 'border-cyan-500/50 bg-cyan-500/8' : 'border-white/8 bg-white/3 hover:border-white/15'}`}
                        >
                            <span className="text-sm font-black text-white flex items-center gap-1.5">
                                <Smartphone size={13} className={channelType === 'BAILEYS' ? 'text-cyan-400' : 'text-white/30'} />
                                QR Baileys
                            </span>
                            <span className="text-[11px] text-white/35">Conectá tu número por QR</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setChannelType('WHATSAPP_CLOUD')}
                            className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-all text-left ${channelType === 'WHATSAPP_CLOUD' ? 'border-green-500/50 bg-green-500/8' : 'border-white/8 bg-white/3 hover:border-white/15'}`}
                        >
                            <span className="text-sm font-black text-white flex items-center gap-1.5">
                                <Wifi size={13} className={channelType === 'WHATSAPP_CLOUD' ? 'text-green-400' : 'text-white/30'} />
                                WA Cloud API
                            </span>
                            <span className="text-[11px] text-white/35">API oficial de Meta</span>
                        </button>
                    </div>

                    {channelType === 'WHATSAPP_CLOUD' && (
                        <div className="mt-4 pt-4 border-t border-white/6">
                            {waCloudBots.length === 0 ? (
                                <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-cyan-400">
                                        No tenés bots Cloud configurados.{' '}
                                        <Link href="/dashboard/services/whatsapp" className="underline font-bold">Crear uno →</Link>
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-white/25 uppercase font-black tracking-widest mb-2">Seleccioná el bot</p>
                                    {waCloudBots.map(bot => (
                                        <button
                                            key={bot.id}
                                            type="button"
                                            onClick={() => { setSelectedBotId(bot.id); fetchWaTemplates(bot.id) }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${selectedBotId === bot.id ? 'border-green-500/40 bg-green-500/8 text-green-400' : 'border-white/8 bg-white/3 text-white/50 hover:text-white hover:border-white/15'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Wifi size={12} className={selectedBotId === bot.id ? 'text-green-400' : 'text-white/20'} />
                                                <span className="text-xs font-bold">{bot.name}</span>
                                            </div>
                                            {selectedBotId === bot.id && <CheckCircle2 size={13} className="text-green-400" />}
                                        </button>
                                    ))}

                                    {selectedBotId && (
                                        <div className="mt-4 pt-3 border-t border-white/6">
                                            <p className="text-[10px] text-white/25 uppercase font-black tracking-widest mb-2">Tipo de mensaje</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button type="button" onClick={() => setWaMessageMode('ai')}
                                                    className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-all text-left ${waMessageMode === 'ai' ? 'border-cyan-500/50 bg-cyan-500/8' : 'border-white/8 bg-white/3 hover:border-white/15'}`}>
                                                    <span className="text-xs font-black text-white flex items-center gap-1.5"><Sparkles size={11} className="text-cyan-400" /> IA genera texto</span>
                                                    <span className="text-[10px] text-white/30">Único por contacto</span>
                                                </button>
                                                <button type="button" onClick={() => setWaMessageMode('template')}
                                                    className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-all text-left ${waMessageMode === 'template' ? 'border-green-500/50 bg-green-500/8' : 'border-white/8 bg-white/3 hover:border-white/15'}`}>
                                                    <span className="text-xs font-black text-white flex items-center gap-1.5"><FileText size={11} className="text-green-400" /> Template Meta</span>
                                                    <span className="text-[10px] text-white/30">Cualquier número</span>
                                                </button>
                                            </div>

                                            {waMessageMode === 'template' && (
                                                <div className="mt-3">
                                                    {loadingWaTemplates ? (
                                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5">
                                                            <Loader2 size={13} className="animate-spin text-white/30" />
                                                            <span className="text-xs text-white/30">Cargando templates...</span>
                                                        </div>
                                                    ) : waTemplates.length === 0 ? (
                                                        <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
                                                            <p className="text-[11px] text-cyan-400">Sin templates aprobados. <Link href={`/dashboard/services/whatsapp/${selectedBotId}/templates`} className="underline font-bold">Crear uno →</Link></p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5 mt-2">
                                                            <p className="text-[10px] text-white/25 uppercase font-black tracking-widest mb-1">Seleccioná el template</p>
                                                            {waTemplates.map(t => (
                                                                <button key={t.name} type="button"
                                                                    onClick={() => { setSelectedTemplateName(t.name); setSelectedTemplateLanguage(t.language) }}
                                                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTemplateName === t.name ? 'border-green-500/40 bg-green-500/8' : 'border-white/8 bg-white/3 hover:border-white/15'}`}>
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <code className="text-xs font-bold text-green-400">{t.name}</code>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {t.status !== 'APPROVED' && <span className="text-[10px] text-cyan-400/60 font-bold">{t.status}</span>}
                                                                            {selectedTemplateName === t.name && <CheckCircle2 size={13} className="text-green-400" />}
                                                                        </div>
                                                                    </div>
                                                                    {t.bodyText && <p className="text-[11px] text-white/40 line-clamp-2">{t.bodyText}</p>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </SectionCard>

                {/* ── Prompt + Multimedia (solo si no es template mode) ── */}
                {!isTemplateMode && (
                  <>
                    {/* Prompt */}
                    <SectionCard>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                    <Sparkles size={12} />
                                </div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Prompt para la IA</p>
                            </div>
                            {templates.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400/60 hover:text-cyan-400 transition-all"
                                >
                                    <FileText size={11} />
                                    Plantillas
                                    <ChevronDown size={11} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-white/25 mb-3 leading-relaxed">
                            La IA generará un mensaje único por contacto basado en este prompt.
                            {audioCount > 0 && <span className="text-cyan-400/60"> Con audios, el prompt es opcional.</span>}
                        </p>

                        {showTemplates && templates.length > 0 && (
                            <div className="mb-3 space-y-1.5 max-h-44 overflow-y-auto rounded-xl border border-cyan-500/15 bg-cyan-500/4 p-2.5">
                                {templates.map(t => (
                                    <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                                        className="w-full text-left p-3 rounded-xl bg-white/4 border border-white/6 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-white">{t.name}</p>
                                            <span className="text-[10px] text-white/20">{t.usageCount} usos</span>
                                        </div>
                                        {t.description && <p className="text-[11px] text-white/30 mt-0.5">{t.description}</p>}
                                    </button>
                                ))}
                            </div>
                        )}

                        <textarea
                            value={form.prompt}
                            onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                            placeholder="Ej: Promoción especial de fin de año, 30% de descuento. Tono cálido y urgente."
                            required={audioCount === 0}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
                        />

                        <div className="mt-4 pt-4 border-t border-white/6">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-1">
                                Ejemplo de mensaje <span className="text-white/15 normal-case font-normal tracking-normal">(opcional)</span>
                            </p>
                            <p className="text-[11px] text-white/20 mb-2">La IA seguirá el estilo de este ejemplo.</p>
                            <textarea
                                value={form.messageExample}
                                onChange={e => setForm(f => ({ ...f, messageExample: e.target.value }))}
                                placeholder="Ej: ¡Hola! 👋 Tenemos una oferta increíble para vos esta semana 🔥"
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
                            />
                        </div>
                    </SectionCard>

                    {/* Multimedia */}
                    <SectionCard>
                        <SectionLabel icon={<ImageIcon size={12} />}>
                            Archivos multimedia
                            {mediaFiles.length > 0 && <span className="ml-2 text-cyan-400 normal-case font-bold tracking-normal">{mediaFiles.length}</span>}
                        </SectionLabel>
                        <p className="text-[11px] text-white/25 mb-4 leading-relaxed">
                            Se rotarán automáticamente entre contactos.
                            {imageCount > 0 && <span className="text-cyan-400/70"> {imageCount} img</span>}
                            {videoCount > 0 && <span className="text-purple-400/70"> {videoCount} vid</span>}
                        </p>

                        <div className="flex gap-2 flex-wrap">
                            {mediaFiles.map((media, i) => (
                                <div key={i} className="relative w-18 h-18 rounded-xl overflow-hidden border border-white/10 group" style={{ width: 70, height: 70 }}>
                                    {media.type === 'VIDEO' ? (
                                        <div className="w-full h-full bg-purple-500/10 flex flex-col items-center justify-center gap-1">
                                            <Film size={18} className="text-purple-400" />
                                            <span className="text-[8px] text-purple-300 truncate max-w-[60px] px-1">{media.file.name}</span>
                                        </div>
                                    ) : (
                                        <img src={media.preview} alt="" className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(i)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                    >
                                        <X size={16} className="text-red-400" />
                                    </button>
                                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-black px-1 rounded">{i + 1}</span>
                                    {media.type === 'VIDEO' && (
                                        <span className="absolute top-1 right-1 bg-purple-500/80 text-white text-[8px] font-bold px-1 rounded">VID</span>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 flex flex-col items-center justify-center gap-1 text-white/25 hover:text-cyan-400 transition-all"
                                style={{ width: 70, height: 70 }}
                            >
                                <Upload size={15} />
                                <span className="text-[9px] font-bold">Agregar</span>
                            </button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => handleMediaSelect(e.target.files)} />
                        <p className="text-[10px] text-white/15 mt-3">JPG · PNG · WEBP · GIF · MP4 · MOV · WEBM</p>
                    </SectionCard>

                    {/* Audios */}
                    <SectionCard>
                        <SectionLabel icon={<Mic size={12} />}>
                            Audios — nota de voz
                            {audioCount > 0 && <span className="ml-2 text-green-400 normal-case font-bold tracking-normal">{audioCount}</span>}
                        </SectionLabel>
                        <p className="text-[11px] text-white/25 mb-4 leading-relaxed">
                            Se envían como <span className="text-green-400/70 font-bold">nota de voz</span>. Si hay audios, no se envía texto.
                        </p>

                        {audioFiles.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-4">
                                {audioFiles.map((audio, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/8 border border-green-500/15">
                                        <Mic size={12} className="text-green-400 shrink-0" />
                                        <span className="text-[11px] text-white/60 max-w-[100px] truncate">{audio.name}</span>
                                        <span className="text-[9px] text-white/25">{(audio.file.size / 1024).toFixed(0)}KB</span>
                                        <button type="button" onClick={() => removeAudio(i)} className="text-white/20 hover:text-red-400 transition-all">
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                            {isRecordingAudio ? (
                                <button type="button" onClick={stopRecordingAudio}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                                    Detener · {recordingSeconds}s
                                </button>
                            ) : (
                                <button type="button" onClick={startRecordingAudio}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/25 bg-green-500/8 text-green-400 hover:bg-green-500/15 transition-all text-xs font-bold">
                                    <Mic size={13} /> Grabar audio
                                </button>
                            )}
                            <button type="button" onClick={() => audioInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-white/10 hover:border-green-500/30 text-white/25 hover:text-green-400 transition-all text-xs font-bold">
                                <Upload size={13} /> Subir archivo
                            </button>
                        </div>
                        <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={e => handleAudioSelect(e.target.files)} />
                        {audioError && (
                            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-[11px]">
                                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                <span>{audioError}</span>
                            </div>
                        )}
                        <p className="text-[10px] text-white/15 mt-3">OGG · MP3 · WAV · AAC · M4A</p>
                    </SectionCard>
                  </>
                )}

                {/* ── Delay ── */}
                <SectionCard>
                    <SectionLabel icon={<Clock size={12} />}>Delay entre mensajes</SectionLabel>
                    <div className="flex gap-3">
                        <input
                            type="number" min="1" max="3600"
                            value={form.delayValue}
                            onChange={e => setForm(f => ({ ...f, delayValue: e.target.value }))}
                            className="w-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-all"
                        />
                        <select
                            value={form.delayUnit}
                            onChange={e => setForm(f => ({ ...f, delayUnit: e.target.value }))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-all"
                        >
                            <option value="seconds">Segundos</option>
                            <option value="minutes">Minutos</option>
                        </select>
                    </div>
                    <p className="text-[11px] text-white/20 mt-2">Recomendado: mínimo 30 segundos para evitar bloqueos</p>
                </SectionCard>

                {/* ── Programar ── */}
                <SectionCard>
                    <SectionLabel icon={<Calendar size={12} />}>Programar envío <span className="normal-case font-normal tracking-normal text-white/20">(opcional)</span></SectionLabel>
                    <input
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/40 transition-all"
                        style={{ colorScheme: 'dark' }}
                    />
                    <p className="text-[11px] text-white/20 mt-2">Dejá vacío para enviar manualmente</p>
                </SectionCard>

                {/* ── Contactos ── */}
                <SectionCard>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                <Users size={12} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                                Contactos
                                {contacts.length > 0 && <span className="text-cyan-400 normal-case font-bold tracking-normal ml-1.5">{contacts.length}</span>}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddContact(v => !v)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15 transition-all"
                        >
                            <Plus size={11} /> Agregar
                        </button>
                    </div>

                    {showAddContact && (
                        <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-white/4 border border-cyan-500/15">
                            <input
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualContact())}
                                placeholder="Teléfono (+591...)"
                                className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none border border-white/10 focus:border-cyan-500/30 transition-all"
                            />
                            <div className="flex gap-2">
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualContact())}
                                    placeholder="Nombre (opcional)"
                                    className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none border border-white/10 focus:border-cyan-500/30 transition-all"
                                />
                                <button type="button" onClick={addManualContact} className="text-green-400 hover:text-green-300 px-2 transition-all">
                                    <CheckCircle2 size={15} />
                                </button>
                                <button type="button" onClick={() => { setShowAddContact(false); setNewPhone(''); setNewName('') }} className="text-white/25 hover:text-red-400 px-2 transition-all">
                                    <X size={15} />
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-[11px] text-white/20 mb-3">
                        Subí un Excel (.xlsx, .xls, .csv) con columnas de teléfono y nombre.
                    </p>

                    <button
                        type="button"
                        onClick={() => excelInputRef.current?.click()}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${excelFile ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/3'}`}
                    >
                        {excelFile ? (
                            <>
                                <CheckCircle2 size={17} className="text-green-400 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-green-400 truncate">{excelFile.name}</p>
                                    <p className="text-xs text-white/25">{(excelFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button type="button" onClick={e => { e.stopPropagation(); setExcelFile(null); setContacts([]) }} className="text-white/25 hover:text-red-400 transition-all">
                                    <X size={13} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Upload size={17} className="text-white/25 shrink-0" />
                                <p className="text-sm text-white/25">Seleccionar archivo Excel</p>
                            </>
                        )}
                    </button>
                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleExcelSelect(e.target.files)} />

                    {parsingExcel && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
                            <Loader2 size={12} className="animate-spin" /> Leyendo contactos...
                        </div>
                    )}

                    {contacts.length > 0 && (
                        <div className="mt-4">
                            <p className="text-[11px] text-white/25 mb-2">
                                <span className="text-green-400 font-bold">{contacts.length}</span> contactos cargados
                            </p>
                            <div className="max-h-52 overflow-y-auto rounded-xl border border-white/8 divide-y divide-white/5">
                                {contacts.map((c, i) => (
                                    <div key={i} className="px-3 py-2">
                                        {editingIdx === i ? (
                                            <div className="flex flex-col gap-1.5">
                                                <input
                                                    value={editPhone}
                                                    onChange={e => setEditPhone(e.target.value)}
                                                    className="w-full bg-white/5 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none border border-white/10"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        placeholder="Nombre"
                                                        className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none border border-white/10"
                                                    />
                                                    <button type="button" onClick={saveEdit} className="text-green-400 hover:text-green-300 transition-all">
                                                        <CheckCircle2 size={13} />
                                                    </button>
                                                    <button type="button" onClick={() => setEditingIdx(null)} className="text-white/25 hover:text-red-400 transition-all">
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Phone size={10} className="text-white/15 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    {c.name && <p className="text-xs font-bold text-white/70 truncate">{c.name}</p>}
                                                    <p className="text-xs text-white/40">{c.phone}</p>
                                                </div>
                                                <button type="button" onClick={() => startEdit(i)} className="text-white/20 hover:text-cyan-400 transition-all">
                                                    <Pencil size={11} />
                                                </button>
                                                <button type="button" onClick={() => deleteContact(i)} className="text-white/20 hover:text-red-400 transition-all">
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {contacts.length === 0 && !parsingExcel && (
                        <p className="mt-3 text-[11px] text-white/15 text-center">
                            Sin contactos — subí un Excel o agregá manualmente
                        </p>
                    )}
                </SectionCard>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-black transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #00F5FF, #00FF88)' }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {uploadingImg ? 'Subiendo archivos...' : 'Creando campaña...'}
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            Crear campaña
                        </>
                    )}
                </button>

            </form>
        </div>
    )
}
