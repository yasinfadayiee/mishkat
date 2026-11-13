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
  /** تعداد باب‌ها و حجم کل باب‌ها (بایت) */
  chapters?: number
  bytes?: number
}
/** شرح تازهٔ یک جمله: چه می‌گوید، چرا گفته، واژه‌های کلیدی، و معنایش در زندگی امروز */
export interface Explain {
  s: string
  c: string
  k?: [string, string][]
  l: string
}
/** شرح یک عالم: نقل مستقیم (q) یا خلاصه (s)، با جلد و صفحه و نشانی منبع */
export interface Comment {
  a: string
  k: 'q' | 's'
  ar?: string
  fa: string
  v: number
  p: string
  u: string
  /** نام، گرایش، کتاب، درگذشت و توضیح لازم دربارهٔ شارح */
  n: string
  s: string
  b: string
  d?: string
  c?: string
}
/** مثال از کتابی دیگر */
export interface Example {
  k: 'q' | 's'
  t: string
  by: string
  book: string
  loc: string
  u: string
  r: string
}
export interface Item {
  i: number
  ex?: Explain
  cm?: Comment[]
  /** جمع‌بندی: شارحان کجا هم‌نظرند و کجا اختلاف دارند */
  cj?: string
  eg?: Example[]
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
  /** همان متن با اعراب، برگرفته از متن اعراب‌دار نهج‌البلاغه (غرر) */
  v?: string
  /** همین سخن در کتاب دیگر: [کتاب، بخش، باب، شناسهٔ متن، برچسب مثل «حکمت ۸۶»] */
  x?: [string, number, number, number, string][]
  /** شناسهٔ موضوع‌ها (data/topics.ts) */
  tg?: string[]
}
export interface Chapter {
  t: string
  /** عنوان موضوعی (نهج‌البلاغه) یا عنوان عربی (صحیفه، صحیحین) */
  ta?: string
  items: Item[]
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
  type: string
  ayahs: [string, string][]
  /** نشانه‌های تنزیل: آغاز جزء (j)، آغاز حزب (h)، آیهٔ سجده (sj) */
  m?: Record<string, { j?: number; h?: number; sj?: 1 }>
}

/** فهرست یک کتاب (books/<id>/toc.json) */
export interface TocChapter {
  t: string
  ta?: string
  /** تعداد متن‌ها */
  n: number
  /** تعداد متن‌های ترجمه‌شده */
  tr?: number
}
export interface Toc {
  id: string
  sections: { t: string; chapters: TocChapter[] }[]
  /** حجم همهٔ باب‌ها (بایت) */
  bytes: number
}
export interface DailySaying {
  ar: string
  fa: string
  sm: string
  mr?: string
  n: number
  sec: number
  ch: number
  i: number
}
export interface DailyAyah {
  ar: string
  fa: string
  s: number
  a: string
}

/** خطای بارگذاری؛ offline یعنی اینترنت نیست و این فایل هنوز ذخیره نشده */
export class LoadError extends Error {
  offline: boolean
  constructor(file: string, offline: boolean) {
    super(file)
    this.offline = offline
  }
}

const cache = new Map<string, Promise<unknown>>()
const load = <T>(file: string): Promise<T> => {
  if (!cache.has(file)) {
    const p = fetch(`books/${file}`)
      .catch(() => {
        throw new LoadError(file, true)
      })
      .then((r) => {
        if (!r.ok) throw new LoadError(file, !navigator.onLine)
        return r.json()
      })
    // اگر نشد، دفعهٔ بعد دوباره تلاش شود
    p.catch(() => cache.delete(file))
    cache.set(file, p)
  }
  return cache.get(file) as Promise<T>
}

export const loadIndex = () => load<{ shelves: Shelf[]; books: BookMeta[] }>('index.json')
export const loadToc = (id: string) => load<Toc>(`${id}/toc.json`)
export const loadChapter = (id: string, sec: number, ch: number) => load<Chapter>(`${id}/${sec}-${ch}.json`)
export const chapterFile = (id: string, sec: number, ch: number) => `books/${id}/${sec}-${ch}.json`
/** سخن و آیهٔ یک روز (روز شمارهٔ day از آغاز تقویم یونیکس)؛ فقط فایل ۳۰ روزهٔ همان روز گرفته می‌شود */
export const DAILY_DAYS = 365
export async function loadDay(day: number): Promise<{ saying: DailySaying; ayah: DailyAyah }> {
  const d = ((day % DAILY_DAYS) + DAILY_DAYS) % DAILY_DAYS
  const chunk = await load<{ saying: DailySaying; ayah: DailyAyah }[]>(`daily/${Math.floor(d / 30)}.json`)
  return chunk[d % 30]
}
export const loadSurahs = () => load<SurahMeta[]>('quran/index.json')
export const loadSurah = (n: number) => load<Surah>(`quran/${n}.json`)
export const loadJuz = () => load<{ j: number; s: number; a: number }[]>('quran/juz.json')
/** موضوع ← [کتاب، بخش یا سوره، باب، شناسهٔ متن یا آیه، شمارهٔ متن، ترجمه، یعنی چه؟] */
export type TopicHit = [string, number, number, number, number, string, string]
export const loadTopic = (id: string) => load<{ rows: TopicHit[]; count: Record<string, number> }>(`topics/${id}.json`)

/** جای یک متن در کتاب با شناسه‌اش (برای نشان‌ها و یادداشت‌های قدیمی که جایشان ذخیره نشده) */
export async function findItem(book: string, i: number): Promise<[number, number] | null> {
  const ids = await load<[number, number, number[]][]>(`${book}/ids.json`)
  const hit = ids.find(([, , list]) => list.includes(i))
  return hit ? [hit[0], hit[1]] : null
}

/* ───────── جای مطالعه ───────── */
export interface Place {
  book: string
  title: string
  /** شمارهٔ سوره یا جایگاه بخش/باب */
  sec: number
  ch: number
  label: string
  /** شناسهٔ متن یا شمارهٔ آیه‌ای که خواننده به آن رسیده بود */
  i?: number
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
