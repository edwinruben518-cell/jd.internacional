'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category { id: string; name: string }
interface FileEntry { title: string; driveUrl: string }

export default function CreateMarketplaceCoursePage() {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrPreview, setQrPreview] = useState('')
  const [uploadingQr, setUploadingQr] = useState(false)
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [files, setFiles] = useState<FileEntry[]>([{ title: '', driveUrl: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/marketplace/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
  }, [])

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

  async function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setQrPreview(URL.createObjectURL(file))
    setUploadingQr(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    setUploadingQr(false)
    if (data.url) setQrImageUrl(data.url)
    else setError('Error al subir el QR')
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
    const res = await fetch('/api/marketplace/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, coverUrl, qrImageUrl, price: parseFloat(price), categoryId, whatsapp, files: validFiles }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Error al crear'); return }
    router.push('/dashboard/services/marketplace')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13, outline: 'none',
  }

  return (
    <div className="px-4 sm:px-6 pt-6 pb-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white uppercase tracking-widest">Crear Curso</h1>
        <div className="h-px w-20 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #00F5FF, #FF2DF7, transparent)' }} />
        <p className="text-xs text-white/30 mt-2">Tu curso quedará en revisión antes de publicarse.</p>
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
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { if (!coverPreview) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,245,255,0.35)' }}
            onMouseLeave={e => { if (!coverPreview) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="portada" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
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
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600 }}>Click para subir portada</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>JPG, PNG o WebP</p>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverFile} style={{ display: 'none' }} />
        </div>

        {/* QR image upload */}
        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>QR de pago <span style={{ color: '#f97316' }}>*</span></label>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '0 0 8px' }}>Los compradores escanearán este QR para pagarte. Sube el QR de tu billetera (Binance, Yape, etc.).</p>
          <div
            onClick={() => qrInputRef.current?.click()}
            style={{
              width: 160, height: 160, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
              background: qrPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
              border: qrPreview ? 'none' : '2px dashed rgba(255,165,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {qrPreview ? (
              <>
                <img src={qrPreview} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  <span style={{ fontSize: 20 }}>📷</span>
                  <p style={{ color: '#fff', fontSize: 11, fontWeight: 600, margin: '4px 0 0' }}>Cambiar QR</p>
                </div>
              </>
            ) : uploadingQr ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, border: '2px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Subiendo...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12 }}>
                <span style={{ fontSize: 28 }}>📷</span>
                <p style={{ fontSize: 11, color: 'rgba(255,165,0,0.7)', margin: 0, fontWeight: 600, textAlign: 'center' }}>Subir QR de pago</p>
              </div>
            )}
          </div>
          <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrFile} style={{ display: 'none' }} />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Título *</label>
          <input style={inputStyle} placeholder="Nombre del curso" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Descripción *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            placeholder="Describe qué aprenderán los estudiantes..."
            value={description} onChange={e => setDescription(e.target.value)} required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Precio (USD) *</label>
            <input style={inputStyle} type="number" min="0" step="0.01" placeholder="9.99" value={price} onChange={e => setPrice(e.target.value)} required />
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
          <input style={inputStyle} placeholder="+5219991234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>Se mostrará en la página del curso para que compradores te contacten.</p>
        </div>

        {/* Files section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Archivos del curso (links de Drive)</label>
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
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
            Los links se mostrarán al comprador cuando el vendedor apruebe su pago.
          </p>
        </div>

        <button
          type="submit" disabled={saving || uploadingCover || uploadingQr}
          style={{ padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving || uploadingCover || uploadingQr ? 'not-allowed' : 'pointer', border: 'none', background: saving || uploadingCover || uploadingQr ? 'rgba(0,245,255,0.3)' : 'linear-gradient(135deg, #00F5FF, #00FF88)', color: '#0a0a0f', marginTop: 4 }}
        >
          {saving ? 'Enviando...' : 'Publicar curso (para revisión)'}
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
