// متن‌های ترجمه‌نشده را به کارهای آمادهٔ ارسال برای Gemini تقسیم می‌کند (هر کار در یک پاسخ جا می‌شود).
// اجرا: node scripts/make-gemini-jobs.mjs
// خروجی: content/jobs/NNN.txt (متن کامل پیام) و content/jobs/manifest.json
// شناسهٔ هر متن به شکل «NNN.شناسه» است تا خروجی‌ها با هر نام فایلی به کتاب خود برگردند.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const books = path.join(root, 'app', 'public', 'books')
const out = path.join(root, 'content', 'jobs')
const WORDS = 5000

// ترتیب کار: اخلاقی و اعتقادی، سپس فقهی، سپس صحیحین
const ORDER = [
  'tuhaf', 'Al-Kafi-Volume-1-Kulayni', 'Al-Kafi-Volume-8-Kulayni', 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq', 'Al-Khisal-Saduq',
  'Al-Amali-Saduq', 'Al-Amali-Mufid', 'Al-Tawhid-Saduq', 'Maani-al-Akhbar-Saduq', 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  'Uyun-akhbar-al-Rida-Volume-2-Saduq', 'Kitab-al-Zuhd-Ahwazi', 'Kitab-al-Mumin-Ahwazi', 'Fadail-al-Shia-Saduq',
  'Fadail-al-Ashhur-al-Thalatha-Saduq', 'Kamal-al-Din-wa-Tamam-al-Nima-Saduq', 'Kitab-al-Ghayba-Numani', 'Kitab-al-Ghayba-Tusi',
  'Kamil-al-Ziyarat-Qummi', 'Al-Imama-wal-Tabsira-min-al-Hayra-Babawayh', 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
  'Al-Kafi-Volume-3-Kulayni', 'Al-Kafi-Volume-4-Kulayni', 'Al-Kafi-Volume-5-Kulayni', 'Al-Kafi-Volume-6-Kulayni', 'Al-Kafi-Volume-7-Kulayni',
  'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq', 'Man-La-Yahduruh-al-Faqih-Volume-2-Saduq', 'Man-La-Yahduruh-al-Faqih-Volume-3-Saduq',
  'Man-La-Yahduruh-al-Faqih-Volume-4-Saduq', 'Man-La-Yahduruh-al-Faqih-Volume-5-Saduq',
  'Tahdhib-al-Ahkam-Volume-1-Tusi', 'Tahdhib-al-Ahkam-Volume-2-Tusi', 'Tahdhib-al-Ahkam-Volume-3-Tusi', 'Tahdhib-al-Ahkam-Volume-4-Tusi',
  'bukhari', 'muslim',
]

const base = fs.readFileSync(path.join(root, 'content', 'prompts', 'gemini-base.md'), 'utf8')
const RULES = {
  tuhaf: 'Items are sermons, letters, advice and short sayings of the Prophet (ص) and the Imams (ع), collected by Ibn Shuba al-Harrani. "speaker" is given only for context. If an item starts or ends mid-sentence (the source splits long texts), translate exactly the words that are there.',
  shia: 'Items are hadith from a Shia collection. The Arabic usually begins with a chain of narrators (isnad), then the text (matn). In "fa", do NOT translate every narrator name: write the chain as one short opening clause naming only the first narrator and the Imam or Prophet at the end of the chain, e.g. «علی بن ابراهیم با سند خود از امام صادق (ع) روایت می‌کند که فرمود:», then translate the matn COMPLETELY. Never guess which Imam is meant: أبو عبد الله = امام صادق (ع); أبو جعفر = امام باقر (ع) unless the chain makes it the ninth Imam; أبو الحسن = «امام کاظم یا امام رضا (ع)» if the Arabic does not make it clear. If an item is the compiler\'s own heading or comment, translate it simply.',
  fiqh: 'Items are hadith on rulings (fiqh) from a Shia collection. Apply the chain rule: write the isnad as one short clause naming only the first narrator and the Imam at the end (أبو عبد الله = امام صادق (ع); أبو جعفر = امام باقر (ع); أبو الحسن = «امام کاظم یا امام رضا (ع)» if unclear), then translate the matn COMPLETELY. "note": one or two plain sentences saying what the ruling in the text is, without adding any ruling, condition or detail the text does not state. "mirror": usually "" for purely legal items.',
  sunni: 'Items are hadith from a Sunni collection (Sahih al-Bukhari or Sahih Muslim). Write the isnad as one short clause naming only the first narrator and the Companion, e.g. «از ابوهریره روایت است که پیامبر (ص) فرمود:», then translate the matn COMPLETELY.',
}
const kind = (id) => (id === 'tuhaf' ? 'tuhaf' : id === 'bukhari' || id === 'muslim' ? 'sunni' : /Kafi-Volume-[3-7]|Faqih|Tahdhib/.test(id) ? 'fiqh' : 'shia')

fs.mkdirSync(out, { recursive: true })
for (const f of fs.readdirSync(out)) if (/^\d{3}\.txt$/.test(f)) fs.unlinkSync(path.join(out, f))
const manifest = []
let n = 0
for (const id of ORDER) {
  const b = JSON.parse(fs.readFileSync(path.join(books, `${id}.json`), 'utf8'))
  const items = []
  for (const s of b.sections)
    for (const c of s.chapters)
      for (const it of c.items) if (!it.fa) items.push({ i: it.i, ar: it.ar, ...(id === 'tuhaf' && { speaker: s.t.replace('سخنان ', '') }) })
  let cur = []
  let w = 0
  const flush = () => {
    if (!cur.length) return
    n++
    const no = String(n).padStart(3, '0')
    const data = cur.map((x) => ({ id: `${no}.${x.i}`, ...(x.speaker && { speaker: x.speaker }), ar: x.ar }))
    const msg = `${base}\nRULES FOR THIS BOOK\n${RULES[kind(id)]}\n\nINPUT (${data.length} items, job ${no}):\n${JSON.stringify(data)}`
    fs.writeFileSync(path.join(out, `${no}.txt`), msg)
    manifest.push({ job: no, book: id, count: data.length, first: cur[0].i, last: cur.at(-1).i })
    cur = []
    w = 0
  }
  for (const x of items) {
    const k = x.ar.split(/\s+/).length
    if (w + k > WORDS && cur.length) flush()
    cur.push(x)
    w += k
  }
  flush()
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1))
console.log(`${n} کار ساخته شد`)
