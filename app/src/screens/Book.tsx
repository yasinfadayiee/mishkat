import { useEffect, useMemo, useRef, useState } from 'react'
import { AutoText } from '../autotext'
import { loadChapter, loadToc, norm, savePlace, type BookMeta, type Item, type Toc } from '../books'
import { Load, LoadFail, Skeleton, useLoad } from '../load'
import { canOffline, downloadBook, mb, offlineCount, removeBook } from '../offline'
import { askAbout } from '../chat'
import { useDisplay } from '../prefs'
import { MarkButton, ReaderShell } from '../reader'
import { go, href, shareUrl } from '../router'
import { copyText, shareCard, shareLink } from '../share'
import { fa, useStore } from '../store'
import { Icon, Medallion, Sheet } from '../ui'

/* ───────── دانلود برای خواندن بدون اینترنت ───────── */
function OfflineButton({ meta, toc }: { meta: BookMeta; toc: Toc }) {
  const [state, setState] = useState<{ have: number; all: number } | null>(null)
  const [busy, setBusy] = useState<AbortController | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (canOffline()) offlineCount(meta.id, toc).then(setState).catch(() => {})
  }, [meta.id, toc])
  if (!canOffline() || !state) return null
  const full = state.have >= state.all
  const start = async () => {
    const ctl = new AbortController()
    setBusy(ctl)
    setErr(false)
    try {
      await downloadBook(meta.id, toc, (have, all) => setState({ have, all }), ctl.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setErr(true)
    }
    setBusy(null)
  }
  return (
    <div className="offline-box">
      {busy ? (
        <>
          <div className="offline-bar" role="progressbar" aria-label="پیشرفت دانلود" aria-valuemin={0} aria-valuemax={state.all} aria-valuenow={state.have}>
            <i style={{ width: `${(state.have / state.all) * 100}%` }} />
          </div>
          <span>در حال ذخیره: {fa(Math.round((state.have / state.all) * 100))}٪</span>
          <button className="link-btn" onClick={() => busy.abort()}>
            لغو
          </button>
        </>
      ) : full ? (
        <>
          <span className="offline-ok">{Icon.check} این کتاب برای خواندن بدون اینترنت ذخیره شده است.</span>
          <button className="link-btn" onClick={() => removeBook(meta.id, toc).then(() => setState({ have: 0, all: state.all }))}>
            پاک کردن از دستگاه
          </button>
        </>
      ) : (
        <>
          <button className="btn btn-ghost" onClick={start}>
            {Icon.download} دانلود برای خواندن بدون اینترنت ({mb(toc.bytes)})
          </button>
          {state.have > 0 && (
            <small>
              {fa(state.have)} از {fa(state.all)} بخش ذخیره شده
            </small>
          )}
          {err && <small className="warn-text">دانلود کامل نشد؛ دوباره امتحان کن.</small>}
        </>
      )}
    </div>
  )
}

/* ───────── فهرست باب‌ها (صفحهٔ کتاب، برگهٔ فهرست و ستون کناری) ───────── */
function TocList({ meta, toc, q = '', current, onPick }: { meta: BookMeta; toc: Toc; q?: string; current?: [number, number]; onPick: (sec: number, ch: number) => void }) {
  const { p } = useStore()
  const read = new Set(p.readCh?.[meta.id] ?? [])
  const k = norm(q.trim())
  // «ترجمه» فقط وقتی نشان داده می‌شود که بعضی باب‌ها ترجمه ندارند
  const mixed = meta.translated > 0 && meta.translated < meta.count
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // باب فعلی در فهرست کناری و برگهٔ فهرست دیده شود (فقط خود فهرست اسکرول می‌شود)
    const el = list.current?.querySelector<HTMLElement>('[aria-current]')
    const box = el?.closest<HTMLElement>('.reader-aside, .sheet-toc')
    if (el && box) box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientHeight / 2
  }, [current?.[0], current?.[1]])
  return (
    <div ref={list}>
      {toc.sections.map((s, si) => {
        const chs = s.chapters.map((c, ci) => [c, ci] as const).filter(([c]) => !k || norm(`${c.t} ${c.ta ?? ''}`).includes(k))
        if (!chs.length) return null
        return (
          <section key={si} className="toc-sec">
            {s.t && <h2>{s.t}</h2>}
            <ol className="toc">
              {chs.map(([c, ci]) => {
                const here = current?.[0] === si && current[1] === ci
                const done = read.has(`${si}-${ci}`)
                return (
                  <li key={ci}>
                    <button onClick={() => onPick(si, ci)} aria-current={here ? 'true' : undefined} className={here ? 'here' : ''}>
                      <span className="toc-t">
                        {c.t || `بخش ${fa(ci + 1)}`}
                        {c.ta && c.ta !== c.t && <small lang={/[ً-ْ]/.test(c.ta) ? 'ar' : undefined}>{c.ta}</small>}
                      </span>
                      <span className="toc-n">
                        {done && (
                          <i className="toc-done" aria-label="خوانده شده">
                            {Icon.check}
                          </i>
                        )}
                        <span>{fa(c.n)}</span>
                        {mixed && c.tr ? <em>ترجمه</em> : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

/** صفحهٔ یک کتاب: معرفی، دانلود و فهرست */
export function BookToc({ meta, onClose }: { meta: BookMeta; onClose: () => void }) {
  const toc = useLoad(() => loadToc(meta.id), [meta.id])
  const { p } = useStore()
  const [q, setQ] = useState('')
  const all = toc.data?.sections.reduce((n, s) => n + s.chapters.length, 0) ?? 0
  const read = p.readCh?.[meta.id]?.length ?? 0

  return (
    <ReaderShell title={meta.title} onClose={onClose} tone={meta.shelf}>
      <div className="reader-body">
        <header className="book-cover">
          <Medallion className="cover-medallion" />
          <div className="eyebrow">{meta.author}</div>
          <h1>{meta.title}</h1>
          <p>{meta.desc}</p>
          <div className="book-facts">
            <span>{fa(meta.count)} متن</span>
            <span>{meta.translated >= meta.count ? 'ترجمهٔ کامل فارسی' : meta.translated ? `${fa(meta.translated)} متن با ترجمهٔ فارسی` : 'ترجمهٔ فارسی در دست تهیه'}</span>
            {meta.source && (
              <a href={meta.source} target="_blank" rel="noreferrer">
                منبع متن ↗
              </a>
            )}
          </div>
          {read > 0 && all > 0 && (
            <p className="read-count">
              {fa(read)} از {fa(all)} باب خوانده شده
            </p>
          )}
          {toc.data && <OfflineButton meta={meta} toc={toc.data} />}
        </header>
        <label className="lib-search">
          {Icon.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در عنوان بخش‌ها" aria-label="جست‌وجو در عنوان بخش‌ها" />
        </label>
        <Load r={toc} what="فهرست کتاب" skel={<Skeleton kind="list" rows={10} />}>
          {(t) => <TocList meta={meta} toc={t} q={q} onPick={(sec, ch) => go(href.chapter(meta.id, sec, ch))} />}
        </Load>
      </div>
    </ReaderShell>
  )
}

/* ───────── خواندن یک باب ───────── */
const STEP = 20

export function ChapterReader({ meta, sec, ch, focus, onClose }: { meta: BookMeta; sec: number; ch: number; focus?: number; onClose: () => void }) {
  const toc = useLoad(() => loadToc(meta.id), [meta.id])
  const chap = useLoad(() => loadChapter(meta.id, sec, ch), [meta.id, sec, ch])
  const [display] = useDisplay()
  const [showList, setShowList] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const { p, toggleMark, markRead } = useStore()
  const chapter = chap.data
  const flat = useMemo(() => toc.data?.sections.flatMap((s, si) => s.chapters.map((_, ci) => [si, ci] as const)) ?? [], [toc.data])
  const pos = flat.findIndex(([a, b]) => a === sec && b === ch)
  const section = toc.data?.sections[sec]
  const move = (to: readonly [number, number] | undefined) => to && go(href.chapter(meta.id, to[0], to[1]), true)

  // باب‌های بلند تکه‌تکه رسم می‌شوند: ۲۰ متن، و بقیه با رسیدن به پایین
  const [shown, setShown] = useState(STEP)
  const focusAt = chapter && focus !== undefined ? chapter.items.findIndex((x) => x.i === focus) : -1
  useEffect(() => setShown(Math.max(STEP, focusAt + 10)), [chapter, focusAt])

  useEffect(() => {
    const el = end.current
    if (!el || !chapter) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        if (shown < chapter.items.length) setShown((x) => x + STEP)
        // به آخر باب رسید: فقط نشانهٔ جای مطالعه، نه امتیاز
        else markRead(meta.id, sec, ch)
      },
      { root: scroller.current, rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [chapter, shown, meta.id, sec, ch, markRead])

  // ایستادن روی همان متن (از جست‌وجو، موضوع، نشان، یادداشت یا «ادامهٔ مطالعه») و پررنگ کردن یک لحظه‌ای آن
  useEffect(() => {
    if (!chapter) return
    const target = focus !== undefined ? scroller.current?.querySelector<HTMLElement>(`[data-i="${focus}"]`) : null
    if (target) {
      target.scrollIntoView({ block: 'start' })
      target.classList.remove('flash')
      void target.offsetWidth
      target.classList.add('flash')
    } else scroller.current?.scrollTo({ top: 0 })
    savePlace({ book: meta.id, title: meta.title, sec, ch, label: chapter.t, ...(focus !== undefined && { i: focus }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, focus])

  // «ادامهٔ مطالعه» جای دقیق را نگه می‌دارد: نخستین متنی که بالای صفحه است
  useEffect(() => {
    const el = scroller.current
    if (!el || !chapter) return
    let t: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const top = el.getBoundingClientRect().top + 90
        const first = [...el.querySelectorAll<HTMLElement>('[data-i]')].find((x) => x.getBoundingClientRect().bottom > top)
        if (first) savePlace({ book: meta.id, title: meta.title, sec, ch, label: chapter.t, i: Number(first.dataset.i) })
      }, 400)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => (el.removeEventListener('scroll', onScroll), clearTimeout(t))
  }, [chapter, meta, sec, ch])

  const anyFa = chapter?.items.some((i) => i.fa)
  const list = toc.data && <TocList meta={meta} toc={toc.data} current={[sec, ch]} onPick={(s, c) => (setShowList(false), go(href.chapter(meta.id, s, c), true))} />

  return (
    <ReaderShell
      title={chapter?.t ?? section?.chapters[ch]?.t ?? meta.title}
      sub={section ? `${meta.title}، ${fa(ch + 1)} از ${fa(section.chapters.length)}` : undefined}
      onTitle={toc.data ? () => setShowList(true) : undefined}
      prev={pos > 0 ? () => move(flat[pos - 1]) : null}
      next={pos >= 0 && pos < flat.length - 1 ? () => move(flat[pos + 1]) : null}
      onClose={onClose}
      tone={meta.shelf}
      scrollRef={scroller}
      aside={list}
    >
      <div className="reader-body">
        {chap.error ? (
          <LoadFail error={chap.error} retry={chap.retry} what="این باب" />
        ) : !chapter ? (
          <Skeleton kind="reader" rows={4} />
        ) : (
          <>
            <header className="chapter-head">
              <div className="eyebrow">{section?.t || meta.title}</div>
              <h1>{chapter.t}</h1>
              {chapter.ta && chapter.ta !== chapter.t && <p className={/[ً-ْ]/.test(chapter.ta) ? 'arabic' : ''}>{chapter.ta}</p>}
              <small>{fa(chapter.items.length)} متن</small>
            </header>
            {chapter.items.slice(0, shown).map((it, k) => {
              const key = `b:${meta.id}:${it.i}`
              return (
                <TextBlock
                  key={it.i}
                  it={it}
                  n={k + 1}
                  ctx={{ key, title: `${meta.title}، ${chapter.t}`, source: `${meta.title}، ${chapter.t}`, shelf: meta.shelf, path: href.chapter(meta.id, sec, ch, it.i) }}
                  showAr={(display.showAr && anyFa) || !it.fa}
                  marked={p.marks.some((x) => x.key === key)}
                  onMark={() => toggleMark({ key, title: `${meta.title}، ${chapter.t}`, text: it.fa ?? it.ar })}
                />
              )
            })}
          </>
        )}
        <div ref={end} className="chunk-end" aria-hidden />
        {toc.data && chapter && shown >= chapter.items.length && (
          <nav className="reader-nav" aria-label="باب قبلی و بعدی">
            <button className="btn btn-ghost" disabled={pos <= 0} onClick={() => move(flat[pos - 1])}>
              {Icon.back} باب قبلی
            </button>
            <button className="btn btn-ghost" disabled={pos >= flat.length - 1} onClick={() => move(flat[pos + 1])}>
              باب بعدی {Icon.next}
            </button>
          </nav>
        )}
      </div>
      <Sheet open={showList} onClose={() => setShowList(false)} label={`فهرست ${meta.title}`}>
        <h3 className="h2 sheet-title">{meta.title}</h3>
        <div className="sheet-toc">{list}</div>
      </Sheet>
    </ReaderShell>
  )
}

/* ───────── یک متن ───────── */
type TextCtx = { key: string; title: string; source: string; shelf?: string; path: string }

// آغاز تکراری حکمت‌ها («قال (عليه السلام):») کم‌رنگ نشان داده می‌شود؛ خود متن دست نمی‌خورد
const H = '[\\u064B-\\u0652\\u0670]*'
const loose = (w: string) => [...w].map((c) => (c === ' ' ? '\\s+' : c + H)).join('')
const LEAD = new RegExp(`^(\\s*(?:[0-9٠-٩۰-۹]+\\s*[.\\-–]\\s*)?(?:${loose('و')})?${loose('قال')}\\s*\\(\\s*${loose('عليه السلام')}\\s*\\)\\s*:?\\s*)`)
const NUM = /^[\s۰-۹٠-٩0-9]+[.\-–]\s*/

function ArabicLead({ text }: { text: string }) {
  const m = text.match(LEAD)
  const lead = m?.[1] ?? ''
  const rest = text.slice(lead.length)
  const shownLead = lead.replace(NUM, '')
  return (
    <div className="arabic tb-ar" lang="ar" dir="rtl">
      {shownLead && <span className="ar-lead">{shownLead}</span>}
      {(lead ? rest : text.replace(NUM, '')).trim()}
    </div>
  )
}

/** واژه‌ها: با لمس هر واژه، معنی‌اش درست زیر همان واژه باز می‌شود و با لمس بیرون بسته می‌شود */
function Words({ words }: { words: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open === null) return
    const off = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('pointerdown', off)
    document.addEventListener('keydown', esc)
    return () => (document.removeEventListener('pointerdown', off), document.removeEventListener('keydown', esc))
  }, [open])
  return (
    <div className="tb-words" ref={box}>
      {words.map(([w, meaning], k) => (
        <span key={k} className="tb-word">
          <button className={open === k ? 'on' : ''} aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)} lang="ar">
            {w}
          </button>
          {open === k && (
            <span className="word-pop" role="tooltip">
              {meaning}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

/** یک بخش بازشونده زیر متن (شرح ساده، واژه‌ها، شرح عمیق‌تر…) */
function Fold({ title, open, onToggle, mark, children }: { title: string; open: boolean; onToggle: () => void; mark?: boolean; children: React.ReactNode }) {
  return (
    <section className={`fold ${open ? 'open' : ''}`}>
      <button className="fold-h" aria-expanded={open} onClick={onToggle}>
        <span>
          {title}
          {mark && <em> · پاسخ داده‌ای</em>}
        </span>
        <i aria-hidden="true">{open ? '−' : '+'}</i>
      </button>
      {open && <div className="fold-b">{children}</div>}
    </section>
  )
}

function TextBlock({ it, n, showAr, marked, onMark, ctx }: { it: Item; n: number; showAr: boolean; marked: boolean; onMark: () => void; ctx: TextCtx }) {
  const { p, setNote } = useStore()
  const [display] = useDisplay()
  const note = p.notes[ctx.key]
  const [writing, setWriting] = useState(false)
  // بخش‌های بازشونده؛ «شرح ساده» از اول باز است
  const [open, setOpen] = useState<Set<string>>(() => new Set(['gist']))
  const [menu, setMenu] = useState(false)
  const save = (patch: { note?: string; answer?: string }) => setNote(ctx.key, { title: ctx.title, text: it.sm ?? it.fa ?? it.ar, question: it.mr, ...patch })
  const full = display.mode === 'full'
  const toggle = (x: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (!n.delete(x)) n.add(x)
      return n
    })
  const plain = `${it.ar.replace(NUM, '')}\n\n${it.fa ?? ''}\n\n${ctx.source}`
  const url = shareUrl(ctx.path)

  const actions: [keyof typeof Icon, string, () => void][] = [
    ...(it.u ? ([['shield', 'سند: تطبیق با منبع', () => window.open(it.u, '_blank', 'noopener')]] as [keyof typeof Icon, string, () => void][]) : []),
    ...(it.fa ? ([['card', 'کارت تصویری برای فرستادن', () => shareCard({ ar: it.ar, gist: it.sm, fa: it.fa!, source: ctx.source, shelf: ctx.shelf })]] as [keyof typeof Icon, string, () => void][]) : []),
    ['pen', note?.note ? 'ویرایش یادداشت من' : 'یادداشت من', () => setWriting(true)],
    ['copy', 'رونوشت متن', () => copyText(plain, 'متن رونوشت شد')],
    ['link', 'هم‌رسانی پیوند', () => shareLink(url, ctx.title)],
    ['flag', 'رونوشت نشانی برای گزارش خطا', () => copyText(`${ctx.source}، شمارهٔ ${it.n ?? it.i}\n${url}`, 'نشانی متن رونوشت شد؛ همراه توضیح خطا بفرست')],
  ]

  return (
    <article className="text-block" data-i={it.i}>
      <div className="ayah-tools">
        <span className="ayah-badge">{fa(it.n ?? n)}</span>
        {it.g?.map(([by, v]) => (
          <span key={by} className={`chip ${/صحيح|حسن|موثق|معتبر/.test(v) ? 'ok' : 'warn'}`} title={`درجهٔ سند به نظر ${by}`}>
            {by}: {v}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        <MarkButton on={marked} onClick={onMark} />
        <button className="mini-btn" aria-label="کارهای دیگر با این متن" aria-haspopup="dialog" onClick={() => setMenu(true)}>
          {Icon.more}
        </button>
      </div>

      {showAr && (
        <div className="ms-frame">
          <ArabicLead text={it.v ?? it.ar} />
          {it.v && <small className="tb-vocal">اعراب از متن نهج‌البلاغه</small>}
        </div>
      )}

      {it.fa ? (
        <>
          <p className="tb-fa">{it.fa}</p>
          <div className="folds">
            {it.sm && (
              <Fold title="شرح ساده" open={open.has('gist')} onToggle={() => toggle('gist')}>
                <p>{it.sm}</p>
              </Fold>
            )}
            {!it.sm && it.nt && (
              <Fold title="توضیح" open={open.has('gist')} onToggle={() => toggle('gist')}>
                <p>{it.nt}</p>
              </Fold>
            )}
            {full && it.w?.length ? (
              <Fold title="واژه‌های کلیدی" open={open.has('words')} onToggle={() => toggle('words')}>
                <Words words={it.w} />
              </Fold>
            ) : null}
            {full && it.dp && (
              <Fold title="شرح عمیق‌تر" open={open.has('deep')} onToggle={() => toggle('deep')}>
                {it.dp.split(/\n+/).map((t, k) => (
                  <p key={k}>{t}</p>
                ))}
              </Fold>
            )}
            {full && it.mr && (
              <Fold title="از خودت بپرس" mark={!!note?.answer} open={open.has('mirror')} onToggle={() => toggle('mirror')}>
                <p>{it.mr}</p>
                <AutoText label="پاسخ من" className="tb-answer" value={note?.answer ?? ''} placeholder="پاسخ من… (فقط برای خودت ذخیره می‌شود)" onSave={(v) => save({ answer: v })} autoFocus={!note?.answer} />
              </Fold>
            )}
            <button className="ask-btn" onClick={() => askAbout({ title: `${ctx.title}، شمارهٔ ${fa(it.n ?? n)}`, ar: (it.v ?? it.ar).replace(NUM, ''), fa: it.fa, plain: it.sm ?? it.nt, deep: it.dp, words: it.w, source: ctx.source, url: it.u, path: ctx.path })}>
              {Icon.chat} بپرس از هوش مصنوعی
            </button>
          </div>
          {it.x?.length ? (
            <div className="tb-cross">
              {it.x.map(([b, s, c, i, label]) => (
                <button key={`${b}-${i}`} className="link-btn" onClick={() => go(href.chapter(b, s, c, i))}>
                  همین سخن در {b === 'ghurar' ? 'غررالحکم' : 'نهج‌البلاغه'}، {label} ←
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="tb-pending">ترجمهٔ فارسی این متن هنوز آماده نیست.</p>
      )}

      {(writing || note?.note) && (
        <div className="tb-mynote">
          <small>یادداشت من</small>
          <AutoText label="یادداشت من" value={note?.note ?? ''} autoFocus={writing && !note?.note} placeholder="هرچه از این متن فهمیدی یا می‌خواهی به یاد بماند…" onSave={(v) => save({ note: v })} />
        </div>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} label="کارها با این متن">
        <h3 className="h2 sheet-title">{ctx.title}</h3>
        <div className="action-list">
          {actions.map(([icon, label, run]) => (
            <button key={label} onClick={() => (setMenu(false), run())}>
              {Icon[icon]}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </article>
  )
}
