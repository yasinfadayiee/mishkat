// تضاد رنگ متن با زمینه در هر پوسته (معیار WCAG، کمینه ۴٫۵ به ۱)
// اجرا: node tools/contrast.mjs        جدول
//       node tools/contrast.mjs --fix  رنگ‌های کم‌تضاد (muted، ink-2، gold، accent) را تا ۴٫۶ تیره یا روشن می‌کند
import fs from 'node:fs'
const file = 'app/src/tokens.css'
let css = fs.readFileSync(file, 'utf8')
const themes = ['paper', 'white', 'sage']
const block = (t) => {
  const re = t === 'emerald' ? /:root,\s*:root\[data-theme='emerald'\]\s*\{([^}]*)\}/ : new RegExp(String.raw`:root\[data-theme='${t}'\]\s*\{([^}]*)\}`)
  return css.match(re)
}
const vars = (t) => Object.fromEntries([...block(t)[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
const parse = (c) => {
  let m = c.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)).concat(1)
  m = c.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x))
    return [p[0], p[1], p[2], p[3] ?? 1]
  }
  return null
}
const over = (fg, bg) => [0, 1, 2].map((k) => fg[k] * fg[3] + bg[k] * (1 - fg[3])).concat(1)
const lum = (c) => {
  const [r, g, b] = c.slice(0, 3).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const TEXTS = ['--ink', '--ink-2', '--muted', '--gold', '--accent']
const fix = process.argv.includes('--fix')
const rows = []
for (const t of themes) {
  const v = vars(t)
  const bg = parse(v['--bg1'])
  const card = over(parse(v['--card']), bg)
  const solid = parse(v['--card-solid'])
  const light = lum(bg) > 0.4
  for (const name of TEXTS) {
    let c = parse(v[name])
    const worst = () => Math.min(ratio(c, bg), ratio(c, card), ratio(c, solid), ratio(c, parse(v['--bg2'])), ratio(c, parse(v['--bg0'])))
    const before = worst()
    if (fix && before < 4.6) {
      // تا رسیدن به ۴٫۶، به سمت سیاه (پوستهٔ روشن) یا سفید (پوستهٔ تیره) برده می‌شود
      for (let k = 0; k < 60 && worst() < 4.6; k++) c = c.map((x, i) => (i < 3 ? (light ? x * 0.96 : x + (255 - x) * 0.06) : x))
      const h = hex(c)
      const sel = t === 'emerald' ? /(:root,\s*:root\[data-theme='emerald'\]\s*\{[^}]*)/ : new RegExp(String.raw`(:root\[data-theme='${t}'\]\s*\{[^}]*)`)
      css = css.replace(sel, (b) => b.replace(new RegExp(String.raw`(${name}:\s*)[^;]+;`), `$1${h};`))
    }
    rows.push({ theme: t, color: name, value: hex(c), bg: before.toFixed(2), after: worst().toFixed(2) })
  }
}
if (fix) fs.writeFileSync(file, css)
console.log('| پوسته | رنگ متن | مقدار | تضاد پیش از اصلاح | تضاد پس از اصلاح |\n|---|---|---|---|---|')
for (const r of rows) console.log(`| ${r.theme} | ${r.color} | ${r.value} | ${r.bg} | ${r.after} |`)
