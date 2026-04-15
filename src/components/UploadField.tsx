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
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const btn = 'text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors'

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {value ? (
        <div className="flex flex-col gap-1.5">
          {isImage ? (
            <img
              src={value}
              alt="preview"
              className="w-full max-h-32 object-cover rounded-lg border border-white/10"
            />
          ) : isAudio ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <span className="text-green-400 text-sm">🎙️</span>
              <span className="text-xs text-dark-300 truncate flex-1">Audio guardado ✓</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/30">
              <span className="text-neon-purple text-sm">🎬</span>
              <span className="text-xs text-dark-300 truncate flex-1">Video guardado ✓</span>
            </div>
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
              onClick={() => onChange('')}
              className={`${btn} bg-red-500/10 text-red-400 hover:bg-red-500/20`}
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
