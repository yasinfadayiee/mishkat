// پل محلی میان افزونهٔ «مشکات · Gemini» و پوشهٔ کارها. فقط روی 127.0.0.1 گوش می‌دهد.
// اجرا: node scripts/gemini-bridge.mjs   (یا دو بار کلیک روی «گیمنای-خودکار.cmd»)
//   GET  /next          → کار بعدیِ ناتمام { job, kind, book, count, text, ids }
//   POST /result        ← { job, items } ؛ با خروجی قبلی همان کار ادغام می‌شود
//   GET  /status        → شمار کارهای انجام‌شده
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jobsDir = path.join(root, 'content', 'jobs')
const outDir = path.join(jobsDir, 'out')
const logFile = path.join(jobsDir, 'bridge.log')
fs.mkdirSync(outDir, { recursive: true })
const manifest = JSON.parse(fs.readFileSync(path.join(jobsDir, 'manifest.json'), 'utf8'))
const PORT = 8791

const log = (m) => {
  const line = `${new Date().toLocaleString('fa-IR')}  ${m}`
  console.log(line)
  fs.appendFileSync(logFile, `${line}\n`)
}
const outFile = (job) => path.join(outDir, `${job}.json`)
const have = (job) => (fs.existsSync(outFile(job)) ? JSON.parse(fs.readFileSync(outFile(job), 'utf8')) : [])
const input = (job) => {
  const t = fs.readFileSync(path.join(jobsDir, `${job}.txt`), 'utf8')
  return { text: t, ids: JSON.parse(t.slice(t.lastIndexOf('\n[') + 1)).map((x) => x.id) }
}
// کاری که چند بار پشت سر هم ناقص ماند، کنار گذاشته می‌شود تا صف گیر نکند
const tries = new Map()

function next() {
  for (const j of manifest) {
    const got = new Set(have(j.job).map((x) => x.id))
    if (got.size >= j.count) continue
    if ((tries.get(j.job) ?? 0) >= 3) continue
    const { text, ids } = input(j.job)
    const missing = ids.filter((id) => !got.has(id))
    return { ...j, text, ids, missing }
  }
  return null
}

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' })
  res.end(JSON.stringify(body))
}

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, {})
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
    if (req.method === 'GET' && url.pathname === '/next') {
      const j = next()
      if (j) log(`کار ${j.job} فرستاده شد (${j.kind}، ${j.book}، ${j.missing.length} متن مانده)`)
      return send(res, 200, j ?? { done: true })
    }
    if (req.method === 'GET' && url.pathname === '/status') {
      const done = manifest.filter((j) => have(j.job).length >= j.count).length
      return send(res, 200, { done, total: manifest.length })
    }
    if (req.method === 'POST' && url.pathname === '/result') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        try {
          const { job, items } = JSON.parse(body)
          const j = manifest.find((x) => x.job === job)
          if (!j || !Array.isArray(items)) return send(res, 400, { error: 'bad job' })
          const { ids } = input(job)
          const map = new Map(have(job).map((x) => [x.id, x]))
          for (const x of items) if (x?.id && ids.includes(x.id) && (x.fa || x.gist)) map.set(x.id, x)
          const list = ids.filter((id) => map.has(id)).map((id) => map.get(id))
          fs.writeFileSync(outFile(job), JSON.stringify(list, null, 1))
          if (list.length < ids.length) tries.set(job, (tries.get(job) ?? 0) + 1)
          log(`نتیجهٔ کار ${job}: ${list.length}/${ids.length}`)
          send(res, 200, { saved: list.length, total: ids.length })
        } catch (e) {
          send(res, 400, { error: e.message })
        }
      })
      return
    }
    send(res, 404, { error: 'not found' })
  })
  .listen(PORT, '127.0.0.1', () => log(`پل آماده است: http://127.0.0.1:${PORT}  (${manifest.length} کار)`))
