// ساخته‌شده با scripts/make-sw.mjs — دستی ویرایش نشود
const CACHE = 'mishkat-3a180ec947'
const FILES = ["./","./art/home-night.webp","./art/splash.webp","./assets/amiri-arabic-400-normal-C_1DQziU.woff","./assets/amiri-arabic-400-normal-D0NIBXga.woff2","./assets/amiri-quran-arabic-400-normal-CZ144KtP.woff","./assets/amiri-quran-arabic-400-normal-wRcqfVJx.woff2","./assets/index-B1ys7Euk.css","./assets/index-CewNOfSg.js","./assets/vazirmatn-arabic-400-normal-C4W5XURk.woff","./assets/vazirmatn-arabic-400-normal-DMZFCm7K.woff2","./assets/vazirmatn-arabic-600-normal-CPKvAnd1.woff2","./assets/vazirmatn-arabic-600-normal-CWYTfCgi.woff","./assets/vazirmatn-arabic-700-normal-B5nPuCFv.woff","./assets/vazirmatn-arabic-700-normal-Dge_DOjm.woff2","./assets/vazirmatn-arabic-800-normal-BH12s3-y.woff","./assets/vazirmatn-arabic-800-normal-Bwnt96zj.woff2","./assets/vazirmatn-arabic-900-normal-BVDx3pOU.woff2","./assets/vazirmatn-arabic-900-normal-DxDkRnCr.woff","./assets/vazirmatn-latin-400-normal-BT_DHTc7.woff2","./assets/vazirmatn-latin-400-normal-GKyMcI03.woff","./books/index.json","./books/quran/index.json","./covers/c1.webp","./covers/c10.webp","./covers/c11.webp","./covers/c12.webp","./covers/c13.webp","./covers/c14.webp","./covers/c15.webp","./covers/c16.webp","./covers/c17.webp","./covers/c18.webp","./covers/c19.webp","./covers/c2.webp","./covers/c20.webp","./covers/c21.webp","./covers/c22.webp","./covers/c23.webp","./covers/c24.webp","./covers/c3.webp","./covers/c4.webp","./covers/c5.webp","./covers/c6.webp","./covers/c7.webp","./covers/c8.webp","./covers/c9.webp","./icons/app.ico","./icons/hero-lamp.webp","./icons/icon-1024.png","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-32.png","./icons/icon-512.png","./icons/icon-64.png","./index.html","./manifest.webmanifest"]

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
        fetch(req)
          .then((res) => {
            if (res.ok && new URL(req.url).pathname.includes('/books/')) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(req, copy))
            }
            return res
          })
          .catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error())),
    ),
  )
})
