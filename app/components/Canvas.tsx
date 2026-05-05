'use client'

import React, { useEffect, useRef, useState } from 'react'

type Path = { id: string; d: string }
type Img = { id: string; src: string; x: number; y: number; w: number; h: number }
type HandleId = 'tl' | 'tr' | 'bl' | 'br'
type Mode = 'draw' | 'select'
type Action =
  | { kind: 'idle' }
  | { kind: 'pan'; ox: number; oy: number; otx: number; oty: number }
  | { kind: 'draw' }
  | { kind: 'move'; id: string; owx: number; owy: number; oix: number; oiy: number }
  | { kind: 'resize'; id: string; handle: HandleId; owx: number; owy: number; orig: Img }

const HANDLE_CURSOR: Record<HandleId, string> = {
  tl: 'nwse-resize', tr: 'nesw-resize',
  bl: 'nesw-resize', br: 'nwse-resize',
}

export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null)

  const [paths, setPaths] = useState<Path[]>([])
  const [images, setImages] = useState<Img[]>([])
  const [livePath, setLivePath] = useState('')
  const [view, setView] = useState({ x: 0, y: 0, s: 1 })
  const [mode, setMode] = useState<Mode>('draw')
  const [sel, setSel] = useState<string | null>(null)

  // Mutable refs for event handlers (avoid stale closures)
  const vRef = useRef({ x: 0, y: 0, s: 1 })
  const action = useRef<Action>({ kind: 'idle' })
  const modeRef = useRef<Mode>('draw')
  const selRef = useRef<string | null>(null)
  const imgsRef = useRef<Img[]>([])
  const liveRef = useRef('')

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { selRef.current = sel }, [sel])
  useEffect(() => { imgsRef.current = images }, [images])

  const flush = () => setView({ ...vRef.current })

  const toWorld = (sx: number, sy: number) => ({
    x: (sx - vRef.current.x) / vRef.current.s,
    y: (sy - vRef.current.y) / vRef.current.s,
  })

  // ── Wheel: pinch/ctrl = zoom, else = pan ──────────────────────────────────
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const v = vRef.current
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.06 : 1 / 1.06
      const ns = Math.max(0.05, Math.min(20, v.s * factor))
      const r = ns / v.s
      vRef.current = { x: e.clientX - r * (e.clientX - v.x), y: e.clientY - r * (e.clientY - v.y), s: ns }
    } else {
      vRef.current = { ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }
    }
    flush()
  }

  // ── SVG pointer events ─────────────────────────────────────────────────────
  const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Middle mouse or alt+left = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      action.current = { kind: 'pan', ox: e.clientX, oy: e.clientY, otx: vRef.current.x, oty: vRef.current.y }
      svgRef.current!.setPointerCapture(e.pointerId)
      return
    }
    if (e.button !== 0) return

    if (modeRef.current === 'draw') {
      const w = toWorld(e.clientX, e.clientY)
      liveRef.current = `M ${w.x.toFixed(1)} ${w.y.toFixed(1)}`
      setLivePath(liveRef.current)
      action.current = { kind: 'draw' }
      svgRef.current!.setPointerCapture(e.pointerId)
    } else {
      setSel(null)
      selRef.current = null
    }
  }

  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = action.current
    if (a.kind === 'pan') {
      const v = vRef.current
      vRef.current = { ...v, x: a.otx + (e.clientX - a.ox), y: a.oty + (e.clientY - a.oy) }
      flush()
    } else if (a.kind === 'draw') {
      const w = toWorld(e.clientX, e.clientY)
      liveRef.current += ` L ${w.x.toFixed(1)} ${w.y.toFixed(1)}`
      setLivePath(liveRef.current)
    } else if (a.kind === 'move') {
      const w = toWorld(e.clientX, e.clientY)
      setImages(prev => prev.map(img => img.id === a.id
        ? { ...img, x: a.oix + (w.x - a.owx), y: a.oiy + (w.y - a.owy) }
        : img
      ))
    } else if (a.kind === 'resize') {
      const w = toWorld(e.clientX, e.clientY)
      const dx = w.x - a.owx
      const o = a.orig
      const ar = o.w / o.h
      const minW = 40 / vRef.current.s
      setImages(prev => prev.map(img => {
        if (img.id !== a.id) return img
        let nw = (a.handle === 'br' || a.handle === 'tr') ? o.w + dx : o.w - dx
        nw = Math.max(minW, nw)
        const nh = nw / ar
        const nx = (a.handle === 'bl' || a.handle === 'tl') ? o.x + o.w - nw : o.x
        const ny = (a.handle === 'tr' || a.handle === 'tl') ? o.y + o.h - nh : o.y
        return { ...img, x: nx, y: ny, w: nw, h: nh }
      }))
    }
  }

  const onSvgPointerUp = () => {
    if (action.current.kind === 'draw' && liveRef.current) {
      setPaths(prev => [...prev, { id: crypto.randomUUID(), d: liveRef.current }])
      liveRef.current = ''
      setLivePath('')
    }
    action.current = { kind: 'idle' }
  }

  // ── Image pointer events (select mode only) ────────────────────────────────
  const onImagePointerDown = (e: React.PointerEvent<SVGImageElement>, id: string) => {
    if (modeRef.current !== 'select') return
    e.stopPropagation()
    setSel(id)
    selRef.current = id
    const img = imgsRef.current.find(i => i.id === id)!
    const w = toWorld(e.clientX, e.clientY)
    action.current = { kind: 'move', id, owx: w.x, owy: w.y, oix: img.x, oiy: img.y }
    svgRef.current!.setPointerCapture(e.pointerId)
  }

  const onHandlePointerDown = (e: React.PointerEvent<SVGRectElement>, handle: HandleId) => {
    e.stopPropagation()
    const id = selRef.current!
    const img = imgsRef.current.find(i => i.id === id)!
    const w = toWorld(e.clientX, e.clientY)
    action.current = { kind: 'resize', id, handle, owx: w.x, owy: w.y, orig: { ...img } }
    svgRef.current!.setPointerCapture(e.pointerId)
  }

  // ── Paste images from clipboard ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const blob = item.getAsFile()
      if (!blob) return
      const src = URL.createObjectURL(blob)
      const el = new Image()
      el.onload = () => {
        const v = vRef.current
        const maxW = 500 / v.s
        const scale = Math.min(1, maxW / el.naturalWidth)
        const w = el.naturalWidth * scale
        const h = el.naturalHeight * scale
        const cx = (window.innerWidth / 2 - v.x) / v.s
        const cy = (window.innerHeight / 2 - v.y) / v.s
        setImages(prev => [...prev, { id: crypto.randomUUID(), src, x: cx - w / 2, y: cy - h / 2, w, h }])
      }
      el.src = src
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [])

  useEffect(() => {
    return () => { imgsRef.current.forEach(img => URL.revokeObjectURL(img.src)) }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  const selImg = mode === 'select' ? images.find(i => i.id === sel) : undefined
  const toScreen = (wx: number, wy: number) => ({
    x: wx * view.s + view.x,
    y: wy * view.s + view.y,
  })
  const H = 8

  const dotSpacing = 20 * view.s
  const dotOffX = ((view.x % dotSpacing) + dotSpacing) % dotSpacing
  const dotOffY = ((view.y % dotSpacing) + dotSpacing) % dotSpacing

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f7f7f7', userSelect: 'none' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, background: '#fff', borderRadius: 10,
        padding: '6px 8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', zIndex: 10,
        alignItems: 'center',
      }}>
        <ToolBtn active={mode === 'draw'} onClick={() => setMode('draw')} title="Draw">
          <PencilIcon />
        </ToolBtn>
        <ToolBtn active={mode === 'select'} onClick={() => setMode('select')} title="Select & move">
          <SelectIcon />
        </ToolBtn>
        <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
        <ToolBtn active={false} onClick={() => { setPaths([]); setImages([]); setSel(null) }} title="Clear canvas">
          <TrashIcon />
        </ToolBtn>
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        fontSize: 12, color: '#bbb', pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Scroll to pan · Ctrl+scroll or pinch to zoom · Alt+drag to pan · Paste to drop an image
      </div>

      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', touchAction: 'none', cursor: mode === 'draw' ? 'crosshair' : 'default', display: 'block' }}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerCancel={onSvgPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <pattern id="dots" x={dotOffX} y={dotOffY} width={dotSpacing} height={dotSpacing} patternUnits="userSpaceOnUse">
            <circle cx={0} cy={0} r={0.8} fill="#ccc" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.s})`}>
          {paths.map(p => (
            <path key={p.id} d={p.d} stroke="#1a1a1a" strokeWidth={2} fill="none"
              strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
          {livePath && (
            <path d={livePath} stroke="#1a1a1a" strokeWidth={2} fill="none"
              strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
          {images.map(img => (
            <image
              key={img.id}
              href={img.src}
              x={img.x} y={img.y} width={img.w} height={img.h}
              style={{ cursor: mode === 'select' ? 'move' : undefined }}
              onPointerDown={mode === 'select' ? (e) => onImagePointerDown(e as React.PointerEvent<SVGImageElement>, img.id) : undefined}
              pointerEvents={mode === 'select' ? 'all' : 'none'}
            />
          ))}
        </g>

        {/* Selection handles rendered in screen space */}
        {selImg && (() => {
          const tl = toScreen(selImg.x, selImg.y)
          const br = toScreen(selImg.x + selImg.w, selImg.y + selImg.h)
          const handles: { id: HandleId; x: number; y: number }[] = [
            { id: 'tl', x: tl.x, y: tl.y },
            { id: 'tr', x: br.x, y: tl.y },
            { id: 'bl', x: tl.x, y: br.y },
            { id: 'br', x: br.x, y: br.y },
          ]
          return (
            <g>
              <rect x={tl.x} y={tl.y} width={br.x - tl.x} height={br.y - tl.y}
                fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="5 3"
                pointerEvents="none"
              />
              {handles.map(({ id, x, y }) => (
                <rect key={id}
                  x={x - H / 2} y={y - H / 2} width={H} height={H}
                  fill="white" stroke="#3b82f6" strokeWidth={1.5}
                  style={{ cursor: HANDLE_CURSOR[id] }}
                  onPointerDown={(e) => onHandlePointerDown(e as React.PointerEvent<SVGRectElement>, id)}
                />
              ))}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

function ToolBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer',
      background: active ? '#eff6ff' : 'transparent',
      color: active ? '#3b82f6' : '#555',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SelectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3l14 9-7 1-4 7z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
