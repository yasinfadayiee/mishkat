// اجرای خودکار همهٔ کارهای content/jobs با Gemini API، یکی پس از دیگری، بدون کار دستی.
// کلید: متغیر GEMINI_API_KEY یا فایل content/jobs/gemini-key.txt (این پوشه در git نیست).
// اجرا: node scripts/gemini-runner.mjs [--model نام-مدل] [--from 001] [--to 230] [--dry]
// خروجی هر کار: content/jobs/out/NNN.json؛ کار انجام‌شده دوباره فرستاده نمی‌شود، پس هر وقت قطع شد دوباره اجرا کن.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jobsDir = path.join(root, 'content', 'jobs')
const outDir = path.join(jobsDir, 'out')
const logFile = path.join(jobsDir, 'runner.log')
fs.mkdirSync(outDir, { recursive: true })

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : def
}
const DRY = process.argv.includes('--dry')
const FROM = Number(arg('from', 1))
const TO = Number(arg('to', 99999))
const API = 'https://generativelanguage.googleapis.com/v1beta'

const log = (msg) => {
  const line = `${new Date().toLocaleString('fa-IR')}  ${msg}`
  console.log(line)
  fs.appendFileSync(logFile, `${line}\n`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const keyFile = path.join(jobsDir, 'gemini-key.txt')
const KEY = (process.env.GEMINI_API_KEY || (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8') : '')).trim()

async function call(url, body) {
  // کلید در سرآیند می‌رود، نه در نشانی
  const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' }, body: body && JSON.stringify(body) })
  const text = await r.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { error: { message: text.slice(0, 300) } }
  }
  return { status: r.status, json }
}

/** قوی‌ترین مدلِ Pro که این کلید به آن دسترسی دارد */
async function pickModel() {
  const forced = arg('model')
  if (forced) return forced
  const { status, json } = await call(`${API}/models?pageSize=200`)
  if (status !== 200) throw new Error(`فهرست مدل‌ها: ${status} ${json.error?.message ?? ''}`)
  const pro = (json.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent') && /pro/i.test(m.name) && !/vision|tts|image|embed|preview-tts/i.test(m.name))
    .map((m) => m.name.replace('models/', ''))
  const version = (n) => Number((n.match(/gemini-(\d+(?:\.\d+)?)/) ?? [0, 0])[1])
  pro.sort((a, b) => version(b) - version(a) || Number(/latest/.test(b)) - Number(/latest/.test(a)) || a.length - b.length)
  if (!pro.length) throw new Error('هیچ مدل Pro در دسترس این کلید نیست؛ با --model نام مدل را بده')
  return pro[0]
}

/** شیء‌های کامل JSON از یک پاسخ (حتی اگر پاسخ وسط کار بریده باشد) */
function parseItems(text) {
  const t = text.replace(/^[\s\S]*?(\[)/, '$1').replace(/```[\s\S]*$/, '')
  try {
    return JSON.parse(t)
  } catch {
    const cut = t.lastIndexOf('}')
    try {
      return JSON.parse(`${t.slice(0, cut + 1)}]`)
    } catch {
      return []
    }
  }
}

let useThinking = true
async function generate(model, contents) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    const body = {
      contents,
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 65536, temperature: 0.4, ...(useThinking && { thinkingConfig: { thinkingLevel: 'high' } }) },
    }
    const { status, json } = await call(`${API}/models/${model}:generateContent`, body)
    if (status === 200) {
      const c = json.candidates?.[0]
      return { text: (c?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join(''), finish: c?.finishReason }
    }
    const msg = json.error?.message ?? ''
    // مدل‌هایی که «سطح اندیشیدن» را نمی‌شناسند: بدون آن دوباره
    if (status === 400 && useThinking && /thinking/i.test(msg)) {
      useThinking = false
      log('این مدل سطح اندیشیدن را نمی‌پذیرد؛ بدون آن ادامه می‌دهم')
      continue
    }
    if (status === 400 || status === 401 || status === 403) throw new Error(`${status}: ${msg}`)
    // محدودیت سرعت یا سهمیه، یا خطای موقت سرور: صبر و تلاش دوباره
    const wait = status === 429 ? Math.min(15 * 60, 30 * 2 ** (attempt - 1)) : 20 * attempt
    log(`پاسخ ${status} (${msg.slice(0, 120)})؛ ${wait} ثانیه صبر، تلاش ${attempt}`)
    await sleep(wait * 1000)
  }
  throw new Error('پس از چند تلاش پاسخی نیامد')
}

async function runJob(model, j) {
  const prompt = fs.readFileSync(path.join(jobsDir, `${j.job}.txt`), 'utf8')
  const want = JSON.parse(prompt.slice(prompt.lastIndexOf('\n[') + 1)).map((x) => x.id)
  const got = new Map()
  const contents = [{ role: 'user', parts: [{ text: prompt }] }]
  for (let turn = 0; turn < 6 && got.size < want.length; turn++) {
    const { text, finish } = await generate(model, contents)
    for (const x of parseItems(text)) if (x?.id && want.includes(x.id)) got.set(x.id, x)
    if (got.size >= want.length) break
    // پاسخ بریده شد: «ادامه بده» از اولین متنِ نانوشته
    const next = want.find((id) => !got.has(id))
    log(`کار ${j.job}: ${got.size}/${want.length} (${finish ?? '?'})؛ ادامه از ${next}`)
    contents.push({ role: 'model', parts: [{ text }] }, { role: 'user', parts: [{ text: `ادامه بده. reply with ONLY one JSON code block with the remaining items, starting with id "${next}".` }] })
  }
  const items = want.filter((id) => got.has(id)).map((id) => got.get(id))
  fs.writeFileSync(path.join(outDir, `${j.job}.json`), JSON.stringify(items, null, 1))
  return { done: items.length, total: want.length }
}

const manifest = JSON.parse(fs.readFileSync(path.join(jobsDir, 'manifest.json'), 'utf8'))
const done = (j) => {
  const f = path.join(outDir, `${j.job}.json`)
  return fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).length >= j.count
}
const todo = manifest.filter((j) => Number(j.job) >= FROM && Number(j.job) <= TO && !done(j))
log(`${todo.length} کار مانده (از ${manifest.length})`)
if (DRY) {
  console.log(todo.slice(0, 5).map((j) => `${j.job} ${j.kind} ${j.book} (${j.count})`).join('\n'))
  process.exit(0)
}
if (!KEY) {
  console.log('کلید Gemini پیدا نشد. راهنما: content/jobs/راهنمای-خودکار.md')
  process.exit(1)
}

const model = await pickModel()
log(`مدل: ${model}`)
let n = 0
for (const j of todo) {
  const t0 = Date.now()
  try {
    const r = await runJob(model, j)
    n++
    log(`✓ کار ${j.job} (${j.kind}، ${j.book}): ${r.done}/${r.total} در ${Math.round((Date.now() - t0) / 1000)} ثانیه — ${n}/${todo.length}`)
  } catch (e) {
    log(`✗ کار ${j.job}: ${e.message}`)
    if (/^40[013]/.test(e.message)) break
  }
}
log('پایان این دور. برای ادامهٔ کارهای ناتمام دوباره اجرا کن.')
