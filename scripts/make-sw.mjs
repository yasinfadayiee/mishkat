// پس از ساخت نسخهٔ وب اجرا می‌شود و sw.js را می‌سازد تا برنامه بعد از اولین باز شدن، بدون اینترنت هم کار کند (به‌جز پخش تلاوت).
// دو حافظه دارد:
//   mishkat-shell-<نسخه>  پوستهٔ برنامه (جاوااسکریپت، سبک، قلم و تصویر)؛ با هر انتشار عوض می‌شود
//   mishkat-books         کتاب‌ها؛ پایدار است و هر فایل فقط وقتی هشش در books/manifest.json عوض شود پاک و دوباره گرفته می‌شود
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'app', 'dist')

const files = []
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) {
      if (path.relative(dist, p) !== 'books') walk(p)
    } else if (f.name !== 'sw.js') files.push(path.relative(dist, p).split(path.sep).join('/'))
  }
}
walk(dist)
const hash = crypto.createHash('sha1')
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(dist, f)))
const manifest = path.join(dist, 'books', 'manifest.json')
if (fs.existsSync(manifest)) hash.update(fs.readFileSync(manifest))
const version = hash.digest('hex').slice(0, 10)

const sw = `// ساخته‌شده با scripts/make-sw.mjs — دستی ویرایش نشود
const SHELL = 'mishkat-shell-${version}'
const BOOKS = 'mishkat-books'
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])}
// کتاب‌های کوچکی که خانه بدون آن‌ها کامل نمی‌شود
const BOOK_FILES = ['./books/index.json', './books/quran/index.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    Promise.all([caches.open(SHELL).then((c) => c.addAll(FILES)), caches.open(BOOKS).then((c) => Promise.all(BOOK_FILES.map((f) => c.match(f).then((hit) => hit || c.add(f)))))]).then(() => self.skipWaiting()),
  )
})

// فایل‌های کتابی که محتوایشان عوض شده (یا دیگر نیست) پاک می‌شوند؛ بقیه می‌مانند
async function refreshBooks() {
  const res = await fetch('./books/manifest.json', { cache: 'no-store' })
  if (!res.ok) return
  const next = await res.clone().json()
  const c = await caches.open(BOOKS)
  const old = await c.match('./books/manifest.json').then((r) => (r ? r.json() : null))
  if (old) {
    const scope = new URL('./books/', self.registration.scope).href
    for (const req of await c.keys()) {
      const f = req.url.startsWith(scope) ? decodeURIComponent(req.url.slice(scope.length).split('?')[0]) : null
      if (f && f !== 'manifest.json' && old[f] !== next[f]) await c.delete(req)
    }
  } else {
    // نخستین بار با این روش: نسخه‌های قدیمیِ این فایل‌ها تازه گرفته شوند
    for (const f of BOOK_FILES) await c.delete(f)
  }
  await c.put('./books/manifest.json', res)
  await Promise.all(BOOK_FILES.map((f) => c.match(f).then((hit) => hit || c.add(f).catch(() => {}))))
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== BOOKS).map((k) => caches.delete(k))))
      .then(() => refreshBooks().catch(() => {}))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin) return
  const isBook = url.pathname.includes('/books/') && !url.pathname.endsWith('/manifest.json')
  e.respondWith(
    caches.open(isBook ? BOOKS : SHELL).then((c) =>
      c.match(req, { ignoreSearch: true }).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res.ok && isBook) c.put(req, res.clone())
              return res
            })
            .catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error())),
      ),
    ),
  )
})
`
fs.writeFileSync(path.join(dist, 'sw.js'), sw)
console.log(`sw.js: ${files.length} فایل پوسته، نسخهٔ ${version}`)
