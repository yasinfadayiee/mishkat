// ساخته‌شده با scripts/make-sw.mjs — دستی ویرایش نشود
const SHELL = 'mishkat-shell-0373d87a6d'
const BOOKS = 'mishkat-books'
const FILES = ["./","./art/home-night.webp","./art/splash.webp","./assets/Book-CFn5e5VM.js","./assets/Intro-CVK8MRvX.js","./assets/Lesson-DfDgNyau.js","./assets/Library-C1atUJ19.js","./assets/Me-CqGHX1ew.js","./assets/Onboarding-CZBOustM.js","./assets/Quran-CewQNMWp.js","./assets/Search-CGCanVbA.js","./assets/Topics-DajjJa8E.js","./assets/Trust-B2OYKcm9.js","./assets/amiri-arabic-400-normal-C_1DQziU.woff","./assets/amiri-arabic-400-normal-D0NIBXga.woff2","./assets/amiri-quran-arabic-400-normal-CZ144KtP.woff","./assets/amiri-quran-arabic-400-normal-wRcqfVJx.woff2","./assets/autotext-BYSOxwYU.js","./assets/backup-BxX24ZII.js","./assets/display-D-YorBu9.js","./assets/dist-BLmgc4Bi.js","./assets/esm-16WH5_rT.js","./assets/esm-9KluiFTX.js","./assets/fx-Btk0i1XP.js","./assets/index-BE6rSw9U.css","./assets/index-CCuTPvQO.js","./assets/is-svg-component-BdopSPiB.js","./assets/lessons-CVGoqXrh.js","./assets/motion-features-D_njzoKy.js","./assets/paren-BT_DHTc7.woff2","./assets/prefs-v4d-PK5G.js","./assets/reader-C1T-G1Vm.js","./assets/rolldown-runtime-XKyaHtl9.js","./assets/search-worker-C77N1owU.js","./assets/topics-hMDNOVin.js","./assets/vazirmatn-arabic-400-normal-C4W5XURk.woff","./assets/vazirmatn-arabic-400-normal-DMZFCm7K.woff2","./assets/vazirmatn-arabic-700-normal-B5nPuCFv.woff","./assets/vazirmatn-arabic-700-normal-Dge_DOjm.woff2","./assets/vazirmatn-arabic-900-normal-BVDx3pOU.woff2","./assets/vazirmatn-arabic-900-normal-DxDkRnCr.woff","./assets/vazirmatn-latin-400-normal-GKyMcI03.woff","./assets/verses-DhhScGPB.js","./assets/web-Dy6qEK7A.js","./assets/web-agR-3OGK.js","./covers/c1.webp","./covers/c10.webp","./covers/c11.webp","./covers/c12.webp","./covers/c13.webp","./covers/c14.webp","./covers/c15.webp","./covers/c16.webp","./covers/c17.webp","./covers/c18.webp","./covers/c19.webp","./covers/c2.webp","./covers/c20.webp","./covers/c21.webp","./covers/c22.webp","./covers/c23.webp","./covers/c24.webp","./covers/c3.webp","./covers/c4.webp","./covers/c5.webp","./covers/c6.webp","./covers/c7.webp","./covers/c8.webp","./covers/c9.webp","./icons/app.ico","./icons/hero-lamp.webp","./icons/icon-1024.png","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-32.png","./icons/icon-512.png","./icons/icon-64.png","./index.html","./manifest.webmanifest"]
// کتاب‌های کوچکی که خانه بدون آن‌ها کامل نمی‌شود
const BOOK_FILES = ['./books/index.json', './books/quran/index.json']

self.addEventListener('install', (e) => {
  e.waitUntil(
    // cache: 'reload' تا نسخهٔ قدیمی از حافظهٔ HTTP مرورگر برداشته نشود
    Promise.all([caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))), caches.open(BOOKS).then((c) => Promise.all(BOOK_FILES.map((f) => c.match(f).then((hit) => hit || c.add(new Request(f, { cache: 'reload' }))))))]).then(() => self.skipWaiting()),
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
  await Promise.all(BOOK_FILES.map((f) => c.match(f).then((hit) => hit || c.add(new Request(f, { cache: 'reload' })).catch(() => {}))))
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
