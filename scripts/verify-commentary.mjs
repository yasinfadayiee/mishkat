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
    .replace(/[\s،,.:؛«»()[\]\-–!?؟]+/g, '')

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

// انگلیسی: حروف کوچک، بدون نشانه‌گذاری و فاصله؛ نقل‌قول‌های خمیده و صاف یکی
const enNorm = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, '')
async function gutenberg(id) {
  const f = path.join(cache, 'books', `${id}.txt`)
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8')
  fs.mkdirSync(path.dirname(f), { recursive: true })
  const r = await fetch(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`, { headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`گوتنبرگ خوانده نشد: ${id}`)
  const t = await r.text()
  fs.writeFileSync(f, t)
  return t
}

let ok = 0
const bad = []
// مثال‌های جهانی جدا در world-examples.json هر کتاب نگه داشته می‌شوند
const worldOf = (bdir) => { const f = path.join(bdir, 'world-examples.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).items : {} }
for (const bookId of fs.readdirSync(dir)) {
  const bdir = path.join(dir, bookId)
  if (!fs.statSync(bdir).isDirectory()) continue
  const world = worldOf(bdir)
  const files = fs.readdirSync(bdir).filter((x) => x !== 'world-examples.json')
  files.push('world-examples.json')
  for (const f of files) {
    const list = f === 'world-examples.json' ? Object.entries(world).map(([id, eg]) => ({ id, eg })) : JSON.parse(fs.readFileSync(path.join(bdir, f), 'utf8'))
    for (const item of list) {
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
        if (e.k !== 'q') continue
        if (e.u.startsWith('https://ganjoor.net/')) {
          const text = norm(await ganjoor(e.u))
          for (const line of e.t.split('\n')) (text.includes(norm(line)) ? ok++ : bad.push(`${f} #${item.id} مثال: در منبع نیست ← ${line}`))
        } else if (e.u.startsWith('https://www.gutenberg.org/ebooks/')) {
          // کتاب‌های آزاد جهانی: متن اصلی انگلیسی (e.t) باید عیناً در فایل گوتنبرگ باشد؛ e.tf ترجمهٔ فارسی است
          if (!e.tf) bad.push(`${f} #${item.id} مثال: ترجمهٔ فارسی (tf) ندارد`)
          const text = enNorm(await gutenberg(e.u.split('/').pop()))
          for (const seg of e.t.split(' ... ')) (text.includes(enNorm(seg)) ? ok++ : bad.push(`${f} #${item.id} مثال: در کتاب نیست ← ${seg.slice(0, 70)}`))
        } else bad.push(`${f} #${item.id} مثال: منبع قابل‌تطبیق نیست ← ${e.u}`)
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
