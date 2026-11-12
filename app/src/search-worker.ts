// جست‌وجو در پس‌زمینه تا صفحه قفل نشود. نمایهٔ هر کتاب فقط وقتی لازم شد گرفته می‌شود (books/search/<id>.json).
/// <reference lib="webworker" />

export type SearchHit = {
  book: string
  sec: number
  ch: number
  /** شناسهٔ متن یا شمارهٔ آیه */
  i: number
  n: number
  fa: string
  /** متن عربی (وقتی واژه فقط در متن عربی پیدا شد) */
  ar?: string
  /** نام باب یا سوره */
  place: string
}
export type SearchReq = { id: number; base: string; q: string; books: string[] }
export type SearchRes = { id: number; done: boolean; counts: Record<string, number>; hits: Record<string, SearchHit[]>; failed: string[] }

const norm = (t: string) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[‌\s]+/g, ' ')
    .toLowerCase()

type Row = { sec: number; ch: number; i: number; n: number; fa: string; nf: string; ar: string; na: string }
// متن عربی برای جست‌وجو: بی‌اعراب و بی‌نشانه
const arKey = (t: string) => norm(t).replace(/[^ء-ۿ\s]/g, ' ').replace(/\s+/g, ' ')
const shards = new Map<string, Promise<{ rows: Row[]; places: (sec: number, ch: number) => string }>>()

const shard = (base: string, id: string) => {
  if (!shards.has(id)) {
    const get = (f: string) => fetch(base + f).then((r) => (r.ok ? r.json() : Promise.reject(new Error(f))))
    const p = (async () => {
      if (id === 'quran') {
        const [raw, surahs] = await Promise.all([get('search/quran.json'), get('quran/index.json')])
        const names: string[] = surahs.map((s: { name: string }) => s.name)
        return {
          rows: (raw as [number, number, string, string][]).map(([s, a, fa, ar]) => ({ sec: s, ch: 0, i: a, n: a, fa, nf: norm(fa), ar, na: arKey(ar) })),
          places: (s: number) => names[s - 1] ?? '',
        }
      }
      const [raw, toc] = await Promise.all([get(`search/${id}.json`), get(`${id}/toc.json`)])
      return {
        rows: (raw as [number, number, number, number, string, string][]).map(([sec, ch, i, n, fa, ar]) => ({ sec, ch, i, n, fa, nf: norm(fa), ar, na: arKey(ar) })),
        places: (sec: number, ch: number) => toc.sections[sec]?.chapters[ch]?.t ?? '',
      }
    })()
    p.catch(() => shards.delete(id))
    shards.set(id, p)
  }
  return shards.get(id)!
}

const PER_BOOK = 60
let latest = 0

self.onmessage = async (e: MessageEvent<SearchReq>) => {
  const { id, base, q, books } = e.data
  latest = id
  const words = norm(q.trim())
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(' ')
    .filter((w) => w.length > 1)
  const counts: Record<string, number> = {}
  const hits: Record<string, SearchHit[]> = {}
  const failed: string[] = []
  const post = (done: boolean) => (self as unknown as Worker).postMessage({ id, done, counts, hits, failed } satisfies SearchRes)
  if (!words.length) return post(true)
  for (const book of books) {
    let s
    try {
      s = await shard(base, book)
    } catch {
      failed.push(book)
      continue
    }
    if (id !== latest) return
    const list: SearchHit[] = []
    let count = 0
    for (const r of s.rows) {
      const inFa = r.nf && words.every((w) => r.nf.includes(w))
      if (!inFa && !words.every((w) => r.na.includes(w))) continue
      count++
      if (list.length < PER_BOOK) list.push({ book, sec: r.sec, ch: r.ch, i: r.i, n: r.n, fa: r.fa, ...(!inFa && { ar: r.ar }), place: s.places(r.sec, r.ch) })
    }
    if (count) {
      counts[book] = count
      hits[book] = list
    }
    post(false)
  }
  post(true)
}
