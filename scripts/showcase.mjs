// عکس‌برداری از نسخهٔ ویندوزیِ واقعی (Electron) از صفحه‌های اصلی، در اندازهٔ گوشی و دسکتاپ
// اجرا: node scripts/showcase.mjs   (خروجی: art/screens/*.png)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const out = path.join(root, 'art', 'screens')
fs.mkdirSync(out, { recursive: true })
const exe = path.join(root, 'desktop', 'release', 'win-unpacked', 'Mishkat.exe')
const app = spawn(exe, ['--remote-debugging-port=9333'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let page
  for (let i = 0; i < 30 && !page; i++) {
    await sleep(500)
    try {
      page = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((x) => x.type === 'page')
    } catch {
      /* هنوز بالا نیامده */
    }
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const call = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id
      const h = (e) => {
        const m = JSON.parse(e.data)
        if (m.id === i) {
          ws.removeEventListener('message', h)
          resolve(m.result)
        }
      }
      ws.addEventListener('message', h)
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  const ev = (expression) => call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  const shot = async (name) => {
    const s = await call('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(s.data, 'base64'))
    console.log('saved', name)
  }
  const phone = () => call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  const desktop = () => call('Emulation.setDeviceMetricsOverride', { width: 1366, height: 820, deviceScaleFactor: 1, mobile: false })
  const progress = {
    onboarded: true,
    name: 'یاسین',
    theme: 'emerald',
    completed: { consistency: '2026-11-01', 'change-within': '2026-11-02' },
    quiz: {},
    habits: [{ lessonId: 'consistency', short: 'دو دقیقه کار خوبِ هرروزه', addedAt: '2026-11-01' }],
    checkins: { '2026-11-01': ['consistency'] },
    studyDays: ['2026-11-01', '2026-11-02'],
    journal: [],
    programs: { steadfast: { startedAt: '2026-11-01' } },
  }

  await phone()
  await ev(`localStorage.clear(); sessionStorage.clear(); location.reload(); 1`)
  await sleep(4600)
  await shot('01-intro')
  await ev(`sessionStorage.setItem('mishkat.intro','1'); location.reload(); 1`)
  await sleep(2600)
  await shot('02-welcome')
  await ev(`localStorage.setItem('mishkat.progress.v1', ${JSON.stringify(JSON.stringify(progress))}); location.reload(); 1`)
  await sleep(3200)
  await shot('03-home')
  await ev(`document.querySelector('.journey').scrollIntoView({block:'center'}); 1`)
  await sleep(2600)
  await shot('04-path')
  await ev(`window.scrollTo(0,0); document.querySelector('.today-card').click(); 1`)
  await sleep(1500)
  await shot('05-lesson-hook')
  await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'})); 1`)
  await sleep(3800)
  await shot('06-lesson-verse')
  await ev(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); 1`)
  await sleep(800)
  await desktop()
  await ev(`window.scrollTo(0,0); 1`)
  await sleep(2200)
  await shot('07-desktop-home')
  await ev(`localStorage.clear(); sessionStorage.clear(); 1`)
  ws.close()
} finally {
  app.kill()
}
