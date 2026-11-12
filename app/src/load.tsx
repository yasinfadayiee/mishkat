// بارگذاری با سه حالت: اسکلت هنگام انتظار، خطا با «دوباره تلاش کن»، و «اینترنت نیست»
import { Component, useCallback, useEffect, useState, type ReactNode } from 'react'
import { LoadError } from './books'

export interface Loaded<T> {
  data: T | null
  error: unknown
  retry: () => void
}

/** نتیجهٔ یک بارگذاری؛ با تغییر deps از نو می‌گیرد و retry دوباره تلاش می‌کند */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [state, setState] = useState<{ data: T | null; error: unknown; key: string }>({ data: null, error: null, key: '' })
  const [tick, setTick] = useState(0)
  const key = JSON.stringify(deps)
  useEffect(() => {
    let live = true
    fn().then(
      (data) => live && setState({ data, error: null, key }),
      (error) => live && setState({ data: null, error: error ?? new Error('load'), key }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick])
  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null, key: '' }))
    setTick((t) => t + 1)
  }, [])
  // داده‌ای که برای deps قبلی بود نشان داده نمی‌شود
  const fresh = state.key === key
  return { data: fresh ? state.data : null, error: fresh ? state.error : null, retry }
}

/** اسکلت خاکستری هنگام انتظار */
export function Skeleton({ kind = 'text', rows = 3 }: { kind?: 'text' | 'card' | 'list' | 'reader'; rows?: number }) {
  if (kind === 'reader')
    return (
      <div className="skel-wrap" aria-busy="true" aria-label="در حال بارگذاری">
        <div className="skel skel-head" />
        {Array.from({ length: rows }, (_, k) => (
          <div key={k} className="skel-block">
            <div className="skel skel-line w90" />
            <div className="skel skel-line w70" />
            <div className="skel skel-line w80" />
          </div>
        ))}
      </div>
    )
  if (kind === 'list')
    return (
      <div className="skel-wrap" aria-busy="true" aria-label="در حال بارگذاری">
        {Array.from({ length: rows }, (_, k) => (
          <div key={k} className="skel skel-row" />
        ))}
      </div>
    )
  if (kind === 'card') return <div className="skel skel-card" aria-busy="true" aria-label="در حال بارگذاری" />
  return (
    <div className="skel-wrap" aria-busy="true" aria-label="در حال بارگذاری">
      {Array.from({ length: rows }, (_, k) => (
        <div key={k} className={`skel skel-line ${k % 2 ? 'w70' : 'w90'}`} />
      ))}
    </div>
  )
}

/** پیام خطا با دکمهٔ «دوباره تلاش کن» */
export function LoadFail({ error, retry, what = 'این بخش' }: { error: unknown; retry: () => void; what?: string }) {
  const offline = error instanceof LoadError ? error.offline : !navigator.onLine
  return (
    <div className="load-fail" role="alert">
      <b>{offline ? 'اینترنت نیست' : `${what} باز نشد`}</b>
      <p>{offline ? `${what} هنوز روی این دستگاه ذخیره نشده است. وقتی به اینترنت وصل شدی دوباره تلاش کن.` : 'شاید اتصال قطع و وصل شده باشد.'}</p>
      <button className="btn btn-ghost" onClick={retry}>
        دوباره تلاش کن
      </button>
    </div>
  )
}

/** هر سه حالت با هم: اسکلت، خطا یا محتوا */
export function Load<T>({ r, what, skel, children }: { r: Loaded<T>; what?: string; skel?: ReactNode; children: (d: T) => ReactNode }) {
  if (r.error) return <LoadFail error={r.error} retry={r.retry} what={what} />
  if (r.data === null) return <>{skel ?? <Skeleton />}</>
  return <>{children(r.data)}</>
}

/** هر خطای پیش‌بینی‌نشده به‌جای صفحهٔ سفید، این پیام را نشان می‌دهد */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e: unknown) {
    console.error(e)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="crash">
        <b>مشکلی پیش آمد</b>
        <p>این صفحه درست باز نشد. یادداشت‌ها و نشان‌هایت سر جایشان هستند.</p>
        <div>
          <button className="btn btn-gold" onClick={() => this.setState({ failed: false })}>
            دوباره تلاش کن
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              location.hash = ''
              location.reload()
            }}
          >
            برگشتن به خانه
          </button>
        </div>
      </div>
    )
  }
}
