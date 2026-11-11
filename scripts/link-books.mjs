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

// اعراب: اگر حروف سخن غرر عیناً در متن اعراب‌دار نهج‌البلاغه آمده باشد، همان بخش اعراب‌دار (فیلد v) نمایش داده می‌شود.
// هیچ اعرابی حدس زده نمی‌شود؛ متن ar دست نمی‌خورد و برای تطبیق با منبع می‌ماند.
const H = /[ً-ٰٟـ]/
const fold = (c) => ({ 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ی': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي' })[c] ?? c
const letters = (t) => {
  let s = ''
  const pos = []
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (H.test(c)) continue
    if (/[ء-ي]/.test(c)) (s += fold(c)), pos.push(i)
    else if (/\s/.test(c) && s && s.at(-1) !== ' ') (s += ' '), pos.push(i)
  }
  return { s, pos }
}
const NV = N.map((n) => ({ ar: n.it.ar, ...letters(n.it.ar) }))
let vocal = 0
for (const g of G) {
  delete g.it.v
  if (!g.it.x) continue
  const want = letters(g.it.ar.replace(/\[[^\]]*\]/g, '')).s.trim()
  for (const n of NV) {
    const k = n.s.indexOf(want)
    if (k < 0) continue
    let end = n.pos[k + want.length - 1] + 1
    while (end < n.ar.length && H.test(n.ar[end])) end++
    g.it.v = n.ar.slice(n.pos[k], end)
    vocal++
    break
  }
}
fs.writeFileSync(path.join(dir, 'Nahj-al-Balagha-Radi.json'), JSON.stringify(nahj))
fs.writeFileSync(path.join(dir, 'ghurar.json'), JSON.stringify(ghurar))
console.log(`پیوند غرر ↔ نهج: ${links} سخن غرر، ${N.filter((n) => n.it.x).length} متن نهج؛ اعراب از نهج برای ${vocal} سخن غرر`)
