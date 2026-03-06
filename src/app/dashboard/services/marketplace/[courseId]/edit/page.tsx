'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Category { id: string; name: string }
interface FileEntry { title: string; driveUrl: string }

export default function EditMarketplaceCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [files, setFiles] = useState<FileEntry[]>([{ title: '', driveUrl: '' }])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const courseLink = typeof window !== 'undefined' ? `${window.location.origin}/marketplace/${courseId}` : ''

  useEffect(() => {
    fetch('/api/marketplace/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
    fetch(`/api/marketplace/my-courses`).then(r => r.json()).then(d => {
      const course = (d.courses ?? []).find((c: { id: string }) => c.id === courseId)
      if (course) {
        setTitle(course.title)
        setDescription(course.description)
        setCoverUrl(course.coverUrl ?? '')
        setCoverPreview(course.coverUrl ?? '')
        setPrice(String(course.price))
        setCategoryId(course.category?.id ?? '')
        setWhatsapp(course.whatsapp ?? '')
        setFiles(course.files?.length ? course.files.map((f: FileEntry) => ({ title: f.title, driveUrl: f.driveUrl })) : [{ title: '', driveUrl: '' }])
      }
      setLoading(false)
    })
  }, [courseId])

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverPreview(URL.createObjectURL(file))
    setUploadingCover(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploadingCover(false)
    if (data.url) setCoverUrl(data.url)
    else setError('Error al subir la imagen')
  }

  function copyLink() {
    navigator.clipboard.writeText(courseLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function addFile() { setFiles(prev => [...prev, { title: '', driveUrl: '' }]) }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }
  function updateFile(i: number, field: keyof FileEntry, value: string) {
    setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title || !description || !price) { setError('Completa todos los campos requeridos'); return }
    const validFiles = files.filter(f => f.title && f.driveUrl)
    setSaving(true)
    const res = await fetch(`/api/marketplace/my-courses/${courseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, coverUrl, price: parseFloat(price), categoryId, whatsapp, files: validFiles }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Error al guardar'); return }
    router.push('/dashboard/services/marketplace')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13, outline: 'none',
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Editar Curso</h1>
        <div className="h-px w-20 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
        <p className="text-xs text-white/30 mt-2">Al guardar, el curso volverá a revisión del admin.</p>
      </div>

      {/* Copy link box */}
      <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enlace de tu curso</p>
          <p style={{ margin: 0, fontSize: 12, color: '#00F5FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseLink}</p>
        </div>
        <button
          onClick={copyLink}
          style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', background: copied ? '#00FF88' : 'rgba(0,245,255,0.15)', color: copied ? '#0a0a0f' : '#00F5FF', transition: 'all 0.2s' }}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Cover upload */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>Imagen de portada</label>
          <div
            onClick={() => coverInputRef.current?.click()}
            style={{
              width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
              background: coverPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
              border: coverPreview ? 'none' : '2px dashed rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="portada" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  <span style={{ fontSize: 22 }}>📷</span>
                  <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: '4px 0 0' }}>Cambiar imagen</p>
                </div>
              </>
            ) : uploadingCover ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #00F5FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Subiendo imagen...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 32 }}>🖼️</span>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Click para cambiar portada</p>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFile} style={{ display: 'none' }} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Título *</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Descripción *</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Precio (USD) *</label>
            <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Categoría</label>
            <select style={{ ...inputStyle }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>WhatsApp de contacto</label>
          <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Archivos del curso</label>
            <button type="button" onClick={addFile} style={{ fontSize: 11, fontWeight: 700, color: '#00F5FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              + Agregar archivo
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((file, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input style={inputStyle} placeholder={`Nombre del archivo ${i + 1}`} value={file.title} onChange={e => updateFile(i, 'title', e.target.value)} />
                  <input style={inputStyle} type="url" placeholder="https://drive.google.com/file/d/..." value={file.driveUrl} onChange={e => updateFile(i, 'driveUrl', e.target.value)} />
                </div>
                {files.length > 1 && (
                  <button type="button" onClick={() => removeFile(i)} style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', marginTop: 4 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit" disabled={saving || uploadingCover}
          style={{ padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving || uploadingCover ? 'not-allowed' : 'pointer', border: 'none', background: saving || uploadingCover ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#0a0a0f', marginTop: 4 }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
