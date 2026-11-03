// اجرای خودکار کارهای مشکات در Gemini: گپ تازه، آرگون + اندیشگر بالا، چسباندن کار، صبر تا پایان پاسخ،
// برداشتن JSON، «ادامه بده» اگر پاسخ بریده شد، فرستادن نتیجه به پل محلی، مکث، کار بعدی.
// هر وقت صفحه دوباره بارگذاری شود و «در حال اجرا» روشن باشد، از کار ناتمام ادامه می‌دهد.
;(() => {
  const HOME = /^\/u\/\d+\/app\/?$|^\/app\/?$/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const rand = (a, b) => a + Math.random() * (b - a)
  const bridge = (path, body) => new Promise((res) => chrome.runtime.sendMessage({ type: 'bridge', path, body }, (r) => res(r ?? { ok: false, error: 'no reply' })))
  const store = {
    get: (k) => new Promise((r) => chrome.storage.local.get(k, (x) => r(x[k]))),
    set: (k, v) => new Promise((r) => chrome.storage.local.set({ [k]: v }, r)),
  }

  /* ───────── پنل کوچک ───────── */
  const panel = document.createElement('div')
  panel.style.cssText = 'position:fixed;z-index:999999;bottom:14px;left:14px;width:270px;padding:10px 12px;border-radius:14px;background:#0d2347;color:#f3ecdc;font:13px/1.7 Vazirmatn,Tahoma,sans-serif;direction:rtl;box-shadow:0 8px 30px rgba(0,0,0,.4);border:1px solid rgba(236,199,127,.4)'
  panel.innerHTML = '<b style="color:#ecc77f">مشکات · Gemini</b><div id="mk-st">آماده</div><div id="mk-ct" style="opacity:.75"></div><button id="mk-go" style="margin-top:6px;width:100%;padding:6px;border-radius:10px;border:0;background:#ecc77f;color:#0d2347;font-weight:700;cursor:pointer">شروع</button>'
  document.documentElement.appendChild(panel)
  const st = (t) => (panel.querySelector('#mk-st').textContent = t)
  const ct = (t) => (panel.querySelector('#mk-ct').textContent = t)
  const btn = panel.querySelector('#mk-go')

  let running = false
  btn.onclick = async () => {
    running = !running
    await store.set('mk-running', running)
    btn.textContent = running ? 'توقف' : 'شروع'
    if (running) loop()
    else st('متوقف شد')
  }

  /* ───────── ابزارهای صفحه ───────── */
  const q = (sel) => document.querySelector(sel)
  const editor = () => q('rich-textarea .ql-editor') ?? q('[contenteditable="true"]')
  const label = (b) => b.getAttribute('aria-label') ?? ''
  const buttons = () => [...document.querySelectorAll('button, [role="menuitem"]')]
  const generating = () => buttons().some((b) => /توقف|Stop/.test(label(b)))
  const sendBtn = () => buttons().find((b) => /ارسال کردن پیام|Send message/.test(label(b)))
  const picker = () => buttons().find((b) => /انتخاب‌گر حالت|mode picker/i.test(label(b)))
  // نام عنصرِ پاسخ در نسخه‌های مختلف رابط Gemini فرق کرده است
  const lastReply = () => [...document.querySelectorAll('model-response-content, model-response')].at(-1)

  async function waitFor(fn, ms = 20000) {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) {
      const v = fn()
      if (v) return v
      await sleep(400)
    }
    return null
  }

  async function chooseArgonHigh() {
    const p = await waitFor(picker)
    if (!p) throw new Error('دکمهٔ انتخاب مدل پیدا نشد')
    if (/آرگون بالا|Argon.*High/i.test(label(p))) return
    if (!/آرگون|Argon/i.test(label(p))) {
      p.click()
      const m = await waitFor(() => buttons().find((b) => /Argon|آرگون/.test(b.textContent) && b.getAttribute('role') === 'menuitem'))
      if (!m) throw new Error('آرگون در فهرست مدل‌ها نبود')
      m.click()
      await sleep(800)
    }
    picker().click()
    const lvl = await waitFor(() => buttons().find((b) => /سطح «اندیشگر»|Thinking level/i.test(b.textContent)))
    if (!lvl) throw new Error('منوی سطح اندیشگر پیدا نشد')
    lvl.click()
    const hi = await waitFor(() => buttons().find((b) => b.getAttribute('role') === 'menuitem' && /^\s*(بالا|High)/.test(b.textContent)))
    if (!hi) throw new Error('گزینهٔ «بالا» پیدا نشد')
    hi.click()
    await sleep(800)
    if (!/بالا|High/.test(label(picker()))) throw new Error('سطح «بالا» انتخاب نشد')
  }

  async function paste(text) {
    const ed = await waitFor(editor)
    if (!ed) throw new Error('کادر پیام پیدا نشد')
    // رویداد paste ساختگی را ویرایشگر Gemini نمی‌پذیرد؛ insertText مثل تایپ عمل می‌کند
    ed.focus()
    document.execCommand('selectAll')
    document.execCommand('delete')
    // ویرایشگر Gemini پس از نخستین «خط تازه» بقیهٔ متن را نمی‌پذیرد؛ پس همه در یک خط
    // (بخش JSON از اول یک‌خطی است و دستورها با فاصله هم خوانا می‌مانند)
    document.execCommand('insertText', false, text.replace(/\s*\n+\s*/g, '  '))
    await sleep(2000)
    const bare = (t) => t.replace(/\s+/g, '').length
    if (bare(ed.innerText) < bare(text) * 0.97) throw new Error(`متن کامل در کادر ننشست (${bare(ed.innerText)} از ${bare(text)})`)
  }

  async function send() {
    const b = await waitFor(() => {
      const x = sendBtn()
      return x && !x.disabled && x.getAttribute('aria-disabled') !== 'true' ? x : null
    })
    if (!b) throw new Error('دکمهٔ ارسال فعال نشد')
    b.click()
  }

  /** صبر تا پایان پاسخ: دکمهٔ توقف رفته باشد و متن ۱۲ ثانیه تغییر نکند */
  async function waitReply() {
    await waitFor(generating, 90000)
    const t0 = Date.now()
    let last = ''
    let still = 0
    while (Date.now() - t0 < 40 * 60000) {
      await sleep(3000)
      const txt = lastReply()?.innerText ?? ''
      ct(`پاسخ: ${txt.length.toLocaleString('fa-IR')} حرف`)
      // هنگام «اندیشیدن» متن مدتی تغییر نمی‌کند؛ پایانِ واقعی یعنی بلوک JSON بسته شده، یا سکوتی طولانی
      const closed = [...(lastReply()?.querySelectorAll('code, pre') ?? [])].some((e) => /\]\s*$/.test(e.innerText))
      if (!generating() && txt === last && txt) {
        if ((still += 3) >= (closed ? 12 : 150)) return lastReply()
      } else still = 0
      last = txt
    }
    throw new Error('پاسخ بیش از ۴۰ دقیقه طول کشید')
  }

  function itemsOf(reply) {
    const blocks = [...(reply?.querySelectorAll('code, pre') ?? [])].map((e) => e.innerText)
    const text = blocks.sort((a, b) => b.length - a.length)[0] ?? reply?.innerText ?? ''
    const t = text.replace(/^[\s\S]*?\[/, '[').replace(/```[\s\S]*$/, '')
    try {
      return JSON.parse(t)
    } catch {
      try {
        return JSON.parse(`${t.slice(0, t.lastIndexOf('}') + 1)}]`)
      } catch {
        return []
      }
    }
  }

  /* ───────── حلقهٔ اصلی ───────── */
  async function loop() {
    while (running) {
      try {
        if (!HOME.test(location.pathname)) {
          // هر کار در گپ تازه؛ پس از بارگذاری، همین اسکریپت دوباره ادامه می‌دهد
          st('باز کردن گپ تازه…')
          await sleep(rand(2000, 4000))
          location.href = `${location.origin}${location.pathname.match(/^\/u\/\d+/)?.[0] ?? ''}/app`
          return
        }
        const r = await bridge('/next')
        if (!r.ok) throw new Error(`پل محلی در دسترس نیست؛ «گیمنای-خودکار.cmd» را اجرا کن (${r.error})`)
        if (r.data.done) {
          st('همهٔ کارها انجام شد ✓')
          running = false
          await store.set('mk-running', false)
          btn.textContent = 'شروع'
          return
        }
        const job = r.data
        st(`کار ${job.job} · ${job.kind === 'enrich' ? 'توضیح' : 'ترجمه'} · ${job.book}`)
        await sleep(rand(2500, 5000))
        await chooseArgonHigh()
        const partial = job.missing.length < job.ids.length
        await paste(partial ? `${job.text}\n\nIMPORTANT: output ONLY the items with these ids, in order: ${JSON.stringify(job.missing)}` : job.text)
        await sleep(rand(1000, 2500))
        await send()
        const got = new Map()
        for (let turn = 0; turn < 5; turn++) {
          const reply = await waitReply()
          for (const x of itemsOf(reply)) if (x?.id && job.missing.includes(x.id)) got.set(x.id, x)
          const left = job.missing.filter((id) => !got.has(id))
          ct(`${got.size.toLocaleString('fa-IR')} از ${job.missing.length.toLocaleString('fa-IR')} متن`)
          if (!left.length) break
          if (!got.size && turn === 0 && !/[\[{]/.test(reply?.innerText ?? '')) throw new Error(`پاسخ JSON نداشت: ${(reply?.innerText ?? '').slice(0, 120)}`)
          await sleep(rand(3000, 6000))
          await paste(`ادامه بده. reply with ONLY one JSON code block with the remaining items, starting with id "${left[0]}".`)
          await send()
        }
        const saved = await bridge('/result', { job: job.job, items: [...got.values()] })
        st(`کار ${job.job} ذخیره شد: ${saved.data?.saved ?? '?'}/${saved.data?.total ?? '?'}`)
        const s = await bridge('/status')
        if (s.ok) ct(`انجام‌شده: ${s.data.done.toLocaleString('fa-IR')} از ${s.data.total.toLocaleString('fa-IR')} کار`)
        // مکث میان کارها، مثل یک آدم
        const wait = rand(60, 120)
        st(`${Math.round(wait)} ثانیه مکث…`)
        await sleep(wait * 1000)
      } catch (e) {
        // سقف استفاده یا خطای موقت: نیم ساعت صبر، بعد دوباره
        st(`خطا: ${e.message}`)
        ct('۳۰ دقیقه صبر و تلاش دوباره…')
        await sleep(30 * 60000)
        if (running) location.reload()
        return
      }
    }
  }

  store.get('mk-running').then((v) => {
    if (v) {
      running = true
      btn.textContent = 'توقف'
      setTimeout(loop, rand(4000, 7000))
    }
  })
})()
