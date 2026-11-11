// «یعنی چه؟»‌هایی را که Claude بازنویسی کرده در فایل‌های content/enrich می‌گذارد.
// ورودی: content/fixes/gists-claude-*.json  ({ شناسه: متن تازه | null })
// null یعنی آن سطر جمله‌ای ربط‌دهنده یا توضیح سید رضی است: «یعنی چه؟» و «عمیق‌تر» برایش نمایش داده نشود.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const fixes = {}
for (const f of fs.readdirSync(path.join(root, 'content/fixes')).filter((f) => /^gists-claude-.*\.json$/.test(f))) Object.assign(fixes, JSON.parse(fs.readFileSync(path.join(root, 'content/fixes', f), 'utf8')))
let n = 0
for (const book of ['Nahj-al-Balagha-Radi', 'ghurar']) {
  const dir = path.join(root, 'content/enrich', book)
  for (const f of fs.readdirSync(dir).filter((f) => f.startsWith('job-'))) {
    const p = path.join(dir, f)
    const a = JSON.parse(fs.readFileSync(p, 'utf8'))
    let changed = false
    for (const x of a) {
      const k = `${book}:${x.id}`
      if (!(k in fixes)) continue
      if (fixes[k] === null) (x.gist = ''), (x.deep = '')
      else x.gist = fixes[k]
      changed = true
      n++
    }
    if (changed) fs.writeFileSync(p, JSON.stringify(a, null, 1))
  }
}
console.log(`${n} مورد اعمال شد از ${Object.keys(fixes).length}`)
