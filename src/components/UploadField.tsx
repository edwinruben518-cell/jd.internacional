'use client'

import { useRef, useState } from 'react'

interface UploadFieldProps {
  value: string
  onChange: (url: string) => void
  type: 'image' | 'video' | 'audio'
  placeholder?: string
}

export function UploadField({ value, onChange, type, placeholder }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Local preview URL (object URL) shown while uploading
  const [localPreview, setLocalPreview] = useState<string>('')

  const isImage = type === 'image'
  const isAudio = type === 'audio'
  const accept = isImage
    ? 'image/jpeg,image/png,image/webp,image/heic'
    : isAudio
      ? 'audio/mpeg,audio/mp3,audio/ogg,audio/opus,audio/wav,audio/m4a,audio/aac,audio/webm'
      : 'video/mp4,video/quicktime,video/3gpp'

  async function getVideoDuration(file: File): Promise<number> {
    return new Promise(resolve => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration) }
      video.onerror = () => resolve(0)
      video.src = URL.createObjectURL(file)
    })
  }

  async function handleFile(file: File) {
    setError('')

    if (!isImage && !isAudio) {
      const duration = await getVideoDuration(file)
      if (duration > 90) {
        setError('El video no puede durar más de 90 segundos')
        return
      }
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB')
      return
    }

    if (isAudio && file.size > 16 * 1024 * 1024) {
      setError('El audio no puede pesar más de 16MB')
      return
    }

    // Show local preview immediately while uploading
    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      onChange(data.url)
    } catch (e: any) {
      setError(e.message)
      setLocalPreview('')
      URL.revokeObjectURL(preview)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview('')
    }
    onChange('')
  }

  const btn = 'text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors'
  // Use uploaded URL if available, otherwise show local preview while uploading
  const previewSrc = value || localPreview

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {previewSrc ? (
        <div className="flex flex-col gap-1.5">
          {isImage ? (
            <img
              src={previewSrc}
              alt="preview"
              className="w-full max-h-48 object-contain rounded-lg border border-white/10 bg-black/20"
            />
          ) : isAudio ? (
            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-sm">🎙️</span>
                <span className="text-xs text-green-400 font-semibold">
                  {loading ? 'Subiendo...' : 'Audio listo'}
                </span>
              </div>
              <audio
                key={previewSrc}
                src={previewSrc}
                controls
                className="w-full"
              />
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-neon-purple/30 bg-black/20">
              <video
                key={previewSrc}
                src={previewSrc}
                controls
                playsInline
                className="w-full max-h-48 object-contain"
                preload="metadata"
              />
            </div>
          )}

          {loading && (
            <p className="text-[10px] text-white/40 text-center">⏳ Subiendo archivo...</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className={`${btn} bg-white/8 text-dark-300 hover:bg-white/12 flex-1`}
            >
              {loading ? '⏳ Subiendo...' : isImage ? '🔄 Cambiar foto' : isAudio ? '🔄 Cambiar audio' : '🔄 Cambiar video'}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className={`${btn} bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40`}
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`${btn} w-full py-3 border border-dashed ${
            isImage
              ? 'border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/5'
              : isAudio
                ? 'border-green-500/30 text-green-400 hover:bg-green-500/5'
                : 'border-neon-purple/30 text-neon-purple hover:bg-neon-purple/5'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading
            ? '⏳ Subiendo...'
            : isImage
              ? `📷 ${placeholder || 'Subir foto'}`
              : isAudio
                ? `🎙️ ${placeholder || 'Subir audio de voz'}`
                : `🎬 ${placeholder || 'Subir video (máx. 90 seg)'}`}
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
