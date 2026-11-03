// اصلاح‌های دستیِ بازبین را روی ترجمهٔ پیش‌نویس و نسخهٔ منتشرشده اعمال می‌کند.
// اجرا: node scripts/apply-fixes.mjs <fixes.json> <bookId> <نام فایل ترجمه>
// fixes: { "<id>": { "fa"?: "...", "note"?: "...", "mirror"?: "..." } }
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [fixFile, book, name] = process.argv.slice(2)
const fixes = JSON.parse(fs.readFileSync(fixFile, 'utf8'))
for (const file of [path.join(root, 'content', 'drafts', 'tr', name), path.join(root, 'content', 'translations', book, name)]) {
  if (!fs.existsSync(file)) continue
  const list = JSON.parse(fs.readFileSync(file, 'utf8'))
  let n = 0
  for (const x of list) if (fixes[x.id]) (Object.assign(x, fixes[x.id]), n++)
  fs.writeFileSync(file, JSON.stringify(list, null, 1))
  console.log(`${path.relative(root, file)}: ${n} اصلاح`)
}
