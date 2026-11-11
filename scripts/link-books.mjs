// سخن‌های یکسانِ غرر و نهج‌البلاغه را به هم پیوند می‌دهد (فیلد x در هر متن: [[کتاب، بخش، باب، شمارهٔ متن]]).
// پس از build-books اجرا می‌شود و فقط فایل‌های ساخته‌شده در app/public/books را تغییر می‌دهد.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dir = path.join(root, 'app', 'public', 'books')
const read = (id) => JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8'))
// بی‌اعراب، بی‌نشانه، بی‌شماره و بی «و قال علیه السلام»
const bare = (t) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/\[[^\]]*\]|\([^)]*\)/g, ' ')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/^\s*و?قال\s+عليه\s+السلام\s*/, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const nahj = read('Nahj-al-Balagha-Radi')
const ghurar = read('ghurar')
const all = (b) => b.sections.flatMap((s, si) => s.chapters.flatMap((c, ci) => c.items.map((it) => ({ it, si, ci, t: bare(it.ar) }))))
const N = all(nahj)
const G = all(ghurar).filter((g) => g.t.split(' ').length >= 4)
// شاخص سه‌واژه‌ای برای یافتن سریع
const grams = (t) => {
  const w = t.split(' ')
  const out = new Set()
  for (let i = 0; i + 2 < w.length; i++) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`)
  return out
}
const idx = new Map()
N.forEach((n, k) => grams(n.t).forEach((g) => (idx.get(g) ?? idx.set(g, []).get(g)).push(k)))
let links = 0
for (const n of N) delete n.it.x
for (const g of G) delete g.it.x
for (const g of G) {
  const gg = grams(g.t)
  if (gg.size < 2) continue
  const hits = new Map()
  for (const x of gg) for (const k of idx.get(x) ?? []) hits.set(k, (hits.get(k) ?? 0) + 1)
  // بیشترِ سه‌واژه‌ای‌های سخن غرر باید در یک متن نهج باشد
  const best = [...hits].filter(([, c]) => c / gg.size >= 0.6).sort((a, b) => b[1] - a[1])[0]
  if (!best) continue
  const n = N[best[0]]
  const nCh = nahj.sections[n.si].chapters[n.ci]
  const nLabel = n.it.n ? `حکمت ${n.it.n.toLocaleString('fa-IR')}` : nCh.t
  ;(g.it.x ??= []).push(['Nahj-al-Balagha-Radi', n.si, n.ci, n.it.i, nLabel])
  ;(n.it.x ??= []).some((y) => y[0] === 'ghurar' && y[3] === g.it.i) || n.it.x.push(['ghurar', g.si, g.ci, g.it.i, ghurar.sections[g.si].chapters[g.ci].t])
  links++
}
for (const n of N) if (n.it.x) n.it.x = n.it.x.slice(0, 3)
fs.writeFileSync(path.join(dir, 'Nahj-al-Balagha-Radi.json'), JSON.stringify(nahj))
fs.writeFileSync(path.join(dir, 'ghurar.json'), JSON.stringify(ghurar))
console.log(`پیوند غرر ↔ نهج: ${links} سخن غرر، ${N.filter((n) => n.it.x).length} متن نهج`)
