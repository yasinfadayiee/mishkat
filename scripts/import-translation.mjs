// ترجمهٔ پیش‌نویس (خروجی ChatGPT) را با فایل ورودی تطبیق می‌دهد و در content/translations/<کتاب>/ ذخیره می‌کند.
// اجرا: node scripts/import-translation.mjs <ورودی.json> <خروجی-fa.json> [شناسهٔ کتاب]
// اگر ورودی فیلد book داشته باشد، هر متن در کتاب خودش ذخیره می‌شود.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [inFile, outFile, bookArg] = process.argv.slice(2)
const input = JSON.parse(fs.readFileSync(inFile, 'utf8'))
const output = JSON.parse(fs.readFileSync(outFile, 'utf8'))
const BANNED = ['در روایت', 'حدیث دیگر', 'علامه', 'ابن ابی‌الحدید', 'تفسیر', 'نقل شده']
const HARAKAT = /[ً-ْ]{2,}/
const words = (t) => t.trim().split(/\s+/).length

const problems = []
const short = []
const byBook = {}
if (output.length !== input.length) problems.push(`تعداد: ورودی ${input.length}، خروجی ${output.length}`)
input.forEach((x, k) => {
  const y = output[k]
  if (!y || y.id !== x.id) return problems.push(`ردیف ${k + 1}: شناسهٔ ${x.id} جابه‌جا یا گم شده`)
  if (!y.fa?.trim()) return problems.push(`${x.id}: ترجمه خالی`)
  if (!y.note?.trim()) problems.push(`${x.id}: توضیح خالی`)
  if (words(y.fa) < 0.6 * words(x.ar)) short.push(`${x.id} (${words(x.ar)}→${words(y.fa)})`)
  for (const t of [y.note ?? '', y.mirror ?? '']) {
    if (HARAKAT.test(t)) problems.push(`${x.id}: عربی اعراب‌دار در توضیح`)
    for (const b of BANNED) if (t.includes(b)) problems.push(`${x.id}: «${b}» در توضیح — ${t.slice(0, 80)}`)
  }
  const book = x.book ?? bookArg
  ;(byBook[book] ??= []).push({ id: x.id, fa: y.fa.trim(), note: (y.note ?? '').trim(), mirror: (y.mirror ?? '').trim() })
})

if (problems.length) {
  console.log(`${problems.length} مشکل — چیزی ذخیره نشد:\n${problems.slice(0, 40).join('\n')}`)
  process.exit(1)
}
for (const [book, list] of Object.entries(byBook)) {
  const dir = path.join(root, 'content', 'translations', book)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, path.basename(outFile)), JSON.stringify(list, null, 1))
  console.log(`${book}: ${list.length} ترجمه ذخیره شد`)
}
if (short.length) console.log(`\nترجمه‌های کوتاه‌تر از انتظار (برای بازبینی): ${short.length}\n${short.slice(0, 30).join('، ')}`)
