'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Bot,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ChevronRight,
  Package,
  Settings,
  Zap,
  Bell,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Key,
  FileText,
  ShoppingBag,
  Webhook,
  X,
  Edit2,
  Save,
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bot {
  id: string
  name: string
  type: 'YCLOUD' | 'BAILEYS'
  status: 'ACTIVE' | 'PAUSED'
  webhookToken: string
  systemPromptTemplate: string | null
  maxCharsMensaje1: number | null
  maxCharsMensaje2: number | null
  maxCharsMensaje3: number | null
  baileysPhone: string | null
  followUp1Delay: number
  followUp2Delay: number
  createdAt: string
  secret?: { whatsappInstanceNumber: string; reportPhone: string } | null
  _count?: { products: number; conversations: number }
}

interface Product {
  id: string
  botId: string
  name: string
  category: string | null
  benefits: string | null
  usage: string | null
  warnings: string | null
  priceUnit: string | null
  pricePromo2: string | null
  priceSuper6: string | null
  currency: string
  welcomeMessage: string | null
  firstMessage: string | null
  hooks: string[]
  imageMainUrls: string[]
  imagePriceUnitUrl: string | null
  imagePricePromoUrl: string | null
  imagePriceSuperUrl: string | null
  // testimonialsVideoUrls may be string[] (legacy) or {url,label}[] (new)
  testimonialsVideoUrls: Array<string | { url: string; label: string }>
  shippingInfo: string | null
  coverage: string | null
  tags: string[]
  active: boolean
}

type Tab = 'webhook' | 'credentials' | 'prompt' | 'products' | 'qr' | 'followup'

// ─── Small reusable components ────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-dark-400 hover:text-white"
      title="Copiar"
    >
      {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

function Alert({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  if (!msg) return null
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${type === 'error'
        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
        : 'bg-neon-green/10 border border-neon-green/20 text-neon-green'
        }`}
    >
      {type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  )
}

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />
}

// ─── Create Bot Form ──────────────────────────────────────────────────────────

function CreateBotForm({ onCreated }: { onCreated: (bot: Bot, webhookUrl: string) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'YCLOUD' | 'BAILEYS'>('YCLOUD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando bot')
      onCreated(data.bot, data.webhookUrl)
      setName('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-neon-green/20">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-neon-green" />
        Crear nuevo bot
      </h3>

      {/* Tipo de bot */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setType('YCLOUD')}
          className={`p-3 rounded-xl border text-left transition-all ${type === 'YCLOUD'
            ? 'border-neon-blue/50 bg-neon-blue/10 text-white'
            : 'border-white/10 text-dark-400 hover:border-white/20'
            }`}
        >
          <Webhook className="w-4 h-4 mb-1.5" />
          <div className="text-xs font-bold">YCloud</div>
          <div className="text-[10px] text-dark-500 mt-0.5">Via API + Webhook</div>
        </button>
        <button
          type="button"
          onClick={() => setType('BAILEYS')}
          className={`p-3 rounded-xl border text-left transition-all ${type === 'BAILEYS'
            ? 'border-neon-green/50 bg-neon-green/10 text-white'
            : 'border-white/10 text-dark-400 hover:border-white/20'
            }`}
        >
          <Smartphone className="w-4 h-4 mb-1.5" />
          <div className="text-xs font-bold">WhatsApp Web</div>
          <div className="text-[10px] text-dark-500 mt-0.5">Escanear QR</div>
        </button>
      </div>

      {error && <Alert type="error" msg={error} />}
      <div className="flex gap-3 mt-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del bot (ej: Bot Ventas Bolivia)"
          className="flex-1 bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-neon-green/40"
          required
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-5 py-2.5 bg-neon-green text-dark-950 font-bold rounded-xl text-sm hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? <Spinner /> : <Plus className="w-4 h-4" />}
          Crear
        </button>
      </div>
    </form>
  )
}

// ─── Bot List ─────────────────────────────────────────────────────────────────

function BotCard({ bot, onSelect }: { bot: Bot; onSelect: (bot: Bot) => void }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      <button
        onClick={() => onSelect(bot)}
        className="relative z-10 w-full text-left group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-neon-green" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{bot.name}</div>
              <div className="text-xs text-dark-400 mt-0.5">
                {bot._count?.products ?? 0} productos · {bot._count?.conversations ?? 0} conv.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full border ${bot.status === 'ACTIVE'
                ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                : 'bg-dark-700/50 text-dark-400 border-dark-600'
                }`}
            >
              {bot.status === 'ACTIVE' ? 'ACTIVO' : 'PAUSADO'}
            </span>
            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-colors" />
          </div>
        </div>
        {bot.secret?.whatsappInstanceNumber && (
          <div className="text-xs text-dark-400">
            📱 {bot.secret.whatsappInstanceNumber}
          </div>
        )}
      </button>
    </div>
  )
}

// ─── Webhook Tab ──────────────────────────────────────────────────────────────

function WebhookTab({ bot }: { bot: Bot }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com'
  const webhookUrl = `${appUrl}/api/webhooks/ycloud/whatsapp/${bot.id}?token=${bot.webhookToken}`
  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleClearMemory() {
    if (!confirm('⚠️ Esto eliminará TODAS las conversaciones y mensajes de este bot.\n\n¿Estás seguro? Esta acción no se puede deshacer.')) return
    setClearing(true)
    setClearMsg(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}/clear-memory`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al limpiar')
      setClearMsg({ type: 'success', text: `Memoria limpiada correctamente (${data.conversationsDeleted} conversaciones eliminadas)` })
    } catch (err: unknown) {
      setClearMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-neon-blue/20">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-neon-blue" />
          URL del Webhook
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Configura esta URL en tu panel de YCloud como Webhook URL para mensajes entrantes.
        </p>
        <div className="bg-dark-900/70 border border-white/5 rounded-xl p-3 flex items-center gap-2">
          <code className="flex-1 text-xs text-neon-blue break-all font-mono">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-neon-purple" />
          Webhook Token (secreto)
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Este token valida que el webhook viene de YCloud. Ya está incluido en la URL anterior como{' '}
          <code className="text-neon-purple">?token=...</code>
        </p>
        <div className="bg-dark-900/70 border border-white/5 rounded-xl p-3 flex items-center gap-2">
          <code className="flex-1 text-xs text-dark-300 font-mono truncate">
            {bot.webhookToken.slice(0, 8)}{'*'.repeat(20)}{bot.webhookToken.slice(-4)}
          </code>
          <CopyButton text={bot.webhookToken} />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-sm font-bold text-white mb-3">Pasos de configuración en YCloud</h3>
        <ol className="space-y-3">
          {[
            'Inicia sesión en https://app.ycloud.com',
            'Ve a WhatsApp → Webhooks',
            'Agrega la URL del webhook copiada arriba',
            'Selecciona el evento: inbound_message.received',
            'Guarda la configuración',
            'Envía un mensaje de prueba al número configurado',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-dark-300">
              <span className="w-5 h-5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Zona de riesgo ── */}
      <div className="glass-panel p-6 rounded-2xl border border-red-500/20">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-1">
          <Trash2 className="w-4 h-4" />
          Zona de riesgo
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Elimina permanentemente todo el historial de conversaciones y mensajes de este bot.
          Los productos y la configuración no se verán afectados.
        </p>

        {clearMsg && <div className="mb-4"><Alert type={clearMsg.type} msg={clearMsg.text} /></div>}

        <button
          type="button"
          onClick={handleClearMemory}
          disabled={clearing}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {clearing ? <Spinner /> : <Trash2 className="w-4 h-4" />}
          {clearing ? 'Limpiando...' : 'Limpiar memoria del bot'}
        </button>
      </div>
    </div>
  )
}


// ─── Credentials Tab ──────────────────────────────────────────────────────────

function CredentialsTab({ bot, onStatusChange }: { bot: Bot; onStatusChange: (status: 'ACTIVE' | 'PAUSED') => void }) {
  const isBaileys = bot.type === 'BAILEYS'
  const [form, setForm] = useState({
    ycloudApiKey: '',
    openaiApiKey: '',
    whatsappInstanceNumber: '',
    reportPhone: '',
  })
  const [showYcloud, setShowYcloud] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [creds, setCreds] = useState<{ hasYcloudKey: boolean; hasOpenAIKey: boolean; whatsappInstanceNumber: string; reportPhone: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const loadCreds = useCallback(async () => {
    const res = await fetch(`/api/bots/${bot.id}/credentials`)
    if (res.ok) {
      const data = await res.json()
      setCreds(data)
      setForm(f => ({
        ...f,
        whatsappInstanceNumber: data.whatsappInstanceNumber,
        reportPhone: data.reportPhone,
      }))
    }
  }, [bot.id])

  useEffect(() => { loadCreds() }, [loadCreds])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: 'Credenciales guardadas correctamente' })
      loadCreds()
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error guardando' })
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus() {
    setSavingStatus(true)
    const newStatus = bot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) onStatusChange(newStatus)
    } finally {
      setSavingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status toggle */}
      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">Estado del bot</div>
          <div className="text-xs text-dark-400 mt-0.5 truncate">
            {bot.status === 'ACTIVE' ? 'El bot está respondiendo mensajes' : 'El bot está pausado'}
          </div>
        </div>
        <button
          onClick={toggleStatus}
          disabled={savingStatus}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
        >
          {savingStatus ? (
            <Spinner />
          ) : bot.status === 'ACTIVE' ? (
            <ToggleRight className="w-8 h-8 text-neon-green" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-dark-500" />
          )}
          <span className={bot.status === 'ACTIVE' ? 'text-neon-green' : 'text-dark-400'}>
            {bot.status === 'ACTIVE' ? 'Activo' : 'Pausado'}
          </span>
        </button>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-neon-purple" />
          Claves de API
        </h3>

        {msg && <Alert type={msg.type} msg={msg.text} />}

        {/* YCloud API Key — solo para bots YCloud */}
        {!isBaileys && (
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              YCloud API Key{' '}
              {creds?.hasYcloudKey && (
                <span className="text-neon-green ml-1">✓ configurada</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showYcloud ? 'text' : 'password'}
                value={form.ycloudApiKey}
                onChange={e => setForm(f => ({ ...f, ycloudApiKey: e.target.value }))}
                placeholder={creds?.hasYcloudKey ? '(dejar vacío para mantener)' : 'yk_live_...'}
                className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-purple/40"
              />
              <button
                type="button"
                onClick={() => setShowYcloud(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
              >
                {showYcloud ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* OpenAI API Key */}
        <div>
          <label className="block text-xs font-medium text-dark-300 mb-1.5">
            OpenAI API Key{' '}
            {creds?.hasOpenAIKey && (
              <span className="text-neon-green ml-1">✓ configurada</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showOpenai ? 'text' : 'password'}
              value={form.openaiApiKey}
              onChange={e => setForm(f => ({ ...f, openaiApiKey: e.target.value }))}
              placeholder={creds?.hasOpenAIKey ? '(dejar vacío para mantener)' : 'sk-proj-...'}
              className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-purple/40"
            />
            <button
              type="button"
              onClick={() => setShowOpenai(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
            >
              {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* WhatsApp number — solo para bots YCloud */}
        {!isBaileys && (
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">
              Número WhatsApp Business (from)
            </label>
            <input
              value={form.whatsappInstanceNumber}
              onChange={e => setForm(f => ({ ...f, whatsappInstanceNumber: e.target.value }))}
              placeholder="15551234567 (sin + ni espacios)"
              className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-purple/40"
            />
          </div>
        )}

        {/* Report phone */}
        <div>
          <label className="block text-xs font-medium text-dark-300 mb-1.5">
            Número interno para reportes
          </label>
          <input
            value={form.reportPhone}
            onChange={e => setForm(f => ({ ...f, reportPhone: e.target.value }))}
            placeholder="15559876543"
            className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-purple/40"
            required
          />
          <p className="text-xs text-dark-500 mt-1">
            Cuando un cliente confirme su pedido, el bot enviará un reporte a este número.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl hover:bg-neon-purple/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Spinner /> : <Save className="w-4 h-4" />}
          Guardar credenciales
        </button>
      </form>
    </div>
  )
}

// ─── Prompt Tab ───────────────────────────────────────────────────────────────

// ─── Plantilla de prompt de ejemplo ─────────────────────────────────────────

const EXAMPLE_PROMPT = `# 🎯 IDENTIDAD

Eres Rubén, vendedor profesional de WhatsApp (Bolivia). Hombre, amable, directo y humano.

Tono: corto, cálido, cercano y boliviano.

- Con mujeres: señorita / casera / estimada / amiga / [su nombre]
- Con hombres: estimado / [su nombre]

Nunca inventas datos. Siempre presionas de forma ética hacia la compra.

---

# 🧠 SECUENCIA PRINCIPAL

## 1. Dar un bienvenida cálida y amigable y luego Identificación del producto (OBLIGATORIO)

Primero dar una bienvenida calida y amigable.

Luego identifica el producto de interés (obligatorio).

Si no está identificado:

- NO envíes bienvenida, precios, fotos ni beneficios.
- Pregunta amablemente: "¿Qué producto te interesa?"

El flujo no avanza hasta que el producto esté identificado.

---

## 2. Primera interacción (solo si el producto ya fue identificado)

Si es la primera vez que el usuario consulta sobre ese producto:

- Enviar el texto exacto del campo "Primer mensaje del producto identificado".
- NO incluir precios en este mensaje.
- Enviar 1 foto de "Imágenes principales" en fotos_mensaje1 (solo se puede enviar una vez).
- Añadir gatillos mentales suaves: transformación, autoridad, prueba social.

Una vez enviado el primer mensaje y la primera foto "Imágenes principales"  → no repetirlo en ningún turno posterior.

---

## 3. Detección de intención

Detecta una sola intención dominante por turno:
Interés / Duda / Precio / Comparación / Compra / Entrega

Máximo 3 mensajes por turno.

---

## 4. Precios

Solo informa precios si el usuario los solicita explícitamente.

- Precio unitario → cuando quiere 1 unidad.
- Precio promo ×2 o Precio súper ×6 → cuando quiere 2 o más unidades.

Usa gatillos de: ahorro, urgencia y beneficio inmediato.

NUNCA inventas montos. Usa solo los precios de la base de conocimiento del producto.

## 5. Fotos y videos (usar solo si el usuario pide mas fotos del producto identificado)

- Envía fotos reales desde "**Más fotos del producto”**.
- O envía fotos reales desde "**Videos del producto”**.
- Y si hay fotos y videos envia segun la nesecidad del cliente.

---

## 6. Testimonios y confianza (usar testimonios solo si existe)

Si detectas duda, inseguridad o el usuario pide evidencias o testimonio o deseas reforsar:

- Envía fotos de testimonios reales desde "Fotos de testimonios" según la ocasión.
- O envía videos de testimonios reales desde "**Videos de testimonios**" según la ocasión.
- No repitas la misma foto o video en la misma conversación.
- Acompaña con prueba social y credibilidad.

---

## **7. Comparación y cierre**

Guía suave hacia la decisión:

- Resaltar beneficios del producto.
- Mostrar resultados potenciales o transformación (sin inventar).
- Los mensajes deben avanzar hacia:
    - Confirmación de compra
    - Datos de entrega
    - Selección de variante

Siempre con amabilidad y claridad.

---

# 📍 **DIRECCIÓN**

Válida si incluye:

- Ciudad
- Calle
- Zona
- Nº (si existe)
    
    o coordenadas / link Maps.
    

Si falta algo → pedir solo lo faltante o direccion en gps (vaidar cordenadas).

Deves pedir nombre y numero de telefono obligatorio.

Si es de provincia no pedir direccion detallada enves de eso preguntar por que linia de transporte le gustaria que se lo mandemos en cuanto confirme pasar a (CONFIRMACION)

No repetir datos ya enviados.

---

# 📦 **CONFIRMACIÓN**

Se confirma solo si hay dirección completa o coordenadas válidas.

El pago se coordina directo con asesor que se va a comunicar.

Mensaje obligatorio:

\`\`\`
¡Gracias por tu confianza, [nombre]! 🚚💚

Recibí tu dirección:

📍 [dirección o coordenadas]

Entrega estimada: dentro las primeras 8–24 horas despues del pedido.

Un encargado te llamará para coordinar ⭐
\`\`\`

---

# 📝 **REPORTE (solo si hubo confirmación)**

\`\`\`
"Hola *Ruben*, nuevo pedido de [nombre].
Contacto: [teléfono] (Solo el numero de tefono sin textos).
Dirección: [dirección o coordenadas].
Descripción: [producto]."
\`\`\`

Si no hubo confirmación → \`"reporte": ""\`.

---

# 🚨 REGLA OBLIGATORIA (NO NEGOCIABLE)

Está prohibido inventar datos.
Toda la información debe obtenerse únicamente de la base de conocimiento del producto.

---

# 🧩 REGLAS GENERALES

- Tono cálido, cercano, empático y natural con acento boliviano.
- No repetir fotos ni URLs de testimonios ya enviados.
- No dar precios en los primeros mensajes.
- En dudas → usar testimonios.
- No pedir datos ya recibidos.
- No ofrecer productos ya cerrados.
- Usar *negritas con un asterisco por lado*.
- Máx. 50 caracteres por mensaje (excepto el primer mensaje del producto).
- 2 saltos de línea entre bloques de texto.
- Responder siempre aunque el input llegue vacío: usar el historial.
- Mensajes cortos, claros y humanos.

---

# 🔥 GATILLOS MENTALES (VENTA ÉTICA)

- Urgencia, escasez, autoridad, prueba social, transformación.
- Insistir de forma estratégica, amigable y respetuosa.
- Objetivo principal: cerrar la venta.
- Después de la confirmación → NO seguir vendiendo.

---

# 📏 REGLAS DE MENSAJES

## mensaje1

- Si es el primer mensaje del producto: enviar el texto completo tal cual.
- Si no: máx. 60 caracteres. Con emojis. Sin preguntas. 2 saltos entre frases.

## mensaje2 (opcional)

- Máx. 50 caracteres. Pregunta suave o llamada a la acción.

## mensaje3 (opcional)

- Máx. 50 caracteres. Emoción, gatillo o pregunta de cierre.

Usar solo 1 o 2 mensajes por turno.
Usar mensaje2 y mensaje3 SOLO si realmente aportan valor.

## Regla estricta

- Jamás superar el límite de caracteres por mensaje.
- Resaltar palabras clave con *negrita de un asterisco*.
- Separar bloques con 2 saltos de línea.

---

# 🧠 REGLA FINAL

Siempre generar una respuesta aunque no llegue texto nuevo.
Leer el historial completo y responder con coherencia y continuidad.

---

# 📦 FORMATO DE SALIDA (OBLIGATORIO)

\`\`\`json
{
  "mensaje1": "Primer bloque de texto",
  "mensaje2": "Opcional: aclaración o pregunta",
  "mensaje3": "Opcional: cierre o instrucción",
  "fotos_mensaje1": [],
  "videos_mensaje1": [],
  "reporte": "Resumen detallado del pedido si hubo confirmación"
}
\`\`\`\``.trim()

function PromptTab({ bot, onSaved }: { bot: Bot; onSaved: (updated: Partial<Bot>) => void }) {
  const [form, setForm] = useState({
    systemPromptTemplate: bot.systemPromptTemplate ?? '',
    maxCharsMensaje1: bot.maxCharsMensaje1?.toString() ?? '',
    maxCharsMensaje2: bot.maxCharsMensaje2?.toString() ?? '',
    maxCharsMensaje3: bot.maxCharsMensaje3?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPromptTemplate: form.systemPromptTemplate,
          maxCharsMensaje1: form.maxCharsMensaje1 ? parseInt(form.maxCharsMensaje1) : null,
          maxCharsMensaje2: form.maxCharsMensaje2 ? parseInt(form.maxCharsMensaje2) : null,
          maxCharsMensaje3: form.maxCharsMensaje3 ? parseInt(form.maxCharsMensaje3) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg({ type: 'success', text: 'Plantilla guardada correctamente' })
      onSaved(data.bot)
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error guardando' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-neon-blue" />
          Prompt del vendedor
        </h3>

        {msg && <Alert type={msg.type} msg={msg.text} />}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-dark-300">
              Instrucciones del vendedor (system prompt)
            </label>
            <button
              type="button"
              onClick={() => {
                if (!form.systemPromptTemplate.trim()) {
                  setForm(f => ({ ...f, systemPromptTemplate: EXAMPLE_PROMPT }))
                } else if (confirm('Esto reemplazará tu prompt actual. ¿Continuar?')) {
                  setForm(f => ({ ...f, systemPromptTemplate: EXAMPLE_PROMPT }))
                }
              }}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue hover:bg-neon-blue/20 transition-colors font-medium"
            >
              Cargar plantilla de ejemplo
            </button>
          </div>
          <textarea
            value={form.systemPromptTemplate}
            onChange={e => setForm(f => ({ ...f, systemPromptTemplate: e.target.value }))}
            rows={12}
            placeholder={`Escribe aquí las instrucciones de tu vendedor.\n\nEjemplo:\n- Su nombre, estilo de comunicación y tono\n- Cómo identificar el problema del cliente\n- Cómo presentar y cerrar la venta\n- Reglas de negocio especiales\n\nUsa el botón "Cargar plantilla de ejemplo" para ver una plantilla lista.`}
            className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-blue/40 font-mono resize-y min-h-[200px]"
          />
          <p className="text-xs text-dark-500 mt-1">
            Estas instrucciones se combinan con las reglas del bot y la base de conocimiento de productos.
          </p>
        </div>

        {/* Char limits */}
        <div>
          <label className="block text-xs font-medium text-dark-300 mb-3">
            Límite de caracteres por mensaje (opcional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['maxCharsMensaje1', 'maxCharsMensaje2', 'maxCharsMensaje3'] as const).map((field, i) => (
              <div key={field}>
                <label className="block text-[10px] text-dark-400 mb-1">Mensaje {i + 1}</label>
                <input
                  type="number"
                  min="50"
                  max="4000"
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder="Sin límite"
                  className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-blue/40"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Strict JSON badge */}
        <div className="flex items-center gap-3 bg-neon-green/5 border border-neon-green/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
          <div>
            <div className="text-xs font-bold text-neon-green">strictJsonOutput: ACTIVO</div>
            <div className="text-xs text-dark-400">
              El bot siempre devuelve JSON válido con el schema requerido.
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-neon-blue text-dark-950 font-bold rounded-xl hover:bg-neon-blue/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Spinner /> : <Save className="w-4 h-4" />}
          Guardar plantilla
        </button>
      </div>
    </form>
  )
}

// ─── Product Form ─────────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name: '',
  category: '',
  benefits: '',
  usage: '',
  warnings: '',
  priceUnit: '',
  pricePromo2: '',
  priceSuper6: '',
  currency: 'USD',
  welcomeMessage: '',
  firstMessage: '',
  hooks: '',
  // Imágenes principales (hasta 8 URLs individuales)
  img1: '', img2: '', img3: '', img4: '', img5: '', img6: '', img7: '', img8: '',
  // Videos del producto (hasta 2)
  vid1: '', vid2: '',
  // Testimonios (hasta 7, cada uno con tipo, URL de foto y URL de video)
  test1Label: '', test1Url: '', test1VidUrl: '',
  test2Label: '', test2Url: '', test2VidUrl: '',
  test3Label: '', test3Url: '', test3VidUrl: '',
  test4Label: '', test4Url: '', test4VidUrl: '',
  test5Label: '', test5Url: '', test5VidUrl: '',
  test6Label: '', test6Url: '', test6VidUrl: '',
  test7Label: '', test7Url: '', test7VidUrl: '',
  shippingInfo: '',
  coverage: '',
  active: true,
}

type ProductFormState = typeof EMPTY_PRODUCT

/** Normaliza testimonialsVideoUrls (string[] o {url,label,type}[]) a un array agrupado de 7 entradas. */
function parseProductTestimonials(p: Product): Array<{ label: string; url: string; vidUrl: string }> {
  const result: Array<{ label: string; url: string; vidUrl: string }> = Array.from({ length: 7 }, () => ({ label: '', url: '', vidUrl: '' }))

  // Agrupar testimonios por label original para juntar imagen y video del mismo testimonio
  let i = 0
  for (const item of p.testimonialsVideoUrls) {
    if (i >= 7) break
    if (typeof item === 'object' && item !== null && (item as { url?: string }).url) {
      const obj = item as { url: string; label?: string; type?: string }
      result[i].label = obj.label ?? ''
      if (obj.type === 'video') result[i].vidUrl = obj.url
      else result[i].url = obj.url

      // Intentar encontrar si el SIGUIENTE es la contraparte (foto/video) con el mismo label
      i++
    } else if (typeof item === 'string' && item.startsWith('http')) {
      result[i].url = item
      i++
    }
  }

  // Segunda pasada para juntar items con mismo label que quedaron separados (opcional, pero ayuda)
  const deduped: Array<{ label: string; url: string; vidUrl: string }> = []
  const byLabel = new Map<string, { label: string; url: string; vidUrl: string }>()

  for (const item of p.testimonialsVideoUrls) {
    if (typeof item === 'object' && item !== null && (item as { url?: string }).url) {
      const obj = item as { url: string; label?: string; type?: string }
      const lbl = obj.label ?? ''
      if (!byLabel.has(lbl)) byLabel.set(lbl, { label: lbl, url: '', vidUrl: '' })
      if (obj.type === 'video') byLabel.get(lbl)!.vidUrl = obj.url
      else if (!byLabel.get(lbl)!.url) byLabel.get(lbl)!.url = obj.url
    } else if (typeof item === 'string' && item.startsWith('http')) {
      deduped.push({ label: '', url: item, vidUrl: '' })
    }
  }

  const finalMerged = Array.from(byLabel.values()).concat(deduped)

  // Migración: incorporar los 3 campos imagePriceUrl del formato anterior
  const existing = new Set(finalMerged.map(r => r.url))
  for (const url of [p.imagePriceUnitUrl, p.imagePricePromoUrl, p.imagePriceSuperUrl]) {
    if (url && !existing.has(url)) finalMerged.push({ label: '', url, vidUrl: '' })
  }

  while (finalMerged.length < 7) finalMerged.push({ label: '', url: '', vidUrl: '' })
  return finalMerged.slice(0, 7)
}

function productToForm(p: Product): ProductFormState {
  const testis = parseProductTestimonials(p)
  const imgs = [...p.imageMainUrls, '', '', '', '', '', '', '', ''].slice(0, 8)
  return {
    name: p.name,
    category: p.category ?? '',
    benefits: p.benefits ?? '',
    usage: p.usage ?? '',
    warnings: p.warnings ?? '',
    priceUnit: p.priceUnit ?? '',
    pricePromo2: p.pricePromo2 ?? '',
    priceSuper6: p.priceSuper6 ?? '',
    currency: p.currency ?? 'USD',
    welcomeMessage: p.welcomeMessage ?? '',
    firstMessage: p.firstMessage ?? '',
    hooks: p.hooks.join('\n'),
    img1: imgs[0], img2: imgs[1], img3: imgs[2], img4: imgs[3], img5: imgs[4], img6: imgs[5], img7: imgs[6], img8: imgs[7],
    vid1: ((p as any).productVideoUrls?.[0] as string) || '', vid2: ((p as any).productVideoUrls?.[1] as string) || '',
    test1Label: testis[0].label, test1Url: testis[0].url, test1VidUrl: testis[0].vidUrl,
    test2Label: testis[1].label, test2Url: testis[1].url, test2VidUrl: testis[1].vidUrl,
    test3Label: testis[2].label, test3Url: testis[2].url, test3VidUrl: testis[2].vidUrl,
    test4Label: testis[3].label, test4Url: testis[3].url, test4VidUrl: testis[3].vidUrl,
    test5Label: testis[4].label, test5Url: testis[4].url, test5VidUrl: testis[4].vidUrl,
    test6Label: testis[5].label, test6Url: testis[5].url, test6VidUrl: testis[5].vidUrl,
    test7Label: testis[6].label, test7Url: testis[6].url, test7VidUrl: testis[6].vidUrl,
    shippingInfo: p.shippingInfo ?? '',
    coverage: p.coverage ?? '',
    active: p.active,
  }
}

function formToPayload(f: ProductFormState, existingProduct?: Product | null) {
  // Aplanar imagen y video de testimonios en el array final
  const testimonialsVideoUrls: Array<{ label: string, url: string, type?: string }> = []

  for (let i = 1; i <= 7; i++) {
    const lbl = f[`test${i}Label` as keyof ProductFormState] as string
    const url = f[`test${i}Url` as keyof ProductFormState] as string
    const vid = f[`test${i}VidUrl` as keyof ProductFormState] as string

    if (url.trim()) testimonialsVideoUrls.push({ label: lbl.trim(), url: url.trim() })
    if (vid.trim()) testimonialsVideoUrls.push({ label: lbl.trim(), url: vid.trim(), type: 'video' })
  }

  const productVideoUrls = [f.vid1, f.vid2].map(s => s.trim()).filter(Boolean)

  return {
    name: f.name.trim(),
    category: f.category.trim() || null,
    benefits: f.benefits.trim() || null,
    usage: f.usage.trim() || null,
    warnings: f.warnings.trim() || null,
    priceUnit: f.priceUnit ? parseFloat(f.priceUnit) : null,
    pricePromo2: f.pricePromo2 ? parseFloat(f.pricePromo2) : null,
    priceSuper6: f.priceSuper6 ? parseFloat(f.priceSuper6) : null,
    currency: f.currency || 'USD',
    welcomeMessage: f.welcomeMessage.trim() || null,
    firstMessage: f.firstMessage.trim() || null,
    hooks: f.hooks.split('\n').map((s: string) => s.trim()).filter(Boolean),
    imageMainUrls: [f.img1, f.img2, f.img3, f.img4, f.img5, f.img6, f.img7, f.img8].map((s: string) => s.trim()).filter(Boolean),
    productVideoUrls, // Added productVideoUrls explicitly back in
    // Preservar URLs de precios si ya existían para evitar pérdida de datos heredados
    imagePriceUnitUrl: existingProduct?.imagePriceUnitUrl || null,
    imagePricePromoUrl: existingProduct?.imagePricePromoUrl || null,
    imagePriceSuperUrl: existingProduct?.imagePriceSuperUrl || null,
    testimonialsVideoUrls,
    shippingInfo: f.shippingInfo.trim() || null,
    coverage: f.coverage.trim() || null,
    tags: existingProduct?.tags || [],
    active: f.active,
  }
}

function ProductForm({
  botId,
  product,
  onSaved,
  onCancel,
}: {
  botId: string
  product: Product | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ProductFormState>(
    product ? productToForm(product) : EMPTY_PRODUCT,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (key: keyof ProductFormState, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = formToPayload(form, product)
      const url = product
        ? `/api/bots/${botId}/products/${product.id}`
        : `/api/bots/${botId}/products`
      const method = product ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error guardando producto')
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-neon-green/40'
  const textareaClass = `${inputClass} resize-y`
  const labelClass = 'block text-xs font-medium text-dark-300 mb-1.5'
  const sectionClass = 'glass-panel p-5 rounded-2xl space-y-4'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-green" />
          {product ? 'Editar producto' : 'Nuevo producto'}
        </h3>
        <button type="button" onClick={onCancel} className="text-dark-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <Alert type="error" msg={error} />}

      {/* Basic info */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Información básica</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre del producto *</label>
            <input
              required
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="ej: Gel de Aloe Vera"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              value={form.category}
              onChange={e => setField('category', e.target.value)}
              className={`${inputClass} appearance-none bg-dark-900/50`}
            >
              <option value="">Selecciona una categoría...</option>
              <option value="Salud y Bienestar">Salud y Bienestar</option>
              <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
              <option value="Electrónica y Gadgets">Electrónica y Gadgets</option>
              <option value="Hogar y Cocina">Hogar y Cocina</option>
              <option value="Deportes y Fitness">Deportes y Fitness</option>
              <option value="Moda y Accesorios">Moda y Accesorios</option>
              <option value="Juguetes y Bebés">Juguetes y Bebés</option>
              <option value="Mascotas">Mascotas</option>
              <option value="Herramientas y Automotriz">Herramientas y Automotriz</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Primer mensaje del producto identificado</label>
          <textarea
            rows={3}
            value={form.firstMessage}
            onChange={e => setField('firstMessage', e.target.value)}
            placeholder="Hola {nombre}! Te presento nuestro increíble producto..."
            className={textareaClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setField('active', !form.active)}
            className="flex items-center gap-2 text-sm"
          >
            {form.active ? (
              <ToggleRight className="w-7 h-7 text-neon-green" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-dark-500" />
            )}
            <span className={form.active ? 'text-neon-green font-medium' : 'text-dark-400'}>
              {form.active ? 'Producto activo' : 'Producto inactivo'}
            </span>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Descripción</div>
        <div>
          <label className={labelClass}>Beneficios</label>
          <textarea
            rows={3}
            value={form.benefits}
            onChange={e => setField('benefits', e.target.value)}
            placeholder="te ayuda en..."
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>Modo de uso</label>
          <textarea
            rows={2}
            value={form.usage}
            onChange={e => setField('usage', e.target.value)}
            placeholder="Aplicar 1 veces al día en área limpia..."
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>Advertencias / contraindicaciones</label>
          <textarea
            rows={2}
            value={form.warnings}
            onChange={e => setField('warnings', e.target.value)}
            placeholder="No aplicar en heridas abiertas..."
            className={textareaClass}
          />
        </div>
      </div>

      {/* Prices */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Precios</div>
        <div>
          <label className={labelClass}>Moneda</label>
          <select
            value={form.currency}
            onChange={e => setField('currency', e.target.value)}
            className={inputClass}
          >
            <option value="USD">$ Dólar estadounidense (USD)</option>
            <option value="EUR">€ Euro (EUR)</option>
            <option value="BOB">Bs. Boliviano boliviano (BOB)</option>
            <option value="PEN">S/ Sol peruano (PEN)</option>
            <option value="COP">$ Peso colombiano (COP)</option>
            <option value="ARS">$ Peso argentino (ARS)</option>
            <option value="MXN">$ Peso mexicano (MXN)</option>
            <option value="CLP">$ Peso chileno (CLP)</option>
            <option value="GTQ">Q Quetzal guatemalteco (GTQ)</option>
            <option value="HNL">L Lempira hondureño (HNL)</option>
            <option value="NIO">C$ Córdoba nicaragüense (NIO)</option>
            <option value="CRC">₡ Colón costarricense (CRC)</option>
            <option value="PAB">B/. Balboa panameño (PAB)</option>
            <option value="DOP">RD$ Peso dominicano (DOP)</option>
            <option value="UYU">$ Peso uruguayo (UYU)</option>
            <option value="PYG">₲ Guaraní paraguayo (PYG)</option>
            <option value="BRL">R$ Real brasileño (BRL)</option>
            <option value="VES">Bs.S Bolívar venezolano (VES)</option>
            <option value="CUP">$ Peso cubano (CUP)</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Precio unitario</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.priceUnit}
              onChange={e => setField('priceUnit', e.target.value)}
              placeholder="25.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio promo ×2</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.pricePromo2}
              onChange={e => setField('pricePromo2', e.target.value)}
              placeholder="45.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio súper ×6</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.priceSuper6}
              onChange={e => setField('priceSuper6', e.target.value)}
              placeholder="120.00"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className={sectionClass}>
        <div>
          <div className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3">Imágenes principales</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['img1', 'img2', 'img3'] as const).map((key, i) => (
              <input
                key={key}
                value={form[key]}
                onChange={e => setField(key, e.target.value)}
                placeholder={`Foto principal ${i + 1}`}
                className={inputClass}
              />
            ))}
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus className="w-3 h-3 text-neon-green" />
            Más fotos del producto
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(['img4', 'img5', 'img6', 'img7', 'img8'] as const).map((key, i) => (
              <input
                key={key}
                value={form[key]}
                onChange={e => setField(key, e.target.value)}
                placeholder={`Foto adicional ${i + 1}`}
                className={inputClass}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            Videos del producto (URLs)
          </div>
          <p className="text-xs text-dark-500 mb-3">URLs directas a archivos .mp4 (ej: de Cloudinary o Supabase). El bot enviará estos videos si el cliente quiere ver el producto en acción.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['vid1', 'vid2'] as const).map((key, i) => (
              <input
                key={key}
                value={form[key as keyof ProductFormState] as string}
                onChange={e => setField(key, e.target.value)}
                placeholder={`Video URL ${i + 1} (https://...)`}
                className={inputClass}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Images */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Fotos de testimonios</div>
        <p className="text-xs text-dark-500 mb-3">El bot enviará estas fotos cuando el cliente tenga dudas o pida evidencias visuales.</p>
        <div className="space-y-2">
          <div className="hidden sm:grid sm:grid-cols-[1fr_2fr] gap-2 px-1">
            <span className="text-xs text-dark-500 font-medium">Nombre / Tipo</span>
            <span className="text-xs text-dark-500 font-medium">URL de la Foto (https://...)</span>
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map(n => {
            const labelKey = `test${n}Label` as keyof ProductFormState
            const urlKey = `test${n}Url` as keyof ProductFormState
            return (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2">
                <input
                  value={form[labelKey] as string}
                  onChange={e => setField(labelKey, e.target.value)}
                  placeholder="Ej: Testimonio manchas…"
                  className={inputClass}
                />
                <input
                  value={form[urlKey] as string}
                  onChange={e => setField(urlKey, e.target.value)}
                  placeholder="IMG URL (https://...)"
                  className={inputClass}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Testimonial Videos */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider flex items-center gap-2">
          Videos de testimonios <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded border border-neon-purple/30">NUEVO</span>
        </div>
        <p className="text-xs text-dark-500 mb-3">URLs directas a MP4. El bot enviará estos videos cuando detecte que el cliente necesita un nivel mayor de confianza.</p>
        <div className="space-y-2">
          <div className="hidden sm:grid sm:grid-cols-[1fr_2fr] gap-2 px-1">
            <span className="text-xs text-dark-500 font-medium">Nombre / Tipo del Video</span>
            <span className="text-xs text-dark-500 font-medium">URL del Video (.mp4)</span>
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map(n => {
            const labelKey = `test${n}Label` as keyof ProductFormState
            const vidUrlKey = `test${n}VidUrl` as keyof ProductFormState
            return (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2">
                <input
                  value={form[labelKey] as string}
                  onChange={e => setField(labelKey, e.target.value)}
                  placeholder="Ej: Video antes y después"
                  className={inputClass}
                  title="El nombre se comparte con el de la foto"
                />
                <input
                  value={form[vidUrlKey] as string}
                  onChange={e => setField(vidUrlKey, e.target.value)}
                  placeholder="VID URL (https://...mp4)"
                  className={inputClass}
                />
              </div>
            )
          })}
        </div>
      </div>


      {/* Shipping & coverage */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Envío & cobertura</div>
        <div>
          <label className={labelClass}>Info de envío</label>
          <textarea
            rows={2}
            value={form.shippingInfo}
            onChange={e => setField('shippingInfo', e.target.value)}
            placeholder="Envíos a todo el país en 24-48 hrs. Costo: $/15..."
            className={textareaClass}
          />
        </div>
        <div>
          <label className={labelClass}>Cobertura</label>
          <input
            value={form.coverage}
            onChange={e => setField('coverage', e.target.value)}
            placeholder="La paz, Cochabamba, Santa cruz..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Hooks */}
      <div className={sectionClass}>
        <div className="text-xs font-bold text-dark-400 uppercase tracking-wider">Hooks (keywords)</div>
        <div>
          <label className={labelClass}>Palabras clave – una por línea</label>
          <textarea
            rows={3}
            value={form.hooks}
            onChange={e => setField('hooks', e.target.value)}
            placeholder="precio&#10;quiero comprar&#10;cuánto cuesta"
            className={`${textareaClass} font-mono`}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-dark-800 border border-white/10 text-dark-300 font-medium rounded-xl hover:bg-dark-700 transition-colors text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-neon-green text-dark-950 font-bold rounded-xl hover:bg-neon-green/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm"
        >
          {loading ? <Spinner /> : <Save className="w-4 h-4" />}
          {product ? 'Actualizar' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab({ bot }: { bot: Bot }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bots/${bot.id}/products`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
      }
    } finally {
      setLoading(false)
    }
  }, [bot.id])

  useEffect(() => { loadProducts() }, [loadProducts])

  async function handleDelete(productId: string) {
    if (!confirm('¿Eliminar este producto?')) return
    setDeleting(productId)
    try {
      await fetch(`/api/bots/${bot.id}/products/${productId}`, { method: 'DELETE' })
      setProducts(ps => ps.filter(p => p.id !== productId))
    } finally {
      setDeleting(null)
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  function handleFormClose() {
    setShowForm(false)
    setEditingProduct(null)
  }

  function handleFormSaved() {
    handleFormClose()
    loadProducts()
  }

  if (showForm) {
    return (
      <ProductForm
        botId={bot.id}
        product={editingProduct}
        onSaved={handleFormSaved}
        onCancel={handleFormClose}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-dark-400">
          {products.length} producto{products.length !== 1 ? 's' : ''} configurado{products.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-neon-green text-dark-950 font-bold rounded-xl text-sm hover:bg-neon-green/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-dark-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <ShoppingBag className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <div className="text-dark-400 text-sm">Sin productos aún</div>
          <div className="text-dark-500 text-xs mt-1">
            Agrega productos para que el bot pueda responder sobre ellos.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div
              key={product.id}
              className="glass-panel p-4 rounded-xl flex items-center gap-4 group hover:bg-white/5 transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${product.active ? 'bg-neon-green shadow-[0_0_6px_rgba(0,255,157,0.5)]' : 'bg-dark-600'
                  }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{product.name}</div>
                <div className="text-xs text-dark-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  {product.category && <span>{product.category}</span>}
                  {product.priceUnit && <span>{product.currency ?? 'USD'} {product.priceUnit}</span>}
                  {product.imageMainUrls.length > 0 && (
                    <span>{product.imageMainUrls.length} img</span>
                  )}
                  {!product.active && (
                    <span className="text-dark-600 italic">inactivo</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-dark-400 hover:text-white"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deleting === product.id}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-dark-400 hover:text-red-400 disabled:opacity-50"
                  title="Eliminar"
                >
                  {deleting === product.id ? <Spinner /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── QR Tab (solo para bots BAILEYS) ─────────────────────────────────────────

type BaileysStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected'

// ─── Follow-up Tab ────────────────────────────────────────────────────────────

function FollowUpTab({
  bot,
  onSaved,
}: {
  bot: Bot
  onSaved: (updated: Partial<Bot>) => void
}) {
  const [f1, setF1] = useState(bot.followUp1Delay)
  const [f2, setF2] = useState(bot.followUp2Delay)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUp1Delay: Number(f1),
          followUp2Delay: Number(f2),
        }),
      })
      if (!res.ok) throw new Error('Error al guardar configuración')
      const data = await res.json()
      onSaved(data.bot)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configuración de Seguimientos</h3>
            <p className="text-sm text-dark-400 mt-0.5">Define los intervalos para re-interactuar con clientes.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-dark-300 uppercase tracking-widest pl-1">
              1er Seguimiento
            </label>
            <div className="relative group">
              <input
                type="number"
                min="1"
                value={f1}
                onChange={e => setF1(Number(e.target.value))}
                className="w-full bg-dark-900/50 border border-white/10 group-hover:border-white/20 focus:border-neon-green/40 rounded-xl px-4 py-3 text-sm text-white transition-all outline-none"
                placeholder="Ej: 15"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-dark-500 font-bold uppercase tracking-tighter">Minutos</span>
            </div>
            <p className="text-[10px] text-dark-500 italic pl-1">Por defecto: 15 min.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-dark-300 uppercase tracking-widest pl-1">
              2do Seguimiento
            </label>
            <div className="relative group">
              <input
                type="number"
                min="1"
                value={f2}
                onChange={e => setF2(Number(e.target.value))}
                className="w-full bg-dark-900/50 border border-white/10 group-hover:border-white/20 focus:border-neon-green/40 rounded-xl px-4 py-3 text-sm text-white transition-all outline-none"
                placeholder="Ej: 4320"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-dark-500 font-bold uppercase tracking-tighter">Minutos</span>
            </div>
            <p className="text-[10px] text-dark-500 italic pl-1">Por defecto: 4320 min (3 días).</p>
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4 pt-2">
            <div className="flex-1">
              {error && <Alert type="error" msg={error} />}
              {success && <Alert type="success" msg="¡Configuración guardada!" />}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-neon-green text-black rounded-xl text-sm font-bold hover:bg-neon-green/90 transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-neon-green/10"
            >
              {saving ? <Spinner /> : <Check className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      <div className="bg-neon-green/5 border border-neon-green/10 rounded-2xl p-4 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-neon-green" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">¿Cómo funciona?</h4>
          <p className="text-xs text-dark-300 mt-1 leading-relaxed">
            El sistema calculará el tiempo desde el <strong>último mensaje enviado por el bot</strong>.
            Si el cliente no responde en ese intervalo, el bot enviará un mensaje automático.
            Los seguimientos se detienen si el cliente compra o si vuelve a escribir.
          </p>
        </div>
      </div>
    </div>
  )
}

function QRTab({ bot }: { bot: Bot }) {
  const [status, setStatus] = useState<BaileysStatus>('disconnected')
  const [qrBase64, setQrBase64] = useState<string | undefined>()
  const [phone, setPhone] = useState<string | undefined>(bot.baileysPhone ?? undefined)
  const [connecting, setConnecting] = useState(false)
  const [clearingMemory, setClearingMemory] = useState(false)
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  // Polling: actualizar estado cada 3 segundos cuando no está 'connected'
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    async function poll() {
      try {
        const res = await fetch(`/api/bots/${bot.id}/baileys/status`)
        if (!res.ok) return
        const data = await res.json()
        setStatus(data.status)
        setQrBase64(data.qrBase64)
        if (data.phone) setPhone(data.phone)
      } catch { /* ignore */ }
    }
    poll()
    if (status !== 'connected') {
      interval = setInterval(poll, 3000)
    }
    return () => clearInterval(interval)
  }, [bot.id, status])

  async function handleConnect() {
    setConnecting(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}/baileys/connect`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al conectar')
      setStatus('connecting')
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar y borrar sesión? Deberás escanear el QR de nuevo.')) return
    await fetch(`/api/bots/${bot.id}/baileys/status`, { method: 'DELETE' })
    setStatus('disconnected')
    setQrBase64(undefined)
    setPhone(undefined)
    setMsg({ type: 'success', text: 'Sesión borrada correctamente.' })
  }

  async function handleClearMemory() {
    if (!confirm('¿Eliminar todas las conversaciones de este bot? El bot olvidará el historial de todos los clientes. Esta acción no se puede deshacer.')) return
    setClearingMemory(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/bots/${bot.id}/clear-memory`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al limpiar')
      setMsg({ type: 'success', text: `Memoria limpiada — ${data.conversationsDeleted} conversación(es) eliminada(s).` })
    } catch (err: unknown) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setClearingMemory(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estado */}
      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            {status === 'connected'
              ? <Wifi className="w-4 h-4 text-neon-green" />
              : <WifiOff className="w-4 h-4 text-dark-400" />}
            {status === 'connected' ? 'Conectado' : status === 'qr_ready' ? 'Esperando escaneo' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
          </div>
          {phone && <div className="text-xs text-dark-400 mt-0.5">📱 +{phone}</div>}
        </div>
        <div className="flex gap-2">
          {status === 'connected' ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-colors"
            >
              <WifiOff className="w-3.5 h-3.5" /> Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting || status === 'connecting' || status === 'qr_ready'}
              className="flex items-center gap-2 px-3 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {connecting || status === 'connecting' ? <Spinner /> : <RefreshCw className="w-3.5 h-3.5" />}
              {status === 'qr_ready' ? 'Escanea el QR' : 'Conectar'}
            </button>
          )}
        </div>
      </div>

      {msg && <Alert type={msg.type} msg={msg.text} />}

      {/* QR */}
      {status === 'qr_ready' && qrBase64 && (
        <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
          <div className="flex items-center gap-2 justify-center text-sm font-bold text-white">
            <QrCode className="w-4 h-4 text-neon-green" />
            Escanea con WhatsApp
          </div>
          <p className="text-xs text-dark-400">
            Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
          </p>
          <div className="flex justify-center">
            <img
              src={qrBase64}
              alt="QR WhatsApp"
              className="w-56 h-56 rounded-2xl border-4 border-neon-green/30 bg-white p-2"
            />
          </div>
          <p className="text-[11px] text-dark-500">El QR se actualiza automáticamente cada 20 segundos.</p>
        </div>
      )}

      {/* Conectado */}
      {status === 'connected' && (
        <div className="glass-panel p-6 rounded-2xl border border-neon-green/20 text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mx-auto">
            <Wifi className="w-6 h-6 text-neon-green" />
          </div>
          <div className="text-sm font-bold text-white">¡Bot conectado correctamente!</div>
          <div className="text-xs text-dark-400">El bot está activo y respondiendo mensajes en WhatsApp.</div>
        </div>
      )}

      {/* Desconectado - instrucciones */}
      {status === 'disconnected' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-3">Pasos para conectar</h3>
          <ol className="space-y-3">
            {['Presiona "Conectar" arriba', 'Espera a que aparezca el código QR', 'Abre WhatsApp en tu teléfono', 'Ve a Dispositivos vinculados → Vincular dispositivo', 'Escanea el QR con tu cámara'].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-dark-300">
                <span className="w-5 h-5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
      {/* Zona peligrosa: limpiar memoria */}
      <div className="glass-panel p-4 rounded-2xl border border-red-500/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Limpiar memoria
            </div>
            <p className="text-xs text-dark-400 mt-0.5">
              Elimina el historial de conversaciones de todos los clientes.
            </p>
          </div>
          <button
            onClick={handleClearMemory}
            disabled={clearingMemory}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
          >
            {clearingMemory ? <Spinner /> : <Trash2 className="w-3.5 h-3.5" />}
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bot Detail View ──────────────────────────────────────────────────────────

function BotDetailView({
  bot: initialBot,
  onBack,
  onBotUpdated,
  onDeleted,
}: {
  bot: Bot
  onBack: () => void
  onBotUpdated: (updated: Bot) => void
  onDeleted: (botId: string) => void
}) {
  const [bot, setBot] = useState<Bot>(initialBot)
  const isBaileys = bot.type === 'BAILEYS'
  const [tab, setTab] = useState<Tab>(isBaileys ? 'qr' : 'webhook')
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(bot.name)
  const [savingName, setSavingName] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)

  async function toggleStatus() {
    setSavingStatus(true)
    const newStatus = bot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) handleBotPatch({ status: newStatus })
    } finally {
      setSavingStatus(false)
    }
  }

  function handleBotPatch(updated: Partial<Bot>) {
    const merged = { ...bot, ...updated }
    setBot(merged)
    onBotUpdated(merged)
  }

  async function saveName() {
    if (!newName.trim() || newName === bot.name) { setEditingName(false); return }
    setSavingName(true)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (res.ok) handleBotPatch(data.bot)
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el bot "${bot.name}" permanentemente?\n\nSe borrarán todas sus conversaciones, mensajes y productos. Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/bots/${bot.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(bot.id)
    } finally {
      setDeleting(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    ...(!isBaileys ? [{ id: 'webhook' as Tab, label: 'Webhook', icon: <Webhook className="w-3.5 h-3.5" /> }] : []),
    { id: 'credentials', label: 'Credenciales', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'prompt', label: 'Plantilla', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'products', label: 'Productos', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'followup', label: 'Seguimientos', icon: <Bell className="w-3.5 h-3.5" /> },
    ...(isBaileys ? [{ id: 'qr' as Tab, label: 'WhatsApp QR', icon: <QrCode className="w-3.5 h-3.5" /> }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-dark-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-neon-green" />
          </div>
          {editingName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
                className="bg-dark-900/50 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon-green/40 flex-1 max-w-xs"
              />
              <button onClick={saveName} disabled={savingName} className="text-neon-green hover:text-neon-green/80">
                {savingName ? <Spinner /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditingName(false)} className="text-dark-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white">{bot.name}</h2>
              <button
                onClick={() => { setNewName(bot.name); setEditingName(true) }}
                className="text-dark-500 hover:text-white transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={toggleStatus}
          disabled={savingStatus}
          title={bot.status === 'ACTIVE' ? 'Pausar bot' : 'Activar bot'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all disabled:opacity-50 ${bot.status === 'ACTIVE'
            ? 'bg-neon-green/10 text-neon-green border-neon-green/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
            : 'bg-dark-700/50 text-dark-400 border-dark-600 hover:bg-neon-green/10 hover:text-neon-green hover:border-neon-green/20'
            }`}
        >
          {savingStatus ? (
            <Spinner />
          ) : bot.status === 'ACTIVE' ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          {bot.status === 'ACTIVE' ? 'ACTIVO' : 'PAUSADO'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar bot"
          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-dark-500 hover:text-red-400 disabled:opacity-50"
        >
          {deleting ? <Spinner /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${tab === t.id
              ? 'bg-dark-700 text-white shadow-sm'
              : 'text-dark-400 hover:text-dark-200'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'webhook' && !isBaileys && <WebhookTab bot={bot} />}
      {tab === 'credentials' && (
        <CredentialsTab
          bot={bot}
          onStatusChange={status => handleBotPatch({ status })}
        />
      )}
      {tab === 'prompt' && (
        <PromptTab bot={bot} onSaved={handleBotPatch} />
      )}
      {tab === 'products' && <ProductsTab bot={bot} />}
      {tab === 'followup' && (
        <FollowUpTab bot={bot} onSaved={handleBotPatch} />
      )}
      {tab === 'qr' && isBaileys && <QRTab bot={bot} />}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [justCreatedWebhook, setJustCreatedWebhook] = useState<string | null>(null)

  async function loadBots() {
    setLoading(true)
    try {
      const res = await fetch('/api/bots')
      if (res.ok) {
        const data = await res.json()
        setBots(data.bots)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBots() }, [])

  function handleBotCreated(bot: Bot, webhookUrl: string) {
    setBots(prev => [bot, ...prev])
    setJustCreatedWebhook(webhookUrl)
    setSelectedBot(bot)
  }

  function handleSelectBot(bot: Bot) {
    setJustCreatedWebhook(null)
    setSelectedBot(bot)
  }

  function handleBack() {
    setSelectedBot(null)
    setJustCreatedWebhook(null)
  }

  function handleBotUpdated(updated: Bot) {
    setBots(prev => prev.map(b => (b.id === updated.id ? updated : b)))
    setSelectedBot(updated)
  }

  function handleBotDeleted(botId: string) {
    setBots(prev => prev.filter(b => b.id !== botId))
    setSelectedBot(null)
    setJustCreatedWebhook(null)
  }

  const activeBots = bots.filter(b => b.status === 'ACTIVE').length

  return (
    <div className="px-4 sm:px-6 pt-6 max-w-4xl mx-auto pb-20 fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/services"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 text-dark-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center border border-neon-green/20 shadow-[0_0_15px_rgba(0,255,157,0.15)]">
            <MessageCircle className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              WhatsApp Bots
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-neon-green/10 text-neon-green border border-neon-green/20">
                Multi-Tenant
              </span>
            </h1>
            <p className="text-sm text-dark-300">Configura y gestiona tus bots de venta con IA.</p>
          </div>
        </div>
      </div>

      {selectedBot ? (
        <BotDetailView
          bot={selectedBot}
          onBack={handleBack}
          onBotUpdated={handleBotUpdated}
          onDeleted={handleBotDeleted}
        />
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">{bots.length}</div>
              <div className="text-xs text-dark-400 mt-0.5">Total bots</div>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-neon-green">{activeBots}</div>
              <div className="text-xs text-dark-400 mt-0.5">Activos</div>
            </div>
            <div className="glass-panel p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-neon-blue">
                {bots.reduce((acc, b) => acc + (b._count?.products ?? 0), 0)}
              </div>
              <div className="text-xs text-dark-400 mt-0.5">Productos</div>
            </div>
          </div>

          {/* Create bot form */}
          <CreateBotForm onCreated={handleBotCreated} />

          {/* Bot list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-dark-400" />
            </div>
          ) : bots.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center">
              <Bot className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <div className="text-dark-300 font-medium mb-1">Sin bots configurados</div>
              <div className="text-dark-500 text-sm">
                Crea tu primer bot arriba para comenzar.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bots.map(bot => (
                <BotCard key={bot.id} bot={bot} onSelect={handleSelectBot} />
              ))}
            </div>
          )}

          {/* How it works */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-green" />
              ¿Cómo funciona?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Plus className="w-4 h-4" />, title: '1. Crea el bot', desc: 'Dale un nombre y obtén la URL de webhook.' },
                { icon: <Key className="w-4 h-4" />, title: '2. Configura credenciales', desc: 'Agrega tus API keys de YCloud y OpenAI.' },
                { icon: <ShoppingBag className="w-4 h-4" />, title: '3. Agrega productos', desc: 'Define la base de conocimiento del bot.' },
                { icon: <Settings className="w-4 h-4" />, title: '4. Conecta YCloud', desc: 'Apunta el webhook en tu panel de YCloud.' },
              ].map((step, i) => (
                <div key={i} className="bg-dark-900/30 rounded-xl p-4">
                  <div className="text-neon-green mb-2">{step.icon}</div>
                  <div className="text-xs font-bold text-white mb-1">{step.title}</div>
                  <div className="text-[11px] text-dark-400 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
