// عکس‌برداری و اندازه‌گیری نسخهٔ وب (app/dist) با Chrome بی‌سر و CDP
// اجرا: node scripts/shots.mjs <پوشهٔ خروجی> [scenes.json]
//   هر صحنه: { name, hash?, steps?: [js], wait?: ms, full?: bool, sizes?: ['phone','desktop'], themes?: ['noon','isfahan'] }
// متغیر SLOW=1 شبکه را مثل Fast 3G کند می‌کند و حجم دانلود هر صحنه را گزارش می‌دهد.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'app', 'dist')
const out = path.resolve(process.argv[2] ?? path.join(root, 'art', 'shots'))
fs.mkdirSync(out, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(dist, p)
  if (!f.startsWith(dist) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end()
  const type = TYPES[path.extname(f)] ?? 'application/octet-stream'
  // مثل GitHub Pages: متن‌ها فشرده فرستاده می‌شوند
  if (/json|javascript|css|html|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
    res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip' })
    return res.end(zlib.gzipSync(fs.readFileSync(f)))
  }
  res.writeHead(200, { 'content-type': type })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}/`

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const prof = fs.mkdtempSync(path.join(process.env.TEMP ?? '/tmp', 'mshot-'))
const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=9339', `--user-data-dir=${prof}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' })

let target
for (let i = 0; i < 40 && !target; i++) {
  await sleep(300)
  try {
    target = (await (await fetch('http://127.0.0.1:9339/json')).json()).find((x) => x.type === 'page')
  } catch {
    /* هنوز بالا نیامده */
  }
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
const listeners = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) (pending.get(m.id)(m.result ?? m), pending.delete(m.id))
  else if (m.method) listeners.forEach((l) => l(m))
}
const call = (method, params = {}) => new Promise((resolve) => {
  const i = ++id
  pending.set(i, resolve)
  ws.send(JSON.stringify({ id: i, method, params }))
})
const ev = async (expression) => (await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value

await call('Page.enable')
await call('Network.enable')
await call('Network.setCacheDisabled', { cacheDisabled: true })
let bytes = 0
const reqs = new Map()
listeners.push((m) => {
  if (m.method === 'Network.requestWillBeSent') reqs.set(m.params.requestId, m.params.request.url)
  if (m.method === 'Network.loadingFinished') bytes += m.params.encodedDataLength
})

const progress = (theme) => ({
  onboarded: true,
  name: 'یاسین',
  theme,
  themeSet: true,
  completed: {},
  quiz: {},
  habits: [],
  checkins: {},
  studyDays: [],
  journal: [],
  programs: {},
  saved: [],
  marks: [],
  notes: {},
})
const SIZES = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
  desktop: { width: 1366, height: 820, deviceScaleFactor: 1, mobile: false },
}

const scenes = process.argv[3]
  ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
  : [
      { name: 'home', full: true },
      { name: 'library', steps: ["[...document.querySelectorAll('.tabbar button, .rail button')].find(b=>b.textContent.includes('کتابخانه')).click()"], full: true },
    ]

const report = []
let script
for (const sc of scenes) {
  for (const size of sc.sizes ?? ['phone', 'desktop']) {
    for (const theme of sc.themes ?? ['noon', 'isfahan']) {
      await call('Emulation.setDeviceMetricsOverride', SIZES[size])
      if (script) await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: script })
      const extra = sc.storage ? Object.entries(sc.storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join('') : ''
      script = (
        await call('Page.addScriptToEvaluateOnNewDocument', {
          source: `try{if(!sessionStorage.getItem('shot.init')){localStorage.clear();sessionStorage.setItem('shot.init','1')};localStorage.setItem('mishkat.progress.v1', ${JSON.stringify(JSON.stringify(progress(theme)))});${extra}sessionStorage.setItem('mishkat.intro','1');localStorage.setItem('mishkat.introSeen','1')}catch(e){}`,
        })
      ).identifier
      if (process.env.SLOW) await call('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
      bytes = 0
      reqs.clear()
      // بدون این، رفتن به نشانیِ هم‌سند (فقط hash متفاوت) صفحه را از نو بار نمی‌کند
      await call('Page.navigate', { url: 'about:blank' })
      await sleep(150)
      const t0 = Date.now()
      await call('Page.navigate', { url: `${base}index.html${sc.hash ?? ''}` })
      let ready = 0
      for (let i = 0; i < 200; i++) {
        await sleep(100)
        if (await ev(`document.readyState==='complete' && !!document.querySelector('.shell .main, .shell')`)) {
          ready = Date.now() - t0
          break
        }
      }
      for (const s of sc.steps ?? []) {
        await sleep(sc.stepWait ?? 900)
        await ev(s)
      }
      // صبر تا جای «در حال باز کردن» و اسکلت‌ها خالی شود
      let settled = 0
      for (let i = 0; i < (sc.maxWait ?? 120); i++) {
        await sleep(100)
        const busy = await ev(`!!document.querySelector('.skel, [data-loading]') || /در حال (باز کردن|گشتن|جست)/.test(document.body.innerText)`)
        if (!busy) {
          settled = Date.now() - t0
          break
        }
      }
      await sleep(sc.wait ?? 1200)
      const dims = await ev(`(()=>{const r=document.querySelector('.reader-scroll, .study-scroll');return {doc: document.documentElement.scrollHeight, reader: r ? r.scrollHeight : 0}})()`)
      if (sc.probe) console.log('probe:', JSON.stringify(await ev(sc.probe)))
      const shotName = `${sc.name}-${size}-${theme}`
      let shot
      if (sc.full && size === 'phone') {
        const h = Math.min(dims.doc, 9000)
        await call('Emulation.setDeviceMetricsOverride', { ...SIZES[size], height: h })
        await sleep(600)
        shot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 78 })
        await call('Emulation.setDeviceMetricsOverride', SIZES[size])
      } else shot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 82 })
      if (shot.data) fs.writeFileSync(path.join(out, `${shotName}.jpg`), Buffer.from(shot.data, 'base64'))
      const big = [...reqs.values()].filter((u) => u.includes('/books/')).map((u) => u.replace(base, ''))
      report.push({ shot: shotName, readyMs: ready, settledMs: settled, kb: Math.round(bytes / 1024), height: dims, books: big })
      console.log(JSON.stringify(report.at(-1)))
    }
  }
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1))
ws.close()
proc.kill()
server.close()
process.exit(0)
