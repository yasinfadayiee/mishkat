// رنگ پوسته‌ها را از فایل‌های سبک به app/src/tokens.css می‌برد و اندازه‌ها را یکدست می‌کند:
//   قلم: هیچ متنی کوچک‌تر از ۱۲٫۵ پیکسل نیست؛ گردی: دو اندازه (کارت و دکمه)؛ فاصله‌ها: ۴، ۸، ۱۲، ۱۶، ۲۴، ۳۲
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.resolve('app/package.json'))
const postcss = require('postcss')
const src = path.resolve('app/src')
const out = []
const SCALE = [4, 8, 12, 16, 24, 32]
const snap = (v) => (v <= 2 ? v : v > 40 ? v : SCALE.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)))
let fonts = 0
let radii = 0
let spaces = 0
for (const f of ['styles.css', 'styles-v2.css', 'styles-study.css', 'styles-library.css', 'styles-v3.css', 'styles-v08.css']) {
  const p = path.join(src, f)
  const root = postcss.parse(fs.readFileSync(p, 'utf8'))
  root.walkRules((rule) => {
    // بلوک‌های پوسته (فقط متغیرهای رنگ) به tokens.css می‌روند
    if (rule.parent.type === 'root' && rule.selectors.every((s) => /^:root(\[data-theme='\w+'\])?$/.test(s)) && rule.nodes.every((d) => d.type === 'comment' || d.prop?.startsWith('--') || d.prop === 'transition' || d.prop === 'color-scheme')) {
      out.push(rule.clone())
      rule.remove()
      return
    }
    rule.walkDecls((d) => {
      if (d.prop === 'font-size') {
        d.value = d.value.replace(/(?<![\w.-])(\d+(?:\.\d+)?)px/g, (m, n) => (Number(n) < 12.5 ? (fonts++, 'var(--fs-min)') : m))
      } else if (d.prop === 'border-radius' && /^\d+(\.\d+)?px$/.test(d.value)) {
        const n = parseFloat(d.value)
        if (n >= 16 && n <= 30) (d.value = 'var(--r-card)'), radii++
        else if (n >= 9 && n < 16) (d.value = 'var(--r-btn)'), radii++
      } else if (/^(margin|padding|gap|row-gap|column-gap)(-(top|bottom|left|right|inline|block|inline-start|inline-end|block-start|block-end))?$/.test(d.prop) && !d.value.includes('calc') && !d.value.includes('env(')) {
        d.value = d.value.replace(/(-?)(\d+(?:\.\d+)?)px/g, (m, sign, n) => {
          const v = snap(Number(n))
          if (v !== Number(n)) spaces++
          return `${sign}${v}px`
        })
      }
    })
  })
  fs.writeFileSync(p, root.toString())
}
const head = `/* نشانه‌های طراحی مشکات: رنگ هر پوسته، فاصله، گردی، سایه و اندازهٔ قلم.
   همهٔ سبک‌ها رنگ و اندازه را از همین‌جا می‌گیرند. */
:root {
  /* فاصله */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  /* گردی: کارت و دکمه */
  --r-card: 18px;
  --r-btn: 12px;
  /* قلم: کوچک‌ترین متن ۱۲٫۵ و متن اصلی دست‌کم ۱۵ پیکسل */
  --fs-min: 12.5px;
  --fs-sm: 14px;
  --fs-body: 16px;
  --fs-lg: 18px;
}
`
fs.writeFileSync(path.join(src, 'tokens.css'), head + '\n' + out.map((r) => r.toString()).join('\n\n') + '\n')
console.log(`${out.length} بلوک پوسته منتقل شد؛ قلم ${fonts}، گردی ${radii}، فاصله ${spaces}`)
