import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Icon } from './ui'

const SCALE_KEY = 'mishkat.textScale'
const readScale = () => {
  try {
    return Number(localStorage.getItem(SCALE_KEY)) || 1
  } catch {
    return 1
  }
}

/** پوستهٔ تمام‌صفحهٔ خواندن: نوار پیشرفت، بستن، عنوان و اندازهٔ متن */
export function ReaderShell({
  title,
  onClose,
  actions,
  children,
  scrollRef,
  tone,
}: {
  title: string
  onClose: () => void
  actions?: ReactNode
  children: ReactNode
  scrollRef?: RefObject<HTMLDivElement | null>
  /** قفسهٔ کتاب؛ رنگ خوانشگر را تعیین می‌کند */
  tone?: string
}) {
  const own = useRef<HTMLDivElement>(null)
  const scroller = scrollRef ?? own
  const [progress, setProgress] = useState(0)
  const [scale, setScale] = useState(readScale)

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? el.scrollTop / max : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scroller])

  useEffect(() => {
    try {
      localStorage.setItem(SCALE_KEY, String(scale))
    } catch {
      /* حافظهٔ مرورگر در دسترس نیست */
    }
  }, [scale])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div className="study reader" data-shelf={tone} style={{ ['--ts' as string]: scale }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
      <div className="study-progress">
        <b style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="study-bar solid">
        <button className="icon-btn" onClick={onClose} aria-label="بستن">
          {Icon.close}
        </button>
        <div className="study-bar-title on">{title}</div>
        {actions}
        <div className="text-size" role="group" aria-label="اندازهٔ متن">
          <button onClick={() => setScale((x) => Math.max(0.9, +(x - 0.1).toFixed(1)))} aria-label="متن کوچک‌تر">
            آ<sub>−</sub>
          </button>
          <button onClick={() => setScale((x) => Math.min(1.5, +(x + 0.1).toFixed(1)))} aria-label="متن بزرگ‌تر">
            آ<sup>+</sup>
          </button>
        </div>
      </div>
      <div className="study-scroll reader-scroll" ref={scroller}>
        {children}
      </div>
    </motion.div>
  )
}

/** دکمهٔ کوچک نشان‌کردن متن */
export function MarkButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`mini-btn ${on ? 'on' : ''}`} onClick={onClick} aria-label={on ? 'برداشتن نشان' : 'نشان کردن'}>
      {on ? Icon.bookmarked : Icon.bookmark}
    </button>
  )
}
