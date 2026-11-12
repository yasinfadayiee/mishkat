// دانلود یک کتاب برای خواندن بدون اینترنت (فقط نسخهٔ وب؛ اندروید و ویندوز کتاب‌ها را از خود بسته دارند)
import type { Toc } from './books'

const BOOKS = 'mishkat-books'

export const canOffline = () => typeof caches !== 'undefined' && location.protocol === 'https:' && !!navigator.serviceWorker?.controller

const filesOf = (id: string, toc: Toc) => [`books/${id}/toc.json`, `books/${id}/ids.json`, ...toc.sections.flatMap((s, si) => s.chapters.map((_, ci) => `books/${id}/${si}-${ci}.json`))]
const abs = (f: string) => new URL(f, location.href).href

/** چند فایل از این کتاب ذخیره شده است */
export async function offlineCount(id: string, toc: Toc) {
  const c = await caches.open(BOOKS)
  const have = new Set((await c.keys()).map((r) => r.url.split('?')[0]))
  const all = filesOf(id, toc)
  return { have: all.filter((f) => have.has(abs(f))).length, all: all.length }
}

/** همهٔ باب‌های کتاب را ذخیره می‌کند؛ با signal لغو می‌شود */
export async function downloadBook(id: string, toc: Toc, onProgress: (done: number, all: number) => void, signal: AbortSignal) {
  const c = await caches.open(BOOKS)
  const have = new Set((await c.keys()).map((r) => r.url.split('?')[0]))
  const all = filesOf(id, toc)
  const todo = all.filter((f) => !have.has(abs(f)))
  let done = all.length - todo.length
  onProgress(done, all.length)
  let next = 0
  const worker = async () => {
    while (next < todo.length) {
      if (signal.aborted) throw new DOMException('لغو شد', 'AbortError')
      const f = todo[next++]
      const res = await fetch(f, { signal })
      if (!res.ok) throw new Error(f)
      await c.put(abs(f), res)
      onProgress(++done, all.length)
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
}

/** حذف نسخهٔ ذخیره‌شدهٔ کتاب */
export async function removeBook(id: string, toc: Toc) {
  const c = await caches.open(BOOKS)
  await Promise.all(filesOf(id, toc).map((f) => c.delete(abs(f))))
}

export const mb = (bytes: number) => (bytes / 1e6 < 1 ? `${Math.max(1, Math.round(bytes / 1e3)).toLocaleString('fa-IR')} کیلوبایت` : `${(bytes / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} مگابایت`)
