'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, Copy, Check, Share2, UserCircle2, X, Crown, Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { TreeNode } from '@/app/api/network/route'

// ── Tree line color ──────────────────────────────────────────────────────────
const LINE_COLOR = 'rgba(255,255,255,0.10)'

// ── CSS tree connectors ──────────────────────────────────────────────────────
const TREE_CSS = `
.mlm-children {
  display: flex; flex-wrap: nowrap; position: relative;
  padding-top: 28px; margin: 0; list-style: none; gap: 12px;
}
.mlm-children::before {
  content: ''; position: absolute; top: 0; left: 50%;
  width: 0; height: 28px; border-left: 1.5px solid ${LINE_COLOR};
}
.mlm-child {
  display: flex; flex-direction: column; align-items: center;
  position: relative; padding-top: 28px; min-width: 80px; flex: 1;
}
.mlm-child::before, .mlm-child::after {
  content: ''; position: absolute; top: 0; height: 28px;
}
.mlm-child::before { right: 50%; width: 50%; border-top: 1.5px solid ${LINE_COLOR}; }
.mlm-child::after  { left: 50%;  width: 50%; border-top: 1.5px solid ${LINE_COLOR}; border-left: 1.5px solid ${LINE_COLOR}; }
.mlm-child:only-child::before, .mlm-child:only-child::after { display: none; }
.mlm-child:first-child::before { border: none; }
.mlm-child:last-child::after   { border-left: none; }
.mlm-child:last-child::before  { border-right: 1.5px solid ${LINE_COLOR}; border-radius: 0 5px 0 0; }
.mlm-child:first-child::after  { border-radius: 5px 0 0 0; }
`

// ── Plan labels ──────────────────────────────────────────────────────────────
const PLAN_LABEL: Record<string, string> = {
  NONE: 'Sin plan', BASIC: 'Pack Básico', PRO: 'Pack Pro', ELITE: 'Pack Elite',
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ node, onClose }: { node: TreeNode; onClose: () => void }) {
  const active = node.isActive
  const plan = PLAN_LABEL[node.plan] ?? 'Sin plan'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden z-10 bg-[#111] border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${active ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
            {node.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{node.fullName}</p>
            <p className="text-xs text-white/35 mt-0.5">@{node.username}</p>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 border ${active ? 'bg-emerald-400/8 border-emerald-400/20 text-emerald-400' : 'bg-red-400/8 border-red-400/20 text-red-400'}`}>
              {active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/8 text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mx-5 h-px bg-white/6" />

        <div className="grid grid-cols-2 gap-2.5 p-5">
          <div className="col-span-2 bg-white/[0.03] border border-white/8 rounded-xl p-3.5 flex items-center gap-3">
            <Crown size={14} className="text-white/30 shrink-0" />
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest">Plan adquirido</p>
              <p className="text-sm font-medium text-white/70 mt-0.5">{plan}</p>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3.5">
            <Network size={13} className="text-white/30 mb-2" />
            <p className="text-2xl font-semibold text-white/80">{node.directCount}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">Directos</p>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3.5">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2">Nivel</p>
            <p className="text-2xl font-semibold text-white/80">{node.level}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Recursive tree node ───────────────────────────────────────────────────────
function RecursiveNode({ node, onDetail }: { node: TreeNode; onDetail: (n: TreeNode) => void }) {
  const active = node.isActive
  return (
    <li className="mlm-child">
      <div className="flex flex-col items-center gap-1.5 select-none" style={{ width: 80 }}>
        <div
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-base font-semibold cursor-pointer transition-all active:scale-90 border ${active ? 'bg-emerald-400/8 border-emerald-400/20 text-emerald-400' : 'bg-white/[0.03] border-white/10 text-white/30'}`}
          onClick={() => onDetail(node)}
        >
          {node.fullName.charAt(0).toUpperCase()}
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[8px] font-bold text-white/50">
            {node.level}
          </span>
        </div>
        <p className="text-[10px] font-medium text-white/60 text-center leading-tight w-full truncate px-1">
          {node.fullName.split(' ')[0]}
        </p>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className="mlm-children">
          {node.children.map(child => (
            <RecursiveNode key={child.id} node={child} onDetail={onDetail} />
          ))}
        </ul>
      )}
    </li>
  )
}

// ── Root card ─────────────────────────────────────────────────────────────────
function RootCard({ name, username, isActive }: { name: string; username: string; isActive: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-semibold border-2 bg-white/5 border-white/20 text-white/70">
        <UserCircle2 size={32} />
        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${isActive ? 'bg-emerald-400' : 'bg-red-400/70'}`} />
      </div>
      <p className="text-sm font-medium text-white/70 mt-0.5">{name}</p>
      <p className="text-[10px] text-white/25">@{username} · Tú</p>
    </div>
  )
}

// ── Pan & Zoom canvas ─────────────────────────────────────────────────────────
function PanZoomCanvas({ children, color = '#00F5FF' }: { children: React.ReactNode; color?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const lastDist = useRef(0)

  const MIN_SCALE = 0.3
  const MAX_SCALE = 2.5

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    lastPointer.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    setPos(p => ({ x: p.x + e.clientX - lastPointer.current.x, y: p.y + e.clientY - lastPointer.current.y }))
    lastPointer.current = { x: e.clientX, y: e.clientY }
  }, [])
  const onMouseUp = useCallback(() => { dragging.current = false }, [])

  // Scroll zoom
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => clampScale(s * delta))
  }, [])

  // Touch pan & pinch zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      dragging.current = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }
  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragging.current) {
      setPos(p => ({ x: p.x + e.touches[0].clientX - lastPointer.current.x, y: p.y + e.touches[0].clientY - lastPointer.current.y }))
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (lastDist.current > 0) {
        setScale(s => clampScale(s * (dist / lastDist.current)))
      }
      lastDist.current = dist
    }
  }, [])
  const onTouchEnd = useCallback(() => { dragging.current = false; lastDist.current = 0 }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onMouseMove, onMouseUp, onWheel, onTouchMove, onTouchEnd])

  const reset = () => { setPos({ x: 0, y: 0 }); setScale(1) }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        height: '65vh',
        cursor: dragging.current ? 'grabbing' : 'grab',
        touchAction: 'none',
        background: `linear-gradient(135deg, ${color}06, ${color}03)`,
        border: `1px solid ${color}20`,
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Barra neon superior */}
      <div className="absolute top-0 left-0 right-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }} />
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button onClick={() => setScale(s => clampScale(s * 1.2))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/50 border border-white/10 text-white/40 hover:text-white/70 transition-colors backdrop-blur-sm">
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setScale(s => clampScale(s * 0.8))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/50 border border-white/10 text-white/40 hover:text-white/70 transition-colors backdrop-blur-sm">
          <ZoomOut size={14} />
        </button>
        <button onClick={reset} className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/50 border border-white/10 text-white/40 hover:text-white/70 transition-colors backdrop-blur-sm">
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 left-3 z-10 text-[9px] text-white/20 font-mono bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/6">
        {Math.round(scale * 100)}%
      </div>

      {/* Canvas */}
      <div
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: 'center top',
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '40px',
          paddingBottom: '40px',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Network types ─────────────────────────────────────────────────────────────
interface NetworkData {
  referralCode: string
  user: { fullName: string; username: string; isActive: boolean }
  tree: TreeNode[]
  stats: { directReferrals: number; totalNetwork: number; totalActive: number; totalCommissions: number }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NetworkPage() {
  const [data, setData]       = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)
  const [detail, setDetail]   = useState<TreeNode | null>(null)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    fetch('/api/network')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function copyLink() {
    if (!data) return
    navigator.clipboard.writeText(`${baseUrl}/register?ref=${data.referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-white/25">Error al cargar la red</p>
      </div>
    )
  }

  const { stats, tree, referralCode, user } = data

  return (
    <div className="px-4 md:px-6 pt-6 max-w-screen-2xl mx-auto pb-24 text-white space-y-4">
      <style>{TREE_CSS}</style>

      {detail && <DetailModal node={detail} onClose={() => setDetail(null)} />}

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <Users size={18} className="text-white/40" /> Mi Red
        </h1>
        <p className="text-sm text-white/30 mt-0.5">
          {stats.totalNetwork} miembros · {stats.totalActive} activos
        </p>
      </div>

      {/* ── ÁRBOL (pan + zoom) ── */}
      <PanZoomCanvas>
        <div style={{ paddingBottom: 40 }}>
          <div className="flex flex-col items-center">
            <RootCard
              name={user.fullName}
              username={user.username}
              isActive={user.isActive}
            />

            {tree.length === 0 ? (
              <div className="mt-8 text-center px-6 py-8 rounded-2xl bg-white/[0.015] border border-dashed border-white/6" style={{ minWidth: 260 }}>
                <Users size={18} className="text-white/10 mx-auto mb-3" />
                <p className="text-white/25 text-sm">Aún no tienes referidos</p>
                <p className="text-white/15 text-xs mt-1">Comparte tu link y empieza a construir tu red</p>
              </div>
            ) : (
              <ul className="mlm-children">
                {tree.map(node => (
                  <RecursiveNode key={node.id} node={node} onDetail={setDetail} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </PanZoomCanvas>

      {/* ── HINT ── */}
      <p className="text-[10px] text-white/20 text-center">
        Arrastra para mover · Pellizca o usa los botones para zoom · Toca un avatar para ver detalles
      </p>

      {/* ── REFERRAL LINK ── */}
      <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #00FF8808, #00F5FF04)', border: '1px solid #00FF8822' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00FF8870, transparent)' }} />
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={13} className="text-white/35" />
          <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Tu link de referido</p>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/35">
            {referralCode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-xl px-3 py-2 font-mono text-xs truncate bg-white/[0.02] border border-white/6 text-white/25">
            {baseUrl}/register?ref={referralCode}
          </div>
          <button
            onClick={copyLink}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium uppercase tracking-wider transition-all active:scale-95 border ${copied ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70'}`}
          >
            {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>
      </div>

    </div>
  )
}
