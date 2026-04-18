'use client'

import { useEffect, useState, useRef } from 'react'
import { Settings, Save, Loader2, Check, QrCode, Upload, ExternalLink, Trash2, MessageCircle } from 'lucide-react'

const PACK_KEYS = [
  { key: 'PRICE_BASIC', label: 'Pack Básico', desc: 'Precio base para el pack de entrada', color: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/5' },
  { key: 'PRICE_PRO', label: 'Pack Pro', desc: 'Precio para el pack profesional', color: 'text-purple-400 border-purple-500/25 bg-purple-500/5' },
  { key: 'PRICE_ELITE', label: 'Pack Elite', desc: 'Precio para el pack premium (próximamente)', color: 'text-yellow-400 border-yellow-500/25 bg-yellow-500/5' },
]

export default function AdminSettingsPage() {
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [paymentQr, setPaymentQr] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [uploadingQr, setUploadingQr] = useState(false)
  const qrInputRef = useRef<HTMLInputElement>(null)
  const [storePaymentCrypto, setStorePaymentCrypto] = useState(false)
  const [storePaymentManual, setStorePaymentManual] = useState(false)
  const [savingToggle, setSavingToggle] = useState<string | null>(null)
  const [waGroupLink, setWaGroupLink] = useState('')
  const [savingWa, setSavingWa] = useState(false)
  // saved prices snapshot (what's actually in DB)
  const [savedPrices, setSavedPrices] = useState<Record<string, string>>({})
  const [sponsorshipPct, setSponsorshipPct] = useState('20')
  const [savedSponsorshipPct, setSavedSponsorshipPct] = useState('20')
  const [savingSponsor, setSavingSponsor] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {}
        d.settings?.forEach((s: { key: string; value: string }) => { map[s.key] = s.value })
        setPrices(map)
        setSavedPrices({ PRICE_BASIC: map['PRICE_BASIC'] ?? '49', PRICE_PRO: map['PRICE_PRO'] ?? '99', PRICE_ELITE: map['PRICE_ELITE'] ?? '199' })
        setPaymentQr(map['PAYMENT_QR_URL'] ?? '')
        setStorePaymentCrypto(map['STORE_PAYMENT_CRYPTO'] === 'true')
        setStorePaymentManual(map['STORE_PAYMENT_MANUAL'] === 'true')
        setWaGroupLink(map['WHATSAPP_GROUP_LINK'] ?? '')
        const pct = map['SPONSORSHIP_PCT'] ?? '20'
        setSponsorshipPct(pct)
        setSavedSponsorshipPct(pct)
        setLoading(false)
      })
  }, [])

  async function saveToggle(key: string, value: boolean) {
    setSavingToggle(key)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: value ? 'true' : 'false' }),
    })
    setSavingToggle(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  async function savePrice(key: string) {
    setSaving(key)
    const value = prices[key]
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      alert('Precio inválido')
      setSaving(null)
      return
    }
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(null)
    if (res.ok) {
      setSavedPrices(prev => ({ ...prev, [key]: value }))
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  async function uploadQr(file: File) {
    setUploadingQr(true)
    const fd = new FormData()
    fd.append('file', file)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
    const uploadData = await uploadRes.json()
    setUploadingQr(false)

    if (!uploadRes.ok || !uploadData.url) {
      alert(uploadData.error ?? 'Error al subir la imagen a Supabase Storage. Verifica que el bucket "uploads" exista y sea público.')
      return
    }

    setPaymentQr(uploadData.url)
    const saveRes = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'PAYMENT_QR_URL', value: uploadData.url }),
    })

    if (!saveRes.ok) {
      alert('La imagen se subió pero no se pudo guardar en la configuración. Inténtalo de nuevo.')
      return
    }

    setSaved('PAYMENT_QR_URL')
    setTimeout(() => setSaved(null), 2000)
  }

  async function removeQr() {
    setPaymentQr('')
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'PAYMENT_QR_URL', value: '' }),
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Settings size={18} className="text-white/50" /> Configuración
        </h1>
        <p className="text-xs text-white/30 mt-0.5">Gestiona precios y métodos de pago.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-purple-400" size={22} />
        </div>
      ) : (
        <>
          {/* Payment QR */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <QrCode size={11} /> QR de Pago Global
            </p>
            <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-white/50 mb-4">
                Este QR se muestra a los usuarios en la página de checkout para que realicen el pago. Sube el QR de tu billetera USDT u otro método de pago.
              </p>

              {paymentQr ? (
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-28 h-28 rounded-xl border border-white/10 overflow-hidden bg-white flex items-center justify-center shrink-0">
                    <img src={paymentQr} alt="QR de pago" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {saved === 'PAYMENT_QR_URL' && (
                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                          <Check size={10} /> Guardado
                        </span>
                      )}
                    </div>
                    <a
                      href={paymentQr}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink size={11} /> Ver QR completo
                    </a>
                    <div className="flex gap-2">
                      <button
                        onClick={() => qrInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-600/30 transition-colors"
                      >
                        <Upload size={11} /> Cambiar QR
                      </button>
                      <button
                        onClick={removeQr}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-600/25 transition-colors"
                      >
                        <Trash2 size={11} /> Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQr}
                  className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-white/10 rounded-xl text-white/30 hover:border-purple-500/40 hover:text-purple-400 transition-colors"
                >
                  {uploadingQr ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <QrCode size={24} className="text-white/20" />
                      <span className="text-xs font-bold">Subir imagen del QR de pago</span>
                      <span className="text-[10px] text-white/20">PNG, JPG · USDT, Binance Pay, etc.</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadQr(file)
                }}
              />
            </div>
          </div>

          {/* Pack prices */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Precios de Packs</p>
            {PACK_KEYS.map(({ key, label, desc, color }) => {
              const current = savedPrices[key]
              const draft = prices[key] ?? ''
              const changed = current && draft && draft !== current
              return (
                <div key={key} className={`rounded-2xl border p-4 ${color}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black">{label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
                      {current && (
                        <p className="text-[10px] mt-1.5 flex items-center gap-1">
                          <span className="text-white/40">Actual:</span>
                          <span className="font-black text-white/70">${current}</span>
                          {changed && (
                            <><span className="text-white/20 mx-1">→</span><span className="font-black text-amber-400">${draft}</span></>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">$</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={draft}
                          onChange={e => setPrices(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-24 bg-black/30 border border-white/15 rounded-xl pl-6 pr-3 py-2 text-sm font-bold text-white outline-none focus:border-white/30 text-right"
                        />
                      </div>
                      <button
                        onClick={() => savePrice(key)}
                        disabled={saving === key}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {saving === key ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : saved === key ? (
                          <><Check size={12} className="text-green-400" /> Actualizado</>
                        ) : (
                          <><Save size={12} /> Guardar</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bono de patrocinio */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Distribución de Bonos</p>
            <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">Bono de Patrocinio</p>
                  <p className="text-[10px] text-white/30 mt-0.5">% del precio del plan que recibe el sponsor directo al activarse un referido</p>
                  <p className="text-[10px] mt-1.5 flex items-center gap-1">
                    <span className="text-white/40">Actual:</span>
                    <span className="font-black text-white/70">{savedSponsorshipPct}%</span>
                    {sponsorshipPct !== savedSponsorshipPct && (
                      <><span className="text-white/20 mx-1">→</span><span className="font-black text-amber-400">{sponsorshipPct}%</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={sponsorshipPct}
                      onChange={e => setSponsorshipPct(e.target.value)}
                      className="w-20 bg-black/30 border border-white/15 rounded-xl pl-3 pr-6 py-2 text-sm font-bold text-white outline-none focus:border-purple-500/50 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">%</span>
                  </div>
                  <button
                    onClick={async () => {
                      const val = parseFloat(sponsorshipPct)
                      if (isNaN(val) || val <= 0 || val > 100) { alert('Porcentaje inválido (1–100)'); return }
                      setSavingSponsor(true)
                      await fetch('/api/admin/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: 'SPONSORSHIP_PCT', value: String(val) }),
                      })
                      setSavedSponsorshipPct(String(val))
                      setSavingSponsor(false)
                      setSaved('SPONSORSHIP_PCT')
                      setTimeout(() => setSaved(null), 2000)
                    }}
                    disabled={savingSponsor}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                  >
                    {savingSponsor ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : saved === 'SPONSORSHIP_PCT' ? (
                      <><Check size={12} className="text-green-400" /> Actualizado</>
                    ) : (
                      <><Save size={12} /> Guardar</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tienda — métodos de pago */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Tienda — Métodos de Pago</p>
            <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-4 space-y-4">
              <p className="text-xs text-white/40">Activa los métodos de pago disponibles en el carrito de la tienda. El QR que se muestra es el mismo configurado arriba.</p>

              {/* Crypto toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Pago con Cripto (USDT)</p>
                  <p className="text-[11px] text-white/35 mt-0.5">WalletConnect / USDT-BEP20. Verificación automática en blockchain.</p>
                </div>
                <button
                  onClick={async () => {
                    const next = !storePaymentCrypto
                    setStorePaymentCrypto(next)
                    await saveToggle('STORE_PAYMENT_CRYPTO', next)
                  }}
                  disabled={savingToggle === 'STORE_PAYMENT_CRYPTO'}
                  style={{
                    width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: storePaymentCrypto ? '#00FF88' : 'rgba(255,255,255,0.12)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: storePaymentCrypto ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                  }} />
                </button>
              </div>

              {/* Manual toggle */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">Pago con Comprobante (QR)</p>
                  <p className="text-[11px] text-white/35 mt-0.5">El usuario sube URL del comprobante. El admin verifica y aprueba manualmente.</p>
                </div>
                <button
                  onClick={async () => {
                    const next = !storePaymentManual
                    setStorePaymentManual(next)
                    await saveToggle('STORE_PAYMENT_MANUAL', next)
                  }}
                  disabled={savingToggle === 'STORE_PAYMENT_MANUAL'}
                  style={{
                    width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: storePaymentManual ? '#00FF88' : 'rgba(255,255,255,0.12)',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: storePaymentManual ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                  }} />
                </button>
              </div>

              {saved === 'STORE_PAYMENT_CRYPTO' || saved === 'STORE_PAYMENT_MANUAL' ? (
                <p className="text-[11px] text-green-400 flex items-center gap-1"><Check size={10} /> Guardado</p>
              ) : null}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-4">
            <p className="text-[11px] text-white/30 leading-relaxed">
              <strong className="text-white/50">Flujo de compra:</strong> El usuario selecciona un pack → ve el QR de pago y los detalles → realiza el pago → sube su comprobante → tú revisas el comprobante y apruebas manualmente desde la sección <em>Compras</em>.
            </p>
          </div>

          {/* WhatsApp Group Link */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <MessageCircle size={11} /> Grupo de WhatsApp
            </p>
            <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-white/50">
                Este enlace se muestra en la landing y en el dashboard para que los usuarios se unan al grupo de WhatsApp de la comunidad.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={waGroupLink}
                  onChange={e => setWaGroupLink(e.target.value)}
                  className="flex-1 bg-black/30 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500/50 placeholder:text-white/20"
                />
                <button
                  onClick={async () => {
                    setSavingWa(true)
                    await fetch('/api/admin/settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'WHATSAPP_GROUP_LINK', value: waGroupLink.trim() }),
                    })
                    setSavingWa(false)
                    setSaved('WA_GROUP')
                    setTimeout(() => setSaved(null), 2000)
                  }}
                  disabled={savingWa}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50 shrink-0"
                >
                  {savingWa ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : saved === 'WA_GROUP' ? (
                    <><Check size={12} /> Guardado</>
                  ) : (
                    <><Save size={12} /> Guardar</>
                  )}
                </button>
              </div>
              {waGroupLink && (
                <a href={waGroupLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300">
                  <ExternalLink size={11} /> Ver enlace
                </a>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
