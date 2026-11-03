import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Grading, SourceText } from './data/types'

/* ───────── آیکون‌ها ───────── */
const S = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)
export const Icon = {
  home: S(<><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></>),
  path: S(<><path d="M5 19c3-1 3-5 7-6s4-5 7-6" /><circle cx="5" cy="19" r="1.6" /><circle cx="19" cy="7" r="1.6" /><path d="M12 13v.01" /></>),
  book: S(<><path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z" /><path d="M12 6v13.5" /></>),
  me: S(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2" /></>),
  close: S(<path d="M6 6l12 12M18 6 6 18" />),
  back: S(<path d="M9 5l7 7-7 7" />),
  next: S(<path d="M15 5l-7 7 7 7" />),
  check: S(<path d="M5 12.5 10 17l9-10" />),
  play: S(<path d="M8 5.5v13l10-6.5z" fill="currentColor" />),
  pause: S(<><path d="M8 5v14M16 5v14" strokeWidth={3} /></>),
  shield: S(<><path d="M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6z" /><path d="m9 12 2 2 4-4" /></>),
  spark: S(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />),
  story: S(<><path d="M5 4h14v16H5z" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  quote: S(<path d="M9 7H6v5h3v-2.5M18 7h-3v5h3V9.5M6 12c0 3 1 4.5 3 5M15 12c0 3 1 4.5 3 5" />),
  words: S(<><path d="M4 7h7M7.5 7v10M13 17l3.5-10L20 17M14.2 13.5h4.6" /></>),
  teacher: S(<><path d="M3 9l9-4 9 4-9 4z" /><path d="M7 11v4.5c1.5 1.4 3.2 2 5 2s3.5-.6 5-2V11" /></>),
  life: S(<><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>),
  link: S(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
  quiz: S(<><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.5h.01" /></>),
  target: S(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>),
  pen: S(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>),
  external: S(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5H5V6h5" /></>),
  bookmark: S(<path d="M7 4h10v16l-5-3.5L7 20z" />),
  bookmarked: S(<path d="M7 4h10v16l-5-3.5L7 20z" fill="currentColor" />),
  search: S(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>),
  sound: S(<><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>),
}

/* ───────── نقش هندسی (ستارهٔ هشت‌پر) ───────── */
export function Girih({ id = 'g', size = 96 }: { id?: string; size?: number }) {
  return (
    <svg className="pattern-layer" width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--pattern)" strokeWidth="1.1">
            <path d="M48 18 78 48 48 78 18 48Z" />
            <path d="M27 27h42v42H27z" />
            <path d="M48 0v18M48 78v18M0 48h18M78 48h18" />
            <path d="M0 0l27 27M96 0 69 27M0 96l27-27M96 96 69 69" />
            <circle cx="48" cy="48" r="9" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/* ───────── چراغ (مشکات) ───────── */
export function Lamp({ level = 1, className }: { level?: number; className?: string }) {
  const l = Math.max(0.12, Math.min(1, level))
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden>
      <defs>
        <radialGradient id="halo" cx="50%" cy="62%" r="50%">
          <stop offset="0%" stopColor="#ffd987" stopOpacity={0.9 * l} />
          <stop offset="60%" stopColor="#ffb648" stopOpacity={0.25 * l} />
          <stop offset="100%" stopColor="#ffb648" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="glass" x1="0" x2="1">
          <stop offset="0" stopColor="#f7d68e" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff3d1" stopOpacity={0.35 + 0.5 * l} />
          <stop offset="1" stopColor="#c99543" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="brass" x1="0" x2="1">
          <stop offset="0" stopColor="#9a6b25" />
          <stop offset="0.5" stopColor="#f3d491" />
          <stop offset="1" stopColor="#8a5d1d" />
        </linearGradient>
      </defs>
      <circle className="halo" cx="60" cy="92" r="58" fill="url(#halo)" />
      <path d="M60 0v22" stroke="url(#brass)" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M48 26h24l-4 8H52z" fill="url(#brass)" />
      <path d="M44 36h32c0 0 12 14 12 36s-14 36-28 36-28-14-28-36 12-36 12-36z" fill="url(#glass)" stroke="url(#brass)" strokeWidth="2" />
      <path d="M52 40c-6 10-8 20-8 32" stroke="#fff6dc" strokeOpacity="0.4" strokeWidth="2" fill="none" />
      <g className="lamp-flame" style={{ transform: `scale(${0.55 + 0.45 * l})` }}>
        <path d="M60 58c7 9 10 15 10 22a10 10 0 0 1-20 0c0-7 3-13 10-22z" fill="#ffc35a" />
        <path d="M60 68c4 5 5.5 8.5 5.5 12a5.5 5.5 0 0 1-11 0c0-3.5 1.5-7 5.5-12z" fill="#fff6d6" />
      </g>
      <path d="M50 108h20l-3 8H53z" fill="url(#brass)" />
      <circle cx="60" cy="121" r="3" fill="url(#brass)" />
    </svg>
  )
}

/* ───────── جرقه‌های طلایی ───────── */
export function Sparks({ show }: { show: boolean }) {
  const parts = useRef(
    Array.from({ length: 34 }, () => ({
      x: (Math.random() - 0.5) * 520,
      y: -Math.random() * 520 - 80,
      d: 0.9 + Math.random() * 1.3,
      s: 0.5 + Math.random(),
    })),
  )
  return (
    <AnimatePresence>
      {show &&
        parts.current.map((p, i) => (
          <motion.i
            key={i}
            className="spark"
            style={{ left: '50%', top: '55%', scale: p.s }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0 }}
            transition={{ duration: p.d, ease: [0.15, 0.7, 0.3, 1] }}
          />
        ))}
    </AnimatePresence>
  )
}

/* ───────── ورقهٔ پایین ───────── */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="grab" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────── متن عربی ───────── */
export function ArabicText({ kind, text, className = '' }: { kind: SourceText['kind'] | 'quran' | 'shia' | 'sunni'; text: string; className?: string }) {
  return (
    <div className={`${kind === 'quran' ? 'quran' : 'arabic'} ${className}`} lang="ar" dir="rtl">
      {text}
    </div>
  )
}

export function GradingChip({ g }: { g: Grading }) {
  const strong = /صحیح|حسن|موثق/.test(g.value)
  return (
    <span className={`chip ${strong ? 'ok' : 'warn'}`} title={`درجهٔ سند به نظر ${g.by}`}>
      سند: {g.value}
    </span>
  )
}

/* ───────── پخش تلاوت (everyayah.com، قاری: مشاری العفاسی) ───────── */
const pad = (n: number) => String(n).padStart(3, '0')
export function Recitation({ surah, from, to }: { surah: number; from: number; to?: number }) {
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const idx = useRef(from)

  useEffect(
    () => () => {
      audio.current?.pause()
    },
    [],
  )

  const playAyah = (n: number) => {
    idx.current = n
    if (!audio.current) {
      audio.current = new Audio()
      audio.current.onended = () => {
        if (idx.current < (to ?? from)) playAyah(idx.current + 1)
        else setPlaying(false)
      }
      audio.current.onerror = () => setPlaying(false)
    }
    audio.current.src = `https://everyayah.com/data/Alafasy_128kbps/${pad(surah)}${pad(n)}.mp3`
    audio.current.play().catch(() => setPlaying(false))
  }

  const toggle = () => {
    if (playing) {
      audio.current?.pause()
      setPlaying(false)
    } else {
      setPlaying(true)
      playAyah(from)
    }
  }

  return (
    <button className="btn btn-ghost" onClick={toggle} style={{ padding: '9px 16px', fontSize: 13.5 }}>
      {playing ? Icon.pause : Icon.sound}
      {playing ? 'توقف تلاوت' : 'شنیدن تلاوت'}
    </button>
  )
}

/** شمسه: ترنج دوازده‌پر به سبک تذهیب، برای جلد کتاب‌ها و سرلوحه‌ها */
export function Medallion({ className = '' }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg className={`medallion ${className}`} viewBox="-50 -50 100 100" aria-hidden="true">
      <g className="m-petals">
        {petals.map((a) => (
          <path key={a} d="M0 -46 C8 -34 8 -24 0 -16 C-8 -24 -8 -34 0 -46 Z" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle className="m-ring" r="17" />
      <path className="m-star" d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" />
      <circle className="m-dot" r="3" />
    </svg>
  )
}
