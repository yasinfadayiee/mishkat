// شرح‌های جمله‌به‌جمله (پیش‌نویس ChatGPT در content/drafts/sharh-*.json) را بررسی و در app/src/data/sharh.ts می‌نویسد.
// درسی که حتی یک بررسی را رد کند وارد برنامه نمی‌شود.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lessons } from '../app/src/data/lessons.ts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const drafts = path.join(root, 'content', 'drafts')
const items = fs
  .readdirSync(drafts)
  .filter((f) => /^sharh-.*\.json$/.test(f))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(drafts, f), 'utf8')))

const prose = (x) => [x.essence, ...x.parts.flatMap((p) => [p.plain, p.deep, p.life]), ...x.misread.flatMap((m) => [m.wrong, m.right])]
// نشانه‌های نقل یا ارجاع تازه که در شرح ممنوع است
const BANNED = ['روایت', 'حدیث دیگر', 'فرمود', 'علامه', 'تفسیر', 'آیه‌ای دیگر', 'آیهٔ دیگر', 'پیامبر', 'امام صادق', 'امام باقر', 'امام حسین', 'نقل شده', 'حرام', 'واجب']
const HARAKAT = /[ً-ْ]{2,}/

const out = {}
const problems = []
for (const l of lessons) {
  const x = items.find((i) => i.id === l.id)
  if (!x) {
    problems.push(`${l.id}: شرحی نوشته نشده`)
    continue
  }
  const errs = []
  if (!x.essence?.trim()) errs.push('پیام اصلی خالی است')
  if (!Array.isArray(x.parts) || x.parts.length < 2) errs.push('کمتر از دو تکه')
  else {
    const joined = x.parts.map((p) => p.ar).join(' ')
    if (joined !== l.source.arabic) errs.push(`تکه‌ها کنار هم عین متن نیستند\n   تکه‌ها: ${joined}\n   متن:   ${l.source.arabic}`)
    x.parts.forEach((p, k) => {
      for (const f of ['ar', 'fa', 'plain', 'deep', 'life']) if (!p[f]?.trim()) errs.push(`تکهٔ ${k + 1}: «${f}» خالی است`)
    })
  }
  if (!Array.isArray(x.misread) || !x.misread.length) errs.push('برداشت نادرست ندارد')
  for (const t of prose(x)) {
    if (HARAKAT.test(t)) errs.push(`متن عربیِ اعراب‌دار در توضیح: ${t.slice(0, 70)}…`)
    // نام گویندهٔ خود متن مجاز است
    for (const b of BANNED) if (t.includes(b) && !(l.source.speaker ?? '').includes(b)) errs.push(`واژهٔ «${b}» در توضیح (احتمال نقل بی‌سند): ${t.slice(0, 90)}…`)
  }
  if (errs.length) problems.push(`${l.id}:\n - ${errs.join('\n - ')}`)
  else out[l.id] = { essence: x.essence.trim(), parts: x.parts.map(({ ar, fa, plain, deep, life }) => ({ ar, fa: fa.trim(), plain: plain.trim(), deep: deep.trim(), life: life.trim() })), misread: x.misread }
}

fs.writeFileSync(
  path.join(root, 'app', 'src', 'data', 'sharh.ts'),
  `import type { Sharh } from './types'\n\n// تولید خودکار با scripts/merge-sharh.mjs — متن عربی هر تکه عیناً از متن تطبیق‌شدهٔ درس است؛ توضیحات پیش‌نویس است.\nexport const sharh: Record<string, Sharh> = ${JSON.stringify(out, null, 2)}\n`,
)
console.log(`وارد شد: ${Object.keys(out).length} از ${lessons.length}`)
if (problems.length) {
  console.log(`\n${problems.length} درس رد شد:\n\n${problems.join('\n\n')}`)
  process.exitCode = 1
}
