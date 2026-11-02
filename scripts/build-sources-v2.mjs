// فهرست ۳۲ درس تازه: متن عربی هر مورد عیناً از پیکره (ثقلین، تنزیل، صحیحین) برداشته می‌شود
// اجرا: node scripts/build-sources-v2.mjs   → content/batch2-sources.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const raw = path.join(root, 'corpus', 'raw')
const MAKAREM = 'ترجمهٔ آیت‌الله مکارم شیرازی'

const MARK = /[ً-ٰٟۖ-ۭـ‌‏‎]/
const normChar = (c) => (MARK.test(c) ? '' : /[أإآٱ]/.test(c) ? 'ا' : c === 'ى' || c === 'ئ' ? 'ي' : c === 'ؤ' ? 'و' : c === 'ة' ? 'ه' : /[^ء-ي]/.test(c) ? ' ' : c)

/** بخشی از متن اصلی را از «از» تا «تا» (بدون اعراب) عیناً با اعراب اصلی برمی‌گرداند */
function excerpt(text, from, to) {
  let norm = ''
  const map = []
  for (let i = 0; i < text.length; i++) {
    const n = normChar(text[i])
    if (!n) continue
    if (n === ' ' && norm.endsWith(' ')) continue
    norm += n
    map.push(i)
  }
  const f = from.replace(/\s+/g, ' ')
  const t = (to ?? from).replace(/\s+/g, ' ')
  const s = norm.indexOf(f)
  if (s < 0) throw new Error(`پیدا نشد: ${from}`)
  const e = norm.indexOf(t, s) + t.length
  if (e < t.length) throw new Error(`پایان پیدا نشد: ${to}`)
  let end = map[e - 1] + 1
  while (end < text.length && MARK.test(text[end])) end++
  return text.slice(map[s], end).replace(/\s+/g, ' ').trim()
}

const books = Object.fromEntries(
  ['Nahj-al-Balagha-Radi', 'Al-Kafi-Volume-2-Kulayni'].map((b) => [b, JSON.parse(fs.readFileSync(path.join(raw, `${b}.json`), 'utf8'))]),
)
const byUrl = (url) => Object.values(books).flat().find((h) => h.URL === url) ?? (() => { throw new Error(url) })()
const grade = (h) => (h.majlisiGrading ? { value: h.majlisiGrading.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک'), by: 'علامه مجلسی، مرآة العقول' } : undefined)

async function ayahs(spec) {
  const [s, range] = spec.split(':')
  const [a, b] = range.split('-').map(Number)
  const out = { ar: [], fa: [] }
  for (let n = a; n <= (b ?? a); n++) {
    const file = path.join(raw, `q_${s}_${n}.json`)
    if (!fs.existsSync(file)) fs.writeFileSync(file, await (await fetch(`https://api.alquran.cloud/v1/ayah/${s}:${n}/editions/quran-uthmani,fa.makarem`)).text())
    const d = JSON.parse(fs.readFileSync(file, 'utf8')).data
    out.ar.push(d[0].text.replace(/^۞\s*/, ''))
    out.fa.push(d[1].text)
  }
  return { ar: out.ar.join(' '), fa: out.fa.join(' ') }
}

const SURAH = { 61: 'صف', 2: 'بقره', 3: 'آل‌عمران', 4: 'نساء', 9: 'توبه', 12: 'یوسف', 13: 'رعد', 17: 'اسراء', 20: 'طه', 25: 'فرقان', 28: 'قصص', 31: 'لقمان', 39: 'زمر', 41: 'فصلت', 42: 'شوری', 49: 'حجرات', 59: 'حشر', 65: 'طلاق', 66: 'تحریم', 79: 'نازعات', 94: 'شرح' }
const faNum = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d])

/** Q: آیه | N: نهج‌البلاغه | K: کافی ج۲ | S: صحیحین */
async function src(x) {
  if (x.q) {
    const { ar, fa } = await ayahs(x.q)
    const [s, r] = x.q.split(':')
    const part = x.from ? 'بخشی از ' : ''
    return {
      kind: 'quran',
      arabic: x.from ? excerpt(ar, x.from, x.to) : ar,
      translation: x.fa ?? fa,
      translator: MAKAREM,
      ref: `سورهٔ ${SURAH[s]}، ${part}${r.includes('-') ? 'آیات' : 'آیهٔ'} ${faNum(r.replace('-', ' و '))}`,
      verifyUrl: `https://tanzil.net/#${x.q}`,
      ayah: { surah: +s, from: +r.split('-')[0], ...(r.includes('-') ? { to: +r.split('-')[1] } : {}) },
    }
  }
  if (x.n || x.k) {
    const h = byUrl(x.url)
    const isNahj = !!x.n
    return {
      kind: isNahj ? 'nahj' : 'hadith',
      speaker: x.speaker ?? (isNahj ? 'امام علی (ع)' : undefined),
      arabic: excerpt(h.arabicText, x.from, x.to),
      translation: '',
      translator: 'برگردان روان مشکات',
      ref: isNahj ? `نهج‌البلاغه، ${x.n}` : `الکافی، ج ۲، ${x.k}`,
      ...(isNahj ? {} : { grading: grade(h) }),
      verifyUrl: x.url,
      english: h.englishText.replace(/\s+/g, ' ').slice(0, 700),
    }
  }
  if (x.s) {
    const [col, num] = x.s
    const all = JSON.parse(fs.readFileSync(path.join(raw, `ara-${col}.json`), 'utf8')).hadiths
    const h = all.find((y) => String(y.arabicnumber).split('.')[0] === String(num) && excerptOk(y.text, x.from))
    return {
      kind: 'hadith',
      speaker: 'پیامبر اکرم (ص)',
      arabic: excerpt(h.text, x.from, x.to),
      translation: '',
      translator: 'برگردان روان مشکات',
      ref: `صحیح ${col === 'bukhari' ? 'بخاری' : 'مسلم'}، ح ${faNum(num)}`,
      verifyUrl: `https://sunnah.com/${col}:${num}`,
    }
  }
}
function excerptOk(text, from) {
  try {
    excerpt(text, from)
    return true
  } catch {
    return false
  }
}

const N = 'https://thaqalayn.net/hadith/32/'
const K = 'https://thaqalayn.net/hadith/1/1/'

// هر درس: موضوع، متن اصلی و شاهدها (همه از پیکره)
const DEFS = [
  { id: 'hearts-tire', topic: 'لذت یادگیری', main: { n: 'حکمت ۹۱', url: N + '3/91/110', from: 'ان هذه القلوب', to: 'طرايف الحكمه' }, par: [{ n: 'حکمت ۱۹۳', url: N + '3/193/239', from: 'ان للقلوب', to: 'اكره عمي' }, { n: 'حکمت ۲۷۸', url: N + '3/278/339', from: 'قليل تدوم', to: 'مملول منه' }] },
  { id: 'two-patience', topic: 'ترک عادت بد', main: { n: 'حکمت ۵۵', url: N + '3/55/69', from: 'الصبر صبران', to: 'عما تحب' }, par: [{ q: '2:153' }] },
  { id: 'reason-desire', topic: 'خودکنترلی', main: { n: 'حکمت ۴۲۴', url: N + '3/424/538', from: 'الحلم غطاء', to: 'هواك بعقلك' }, par: [{ q: '79:40-41' }] },
  { id: 'small-sins', topic: 'عادت‌های کوچک', main: { n: 'حکمت ۳۴۸', url: N + '3/348/425', from: 'اشد الذنوب', to: 'صاحبه' }, par: [{ n: 'خطبهٔ ۱۴۰', url: N + '1/140/3', from: 'ولا تامن علي نفسك', to: 'معذب عليه' }] },
  { id: 'think-speak', topic: 'سنجیده‌گویی', main: { n: 'حکمت ۴۰', url: N + '3/40/51', from: 'لسان العاقل', to: 'وراء لسانه' }, par: [{ k: 'باب الصمت و حفظ اللسان، ح ۱', url: K + '56/1', speaker: 'امام رضا (ع)', from: 'من علامات الفقه', to: 'علي كل خير' }] },
  { id: 'word-chain', topic: 'زبان و فضای مجازی', main: { n: 'حکمت ۳۸۱', url: N + '3/381/476', from: 'الكلام في وثاقك', to: 'جلبت نقمه' }, par: [{ q: '17:36' }] },
  { id: 'dignity', topic: 'عزت نفس', main: { n: 'حکمت ۲', url: N + '3/2/2', from: 'ازري بنفسه', to: 'عليها لسانه' }, par: [] },
  { id: 'friends', topic: 'دوستی', main: { n: 'حکمت ۱۲', url: N + '3/12/13', from: 'اعجز الناس', to: 'ظفر به منهم' }, par: [{ n: 'حکمت ۶', url: N + '3/6/6', from: 'صدر العاقل', to: 'قبر العيوب' }] },
  { id: 'among-people', topic: 'رفتار با مردم', main: { n: 'حکمت ۱۰', url: N + '3/10/11', from: 'خالطوا الناس', to: 'حنوا اليكم' }, par: [{ q: '41:34' }] },
  { id: 'forgive-power', topic: 'گذشت', main: { n: 'حکمت ۱۱', url: N + '3/11/12', from: 'اذا قدرت', to: 'للقدره عليه' }, par: [{ q: '42:37', from: 'واذا ما غضبوا', to: 'يغفرون', fa: 'و هنگامی که خشمگین شوند عفو می‌کنند.' }] },
  { id: 'own-faults', topic: 'عیب‌جویی', main: { n: 'حکمت ۳۴۹', url: N + '3/349/426', from: 'من نظر في عيب نفسه', to: 'ما فاته' }, par: [{ n: 'خطبهٔ ۱۴۰', url: N + '1/140/3', from: 'فليكفف من علم', to: 'من عيب نفسه' }] },
  { id: 'three-hours', topic: 'مدیریت وقت', main: { n: 'حکمت ۳۹۰', url: N + '3/390/487', from: 'للمومن ثلاث ساعات', to: 'يحل ويجمل' }, par: [{ q: '28:77', from: 'وابتغ فيما', to: 'من الدنيا', fa: 'و در آنچه خدا به تو داده، سرای آخرت را بطلب؛ و بهره‌ات را از دنیا فراموش مکن' }] },
  { id: 'say-idk', topic: 'یادگیری', main: { n: 'حکمت ۸۲', url: N + '3/82/100', from: 'ولا يستحين احد منكم', to: 'ان يتعلمه' }, par: [{ q: '20:114', from: 'وقل رب', to: 'علما', fa: 'و بگو: «پروردگارا! علم مرا افزون کن!»' }] },
  { id: 'knowledge-wealth', topic: 'ارزش دانش', main: { n: 'حکمت ۱۴۷', url: N + '3/147/182', from: 'العلم خير من المال', to: 'يزكوعلي الانفاق' }, par: [{ q: '39:9', from: 'قل هل يستوي', to: 'لا يعلمون', fa: 'بگو: «آیا کسانی که می‌دانند با کسانی که نمی‌دانند یکسانند؟!' }] },
  { id: 'golden-rule', topic: 'انصاف', main: { n: 'نامهٔ ۳۱', url: N + '2/31/153', from: 'يا بني اجعل نفسك ميزانا', to: 'ان يحسن اليك' }, par: [{ s: ['bukhari', 13], from: 'لا يومن احدكم', to: 'ما يحب لنفسه' }, { s: ['muslim', 45], from: 'لا يومن احدكم', to: 'ما يحب لنفسه' }] },
  { id: 'young-heart', topic: 'تربیت فرزند', main: { n: 'نامهٔ ۳۱', url: N + '2/31/145', from: 'وانما قلب الحدث', to: 'شيء قبلته' }, par: [{ q: '66:6', from: 'يايها الذين ءامنوا قوا', to: 'والحجاره', fa: 'ای کسانی که ایمان آورده‌اید خود و خانواده خویش را از آتشی که هیزم آن انسانها و سنگهاست نگه دارید' }] },
  { id: 'lessons-life', topic: 'درس گرفتن', main: { n: 'حکمت ۲۹۷', url: N + '3/297/364', from: 'ما اكثر العبر', to: 'الاعتبار' }, par: [{ q: '12:111', from: 'لقد كان', to: 'الالبب', fa: 'در سرگذشت آنها درس عبرتی برای صاحبان اندیشه بود!' }] },
  { id: 'envy', topic: 'حسادت', main: { n: 'خطبهٔ ۸۶', url: N + '1/86/7', from: 'لا تحاسدوا', to: 'النار الحطب' }, par: [{ k: 'باب الحسد، ح ۲', url: K + '122/2', speaker: 'امام صادق (ع)', from: 'ان الحسد', to: 'النار الحطب' }] },
  { id: 'truth-trust', topic: 'راستی و امانت', main: { k: 'باب الصدق و اداء الامانة، ح ۱', url: K + '51/1', speaker: 'امام صادق (ع)', from: 'ان الله عز وجل لم يبعث', to: 'البر والفاجر' }, par: [{ q: '4:58', from: 'ان الله يامركم', to: 'الي اهلها', fa: 'خداوند به شما فرمان می‌دهد که امانتها را به صاحبانش بدهید!' }] },
  { id: 'good-character', topic: 'خوش‌اخلاقی', main: { k: 'باب حسن الخلق، ح ۵', url: K + '49/5', speaker: 'پیامبر اکرم (ص)', from: 'ان صاحب الخلق الحسن', to: 'الصايم القايم' }, par: [{ s: ['bukhari', 3559], from: 'ان من خياركم', to: 'اخلاقا' }] },
  { id: 'humility', topic: 'فروتنی', main: { k: 'باب التواضع، ح ۳', url: K + '59/3', speaker: 'پیامبر اکرم (ص)', from: 'فان من تواضع لله', to: 'معيشته رزقه الله' }, par: [{ q: '31:18' }] },
  { id: 'self-account', topic: 'حساب‌رسی روزانه', main: { k: 'باب محاسبة العمل، ح ۲', url: K + '203/2', speaker: 'امام موسی کاظم (ع)', from: 'ليس منا من لم يحاسب', to: 'وتاب اليه' }, par: [{ q: '59:18', from: 'يايها الذين ءامنوا اتقوا الله ولتنظر', to: 'لغد', fa: 'ای کسانی که ایمان آورده‌اید از (مخالفت) خدا بپرهیزید؛ و هر کس باید بنگرد تا برای فردایش چه چیز از پیش فرستاده' }] },
  { id: 'silence', topic: 'سکوت', main: { k: 'باب الصمت و حفظ اللسان، ح ۱', url: K + '56/1', speaker: 'امام رضا (ع)', from: 'من علامات الفقه', to: 'علي كل خير' }, par: [{ n: 'حکمت ۴۰', url: N + '3/40/51', from: 'لسان العاقل', to: 'وراء لسانه' }] },
  { id: 'lying', topic: 'دروغ', main: { k: 'باب الکذب، ح ۳', url: K + '139/3', speaker: 'امام محمد باقر (ع)', from: 'ان الله عز وجل جعل للشر', to: 'شر من الشراب' }, par: [{ q: '9:119' }] },
  { id: 'hope-relapse', topic: 'وقتی دوباره خطا کردم', main: { q: '39:53' }, par: [] },
  { id: 'ease', topic: 'سختی و امید', main: { q: '94:5-6' }, par: [{ q: '65:7', from: 'سيجعل الله', to: 'يسرا', fa: 'خداوند بزودی بعد از سختیها آسانی قرار می‌دهد!' }] },
  { id: 'heart-rest', topic: 'اضطراب و آرامش', main: { q: '13:28' }, par: [{ q: '2:152' }] },
  { id: 'verify-news', topic: 'شایعه و خبر', main: { q: '49:6' }, par: [{ q: '17:36' }] },
  { id: 'capacity', topic: 'هدف واقع‌بینانه', main: { q: '2:286', from: 'لا يكلف الله', to: 'وسعها', fa: 'خداوند هیچ کس را، جز به اندازه تواناییش، تکلیف نمی‌کند.' }, par: [{ q: '2:185', from: 'يريد الله بكم اليسر', to: 'بكم العسر', fa: 'خداوند، راحتی شما را می‌خواهد، نه زحمت شما را!' }] },
  { id: 'parents', topic: 'پدر و مادر', main: { q: '17:23-24' }, par: [{ k: 'باب البر بالوالدين، ح ۴', url: K + '69/4', speaker: 'امام صادق (ع)', from: 'اي الاعمال افضل', to: 'سبيل الله عز وجل' }] },
  { id: 'answer-peace', topic: 'جواب بی‌ادبی', main: { q: '25:63' }, par: [{ q: '41:34' }] },
  { id: 'say-do', topic: 'وفای به قول', main: { q: '61:2-3' }, par: [{ k: 'باب الصدق و اداء الامانة، ح ۱', url: K + '51/1', speaker: 'امام صادق (ع)', from: 'ان الله عز وجل لم يبعث', to: 'البر والفاجر' }] },
]

const out = []
const errors = []
for (const d of DEFS) {
  let main
  try {
    main = await src(d.main)
    for (const p of d.par) await src(p)
  } catch (e) {
    errors.push(`${d.id}: ${e.message}`)
    continue
  }
  const par = []
  for (const p of d.par) {
    const s = await src(p)
    par.push({ arabic: s.arabic, translation: s.translation, ref: s.kind === 'quran' ? `${s.ref} (ترجمهٔ مکارم)` : s.ref, school: s.kind === 'quran' ? 'quran' : s.verifyUrl.includes('sunnah.com') ? 'sunni' : 'shia', grading: s.grading, verifyUrl: s.verifyUrl, speaker: s.speaker, english: s.english })
  }
  out.push({ id: d.id, topic: d.topic, source: main, parallels: par })
}
if (errors.length) {
  console.log(errors.join(' || '))
  process.exit(1)
}
fs.mkdirSync(path.join(root, 'content'), { recursive: true })
fs.writeFileSync(path.join(root, 'content', 'batch2-sources.json'), JSON.stringify(out, null, 2))
console.log(out.length, 'lessons')
for (const l of out) console.log(`${l.id.padEnd(17)} ${l.source.ref} | ${l.source.arabic.slice(0, 70)}${l.source.grading ? ' | ' + l.source.grading.value : ''} | par ${l.parallels.length}`)
