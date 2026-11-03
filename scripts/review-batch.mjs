// خروجی مترجم را پیش از انتشار برای بازبینی دستی غربال می‌کند.
// اجرا: node scripts/review-batch.mjs <ورودی.json> <خروجی-fa.json> [--all]
// موارد مشکوک را با متن عربی کنار هم چاپ می‌کند تا یکی‌یکی خوانده شوند.
import fs from 'node:fs'

const [inFile, outFile, flag] = process.argv.slice(2)
const input = JSON.parse(fs.readFileSync(inFile, 'utf8'))
const output = JSON.parse(fs.readFileSync(outFile, 'utf8'))
const words = (t) => (t ?? '').trim().split(/\s+/).filter(Boolean).length

// ادعاهایی که اگر در عربی نباشند، در ترجمه یا توضیح نباید بیایند
const CLAIMS = [
  [/حرام|حلال|واجب|مستحب|مکروه/, /حرام|حلال|واجب|فرض|فريض|سنة|يكره|كره/],
  [/بهشت/, /جن|فردوس|رضوان/],
  [/دوزخ|جهنم/, /نار|جهنم|جحيم|سعير/],
  [/ثواب|پاداش/, /ثواب|أجر|اجر|جزاء|جزا/],
  [/پیامبر|رسول خدا/, /رسول|نبي|النبى|محمد|صلى الله عليه|پیامبر/],
  [/قرآن|آیه/, /قرآن|القرآن|آية|اية|تعالى|عز وجل|قال الله/],
]
// صفت‌ها و قیدهایی که مترجم ماشینی گاهی از خودش اضافه می‌کند
const EXTRAS = ['گران‌بها', 'گرانبها', 'واقعی', 'آگاهانه', 'حقیقتاً', 'بی‌شک', 'قطعاً', 'همیشه', 'هرگز', 'بسیار', 'فوق‌العاده', 'زیبا']
const ARABIC_NUM = /[٠-٩0-9]|واحد|اثن|ثلاث|أربع|اربع|خمس|ست|سبع|ثمان|تسع|عشر|مائة|مئة|ألف|الف/

const flagged = []
input.forEach((x, k) => {
  const y = output[k]
  const why = []
  if (!y || y.id !== x.id) return flagged.push({ x, y, why: ['شناسه جابه‌جا'] })
  const r = words(y.fa) / Math.max(1, words(x.ar))
  if (r < 0.8) why.push(`ترجمه کوتاه (${r.toFixed(2)})`)
  // سخن کوتاه عربی در فارسی طبیعتاً چند برابر می‌شود
  if (r > 2.4 && words(x.ar) >= 8) why.push(`ترجمه بلند (${r.toFixed(2)})`)
  const all = `${y.fa} ${y.note} ${y.mirror}`
  for (const [fa, ar] of CLAIMS) if (fa.test(y.note + ' ' + y.mirror) && !ar.test(`${x.ar} ${x.speaker ?? ""} ${x.topic ?? ""}`)) why.push(`توضیح: «${all.match(fa)[0]}» در عربی نیست`)
  for (const e of EXTRAS) if (y.fa.includes(e)) why.push(`صفت «${e}» در ترجمه`)
  if (/[۰-۹0-9]/.test(y.note) && !ARABIC_NUM.test(x.ar)) why.push('عدد در توضیح')
  if (/\[[^\]]{25,}\]/.test(y.fa)) why.push('افزودهٔ بلند در قلاب')
  if (why.length || flag === '--all') flagged.push({ x, y, why })
})

for (const { x, y, why } of flagged) {
  console.log(`\n── ${x.id} · ${why.join('، ') || 'نمونه'}`)
  console.log(`AR: ${x.ar}`)
  console.log(`FA: ${y?.fa}`)
  console.log(`NT: ${y?.note}`)
  console.log(`MR: ${y?.mirror}`)
}
console.log(`\n${flagged.length} از ${input.length} برای بازبینی`)
