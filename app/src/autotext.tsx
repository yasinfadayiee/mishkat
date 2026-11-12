import { useEffect, useRef, useState } from 'react'

/** جعبهٔ نوشتن که هنگام نوشتن با تأخیر کوتاه ذخیره می‌شود و «ذخیره شد» نشان می‌دهد */
export function AutoText({ value, onSave, placeholder, autoFocus, rows = 3, className = '', label }: { value: string; onSave: (v: string) => void; placeholder?: string; autoFocus?: boolean; rows?: number; className?: string; label: string }) {
  const [text, setText] = useState(value)
  const [state, setState] = useState<'idle' | 'typing' | 'saved'>('idle')
  const last = useRef(value)
  const pending = useRef<string | null>(null)
  const save = useRef(onSave)
  save.current = onSave

  const flush = () => {
    if (pending.current === null) return
    const v = pending.current
    pending.current = null
    if (v !== last.current) {
      last.current = v
      save.current(v)
      setState('saved')
    }
  }

  useEffect(() => {
    if (pending.current === null) return
    const t = setTimeout(flush, 600)
    return () => clearTimeout(t)
  }, [text])

  // اگر برنامه بسته یا صفحه عوض شود، نوشته‌ی ذخیره‌نشده از دست نمی‌رود
  useEffect(() => {
    const onHide = () => flush()
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [])

  return (
    <div className={`autotext ${className}`}>
      <textarea
        rows={rows}
        value={text}
        aria-label={label}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value)
          pending.current = e.target.value
          setState('typing')
        }}
        onBlur={flush}
      />
      <small className="save-state" aria-live="polite">
        {state === 'saved' ? 'ذخیره شد ✓' : state === 'typing' ? 'در حال نوشتن…' : ''}
      </small>
    </div>
  )
}
