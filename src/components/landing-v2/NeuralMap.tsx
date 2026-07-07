'use client'

/**
 * Landing v2 — Neural Knowledge Map.
 *
 * A self-contained, dependency-free 3D constellation (canvas + manual
 * perspective projection — no three.js, to protect bundle size and LCP).
 * The nodes ARE the exam ecosystem: a CentuMania core, four exam-family
 * hubs (SSC / RRB / Banking / TN & Puducherry) and their individual exams.
 * It slowly rotates in 3D with particles travelling the synapses, themed to
 * the light premium design system (glowing sky/indigo/emerald/amber nodes on
 * a soft light panel — deliberately NOT the dark deep-space look).
 *
 * Accessibility: the canvas is decorative (aria-hidden); the exam names are
 * mirrored in an sr-only list so screen readers and crawlers see the content.
 * Honours prefers-reduced-motion (renders one static tilted frame, no motion).
 */
import { useEffect, useRef } from 'react'

type NodeType = 'root' | 'hub' | 'leaf'
interface GNode {
  label: string
  type: NodeType
  color: string
  glow: string // "r,g,b"
  r: number
  bx: number; by: number; bz: number
}

const CATS = [
  { label: 'SSC',              core: '#0284c7', leaf: '#38bdf8', children: ['CGL', 'CHSL', 'MTS', 'CPO'] },
  { label: 'RRB',              core: '#6366f1', leaf: '#818cf8', children: ['NTPC', 'Group D'] },
  { label: 'Banking',          core: '#059669', leaf: '#34d399', children: ['IBPS PO', 'SBI PO'] },
  { label: 'TN & Puducherry',  core: '#d97706', leaf: '#fbbf24', children: ['Group 4', 'VAO'] },
]

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

// ── Build the graph once (module scope) ────────────────────────────
const NODES: GNode[] = []
const EDGES: [number, number][] = []
;(function build() {
  NODES.push({ label: 'CentuMania', type: 'root', color: '#4f46e5', glow: '99,102,241', r: 15, bx: 0, by: 0, bz: 0 })
  const Rh = 1.05, Rl = 1.95
  CATS.forEach((c, ci) => {
    const a = (ci / CATS.length) * Math.PI * 2 - Math.PI / 2
    const hy = ci % 2 === 0 ? -0.34 : 0.34
    const hubIndex = NODES.length
    NODES.push({ label: c.label, type: 'hub', color: c.core, glow: hexToRgb(c.core), r: 10.5, bx: Math.cos(a) * Rh, by: hy, bz: Math.sin(a) * Rh })
    EDGES.push([0, hubIndex])
    const n = c.children.length
    c.children.forEach((leaf, li) => {
      const off = n > 1 ? (li - (n - 1) / 2) : 0
      const la = a + off * 0.44
      const ly = hy * 1.5 + off * 0.17
      const leafIndex = NODES.length
      NODES.push({ label: leaf, type: 'leaf', color: c.leaf, glow: hexToRgb(c.leaf), r: 6, bx: Math.cos(la) * Rl, by: ly, bz: Math.sin(la) * Rl })
      EDGES.push([hubIndex, leafIndex])
    })
  })
})()

interface Particle { a: number; b: number; t: number; speed: number; glow: string }
const PARTICLES: Particle[] = EDGES.flatMap(([a, b], i) => {
  const glow = NODES[b].glow
  return [
    { a, b, t: (i * 0.37) % 1, speed: 0.0055 + (i % 3) * 0.0012, glow },
    { a, b, t: (i * 0.71 + 0.5) % 1, speed: 0.004 + (i % 4) * 0.001, glow },
  ]
})

const F = 3.4   // focal length (unit space)
const TILT = 0.42

export default function NeuralMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    // Alias to non-null-typed consts so TS keeps the narrowing inside the
    // render/resize closures below (control-flow narrowing isn't preserved
    // across nested function boundaries).
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, DPR = 1
    let ay = -0.5
    let raf = 0
    let running = false
    let last = performance.now()

    function resize() {
      const rect = canvas.getBoundingClientRect()
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width; H = rect.height
      canvas.width = Math.round(W * DPR)
      canvas.height = Math.round(H * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    function rot(x: number, y: number, z: number) {
      const rx = x * Math.cos(ay) + z * Math.sin(ay)
      const rz0 = -x * Math.sin(ay) + z * Math.cos(ay)
      const ry = y * Math.cos(TILT) - rz0 * Math.sin(TILT)
      const rz = y * Math.sin(TILT) + rz0 * Math.cos(TILT)
      return { x: rx, y: ry, z: rz }
    }

    function draw() {
      const cx = W / 2, cy = H / 2
      const RAD = Math.min(W, H) * 0.34
      ctx.clearRect(0, 0, W, H)

      // soft ambient wash
      const bg = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, Math.max(W, H) * 0.7)
      bg.addColorStop(0, 'rgba(224,242,254,0.55)')
      bg.addColorStop(0.6, 'rgba(238,242,255,0.35)')
      bg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // project all nodes
      const P = NODES.map((nd) => {
        const p = rot(nd.bx, nd.by, nd.bz)
        const s = F / (F + p.z)
        return { nd, sx: cx + p.x * RAD * s, sy: cy + p.y * RAD * s, s, z: p.z }
      })

      // edges
      EDGES.forEach(([a, b]) => {
        const pa = P[a], pb = P[b]
        const alpha = 0.10 + Math.max(pa.s, pb.s) * 0.10
        ctx.strokeStyle = `rgba(99,116,155,${alpha.toFixed(3)})`
        ctx.lineWidth = Math.max(0.6, 1.1 * ((pa.s + pb.s) / 2))
        ctx.beginPath()
        ctx.moveTo(pa.sx, pa.sy)
        ctx.lineTo(pb.sx, pb.sy)
        ctx.stroke()
      })

      // particles
      for (const pt of PARTICLES) {
        const na = NODES[pt.a], nb = NODES[pt.b]
        const x = na.bx + (nb.bx - na.bx) * pt.t
        const y = na.by + (nb.by - na.by) * pt.t
        const z = na.bz + (nb.bz - na.bz) * pt.t
        const p = rot(x, y, z)
        const s = F / (F + p.z)
        const sx = cx + p.x * RAD * s, sy = cy + p.y * RAD * s
        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(1, 2.1 * s), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${pt.glow},${(0.75 * s).toFixed(3)})`
        ctx.fill()
      }

      // nodes — far first (painter's algorithm)
      const order = P.map((p, i) => ({ p, i })).sort((u, v) => v.p.z - u.p.z)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const { p } of order) {
        const { nd, sx, sy, s } = p
        const R = nd.r * s
        // glow halo
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 3.4)
        halo.addColorStop(0, `rgba(${nd.glow},${(0.30 * s).toFixed(3)})`)
        halo.addColorStop(1, `rgba(${nd.glow},0)`)
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(sx, sy, R * 3.4, 0, Math.PI * 2)
        ctx.fill()
        // core
        ctx.beginPath()
        ctx.arc(sx, sy, R, 0, Math.PI * 2)
        ctx.fillStyle = nd.color
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.stroke()
        // inner highlight
        ctx.beginPath()
        ctx.arc(sx - R * 0.28, sy - R * 0.3, R * 0.34, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.fill()
        // label
        const showLabel = nd.type !== 'leaf' || s > 0.92
        if (showLabel) {
          const fs = nd.type === 'root' ? 13 : nd.type === 'hub' ? 11.5 : 10
          ctx.font = `${nd.type === 'leaf' ? 500 : 700} ${fs * Math.max(0.8, s)}px Inter, system-ui, sans-serif`
          const ty = sy + R + (nd.type === 'root' ? 15 : 12) * s
          ctx.fillStyle = 'rgba(255,255,255,0.9)'
          ctx.lineWidth = 3
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'
          ctx.strokeText(nd.label, sx, ty)
          ctx.fillStyle = nd.type === 'leaf' ? 'rgba(71,85,105,0.95)' : 'rgba(15,23,42,0.95)'
          ctx.fillText(nd.label, sx, ty)
        }
      }
    }

    function loop(now: number) {
      const dt = Math.min(48, now - last); last = now
      ay += 0.00022 * dt
      for (const pt of PARTICLES) {
        pt.t += pt.speed * (dt / 16.67)
        if (pt.t > 1) pt.t -= 1
      }
      draw()
      if (running) raf = requestAnimationFrame(loop)
    }

    function start() {
      if (running || reduce) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    function stop() {
      running = false
      if (raf) cancelAnimationFrame(raf)
    }

    resize()
    draw() // initial paint (also the static frame for reduced-motion)

    const ro = new ResizeObserver(() => { resize(); draw() })
    ro.observe(canvas)

    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) start(); else stop() },
      { threshold: 0.05 }
    )
    io.observe(canvas)

    function onVis() { if (document.hidden) stop(); else start() }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const allExams = CATS.flatMap((c) => c.children)

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      <ul className="sr-only">
        {CATS.map((c) => (
          <li key={c.label}>{c.label}: {c.children.join(', ')}</li>
        ))}
        <li>Supported and upcoming exams: {allExams.join(', ')}. More exams coming soon.</li>
      </ul>
    </div>
  )
}
