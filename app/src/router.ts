// مسیریاب سبک بر پایهٔ hash؛ تاریخچهٔ مرورگر همان پشتهٔ بازگشت است.
//   #/                       خانه
//   #/quran  #/quran/2  #/quran/2/255
//   #/library  #/library/topics  #/library/lessons
//   #/search?q=صبر
//   #/notes  #/settings  #/trust
//   #/book/ghurar  #/book/ghurar/9/3?i=1519
//   #/topic/sabr  #/lesson/<id>
import { useEffect, useState } from 'react'

export type Tab = 'home' | 'quran' | 'library' | 'notes' | 'search' | 'trust' | 'settings'
export type View =
  | { kind: 'surah'; n: number; ayah?: number }
  | { kind: 'toc'; book: string }
  | { kind: 'chapter'; book: string; sec: number; ch: number; focus?: number }
  | { kind: 'topic'; id: string }
  | { kind: 'lesson'; id: string }

export interface Route {
  /** زبانه‌ای که این مسیر به آن تعلق دارد؛ برای صفحه‌های تمام‌صفحه، null (همان زبانهٔ قبلی زیرش می‌ماند) */
  tab: Tab | null
  view: View | null
  sub?: string
  q: URLSearchParams
  path: string
}

const TABS: Tab[] = ['home', 'quran', 'library', 'notes', 'search', 'trust', 'settings']
const num = (s?: string) => (s && /^\d+$/.test(s) ? Number(s) : undefined)

export function parse(hash = location.hash): Route {
  const raw = hash.replace(/^#\/?/, '')
  const [p, qs = ''] = raw.split('?')
  const parts = p.split('/').filter(Boolean).map(decodeURIComponent)
  const q = new URLSearchParams(qs)
  const path = `/${parts.join('/')}`
  const [head, a, b, c] = parts
  if (!head) return { tab: 'home', view: null, q, path }
  if (head === 'quran' && num(a)) return { tab: null, view: { kind: 'surah', n: num(a)!, ayah: num(b) }, q, path }
  if (head === 'book' && a) {
    if (num(b) !== undefined && num(c) !== undefined) return { tab: null, view: { kind: 'chapter', book: a, sec: num(b)!, ch: num(c)!, focus: num(q.get('i') ?? undefined) }, q, path }
    return { tab: null, view: { kind: 'toc', book: a }, q, path }
  }
  if (head === 'topic' && a) return { tab: null, view: { kind: 'topic', id: a }, q, path }
  if (head === 'lesson' && a) return { tab: null, view: { kind: 'lesson', id: a }, q, path }
  if ((TABS as string[]).includes(head)) return { tab: head as Tab, view: null, sub: a, q, path }
  return { tab: 'home', view: null, q, path }
}

/** نشانی یک صفحه */
export const href = {
  surah: (n: number, ayah?: number) => `/quran/${n}${ayah ? `/${ayah}` : ''}`,
  toc: (book: string) => `/book/${book}`,
  chapter: (book: string, sec: number, ch: number, focus?: number) => `/book/${book}/${sec}/${ch}${focus !== undefined ? `?i=${focus}` : ''}`,
  topic: (id: string) => `/topic/${id}`,
  lesson: (id: string) => `/lesson/${id}`,
}

// پشتهٔ صفحه‌هایی که در همین اجرا دیده شده؛ برای این‌که «بستن» بداند پشت سرش چیزی هست یا نه
const stack: string[] = []
const current = () => location.hash.replace(/^#/, '') || '/'

/** رفتن به صفحهٔ تازه (یک پله به تاریخچه افزوده می‌شود) */
export function go(path: string, replace = false) {
  if (path === current()) return
  if (replace) {
    stack[stack.length - 1] = path
    history.replaceState(history.state, '', `#${path}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else location.hash = path
}

/** یک پله برگشت؛ اگر پشت سر چیزی نیست، به fallback (یا خانه) */
export function back(fallback = '/') {
  if (stack.length > 1) history.back()
  else go(fallback, true)
}

export const canGoBack = () => stack.length > 1

if (typeof window !== 'undefined') {
  stack.push(current())
  window.addEventListener('hashchange', () => {
    const now = current()
    if (stack.length > 1 && stack[stack.length - 2] === now) stack.pop()
    else if (stack[stack.length - 1] !== now) stack.push(now)
  })
}

export function useRoute() {
  const [r, setR] = useState(() => parse())
  useEffect(() => {
    const on = () => setR(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

/** نشانیِ قابل فرستادن برای دیگران (همیشه نسخهٔ وب، حتی در اندروید و ویندوز) */
export const WEB = 'https://yasinfadayiee.github.io/mishkat/'
export const shareUrl = (path: string) => `${WEB}#${path}`
