// منابع شرح عالمان را برای چند حکمت نهج‌البلاغه آماده می‌کند تا شرح از روی متن واقعی کتاب‌ها نوشته شود.
// اجرا: node scripts/commentary-sources.mjs <فایل باب، مثلاً 2-0> <از شناسه> <تا شناسه>
//   حکمت‌ها در هر شرح به ترتیب آمده‌اند؛ پس صفحه‌های هر کتاب از جایی که آخرین حکمتِ شرح‌شده بود به جلو خوانده
//   و در corpus/commentary-cache ذخیره می‌شوند (همان حافظه‌ای که verify-commentary.mjs می‌خواند). جای هر حکمت با
//   جست‌وجوی عبارتی از متن عربی پیدا می‌شود و برای هر حکمت بسته‌ای در corpus/commentary-cache/bundles/<id>.txt
//   ساخته می‌شود: متن، ترجمهٔ فعلی، و از هر شارح بخشی از صفحه با شمارهٔ جلد و صفحه.
//   جای شروع هر کتاب در corpus/commentary-cache/cursor.json نگه داشته می‌شود.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const cache = path.join(root, 'corpus', 'commentary-cache')
const bundles = path.join(cache, 'bundles')
fs.mkdirSync(bundles, { recursive: true })
const [chapter, from, to] = process.argv.slice(2)
const book = 'Nahj-al-Balagha-Radi'
const { commentators } = JSON.parse(fs.readFileSync(path.join(root, 'content', 'commentary', 'commentators.json'), 'utf8'))
const cursorFile = path.join(cache, 'cursor.json')
// جای حکمت ۱۰ در هر شرح (از کار دستی پیشین)؛ جلد هر کتاب برای بخش حکمت‌ها
const cursor = fs.existsSync(cursorFile) ? JSON.parse(fs.readFileSync(cursorFile, 'utf8')) : { iah: [18, 107], im: [5, 244], mb: [21, 25], mg: [4, 223], mk: [12, 83] }
const AHEAD = { iah: 40, im: 12, mb: 25, mg: 12, mk: 60 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const strip = (s) => s.replace(/[ً-ٰٟـ‌-‏]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/ة/g, 'ه').replace(/ک/g, 'ك')
function normMap(s) {
  const map = []
  let o = ''
  for (let k = 0; k < s.length; k++) {
    let c = s[k]
    if (/[ً-ٰٟـ‌-‏]/.test(c)) continue
    c = strip(c)
    if (/[\s()«»\-–،؛:.,]/.test(c)) {
      if (o.endsWith(' ')) continue
      c = ' '
    }
    o += c
    map.push(k)
  }
  return [o, map]
}

async function page(bookId, vol, p) {
  const f = path.join(cache, `${bookId}-${vol}-${p}.txt`)
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8')
  const h = await (await fetch(`https://lib.eshia.ir/${bookId}/${vol}/${p}`, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
  const m = h.match(/<td class="book-page-show"[\s\S]*?<\/td>/)
  if (!m) return ''
  const t = m[0].replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&zwnj;/g, '').replace(/\s7\s/g, ' ')
  fs.writeFileSync(f, t)
  await sleep(150)
  return t
}

// عبارت جست‌وجو: چهار واژهٔ نخست سخن، پس از «قال (عليه السلام)» و شماره
const phraseOf = (ar) => {
  let t = strip(ar).replace(/^[\s\d٠-٩.]+/, '')
  const k = t.indexOf('السلام')
  if (k >= 0 && k < 40) t = t.slice(k + 6)
  t = t.replace(/[()«»:،,.؛\-]/g, ' ')
  return t.split(/\s+/).filter((w) => w.length > 1).slice(0, 4).join(' ')
}

const ch = JSON.parse(fs.readFileSync(path.join(root, 'app', 'public', 'books', book, `${chapter}.json`), 'utf8'))
const items = ch.items.filter((x) => x.i >= Number(from) && x.i <= Number(to))
// متن هر کتاب از جای شروع تا چند صفحه جلوتر
const corpus = {}
for (const [key, [vol, start]] of Object.entries(cursor)) {
  const id = commentators[key].eshia
  let text = ''
  const marks = []
  for (let p = start; p <= start + AHEAD[key]; p++) {
    marks.push([text.length, p])
    text += (await page(id, vol, p)) + '\n'
  }
  corpus[key] = { vol, text, marks, norm: normMap(text) }
}
const pageAt = (c, i) => c.marks.filter((m) => m[0] <= i).pop()[1]

for (const it of items) {
  const phrase = phraseOf(it.v ?? it.ar)
  const out = [`# ${it.i} (حکمت ${it.n ?? '?'})`, `عبارت جست‌وجو: ${phrase}`, `متن: ${it.ar}`, `ترجمهٔ فعلی: ${it.fa ?? ''}`, '']
  const found = []
  for (const [key, c] of Object.entries(corpus)) {
    const [n, map] = c.norm
    const idx = []
    for (let i = n.indexOf(phrase); i >= 0; i = n.indexOf(phrase, i + 1)) idx.push(map[i])
    if (!idx.length) {
      out.push(`## ${key}: پیدا نشد`, '')
      found.push(`${key}:-`)
      continue
    }
    const pages = [...new Set(idx.map((i) => pageAt(c, i)))]
    found.push(`${key}:${c.vol}/${pages.join(',')}`)
    const first = idx[0]
    out.push(`## ${key} — ج ${c.vol}، صفحه‌های ${pages.join('، ')}`, c.text.slice(first, first + 2400).replace(/\s+/g, ' '), '')
    const last = idx[idx.length - 1]
    if (last - first > 2400) out.push(`### ${key} — ادامه از ص ${pageAt(c, last)}`, c.text.slice(last, last + 1200).replace(/\s+/g, ' '), '')
  }
  fs.writeFileSync(path.join(bundles, `${it.i}.txt`), out.join('\n'))
  console.log(it.i, phrase, '→', found.join('  '))
}
