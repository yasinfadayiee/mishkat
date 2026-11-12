// قاعده‌های CSS که کلاسشان در هیچ فایل ts/tsx برنامه نیامده پاک می‌شوند (نسخه‌های قدیمی: سفر، ایستگاه، چراغ، آزمون…)
// اجرا: node tools/prune-css.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.resolve('app/package.json'))
const postcss = require('postcss')
const src = path.resolve('app/src')
const files = fs.readdirSync(src, { recursive: true }).filter((f) => /\.(tsx?|html)$/.test(f))
let code = files.map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + fs.readFileSync('app/index.html', 'utf8')
const words = new Set(code.match(/[A-Za-z][\w-]*/g))
// کلاس‌هایی که با الگو ساخته می‌شوند
for (const ph of ['sahar', 'morning', 'noon', 'asr', 'maghrib', 'night']) words.add(`sky-${ph}`)
const dry = process.argv.includes('--dry')
const dead = new Set()
let removed = 0
for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.css'))) {
  const p = path.join(src, f)
  const root = postcss.parse(fs.readFileSync(p, 'utf8'))
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return
    const keep = rule.selectors.filter((sel) => {
      const cls = [...sel.replace(/\[[^\]]*\]|:not\([^)]*\)/g, '').matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1])
      const bad = cls.filter((c) => !words.has(c))
      bad.forEach((c) => dead.add(c))
      return !bad.length
    })
    if (keep.length === rule.selectors.length) return
    removed += rule.selectors.length - keep.length
    if (keep.length) rule.selectors = keep
    else rule.remove()
  })
  root.walkAtRules((a) => {
    if (a.name === 'media' && !a.nodes?.length) a.remove()
  })
  if (!dry) fs.writeFileSync(p, root.toString())
}
console.log(`${removed} انتخابگر مرده؛ کلاس‌ها: ${[...dead].sort().join(' ')}`)
