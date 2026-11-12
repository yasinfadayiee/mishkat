import { useEffect, useMemo, useRef, useState } from 'react'
import { loadChapter, loadToc, norm, savePlace, type BookMeta, type Item, type Toc } from '../books'
import { Load, LoadFail, Skeleton, useLoad } from '../load'
import { canOffline, downloadBook, mb, offlineCount, removeBook } from '../offline'
import { MarkButton, ReaderShell } from '../reader'
import { shareCard } from '../share'
import { fa, useStore } from '../store'
import { ArabicText, Icon, Medallion } from '../ui'

/** دکمهٔ «دانلود برای خواندن بدون اینترنت»: حجم، پیشرفت و لغو */
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

/** فهرست یک کتاب */
export function BookToc({ meta, onClose, open }: { meta: BookMeta; onClose: () => void; open: (sec: number, ch: number) => void }) {
  const toc = useLoad(() => loadToc(meta.id), [meta.id])
  const [q, setQ] = useState('')
  const k = norm(q.trim())

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
          {toc.data && <OfflineButton meta={meta} toc={toc.data} />}
        </header>
        <label className="lib-search">
          {Icon.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در عنوان بخش‌ها" />
        </label>
        <Load r={toc} what="فهرست کتاب" skel={<Skeleton kind="list" rows={10} />}>
          {(book) => {
            // «ترجمه» فقط وقتی نشان داده می‌شود که بعضی باب‌ها ترجمه ندارند
            const mixed = meta.translated > 0 && meta.translated < meta.count
            return book.sections.map((s, si) => {
              const chs = s.chapters.map((c, ci) => [c, ci] as const).filter(([c]) => !k || norm(`${c.t} ${c.ta ?? ''}`).includes(k))
              if (!chs.length) return null
              return (
                <section key={si} className="toc-sec">
                  {s.t && <h2>{s.t}</h2>}
                  <ol className="toc">
                    {chs.map(([c, ci]) => (
                      <li key={ci}>
                        <button onClick={() => open(si, ci)}>
                          <span className="toc-t">
                            {c.t || `بخش ${fa(ci + 1)}`}
                            {c.ta && c.ta !== c.t && <small lang={/[ً-ْ]/.test(c.ta) ? 'ar' : undefined}>{c.ta}</small>}
                          </span>
                          <span className="toc-n">
                            {fa(c.n)}
                            {mixed && c.tr ? <i>ترجمه</i> : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              )
            })
          }}
        </Load>
      </div>
    </ReaderShell>
  )
}

/** خواندن یک باب */
export function ChapterReader({ meta, sec, ch, focus, onClose, go, openOther }: { meta: BookMeta; sec: number; ch: number; focus?: number; onClose: () => void; go: (sec: number, ch: number) => void; openOther?: (book: string, sec: number, ch: number, focus: number) => void }) {
  const toc = useLoad(() => loadToc(meta.id), [meta.id])
  const chap = useLoad(() => loadChapter(meta.id, sec, ch), [meta.id, sec, ch])
  const [showAr, setShowAr] = useState(true)
  const scroller = useRef<HTMLDivElement>(null)
  const { p, toggleMark } = useStore()
  const chapter = chap.data
  const flat = useMemo(() => toc.data?.sections.flatMap((s, si) => s.chapters.map((_, ci) => [si, ci] as const)) ?? [], [toc.data])
  const pos = flat.findIndex(([a, b]) => a === sec && b === ch)

  useEffect(() => {
    // از پیوند «همین سخن در…» آمده‌ایم: همان متن را نشان بده
    const target = focus !== undefined ? scroller.current?.querySelector<HTMLElement>(`[data-i="${focus}"]`) : null
    if (target) (target.scrollIntoView({ block: 'start' }), target.classList.add('flash'))
    else scroller.current?.scrollTo({ top: 0 })
    if (chapter) savePlace({ book: meta.id, title: meta.title, sec, ch, label: chapter.t })
  }, [chapter, meta, sec, ch, focus])

  const title = chapter ? `${meta.title}، ${chapter.t}` : meta.title
  const anyFa = chapter?.items.some((i) => i.fa)

  return (
    <ReaderShell
      title={title}
      onClose={onClose}
      tone={meta.shelf}
      scrollRef={scroller}
      actions={
        anyFa ? (
          <button className={`mini-btn wide ${showAr ? 'on' : ''}`} onClick={() => setShowAr((x) => !x)}>
            عربی
          </button>
        ) : undefined
      }
    >
      <div className="reader-body">
        {chap.error ? (
          <LoadFail error={chap.error} retry={chap.retry} what="این باب" />
        ) : !chapter ? (
          <Skeleton kind="reader" rows={4} />
        ) : (
          <>
            <header className="chapter-head">
              <div className="eyebrow">{toc.data?.sections[sec]?.t || meta.title}</div>
              <h1>{chapter.t}</h1>
              {chapter.ta && chapter.ta !== chapter.t && <p className={/[ً-ْ]/.test(chapter.ta) ? 'arabic' : ''}>{chapter.ta}</p>}
            </header>
            {chapter.items.map((it, k) => (
              <TextBlock key={it.i} it={it} n={k + 1} openOther={openOther} ctx={{ key: `b:${meta.id}:${it.i}`, title: `${meta.title}، ${chapter.t}`, source: `${meta.title}، ${chapter.t}`, shelf: meta.shelf }} showAr={showAr || !it.fa} marked={p.marks.some((m) => m.key === `b:${meta.id}:${it.i}`)} onMark={() => toggleMark({ key: `b:${meta.id}:${it.i}`, title: `${meta.title}، ${chapter.t}`, text: it.fa ?? it.ar })} />
            ))}
          </>
        )}
        {toc.data && (
          <nav className="reader-nav">
            <button className="btn btn-ghost" disabled={pos <= 0} onClick={() => go(...flat[pos - 1])}>
              {Icon.back} قبلی
            </button>
            <button className="btn btn-ghost" disabled={pos >= flat.length - 1} onClick={() => go(...flat[pos + 1])}>
              بعدی {Icon.next}
            </button>
          </nav>
        )}
      </div>
    </ReaderShell>
  )
}

type TextCtx = { key: string; title: string; source: string; shelf?: string }

function TextBlock({ it, n, showAr, marked, onMark, ctx, openOther }: { it: Item; n: number; showAr: boolean; marked: boolean; onMark: () => void; ctx: TextCtx; openOther?: (book: string, sec: number, ch: number, focus: number) => void }) {
  const { p, setNote } = useStore()
  const note = p.notes[ctx.key]
  const [writing, setWriting] = useState(false)
  const [answering, setAnswering] = useState(false)
  const [word, setWord] = useState<number | null>(null)
  const save = (patch: { note?: string; answer?: string }) => setNote(ctx.key, { title: ctx.title, text: it.sm ?? it.fa ?? it.ar, question: it.mr, ...patch })
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
        {it.u && (
          <a className="mini-btn" href={it.u} target="_blank" rel="noreferrer" aria-label="تطبیق با منبع">
            {Icon.shield}
          </a>
        )}
        {it.fa && (
          <button className="mini-btn" aria-label="کارت تصویری برای فرستادن" onClick={() => shareCard({ ar: it.ar, gist: it.sm, fa: it.fa!, source: ctx.source, shelf: ctx.shelf })}>
            {Icon.share}
          </button>
        )}
        <button className={`mini-btn ${note?.note ? 'on' : ''}`} aria-label="یادداشت من" onClick={() => setWriting((x) => !x)}>
          {Icon.pen}
        </button>
        <MarkButton on={marked} onClick={onMark} />
      </div>
      {it.fa ? (
        <>
          {it.sm && (
            <div className="tb-gist">
              <small>یعنی چه؟</small>
              <p>{it.sm}</p>
            </div>
          )}
          {it.w && (
            <div className="tb-words">
              <small>واژه‌های کلیدی</small>
              <div>
                {it.w.map(([w], k) => (
                  <button key={k} className={word === k ? 'on' : ''} onClick={() => setWord(word === k ? null : k)}>
                    {w}
                  </button>
                ))}
              </div>
              {word !== null && it.w[word] && <p>{it.w[word][1]}</p>}
            </div>
          )}
          {it.dp ? (
            <details className="tb-deep" open={!it.sm}>
              <summary>
                <span>عمیق‌تر</span>
                <i>{Icon.next}</i>
              </summary>
              {it.dp.split(/\n+/).map((t, k) => (
                <p key={k}>{t}</p>
              ))}
            </details>
          ) : (
            it.nt && (
              <div className="tb-note">
                <b>توضیح</b>
                <p>{it.nt}</p>
              </div>
            )
          )}
          {it.mr && (
            <div className="tb-mirror">
              {Icon.life}
              <div>
                <p>{it.mr}</p>
                {/* جعبهٔ پاسخ فقط با لمس باز می‌شود تا صفحهٔ ۹۰ متنی شلوغ نشود */}
                {answering || note?.answer ? (
                  <textarea className="tb-answer" rows={3} autoFocus={answering && !note?.answer} placeholder="پاسخ من… (فقط برای خودت ذخیره می‌شود)" defaultValue={note?.answer ?? ''} onBlur={(e) => e.target.value !== (note?.answer ?? '') && save({ answer: e.target.value })} />
                ) : (
                  <button className="link-btn tb-answer-open" onClick={() => setAnswering(true)}>
                    پاسخ من ←
                  </button>
                )}
              </div>
            </div>
          )}
          {(writing || note?.note) && (
            <div className="tb-mynote">
              <small>یادداشت من</small>
              <textarea rows={3} autoFocus={writing} placeholder="هرچه از این متن فهمیدی یا می‌خواهی به یاد بماند…" defaultValue={note?.note ?? ''} onBlur={(e) => e.target.value !== (note?.note ?? '') && save({ note: e.target.value })} />
            </div>
          )}
          <div className={`tb-source ${it.sm ? 'quiet' : ''}`}>
            {it.sm && <small>متن و ترجمهٔ دقیق</small>}
            {showAr && <ArabicText kind="hadith" text={it.v ?? it.ar} className="tb-ar" />}
            {showAr && it.v && <small className="tb-vocal">اعراب از متن نهج‌البلاغه</small>}
            <p className="tb-fa">{it.fa}</p>
          </div>
          {openOther && it.x?.length ? (
            <div className="tb-cross">
              {it.x.map(([b, s, c, i, label]) => (
                <button key={`${b}-${i}`} className="link-btn" onClick={() => openOther(b, s, c, i)}>
                  همین سخن در {b === 'ghurar' ? 'غررالحکم' : 'نهج‌البلاغه'}، {label} ←
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <>
          {showAr && <ArabicText kind="hadith" text={it.ar} className="tb-ar" />}
          <p className="tb-pending">ترجمهٔ فارسی این متن هنوز آماده نیست.</p>
        </>
      )}
    </article>
  )
}
