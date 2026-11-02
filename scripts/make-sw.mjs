// پس از ساخت نسخهٔ وب اجرا می‌شود و sw.js را با فهرست همهٔ فایل‌های dist می‌سازد
// تا برنامه بعد از اولین باز شدن، بدون اینترنت هم کار کند (به‌جز پخش تلاوت).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'app', 'dist')

const files = []
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) walk(p)
    else if (f.name !== 'sw.js') files.push(path.relative(dist, p).split(path.sep).join('/'))
  }
}
walk(dist)

const hash = crypto.createHash('sha1')
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(dist, f)))
const version = hash.digest('hex').slice(0, 10)

const sw = `// ساخته‌شده با scripts/make-sw.mjs — دستی ویرایش نشود
const CACHE = 'mishkat-${version}'
const FILES = ${JSON.stringify(['./', ...files.map((f) => './' + f)])}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error())),
    ),
  )
})
`
fs.writeFileSync(path.join(dist, 'sw.js'), sw)
console.log(`sw.js: ${files.length} فایل، نسخهٔ ${version}`)
