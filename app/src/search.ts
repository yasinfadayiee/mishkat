// پیوند به جست‌وجوی پس‌زمینه (search-worker.ts)
import { useEffect, useRef, useState } from 'react'
import type { SearchHit, SearchReq, SearchRes } from './search-worker'

export type { SearchHit }
let worker: Worker | null = null
let seq = 0
const getWorker = () => (worker ??= new Worker(new URL('./search-worker.ts', import.meta.url), { type: 'module' }))

export interface SearchState {
  done: boolean
  counts: Record<string, number>
  hits: Record<string, SearchHit[]>
  failed: string[]
}

/** نتیجه‌ها کتاب‌به‌کتاب می‌رسند؛ done یعنی همهٔ کتاب‌ها گشته شد */
export function useSearch(q: string, books: string[]): SearchState | null {
  const [res, setRes] = useState<SearchState | null>(null)
  const want = useRef(0)
  const key = books.join(',')
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setRes(null)
      return
    }
    const t = setTimeout(() => {
      const w = getWorker()
      const id = ++seq
      want.current = id
      setRes({ done: false, counts: {}, hits: {}, failed: [] })
      w.onmessage = (e: MessageEvent<SearchRes>) => {
        if (e.data.id === want.current) setRes({ done: e.data.done, counts: e.data.counts, hits: e.data.hits, failed: e.data.failed })
      }
      w.postMessage({ id, base: new URL('books/', location.href).href, q: term, books: key.split(',') } satisfies SearchReq)
    }, 220)
    return () => clearTimeout(t)
  }, [q, key])
  return res
}
