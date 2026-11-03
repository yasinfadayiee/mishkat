// خروجی‌های Gemini را (با هر نام فایلی) از پوشهٔ دانلود و content/jobs/out جمع می‌کند،
// با کار اصلی تطبیق می‌دهد و ترجمهٔ هر کار کامل را در content/translations/<کتاب>/job-NNN-fa.json می‌گذارد.
// اجرا: node scripts/import-gemini-jobs.mjs [پوشهٔ دیگر...]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jobsDir = path.join(root, 'content', 'jobs')
const manifest = JSON.parse(fs.readFileSync(path.join(jobsDir, 'manifest.json'), 'utf8'))
const dirs = [path.join(os.homedir(), 'Downloads'), path.join(jobsDir, 'out'), ...process.argv.slice(2)]

// همهٔ ترجمه‌ها با شناسهٔ «NNN.x»؛ اگر یک متن دو بار آمده باشد، تازه‌ترین فایل می‌ماند
const got = new Map()
const files = dirs.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).filter((f) => /\.(json|txt)$/i.test(f)).map((f) => path.join(d, f)))
files.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)
for (const f of files) {
  let text = fs.readFileSync(f, 'utf8').replace(/^```(json)?\s*|```\s*$/g, '')
  let list
  try {
    list = JSON.parse(text)
  } catch {
    // پاسخ بریده: تا آخرین شیء کامل
    const cut = text.lastIndexOf('}')
    try {
      list = JSON.parse(text.slice(0, cut + 1).replace(/,\s*$/, '') + ']')
    } catch {
      continue
    }
  }
  if (!Array.isArray(list)) continue
  for (const x of list) if (typeof x?.id === 'string' && /^\d{3}\.\d+$/.test(x.id) && x.fa?.trim()) got.set(x.id, x)
}

let done = 0
const partial = []
for (const j of manifest) {
  const input = fs.readFileSync(path.join(jobsDir, `${j.job}.txt`), 'utf8')
  const data = JSON.parse(input.slice(input.lastIndexOf('\n[') + 1))
  const have = data.filter((x) => got.has(x.id))
  if (!have.length) continue
  if (have.length < data.length) partial.push(`${j.job} (${have.length}/${data.length})`)
  const list = have.map((x) => {
    const y = got.get(x.id)
    let note = (y.note ?? '').trim()
    let mirror = (y.mirror ?? '').trim()
    // «نقل شده» بی‌خطر است و جایگزین می‌شود؛ بقیهٔ واژه‌های ممنوع در بازبینی دستی دیده می‌شوند
    if (!y.fa.includes('نقل شده')) (note = note.replaceAll('نقل شده', 'آمده'), (mirror = mirror.replaceAll('نقل شده', 'آمده')))
    return { id: Number(x.id.split('.')[1]), fa: y.fa.trim(), note, mirror }
  })
  const dir = path.join(root, 'content', 'translations', j.book)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `job-${j.job}-fa.json`), JSON.stringify(list, null, 1))
  if (have.length === data.length) done++
}
console.log(`${files.length} فایل خوانده شد؛ ${done} کار کامل از ${manifest.length}`)
if (partial.length) console.log(`نیمه‌کاره: ${partial.join('، ')}`)
