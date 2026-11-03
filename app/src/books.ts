// بارگذاری کتاب‌ها از public/books (ساخته‌شده با scripts/build-books.mjs)

export interface Shelf {
  id: string
  title: string
}
export interface BookMeta {
  id: string
  kind: 'quran' | 'book'
  title: string
  author: string
  shelf: string
  desc: string
  count: number
  translated: number
  source?: string
}
export interface Item {
  i: number
  /** شمارهٔ رایج متن در کتاب (مثلاً شمارهٔ حکمت) */
  n?: number
  ar: string
  u?: string
  g?: [string, string][]
  fa?: string
  /** توضیح ساده */
  nt?: string
  /** پرسشی برای سنجیدن زندگی خود */
  mr?: string
  /** «یعنی چه؟»: یک جمله به زبان خودمانی */
  sm?: string
  /** «عمیق‌تر»: لایهٔ زیرین معنا */
  dp?: string
  /** واژه‌های کلیدی: [واژهٔ عربی، معنا] */
  w?: [string, string][]
  /** شناسهٔ موضوع‌ها (data/topics.ts) */
  tg?: string[]
}
export interface Chapter {
  t: string
  /** عنوان موضوعی (نهج‌البلاغه) یا عنوان عربی (صحیفه، صحیحین) */
  ta?: string
  items: Item[]
}
export interface Book {
  id: string
  sections: { t: string; chapters: Chapter[] }[]
}
export interface SurahMeta {
  n: number
  name: string
  type: string
  count: number
}
export interface Surah {
  n: number
  name: string
  ayahs: [string, string][]
}

const cache = new Map<string, Promise<unknown>>()
const load = <T>(file: string): Promise<T> => {
  if (!cache.has(file))
    cache.set(
      file,
      fetch(`books/${file}`).then((r) => {
        if (!r.ok) throw new Error(file)
        return r.json()
      }),
    )
  return cache.get(file) as Promise<T>
}

export const loadIndex = () => load<{ shelves: Shelf[]; books: BookMeta[] }>('index.json')
export const loadBook = (id: string) => load<Book>(`${id}.json`)
export const loadSurahs = () => load<SurahMeta[]>('quran/index.json')
export const loadSurah = (n: number) => load<Surah>(`quran/${n}.json`)
/** [کتاب، بخش یا سوره، باب، شمارهٔ متن یا آیه، متن فارسی] */
export type Hit = [string, number, number, number, string]
export const loadSearch = () => load<Hit[]>('search.json')
/** موضوع ← [کتاب، بخش، باب، شمارهٔ متن، ترجمه، یعنی چه؟] */
export type TopicHit = [string, number, number, number, string, string]
export const loadTopics = () => load<Record<string, TopicHit[]>>('topics.json')

/* ───────── جای مطالعه ───────── */
export interface Place {
  book: string
  title: string
  /** شمارهٔ سوره یا جایگاه بخش/باب */
  sec: number
  ch: number
  label: string
  at: string
}
const PLACE = 'mishkat.lastPlace'
export const savePlace = (p: Omit<Place, 'at'>) => {
  try {
    localStorage.setItem(PLACE, JSON.stringify({ ...p, at: new Date().toISOString() }))
  } catch {
    /* حافظهٔ مرورگر در دسترس نیست */
  }
}
export const lastPlace = (): Place | null => {
  try {
    return JSON.parse(localStorage.getItem(PLACE) ?? 'null')
  } catch {
    return null
  }
}

// جست‌وجوی بی‌حساسیت به اعراب، ی/ك عربی و نیم‌فاصله
export const norm = (t: string) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[‌\s]+/g, ' ')
    .toLowerCase()
