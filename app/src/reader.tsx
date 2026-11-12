import { m } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { DisplaySettings } from './display'
import { displayVars, useDisplay } from './prefs'
import { Icon, Sheet, useDialog } from './ui'

/** پوستهٔ تمام‌صفحهٔ خواندن: نوار پیشرفت، بستن، عنوان (قابل لمس)، قبلی و بعدی، و برگهٔ «نمایش» */
export function ReaderShell({
  title,
  sub,
  onTitle,
  prev,
  next,
  onClose,
  actions,
  children,
  aside,
  scrollRef,
  tone,
}: {
  title: string
  /** زیرعنوان کوتاه، مثلاً «باب ۳ از ۲۴» */
  sub?: string
  /** لمس عنوان (مثلاً باز کردن فهرست باب‌ها) */
  onTitle?: () => void
  prev?: (() => void) | null
  next?: (() => void) | null
  onClose: () => void
  actions?: ReactNode
  children: ReactNode
  /** ستون کناری در دسکتاپ (فهرست باب‌ها) */
  aside?: ReactNode
  scrollRef?: RefObject<HTMLDivElement | null>
  /** قفسهٔ کتاب؛ رنگ خوانشگر را تعیین می‌کند */
  tone?: string
}) {
  const own = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const scroller = scrollRef ?? own
  const [progress, setProgress] = useState(0)
  const [display] = useDisplay()
  const [showDisplay, setShowDisplay] = useState(false)
  useDialog(box, true, onClose)

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

  // جهت‌نماها (دسکتاپ): در متن راست‌به‌چپ، چپ یعنی بعدی
  const nav = useRef({ prev, next })
  nav.current = { prev, next }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('.sheet')) return
      if (e.key === 'ArrowLeft' && nav.current.next) nav.current.next()
      else if (e.key === 'ArrowRight' && nav.current.prev) nav.current.prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <m.div
      ref={box}
      className={`study reader ${aside ? 'has-aside' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-dialog
      tabIndex={-1}
      data-shelf={tone}
      data-mode={display.mode}
      style={displayVars(display)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.22 }}
    >
      <div className="study-progress" aria-hidden>
        <b style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="study-bar solid">
        <button className="icon-btn" onClick={onClose} aria-label="بستن">
          {Icon.close}
        </button>
        {onTitle ? (
          <button className="study-bar-title on as-btn" onClick={onTitle} aria-haspopup="dialog">
            <span>{title}</span>
            {sub && <small>{sub}</small>}
            <i aria-hidden>{Icon.list}</i>
          </button>
        ) : (
          <div className="study-bar-title on">
            <span>{title}</span>
            {sub && <small>{sub}</small>}
          </div>
        )}
        {actions}
        {(prev !== undefined || next !== undefined) && (
          <div className="bar-nav">
            <button className="icon-btn" onClick={prev ?? undefined} disabled={!prev} aria-label="قبلی">
              {Icon.back}
            </button>
            <button className="icon-btn" onClick={next ?? undefined} disabled={!next} aria-label="بعدی">
              {Icon.next}
            </button>
          </div>
        )}
        <button className="icon-btn aa-btn" onClick={() => setShowDisplay(true)} aria-label="نمایش و اندازهٔ متن" aria-haspopup="dialog">
          آ<small>آ</small>
        </button>
      </div>
      <div className="reader-cols">
        {aside && <aside className="reader-aside">{aside}</aside>}
        <div className="study-scroll reader-scroll" ref={scroller}>
          {children}
        </div>
      </div>
      <Sheet open={showDisplay} onClose={() => setShowDisplay(false)} label="نمایش">
        <h3 className="h2 sheet-title">نمایش</h3>
        <DisplaySettings />
      </Sheet>
    </m.div>
  )
}

/** دکمهٔ کوچک نشان‌کردن متن */
export function MarkButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`mini-btn ${on ? 'on' : ''}`} onClick={onClick} aria-label={on ? 'برداشتن نشان' : 'نشان کردن'} aria-pressed={on}>
      {on ? Icon.bookmarked : Icon.bookmark}
    </button>
  )
}
