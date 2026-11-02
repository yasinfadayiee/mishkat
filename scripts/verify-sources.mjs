// بازبین خودکار اعتبار متن‌ها
// هر آیه را حرف‌به‌حرف با متن تنزیل و ترجمهٔ مکارم، و هر حدیث را با پیکرهٔ ثقلین/صحیحین مقایسه می‌کند.
// اجرا: node scripts/verify-sources.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lessons } from '../app/src/data/lessons.ts'
import { NUR } from '../app/src/data/verses.ts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const raw = path.join(root, 'corpus', 'raw')

const stripMarks = (t) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ‌‏‎]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/[ةه]/g, 'ه')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const segments = (t) => t.split('…').map((s) => s.replace(/[﴿﴾]/g, '').trim()).filter(Boolean)

async function ayah(ref) {
  // «94:5-6» یعنی چند آیهٔ پیاپی؛ متن‌ها با فاصله کنار هم قرار می‌گیرند
  const [su, range] = ref.split(':')
  const [a, b] = range.split('-').map(Number)
  const ar = []
  const fa = []
  for (let n = a; n <= (b ?? a); n++) {
    const file = path.join(raw, `q_${su}_${n}.json`)
    if (!fs.existsSync(file)) {
      const r = await fetch(`https://api.alquran.cloud/v1/ayah/${su}:${n}/editions/quran-uthmani,fa.makarem`)
      fs.writeFileSync(file, await r.text())
    }
    const d = JSON.parse(fs.readFileSync(file, 'utf8')).data
    ar.push(d.find((e) => e.edition.identifier === 'quran-uthmani').text)
    fa.push(d.find((e) => e.edition.identifier === 'fa.makarem').text)
  }
  return { ar: ar.join(' '), fa: fa.join(' ') }
}

const books = {}
const thaqalayn = (book) => (books[book] ??= JSON.parse(fs.readFileSync(path.join(raw, `${book}.json`), 'utf8')))
const thaqalaynBooks = ['Al-Kafi-Volume-2-Kulayni', 'Nahj-al-Balagha-Radi', 'Al-Amali-Saduq']
const findByUrl = (url) => {
  for (const b of thaqalaynBooks) {
    const h = thaqalayn(b).find((x) => x.URL === url)
    if (h) return h
  }
}
const sunni = {}
const sunniText = (col, num) => {
  sunni[col] ??= JSON.parse(fs.readFileSync(path.join(raw, `ara-${col}.json`), 'utf8')).hadiths
  return sunni[col].filter((h) => String(h.arabicnumber).split('.')[0] === String(num)).map((h) => h.text).join(' ')
}

// با --fix، متن آیه‌ها از روی کلمه‌های متناظر، عیناً از تنزیل جایگزین می‌شود
const FIX = process.argv.includes('--fix')
const fixes = []
function exactSpan(source, ours) {
  const src = source.split(' ').filter((w) => stripMarks(w))
  const want = ours.split(' ').map(stripMarks).filter(Boolean)
  for (let i = 0; i + want.length <= src.length; i++)
    if (want.every((w, j) => stripMarks(src[i + j]) === w)) {
      // علامت‌های وقف بین کلمه‌ها را هم نگه می‌داریم
      const start = source.indexOf(src[i])
      const lastWord = src[i + want.length - 1]
      let end = source.indexOf(lastWord, start) + lastWord.length
      for (let k = i; k < i + want.length; k++) end = Math.max(end, source.indexOf(src[k], start) + src[k].length)
      return source.slice(start, end)
    }
}

let ok = 0
const problems = []
async function check(where, item) {
  const url = item.verifyUrl
  let sourceAr, sourceFa
  if (url.includes('tanzil.net')) {
    const ref = url.split('#')[1]
    const a = await ayah(ref)
    sourceAr = a.ar
    sourceFa = a.fa
    for (const seg of segments(item.arabic)) {
      if (sourceAr.includes(seg)) continue
      const exact = exactSpan(sourceAr, seg)
      if (FIX && exact) fixes.push([seg, exact])
      else problems.push(`${where}: متن آیه ${ref} عیناً مطابق تنزیل نیست\n   ما: ${seg}\n   تنزیل: ${sourceAr}`)
    }
    if (item.translator?.includes('مکارم') || item.ref?.includes('مکارم')) {
      const norm = (t) => t.replace(/[‌\s]+/g, ' ').trim()
      for (const seg of item.translation.split('…').map((s) => s.trim()).filter(Boolean))
        if (!norm(sourceFa).includes(norm(seg))) problems.push(`${where}: ترجمهٔ مکارم ${ref} عیناً مطابق نیست\n   ما: ${seg}\n   منبع: ${sourceFa}`)
    }
  } else if (url.includes('thaqalayn.net')) {
    const h = findByUrl(url)
    if (!h) return problems.push(`${where}: رکورد ${url} در پیکره پیدا نشد`)
    sourceAr = h.arabicText
    for (const seg of segments(item.arabic)) if (!stripMarks(sourceAr).includes(stripMarks(seg))) problems.push(`${where}: متن حدیث با ثقلین نمی‌خواند\n   ما: ${seg}\n   منبع: ${sourceAr.slice(0, 400)}`)
    if (item.grading) {
      const g = h.majlisiGrading?.trim()
      const ours = stripMarks(item.grading.value)
      if (!g || stripMarks(g).replace(/ /g, '') !== ours.replace(/ /g, '')) problems.push(`${where}: درجهٔ سند «${item.grading.value}» با منبع («${g}») یکی نیست`)
    }
  } else if (url.includes('sunnah.com')) {
    const [col, num] = url.split('/').pop().split(':')
    sourceAr = sunniText(col, num.replace(/[a-z]$/, ''))
    for (const seg of segments(item.arabic)) if (!stripMarks(sourceAr).includes(stripMarks(seg))) problems.push(`${where}: متن با ${col} ${num} نمی‌خواند\n   ما: ${seg}`)
  } else {
    return problems.push(`${where}: لینک تطبیق ناشناخته ${url}`)
  }
  ok++
}

await check('آیهٔ نور (صفحهٔ آغاز)', NUR)
for (const l of lessons) {
  await check(`${l.id} / متن اصلی`, l.source)
  for (const [i, p] of l.parallels.entries()) await check(`${l.id} / شاهد ${i + 1}`, p)
  // تکه‌های شرح باید کنار هم دقیقاً همان متن تطبیق‌شده را بسازند
  if (l.sharh && l.sharh.parts.map((x) => x.ar).join(' ') !== l.source.arabic) problems.push(`${l.id} / شرح: تکه‌ها با متن اصلی یکی نیستند`)
}

if (fixes.length) {
  for (const name of ['lessons.ts', 'verses.ts']) {
    const file = path.join(root, 'app', 'src', 'data', name)
    let src = fs.readFileSync(file, 'utf8')
    for (const [from, to] of fixes) src = src.split(from).join(to)
    fs.writeFileSync(file, src)
  }
  console.log(`${fixes.length} متن آیه عیناً از تنزیل جایگزین شد`)
}
console.log(`بررسی‌شده: ${ok}`)
if (problems.length) {
  console.log(`\n${problems.length} مورد نیازمند اصلاح:\n`)
  console.log(problems.join('\n\n'))
  process.exit(1)
}
console.log('همهٔ متن‌ها با منبع اصلی مطابقت دارند ✓')
