// جست‌وجوی مثال در کتاب‌های آزاد جهانی (گوتنبرگ) برای یک مضمون.
// اجرا: node scripts/find-examples.mjs "<الگو ۱>" ["<الگو ۲>" ...] [--max 12] [--only 2680,45109]
//   هر الگو یک عبارت منظم انگلیسی است (بی‌حساسیت به حروف بزرگ). بندهایی چاپ می‌شوند که همهٔ الگوها را داشته باشند.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dir = path.join(root, 'corpus', 'commentary-cache', 'books')
const args = process.argv.slice(2)
const opt = (k, d) => (args.includes(k) ? args.splice(args.indexOf(k), 2)[1] : d)
const max = Number(opt('--max', 12))
const only = opt('--only', '')
const pats = args.map((a) => new RegExp(a, 'i'))
const { books } = JSON.parse(fs.readFileSync(path.join(root, 'content', 'commentary', 'world-books.json'), 'utf8'))
let n = 0
for (const id of Object.keys(books)) {
  if (only && !only.split(',').includes(id)) continue
  const f = path.join(dir, `${id}.txt`)
  if (!fs.existsSync(f)) continue
  let t = fs.readFileSync(f, 'utf8').replace(/\r/g, '')
  const s = t.indexOf('*** START'), e = t.indexOf('*** END')
  if (s > 0) t = t.slice(t.indexOf('\n', s), e > 0 ? e : undefined)
  for (const para of t.split(/\n\s*\n/)) {
    const p = para.replace(/\s+/g, ' ').trim()
    if (p.length < 40 || p.length > 900) continue
    if (pats.every((r) => r.test(p))) {
      console.log(`[${id} ${books[id].by.split(' (')[0]} — ${books[id].book}] ${p}\n`)
      if (++n >= max) process.exit()
    }
  }
}
