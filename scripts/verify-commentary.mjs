// بازبین شرح عالمان و مثال‌ها: هر «نقل مستقیم» در content/commentary باید عیناً در همان صفحهٔ منبع باشد.
// اجرا: node scripts/verify-commentary.mjs
//   متن صفحه‌ها از lib.eshia.ir و ganjoor.net گرفته و در corpus/commentary-cache نگه داشته می‌شود (در git نیست).
//   مقایسه بدون اعراب و با یکسان‌سازی نویسه‌ها (ي/ی، ك/ک، همزه‌ها) و بدون نشانه‌گذاری است. «...» در نقل یعنی بخشی افتاده و هر تکه جدا بررسی می‌شود.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dir = path.join(root, 'content', 'commentary')
const cache = path.join(root, 'corpus', 'commentary-cache')
fs.mkdirSync(cache, { recursive: true })
const { commentators } = JSON.parse(fs.readFileSync(path.join(dir, 'commentators.json'), 'utf8'))

const norm = (s) =>
  s
    .replace(/&zwnj;/g, '')
    .replace(/[ً-ٰٟـ‌-‏]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ک/g, 'ك')
    .replace(/[\s،,.:؛«»()[\]\-–]+/g, '')

async function eshiaPage(book, vol, page) {
  const f = path.join(cache, `${book}-${vol}-${page}.txt`)
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8')
  const h = await (await fetch(`https://lib.eshia.ir/${book}/${vol}/${page}`, { headers: { 'user-agent': 'Mozilla/5.0' } })).text()
  const m = h.match(/<td class="book-page-show"[\s\S]*?<\/td>/)
  if (!m) throw new Error(`صفحه خوانده نشد: ${book}/${vol}/${page}`)
  // در این پایگاه «7» تنها، نشانهٔ «علیه السلام» است
  const t = m[0].replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s7\s/g, ' ')
  fs.writeFileSync(f, t)
  await new Promise((r) => setTimeout(r, 250))
  return t
}
async function ganjoor(url) {
  const u = url.replace('https://ganjoor.net', '')
  const f = path.join(cache, 'ganjoor' + u.replace(/\//g, '_') + '.txt')
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8')
  const r = await fetch('https://api.ganjoor.net/api/ganjoor/poem?url=' + encodeURIComponent(u))
  if (!r.ok) throw new Error(`گنجور خوانده نشد: ${u}`)
  const t = (await r.json()).plainText
  fs.writeFileSync(f, t)
  return t
}

let ok = 0
const bad = []
for (const bookId of fs.readdirSync(dir)) {
  const bdir = path.join(dir, bookId)
  if (!fs.statSync(bdir).isDirectory()) continue
  for (const f of fs.readdirSync(bdir)) {
    for (const item of JSON.parse(fs.readFileSync(path.join(bdir, f), 'utf8'))) {
      for (const c of item.cm ?? []) {
        const who = commentators[c.a]
        if (!who) bad.push(`${f} #${item.id}: شارح ناشناخته ${c.a}`)
        if (!c.v || !c.p || !c.u) bad.push(`${f} #${item.id} ${c.a}: جلد، صفحه یا نشانی ندارد`)
        if (c.k !== 'q' || !who?.eshia) continue
        const [a, b] = String(c.p).split('–').map(Number)
        let text = ''
        for (let p = a; p <= (b || a); p++) text += await eshiaPage(who.eshia, c.v, p)
        text = norm(text)
        for (const seg of (c.ar ?? c.fa).split(' ... ')) (text.includes(norm(seg)) ? ok++ : bad.push(`${f} #${item.id} ${c.a} ص ${c.p}: در منبع نیست ← ${seg.slice(0, 70)}`))
      }
      for (const e of item.eg ?? []) {
        if (!e.by || !e.book || !e.loc || !e.u || !e.r) bad.push(`${f} #${item.id}: مثال بدون نویسنده، کتاب، نشانی یا توضیح ربط`)
        if (e.k !== 'q' || !e.u.startsWith('https://ganjoor.net/')) continue
        const text = norm(await ganjoor(e.u))
        for (const line of e.t.split('\n')) (text.includes(norm(line)) ? ok++ : bad.push(`${f} #${item.id} مثال: در منبع نیست ← ${line}`))
      }
    }
  }
}
console.log(`نقل‌های تطبیق‌شده با منبع: ${ok}`)
if (bad.length) {
  console.log(`ناهمخوانی: ${bad.length}`)
  for (const b of bad) console.log('  ' + b)
  process.exit(1)
}
