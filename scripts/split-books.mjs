// کتاب‌های ساخته‌شده در app/public/books را برای بارگذاری سریع تکه‌تکه می‌کند (پس از build-books و link-books اجرا می‌شود):
//   <id>/toc.json          فهرست کتاب: عنوان بخش‌ها و باب‌ها، تعداد متن و ترجمهٔ هر باب، حجم کل
//   <id>/<sec>-<ch>.json   متن‌های یک باب
//   <id>/ids.json          شناسهٔ متن‌های هر باب (فقط برای پیدا کردن جای نشان‌های قدیمی)
//   search/<id>.json       نمایهٔ جست‌وجوی هر کتاب (ترجمه و متن عربی)
//   topics/<topic>.json    متن‌های هر موضوع (برچسب‌ها و کلیدواژه‌ها)
//   daily.json             ۳۶۵ حکمت کوتاه نهج‌البلاغه و آیه‌های برگزیده، برای خانه و یادآور
//   manifest.json          هش هر فایل، تا service worker فقط فایل‌های تغییرکرده را تازه کند
// متن‌ها دست نمی‌خورند؛ فقط جابه‌جا می‌شوند.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TOPICS } from '../app/src/data/topics.ts'
import { lessons } from '../app/src/data/lessons.ts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dir = path.join(root, 'app', 'public', 'books')
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
const write = (f, d) => {
  fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true })
  fs.writeFileSync(path.join(dir, f), JSON.stringify(d))
}
const index = read('index.json')

// همان norm() در app/src/books.ts
const norm = (t) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[‌\s]+/g, ' ')
    .toLowerCase()

const books = {}
const search = {}
for (const meta of index.books.filter((b) => b.kind === 'book')) {
  // اگر کتاب قبلاً تکه شده، از روی همان تکه‌ها دوباره سر هم می‌شود (اجرای دوباره بدون build-books)
  const book = fs.existsSync(path.join(dir, `${meta.id}.json`))
    ? read(`${meta.id}.json`)
    : { id: meta.id, sections: read(`${meta.id}/toc.json`).sections.map((s, si) => ({ t: s.t, chapters: s.chapters.map((_, ci) => read(`${meta.id}/${si}-${ci}.json`)) })) }
  books[meta.id] = book
  fs.rmSync(path.join(dir, meta.id), { recursive: true, force: true })
  let bytes = 0
  const ids = []
  const rows = []
  const toc = {
    id: meta.id,
    sections: book.sections.map((s, si) => ({
      t: s.t,
      chapters: s.chapters.map((c, ci) => {
        const file = { t: c.t, ...(c.ta && { ta: c.ta }), items: c.items }
        const json = JSON.stringify(file)
        bytes += Buffer.byteLength(json)
        fs.mkdirSync(path.join(dir, meta.id), { recursive: true })
        fs.writeFileSync(path.join(dir, meta.id, `${si}-${ci}.json`), json)
        ids.push([si, ci, c.items.map((i) => i.i)])
        for (const it of c.items) rows.push([si, ci, it.i, it.n ?? 0, it.fa ?? '', it.ar])
        const tr = c.items.filter((i) => i.fa).length
        return { t: c.t, ...(c.ta && { ta: c.ta }), n: c.items.length, ...(tr && { tr }) }
      }),
    })),
    bytes,
  }
  write(`${meta.id}/toc.json`, toc)
  write(`${meta.id}/ids.json`, ids)
  search[meta.id] = rows
  meta.chapters = toc.sections.reduce((n, s) => n + s.chapters.length, 0)
  meta.bytes = bytes
  fs.rmSync(path.join(dir, `${meta.id}.json`), { force: true })
}

// قرآن: [سوره، آیه، ترجمه، متن عربی]
{
  const rows = []
  for (const s of read('quran/index.json')) {
    const d = read(`quran/${s.n}.json`)
    d.ayahs.forEach(([ar, f], k) => rows.push([s.n, k + 1, f, ar]))
  }
  search.quran = rows
}
for (const [id, rows] of Object.entries(search)) write(`search/${id}.json`, rows)

// موضوع‌ها: اول متن‌های برچسب‌خورده، بعد هر متنی که کلیدواژه‌اش در ترجمه آمده (همان روش قبلیِ صفحهٔ موضوع)
// هر سطر: [کتاب، بخش یا سوره، باب، شناسهٔ متن یا آیه، شمارهٔ متن، ترجمه، یعنی چه؟]
{
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const topic of TOPICS) {
    const re = new RegExp(`(^|[\\s«(،؛:.])(${topic.keys.map((k) => esc(norm(k))).join('|')})`, 'g')
    const seen = new Set()
    const out = []
    for (const [id, book] of Object.entries(books))
      book.sections.forEach((s, si) =>
        s.chapters.forEach((c, ci) =>
          c.items.forEach((it) => {
            if (it.fa && it.tg?.includes(topic.id)) {
              seen.add(`${id}:${it.i}`)
              out.push({ r: [id, si, ci, it.i, it.n ?? 0, it.fa, it.sm ?? ''], score: 100 })
            }
          }),
        ),
      )
    for (const [id, rows] of Object.entries(search))
      for (const row of rows) {
        const [book, sec, ch, i, n, f] = id === 'quran' ? ['quran', row[0], 0, row[1], row[1], row[2]] : [id, row[0], row[1], row[2], row[3], row[4]]
        if (!f || seen.has(`${book}:${i}`)) continue
        const hits = norm(f).match(re)?.length ?? 0
        if (hits) out.push({ r: [book, sec, ch, i, n, f, ''], score: hits * 10 - Math.min(9.5, f.length / 50) })
      }
    out.sort((a, b) => b.score - a.score)
    // از هر کتاب حداکثر ۶۰ متن (صفحهٔ موضوع بیش از این نشان نمی‌دهد)
    const per = {}
    const rows = out.filter((x) => (per[x.r[0]] = (per[x.r[0]] ?? 0) + 1) <= 60).map((x) => x.r.map((v, k) => (k === 5 && v.length > 280 ? `${v.slice(0, 270)}…` : v)))
    const count = Object.fromEntries(Object.entries(per))
    write(`topics/${topic.id}.json`, { rows, count })
  }
}

// سخن امروز: حکمت‌های کوتاه و ترجمه‌شدهٔ نهج‌البلاغه (بدون یادداشت‌های سید رضی)
{
  const nahj = books['Nahj-al-Balagha-Radi']
  const pool = []
  nahj.sections.forEach((s, si) =>
    s.chapters.forEach((c, ci) =>
      c.items.forEach((it) => {
        if (si === 2 && it.fa && it.sm && it.n && !/الرضي|وروي|وقد روى/.test(it.ar) && it.ar.split(' ').length < 40) pool.push({ ar: it.ar, fa: it.fa, sm: it.sm, ...(it.mr && { mr: it.mr }), n: it.n, sec: si, ch: ci, i: it.i })
      }),
    ),
  )
  // ۳۶۵ حکمت، پخش در سراسر کتاب
  const step = pool.length / 365
  const sayings = pool.length <= 365 ? pool : Array.from({ length: 365 }, (_, k) => pool[Math.floor(k * step)])
  // آیهٔ امروز: آیه‌های برگزیدهٔ درس‌نامه‌ها، تا آیه بیرون از سیاقش نیاید
  const ayahs = lessons.flatMap((l) => [
    ...(l.source.kind === 'quran' ? [{ ar: l.source.arabic, fa: l.source.translation, ref: l.source.verifyUrl }] : []),
    ...l.parallels.filter((x) => x.school === 'quran').map((x) => ({ ar: x.arabic, fa: x.translation, ref: x.verifyUrl })),
  ]).map((a) => {
    const [s, ay] = (a.ref.split('#')[1] ?? '1:1').split(':')
    return { ar: a.ar, fa: a.fa, s: Number(s), a: ay }
  })
  write('daily.json', { sayings, ayahs })
}

delete index.search
write('index.json', index)
for (const f of ['search.json', 'topics.json']) fs.rmSync(path.join(dir, f), { force: true })

// فهرست هش فایل‌ها
const manifest = {}
for (const f of fs.readdirSync(dir, { recursive: true })) {
  const p = path.join(dir, f)
  if (!fs.statSync(p).isFile() || f === 'manifest.json') continue
  manifest[f.split(path.sep).join('/')] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('base64url').slice(0, 8)
}
write('manifest.json', manifest)
const files = Object.keys(manifest).length
console.log(`کتاب‌ها تکه‌تکه شد: ${files} فایل`)
