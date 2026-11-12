// همهٔ کتاب‌های کتابخانه را از corpus/raw به app/public/books می‌سازد.
// متن عربی عیناً از منبع است؛ ترجمه‌ها و توضیح‌های فارسی (پیش‌نویس) از content/translations خوانده می‌شود.
// اجرا: node scripts/build-books.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BOOKS, SHELVES } from './book-meta.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const raw = path.join(root, 'corpus', 'raw')
const out = path.join(root, 'app', 'public', 'books')
const trDir = path.join(root, 'content', 'translations')
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'quran'), { recursive: true })
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const write = (f, d) => fs.writeFileSync(path.join(out, f), JSON.stringify(d))

// ترجمهٔ عنوان باب‌ها (en → fa)
const titleFa = new Map()
const titlesEn = read(path.join(root, 'corpus', 'titles-en.json'))
const tf = path.join(trDir, 'titles-fa.json')
if (fs.existsSync(tf)) {
  const byId = new Map(read(tf).map((x) => [x.id, x.fa]))
  for (const t of titlesEn) if (byId.get(t.id)) titleFa.set(t.en, byId.get(t.id))
}
const fa = (en) => titleFa.get((en ?? '').trim()) ?? ''
// عنوان‌های عربی و انگلیسیِ غرر، تحف و صحیحین → فارسی (اگر ترجمه‌اش آمده باشد)
const title2 = new Map()
const t2 = path.join(trDir, 'titles2-fa.json')
if (fs.existsSync(t2)) {
  const byId = new Map(read(t2).map((x) => [x.id, x.fa]))
  for (const t of read(path.join(root, 'corpus', 'titles2-src.json'))) if (byId.get(t.id)) title2.set(t.ar, byId.get(t.id))
}
const fa2 = (t) => (t && title2.get(t)) || t

// ترجمهٔ متن‌ها: content/translations/<bookId>/*.json → { id: {fa, note, mirror} }
const translations = (bookId) => {
  const dir = path.join(trDir, bookId)
  // چند شماره در منبع تکراری است (مثلاً غرر)؛ ترجمه‌های هم‌شماره به ترتیب کتاب به متن‌ها می‌رسند
  const m = new Map()
  let size = 0
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })) : []
  for (const f of files)
    for (const x of read(path.join(dir, f)))
      if (x.fa?.trim()) {
        if (!m.has(x.id)) m.set(x.id, [])
        m.get(x.id).push(x)
        size++
      }
  return { size, get: (id) => (m.get(id)?.length > 1 ? m.get(id).shift() : m.get(id)?.[0]) }
}

// «یعنی چه؟» و «عمیق‌تر»: یا در خود فایل ترجمه، یا جدا در content/enrich/<bookId>/ (برای متن‌هایی که از قبل ترجمه داشتند)
const enrichDir = path.join(root, 'content', 'enrich')
const enrichCache = new Map()
const enrichOf = (bookId) => {
  if (!enrichCache.has(bookId)) {
    const m = new Map()
    const dir = path.join(enrichDir, bookId)
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) for (const x of read(path.join(dir, f))) if (x.gist?.trim()) m.set(x.id, x)
    enrichCache.set(bookId, m)
  }
  return enrichCache.get(bookId)
}
let currentBook = ''
/** فارسیِ خوانا: کسرهٔ اضافه («زندگیِ مدرنِ ما»، «برایِ») که مترجم ماشینی زیاد می‌گذارد برداشته می‌شود؛
 *  «ه‌یِ / ه‌ی» اضافه به «هٔ» استاندارد برمی‌گردد. متن عربی و واژه‌های عربی دست نمی‌خورند. */
export const faClean = (s) =>
  typeof s === 'string'
    ? s
        .replace(/ه‌?یِ(?=[\s،؛.]|$)/g, 'هٔ')
        .replace(/([؀-ۿ‌])ِ/g, '$1')
    : s
const rich = (t) => {
  const e = enrichOf(currentBook).get(t.id) ?? {}
  const gist = faClean(t.gist || e.gist)
  const deep = faClean(t.deep || e.deep)
  const mirror = faClean(e.mirror || t.mirror)
  const words = t.words ?? e.words
  const tags = t.tags ?? e.tags
  return { fa: t.fa, nt: faClean(t.note), mr: mirror, ...(gist && { sm: gist }), ...(deep && { dp: deep }), ...(words?.length && { w: words.map((x) => [x.w, faClean(x.m)]) }), ...(tags?.length && { tg: tags }) }
}

const index = { shelves: SHELVES, books: [] }

/* ───────── قرآن ───────── */
const qa = read(path.join(raw, 'quran-quran-uthmani.json')).data.surahs
const qf = read(path.join(raw, 'quran-fa.makarem.json')).data.surahs
// نشانه‌های تنزیل: آغاز جزء و حزب، و آیه‌های سجده ({ آیه: { j, h, sj } })
const juz = []
let lastJuz = 0
let lastHq = 0
const surahs = qa.map((s, i) => {
  const ayahs = s.ayahs.map((a, k) => [a.text.replace(/^﻿/, ''), qf[i].ayahs[k].text])
  const m = {}
  for (const a of s.ayahs) {
    const x = {}
    if (a.juz !== lastJuz) (x.j = a.juz), juz.push({ j: a.juz, s: s.number, a: a.numberInSurah }), (lastJuz = a.juz)
    if (a.hizbQuarter !== lastHq) {
      if (a.hizbQuarter % 4 === 1) x.h = (a.hizbQuarter + 3) / 4
      lastHq = a.hizbQuarter
    }
    if (a.sajda) x.sj = 1
    if (Object.keys(x).length) m[a.numberInSurah] = x
  }
  write(`quran/${s.number}.json`, { n: s.number, name: s.name, type: s.revelationType, ayahs, m })
  return { n: s.number, name: s.name.replace(/^سُورَةُ\s*/, ''), type: s.revelationType === 'Meccan' ? 'مکی' : 'مدنی', count: s.ayahs.length }
})
write('quran/index.json', surahs)
write('quran/juz.json', juz)
index.books.push({ id: 'quran', kind: 'quran', title: 'قرآن کریم', author: 'متن عثمانی تنزیل · ترجمهٔ آیت‌الله مکارم شیرازی', shelf: 'quran', desc: '۱۱۴ سوره و ۶٬۲۳۶ آیه، با ترجمهٔ کامل فارسی و تلاوت.', count: 6236, translated: 6236 })

/* ───────── صحیفهٔ سجادیه (ویکی‌نبشته) ───────── */
{
  const wt = read(path.join(root, 'corpus', 'sahifa-index.json')).parse.wikitext['*']
  const tr = translations('sahifa')
  currentBook = 'sahifa'
  const parts = wt.split(/^==(?!=)(.*?)==\s*$/m)
  const chapters = []
  let id = 0
  for (let i = 1; i < parts.length; i += 2) {
    const head = parts[i].replace(/'''/g, '').trim()
    const [num, ...rest] = head.split(':')
    const paras = parts[i + 1]
      .replace(/\{\{[^}]*\}\}/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 1)
      // بندهای بلند در جای نقطه به تکه‌های حدوداً ۶۰ کلمه‌ای شکسته می‌شوند
      .flatMap((p) => {
        const chunks = ['']
        for (const s of p.split(/(?<=\.)\s+/)) {
          if (chunks.at(-1).split(' ').length > 45) chunks.push('')
          chunks[chunks.length - 1] = `${chunks.at(-1)} ${s}`.trim()
        }
        return chunks
      })
    const items = paras.map((ar) => {
      id++
      const t = tr.get(id)
      return { i: id, ar, ...(t && { ...rich(t) }) }
    })
    chapters.push({ t: `دعای ${chapters.length + 1}`, ta: rest.join(':').trim() || num.trim(), items })
  }
  write('sahifa.json', { id: 'sahifa', sections: [{ t: '', chapters }] })
  index.books.push({ id: 'sahifa', kind: 'book', title: 'صحیفهٔ سجادیه', author: 'دعاهای امام سجاد (ع)', shelf: 'quran', desc: '۵۴ دعا، «زبور آل محمد (ص)». متن عربی از ویکی‌نبشتهٔ عربی.', count: id, translated: tr.size, source: 'https://ar.wikisource.org/wiki/الصحيفة_السجادية' })
}

/* ───────── غررالحکم (تصنیف موضوعی، OpenITI) ───────── */
{
  const lines = fs.readFileSync(path.join(raw, 'ghurar.mARkdown'), 'utf8').split('\n')
  const tr = translations('ghurar')
  currentBook = 'ghurar'
  const clean = (t) => t.replace(/\bms\d+\b/g, '').replace(/\s+/g, ' ').trim()
  const sections = []
  let fasl = ''
  let cur = null
  let started = false
  let pending = { bab: '', fasl: '', topic: '' }
  const flush = () => {
    if (!cur) return
    const m = cur.match(/^@HAD\d*\s+(\d+)\s+(.*?)(?:\s*\(([\d/ ]+)\)\.?)?$/)
    if (m) {
      const id = Number(m[1])
      const t = tr.get(id)
      let sec = sections.at(-1)
      if (!sec) sections.push((sec = { t: '', chapters: [] }))
      let ch = sec.chapters.at(-1)
      if (!ch) sec.chapters.push((ch = { t: fasl || 'متفرقه', items: [] }))
      ch.items.push({ i: id, ar: m[2].trim(), ...(t && { ...rich(t) }) })
    }
    cur = null
  }
  for (const raw0 of lines) {
    const line = raw0.trim()
    if (/^#?\s*PageV/.test(line) || !line) continue
    if (line.startsWith('### |||')) {
      flush()
      const h = clean(line.slice(7))
      // پیش از نخستین حکمت فقط آخرین عنوان‌ها نگه داشته می‌شود (فهرست و مقدمه کنار می‌رود)
      if (!started) {
        if (/^الباب/.test(h)) pending = { bab: h, fasl: '', topic: '' }
        else if (/^الفصل/.test(h)) pending.fasl = h
        else if (!/^القسم/.test(h)) pending.topic = h
        continue
      }
      if (/^القسم/.test(h)) continue
      if (/^الباب/.test(h)) sections.push({ t: h, chapters: [] })
      else if (/^الفصل/.test(h)) fasl = h
      else (sections.at(-1) ?? sections[sections.push({ t: '', chapters: [] }) - 1]).chapters.push({ t: h, ta: fasl, items: [] })
    } else if (line.startsWith('# @HAD')) {
      flush()
      if (!started) {
        started = true
        fasl = pending.fasl
        sections.push({ t: pending.bab, chapters: [{ t: pending.topic || pending.fasl, ta: pending.fasl, items: [] }] })
      }
      cur = clean(line.slice(2))
    } else if (line.startsWith('~~') && cur) cur += ' ' + clean(line.slice(2))
  }
  flush()
  for (const s of sections) s.chapters = s.chapters.filter((c) => c.items.length)
  const kept = sections.filter((s) => s.chapters.length)
  const count = kept.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.items.length, 0), 0)
  for (const s of kept) {
    s.t = fa2(s.t)
    for (const c of s.chapters) Object.assign(c, { t: fa2(c.t), ta: fa2(c.ta) })
  }
  write('ghurar.json', { id: 'ghurar', sections: kept })
  index.books.push({ id: 'ghurar', kind: 'book', title: 'غررالحکم و دررالکلم', author: 'گردآوری عبدالواحد آمدی (د. ۵۱۰ ق)', shelf: 'nahj', desc: 'سخنان کوتاه امیرالمؤمنین (ع)، در ترتیب موضوعی (تصنیف غررالحکم). متن عربی از پیکرهٔ آزاد OpenITI.', count, translated: tr.size, order: 2, source: 'https://github.com/OpenITI/0500AH' })
}

/* ───────── تحف‌العقول (OpenITI) ───────── */
{
  const lines = fs.readFileSync(path.join(raw, 'tuhaf.mARkdown'), 'utf8').split('\n')
  const tr = translations('tuhaf')
  currentBook = 'tuhaf'
  // آغاز بخش هر معصوم در فایل (شمارهٔ سطر)
  const parts = [
    [1, 'سخنان پیامبر (ص)'],
    [1075, 'سخنان امیرالمؤمنین علی (ع)'],
    [4020, 'سخنان امام حسن (ع)'],
    [4248, 'سخنان امام حسین (ع)'],
    [4462, 'سخنان امام سجاد (ع)'],
    [5126, 'سخنان امام باقر (ع)'],
    [5469, 'سخنان امام صادق (ع)'],
    [7101, 'سخنان امام کاظم (ع)'],
    [7702, 'سخنان امام رضا (ع)'],
    [8364, 'سخنان امام جواد (ع)'],
    [8497, 'سخنان امام هادی (ع)'],
    [9058, 'سخنان امام حسن عسکری (ع)'],
  ]
  const clean = (t) =>
    t
      .replace(/\bms\d+\b/g, '')
      .replace(/PageV\d+P\d+/g, '')
      .replace(/\(\d+\)|\(\*\)/g, '')
      .replace(/\[بسم الله الرحمن الرحيم\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  const paras = []
  let cur = null
  lines.forEach((l, k) => {
    if (l.startsWith('# ')) {
      if (cur) paras.push(cur)
      cur = { line: k + 1, text: l.slice(2) }
    } else if (l.startsWith('~~') && cur) cur.text += ' ' + l.slice(2)
  })
  if (cur) paras.push(cur)
  const sections = parts.map(([, t]) => ({ t, chapters: [{ t: 'آغاز بخش', items: [] }] }))
  sections[0].chapters[0].t = 'مقدمهٔ مؤلف'
  let id = 0
  for (const p of paras) {
    if (/^\s*(#\s*)?PageV/.test(p.text) || /^\s*\(\d+\)/.test(p.text)) continue // شمارهٔ صفحه و پاورقی
    const si = parts.findLastIndex(([line]) => p.line >= line)
    const sec = sections[si]
    let text = p.text
    // «* (ومن كلامه …) *» در آغاز بند، عنوان باب تازه است
    const m = text.match(/^\s*\*\s*\(([^)]{3,120})\)\s*\*\s*(.*)$/)
    if (m) {
      sec.chapters.push({ t: clean(m[1]), items: [] })
      text = m[2]
    }
    text = clean(text)
    if (text.split(' ').length < 3) continue
    id++
    const t = tr.get(id)
    sec.chapters.at(-1).items.push({ i: id, ar: text, ...(t && { ...rich(t) }) })
  }
  for (const s of sections) s.chapters = s.chapters.filter((c) => c.items.length)
  for (const s of sections) for (const c of s.chapters) c.t = fa2(c.t)
  write('tuhaf.json', { id: 'tuhaf', sections })
  index.books.push({ id: 'tuhaf', kind: 'book', title: 'تحف‌العقول', author: 'ابن شعبهٔ حرانی (سدهٔ چهارم ق)', shelf: 'other', desc: 'سخنان پیامبر (ص) و یازده امام (ع): وصیت‌ها، نامه‌ها و سخنان کوتاه. متن عربی از پیکرهٔ آزاد OpenITI.', count: id, translated: tr.size, order: 0, source: 'https://github.com/OpenITI/0400AH' })
}

/* ───────── کتاب‌های ثقلین ───────── */
const cleanGrade = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
for (const [bookId, meta] of Object.entries(BOOKS)) {
  const data = read(path.join(raw, `${bookId}.json`))
  const tr = translations(bookId)
  currentBook = bookId
  const isNahj = bookId.startsWith('Nahj')
  const sections = []
  for (const h of data) {
    let sec = sections.at(-1)
    if (!sec || sec.en !== h.category) sections.push((sec = { en: h.category, t: fa(h.category), chapters: [] }))
    let ch = sec.chapters.at(-1)
    const key = isNahj ? `${h.category}:${h.chapterInCategoryId}` : h.chapter
    if (!ch || ch.key !== key) {
      const label = isNahj ? `${{ Sermons: 'خطبهٔ', Letters: 'نامهٔ', Sayings: 'حکمت' }[h.category] ?? ''} ${h.chapterInCategoryId.toLocaleString('fa-IR')}` : fa(h.chapter)
      sec.chapters.push((ch = { key, t: label, ...(isNahj && { ta: fa(h.chapter) }), items: [] }))
    }
    const g = [
      ['مجلسی', cleanGrade(h.majlisiGrading)],
      ['محسنی', cleanGrade(h.mohseniGrading)],
      ['بهبودی', cleanGrade(h.behbudiGrading)],
    ].filter(([, v]) => v)
    const t = tr.get(h.id)
    ch.items.push({ i: h.id, ar: (h.arabicText ?? '').trim(), u: h.URL, ...(g.length && { g }), ...(t && { ...rich(t) }) })
  }
  const slug = bookId.replace(/[’']/g, '')
  // نهج‌البلاغه به ترتیب رایج: خطبه‌ها، نامه‌ها، حکمت‌ها؛ حکمت‌ها بیست‌تا بیست‌تا در یک صفحه
  if (isNahj) {
    const order = ['Sermons', 'Letters', 'Sayings']
    sections.sort((a, b) => order.indexOf(a.en) - order.indexOf(b.en))
    for (const sec of sections) {
      sec.t = { Sermons: 'خطبه‌ها', Letters: 'نامه‌ها', Sayings: 'حکمت‌ها (سخنان کوتاه)' }[sec.en] ?? sec.t
      // فقط حکمت‌ها شمارهٔ خودشان را نشان می‌دهند؛ بندهای خطبه و نامه شمارهٔ بند می‌گیرند
      if (sec.en === 'Sayings')
        for (const c of sec.chapters) {
          const n = Number(c.key.split(':')[1])
          for (const it of c.items) it.n = n
        }
      if (sec.en === 'Sayings') {
        const pages = []
        for (const c of sec.chapters) {
          const n = c.items[0].n
          const k = Math.floor((n - 1) / 20)
          pages[k] ??= { t: `حکمت‌های ${(k * 20 + 1).toLocaleString('fa-IR')} تا ${(k * 20 + 20).toLocaleString('fa-IR')}`, items: [] }
          pages[k].items.push(...c.items)
        }
        sec.chapters = pages.filter(Boolean).map((p) => ({ ...p, t: p.t.replace(/تا [۰-۹]+$/, `تا ${p.items.at(-1).n.toLocaleString('fa-IR')}`) }))
      }
    }
  }
  for (const s of sections) {
    delete s.en
    for (const c of s.chapters) delete c.key
  }
  write(`${slug}.json`, { id: slug, sections })
  index.books.push({ id: slug, kind: 'book', ...meta, count: data.length, translated: tr.size, source: 'https://thaqalayn.net' })
}

/* ───────── صحیح بخاری و مسلم (فقط متن عربی) ───────── */
for (const [col, title] of [
  ['bukhari', 'صحیح بخاری'],
  ['muslim', 'صحیح مسلم'],
]) {
  const d = read(path.join(raw, `ara-${col}.json`))
  const chapters = []
  for (const h of d.hadiths) {
    const b = h.reference?.book ?? 0
    let ch = chapters.at(-1)
    if (!ch || ch.b !== b) chapters.push((ch = { b, t: `کتاب ${b.toLocaleString('fa-IR')}`, ta: d.metadata.sections?.[b] ?? '', items: [] }))
    ch.items.push({ i: h.hadithnumber, ar: h.text.trim(), u: `https://sunnah.com/${col}:${h.hadithnumber}` })
  }
  for (const c of chapters) {
    delete c.b
    c.ta = fa2(c.ta)
  }
  write(`${col}.json`, { id: col, sections: [{ t: '', chapters }] })
  index.books.push({ id: col, kind: 'book', title, author: col === 'bukhari' ? 'محمد بن اسماعیل بخاری (د. ۲۵۶ ق)' : 'مسلم بن حجاج نیشابوری (د. ۲۶۱ ق)', shelf: 'sunni', desc: 'از مهم‌ترین منابع حدیثی اهل سنت؛ فقط متن عربی.', count: d.hadiths.length, translated: 0, source: 'https://sunnah.com' })
}

// نمایهٔ جست‌وجو، موضوع‌ها و سخن امروز در scripts/split-books.mjs ساخته می‌شوند

index.books.sort((a, b) => SHELVES.findIndex((s) => s.id === a.shelf) - SHELVES.findIndex((s) => s.id === b.shelf) || (a.order ?? 0) - (b.order ?? 0))
write('index.json', index)
let size = 0
for (const f of fs.readdirSync(out, { recursive: true })) {
  const p = path.join(out, f)
  if (fs.statSync(p).isFile()) size += fs.statSync(p).size
}
console.log(`${index.books.length} کتاب، ${index.books.reduce((s, b) => s + b.count, 0).toLocaleString('fa-IR')} متن، ${index.books.reduce((s, b) => s + b.translated, 0).toLocaleString('fa-IR')} با ترجمه — ${(size / 1e6).toFixed(1)} مگابایت`)

// پیوند سخن‌های یکسان غرر و نهج‌البلاغه
await import('./link-books.mjs')
// هر کتاب به فهرست و باب‌ها تکه می‌شود تا برنامه فقط همان باب را بگیرد
await import('./split-books.mjs')
