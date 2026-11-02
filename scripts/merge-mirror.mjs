// بخش «در آینهٔ زندگی تو» (پیش‌نویس ChatGPT در content/drafts/mirror.json) را بررسی و در app/src/data/mirror.ts می‌نویسد.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lessons } from '../app/src/data/lessons.ts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const items = JSON.parse(fs.readFileSync(path.join(root, 'content', 'drafts', 'mirror.json'), 'utf8'))
const BANNED = ['روایت', 'حدیث دیگر', 'فرمود', 'علامه', 'تفسیر', 'آیه‌ای دیگر', 'نقل شده', 'حرام', 'واجب', 'ثواب', 'عذاب', 'بهشت', 'جهنم']
const HARAKAT = /[ً-ْ]{2,}/

const out = {}
const problems = []
for (const l of lessons) {
  const x = items.find((i) => i.id === l.id)
  if (!x) {
    problems.push(`${l.id}: آینه نوشته نشده`)
    continue
  }
  const errs = []
  if (!x.intro?.trim()) errs.push('مقدمه خالی است')
  if (!(x.moments?.length >= 3)) errs.push('کمتر از سه موقعیت')
  if (!(x.signs?.length >= 2)) errs.push('کمتر از دو پرسش')
  if (!(x.turn?.length >= 2)) errs.push('کمتر از دو گام')
  const own = `${l.source.speaker ?? ''} ${l.source.translation}`
  for (const t of [x.intro, ...(x.moments ?? []), ...(x.signs ?? []), ...(x.turn ?? [])]) {
    if (!t?.trim()) errs.push('جملهٔ خالی')
    else if (HARAKAT.test(t)) errs.push(`عربی اعراب‌دار: ${t.slice(0, 60)}…`)
    else for (const b of BANNED) if (t.includes(b) && !own.includes(b)) errs.push(`«${b}»: ${t.slice(0, 80)}…`)
  }
  if (errs.length) problems.push(`${l.id}:\n - ${errs.join('\n - ')}`)
  else out[l.id] = { intro: x.intro.trim(), moments: x.moments.map((s) => s.trim()), signs: x.signs.map((s) => s.trim()), turn: x.turn.map((s) => s.trim()) }
}

fs.writeFileSync(
  path.join(root, 'app', 'src', 'data', 'mirror.ts'),
  `import type { Mirror } from './types'\n\n// تولید خودکار با scripts/merge-mirror.mjs — پیش‌نویس، در انتظار تأیید کارشناس\nexport const mirror: Record<string, Mirror> = ${JSON.stringify(out, null, 2)}\n`,
)
console.log(`وارد شد: ${Object.keys(out).length} از ${lessons.length}`)
if (problems.length) {
  console.log(`\n${problems.length} درس رد شد:\n\n${problems.join('\n\n')}`)
  process.exitCode = 1
}
