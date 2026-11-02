// جستجو در پیکرهٔ ثقلین (نهج‌البلاغه، کافی ج۲) با الگوهای بدون اعراب
// اجرا: node scripts/find-texts.mjs "<الگو>" ["<الگو>" ...]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raw = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'corpus', 'raw')
const strip = (t) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ‌‏‎]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
const books = ['Nahj-al-Balagha-Radi', 'Al-Kafi-Volume-2-Kulayni'].map((b) => JSON.parse(fs.readFileSync(path.join(raw, `${b}.json`), 'utf8')))

for (const pat of process.argv.slice(2)) {
  const re = new RegExp(strip(pat))
  const hits = books.flat().filter((h) => re.test(strip(h.arabicText)))
  console.log(`\n### ${pat} → ${hits.length}`)
  for (const h of hits.slice(0, 2)) {
    const where = h.bookId.startsWith('Nahj') ? `Nahj ${h.category}` : `Kafi2 «${h.chapter}»`
    console.log(`- ${where} | ${h.URL} | majlisi=${h.majlisiGrading || '-'}`)
    const t = h.arabicText.replace(/\s+/g, ' ')
    const i = strip(t).search(re)
    console.log('  ' + (t.length > 420 ? t.slice(Math.max(0, i - 120), i + 300) : t))
  }
}
