import { AnimatePresence, m } from 'framer-motion'
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
  share: S(<><circle cx="17.5" cy="6" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><circle cx="17.5" cy="18" r="2.5" /><path d="m8.7 10.8 6.6-3.6M8.7 13.2l6.6 3.6" /></>),
  external: S(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5H5V6h5" /></>),
  bookmark: S(<path d="M7 4h10v16l-5-3.5L7 20z" />),
  bookmarked: S(<path d="M7 4h10v16l-5-3.5L7 20z" fill="currentColor" />),
  search: S(<><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>),
  dict: S(<><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z" /><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5" /><path d="M9 7.5h6M9 11h4" /></>),
  rahl: S(<><path d="M3 8.2c3-1.2 6-.9 9 1.1 3-2 6-2.3 9-1.1l-1.6 4.6c-2.5-.9-5-.5-7.4 1.2-2.4-1.7-4.9-2.1-7.4-1.2z" /><path d="M12 9.3v5.6M7.5 15 16.5 20.5M16.5 15 7.5 20.5" /></>),
  gear: S(<><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" /><circle cx="12" cy="12" r="6.6" /></>),
  more: S(<><circle cx="5.5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18.5" cy="12" r="1.4" fill="currentColor" /></>),
  copy: S(<><rect x="8" y="8" width="11" height="12" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>),
  card: S(<><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="m4 16 4.5-4.5 3.5 3.5 2.5-2.5L20 18" /><circle cx="15.5" cy="8.5" r="1.5" /></>),
  chat: S(<><path d="M5 6h14v10H10l-4 3.5V16H5z" /><path d="M9 10h6M9 13h3.5" /></>),
  flag: S(<><path d="M6 21V4" /><path d="M6 4h11l-2 4 2 4H6" /></>),
  list: S(<><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth={2.6} /></>),
  download: S(<><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19h14" /></>),
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

/* ───────── پنجرهٔ روی صفحه: قفل فوکوس، Escape و برگشت فوکوس ───────── */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
/** فوکوس داخل پنجره می‌ماند، Escape می‌بندد و پس از بستن فوکوس به دکمهٔ بازکننده برمی‌گردد */
export function useDialog(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const el = ref.current
    // فوکوس اول روی خود پنجره، تا صفحه‌خوان عنوانش را بخواند
    requestAnimationFrame(() => {
      if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true })
    })
    const onKey = (e: KeyboardEvent) => {
      const box = ref.current
      if (!box) return
      // فقط بالاترین پنجره به کلیدها جواب می‌دهد
      const all = [...document.querySelectorAll('[data-dialog]')]
      if (all[all.length - 1] !== box) return
      if (e.key === 'Escape') {
        e.preventDefault()
        close.current()
      } else if (e.key === 'Tab') {
        const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) (e.preventDefault(), last.focus())
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open, ref])
}

/* ───────── ورقهٔ پایین ───────── */
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label?: string }) {
  const box = useRef<HTMLDivElement>(null)
  useDialog(box, open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <m.div className="sheet-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <m.div
            ref={box}
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-dialog
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="grab" />
            <button className="icon-btn sheet-close" onClick={onClose} aria-label="بستن">
              {Icon.close}
            </button>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

/* ───────── متن عربی ───────── */
export function ArabicText({ kind, text, className = '' }: { kind: SourceText['kind'] | 'quran' | 'shia' | 'sunni'; text: string; className?: string }) {
  return (
    <div className={`${kind === 'quran' ? 'quran' : 'arabic'} ${className}`} lang="ar" dir="rtl">
      {/* شمارهٔ متن («۱۵۶.») جدا نشان داده می‌شود؛ در خودِ متن عربی تکرارش نمی‌کنیم */}
      {kind === 'quran' ? text : text.replace(/^[\s۰-۹٠-٩0-9]+[.\-–]\s*/, '')}
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
