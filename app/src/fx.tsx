import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* ───────── غبار نور: ذرات طلایی که آرام بالا می‌روند ───────── */
export function LightDust({ density = 46, className = '' }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w = 0
    let h = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      w = c.clientWidth
      h = c.clientHeight
      c.width = w * dpr
      c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const P = Array.from({ length: density }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.9,
      v: 0.00012 + Math.random() * 0.0004,
      drift: (Math.random() - 0.5) * 0.0002,
      t: Math.random() * Math.PI * 2,
    }))
    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of P) {
        p.y -= p.v
        p.x += p.drift + Math.sin(p.t) * 0.00008
        p.t += 0.02
        if (p.y < -0.05) {
          p.y = 1.05
          p.x = Math.random()
        }
        const a = 0.35 + 0.45 * Math.sin(p.t)
        const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, p.r * 4)
        g.addColorStop(0, `rgba(255,226,160,${a})`)
        g.addColorStop(1, 'rgba(255,200,110,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    if (!reduced()) tick()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density])
  return <canvas ref={ref} className={`fx-dust ${className}`} aria-hidden />
}

/* ───────── آسمان زنده: رنگ آسمان با ساعت روز ───────── */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night'
export function skyPhase(d = new Date()): SkyPhase {
  const h = d.getHours() + d.getMinutes() / 60
  if (h >= 4.5 && h < 7) return 'dawn'
  if (h >= 7 && h < 16.5) return 'day'
  if (h >= 16.5 && h < 19) return 'dusk'
  return 'night'
}

export function Stars({ count = 120 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let w = 0
    let h = 0
    const resize = () => {
      w = c.clientWidth
      h = c.clientHeight
      c.width = w * dpr
      c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const S = Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.2 + 0.2, t: Math.random() * 6 }))
    let shoot = { x: 0, y: 0, life: 0 }
    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of S) {
        s.t += 0.03
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.t))
        ctx.fillStyle = '#fff6df'
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (shoot.life <= 0 && Math.random() < 0.004) shoot = { x: 0.3 + Math.random() * 0.6, y: Math.random() * 0.3, life: 1 }
      if (shoot.life > 0) {
        const x = shoot.x * w - (1 - shoot.life) * 260
        const y = shoot.y * h + (1 - shoot.life) * 110
        const g = ctx.createLinearGradient(x, y, x + 90, y - 38)
        g.addColorStop(0, `rgba(255,240,200,${shoot.life})`)
        g.addColorStop(1, 'rgba(255,240,200,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + 90, y - 38)
        ctx.stroke()
        shoot.life -= 0.022
      }
      raf = requestAnimationFrame(tick)
    }
    if (!reduced()) tick()
    else {
      for (const s of S) {
        ctx.fillStyle = '#fff6df'
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [count])
  return <canvas ref={ref} className="fx-stars" aria-hidden />
}

/* ───────── قاب محراب: کارت به شکل قوس جناغی با لبهٔ طلایی ───────── */
const ARCH = 'M0,200 L0,62 C0,30 26,12 50,0 C74,12 100,30 100,62 L100,200 Z'
export function ArchFrame({ children, className = '', glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`arch ${glow ? 'arch-glow' : ''} ${className}`}>
      <div className="arch-clip">{children}</div>
      <svg className="arch-line" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="archGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff0c2" />
            <stop offset="0.35" stopColor="#e6c27d" />
            <stop offset="0.7" stopColor="#a8772f" />
            <stop offset="1" stopColor="#f3d999" />
          </linearGradient>
        </defs>
        <path d={ARCH} fill="none" stroke="url(#archGold)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        <path d={ARCH} fill="none" stroke="rgba(255,240,200,.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" transform="translate(4 6) scale(.92 .95)" />
      </svg>
    </div>
  )
}

/* ───────── لمسِ سه‌بعدی ───────── */
export function Tilt({ children, className = '', max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 180, damping: 18 })
  const shine = useTransform(x, [0, 1], ['-20%', '120%'])
  return (
    <motion.div
      className={`tilt ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width)
        y.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        x.set(0.5)
        y.set(0.5)
      }}
    >
      {children}
      <motion.span className="tilt-shine" style={{ left: shine }} aria-hidden />
    </motion.div>
  )
}

/* ───────── پرتوهای نور ───────── */
export function Rays({ className = '' }: { className?: string }) {
  return <div className={`fx-rays ${className}`} aria-hidden />
}

/* ───────── سربرگ نقاشی‌شدهٔ صفحه‌ها ───────── */
export function PageHero({ art, eyebrow, title, children }: { art: string; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <motion.div className="page-hero-art" style={{ backgroundImage: `url(${art})` }} initial={{ scale: 1.12, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1] }} />
      <LightDust density={22} />
      <div className="page-hero-fade" />
      <motion.div className="page-hero-body" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
        <div className="eyebrow" style={{ color: '#f1d699' }}>
          {eyebrow}
        </div>
        <h1>{title}</h1>
        {children}
      </motion.div>
    </section>
  )
}

/* ───────── تزئین: جداکنندهٔ اسلیمی ───────── */
export function Ornament({ width = 180 }: { width?: number }) {
  return (
    <svg width={width} height="18" viewBox="0 0 180 18" className="ornament" aria-hidden>
      <path d="M0 9h62M118 9h62" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <path d="M90 1l8 8-8 8-8-8z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M90 5l4 4-4 4-4-4z" fill="currentColor" />
      <circle cx="72" cy="9" r="2" fill="currentColor" />
      <circle cx="108" cy="9" r="2" fill="currentColor" />
    </svg>
  )
}
