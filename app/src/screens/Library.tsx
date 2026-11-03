import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadBook, loadIndex, loadSearch, norm, savePlace, type Book, type BookMeta, type Chapter, type Hit, type Item, type Shelf } from '../books'
import { CHAPTERS, lessonById, lessons } from '../data/lessons'
import { MarkButton, ReaderShell } from '../reader'
import { shareCard } from '../share'
import { TopicGrid } from './Topics'
import { fa, useStore } from '../store'
import { ArabicText, Icon, Medallion } from '../ui'

const SPINE: Record<string, string> = {
  quran: 'spine-emerald',
  nahj: 'spine-gold',
  arbaa: 'spine-azure',
  saduq: 'spine-rose',
  other: 'spine-violet',
  sunni: 'spine-stone',
}

export type Open = { book: BookMeta; sec: number; ch: number } | null

/** کتابخانه: قفسه‌ها، درس‌نامه‌ها و جست‌وجو در عنوان کتاب‌ها */
export function Library({ openLesson, openBook, openQuran, openAt, openSurah, openTopic }: { openLesson: (id: string) => void; openBook: (b: BookMeta) => void; openQuran: () => void; openAt: (b: BookMeta, sec: number, ch: number) => void; openSurah: (n: number) => void; openTopic: (id: string) => void }) {
  const [idx, setIdx] = useState<{ shelves: Shelf[]; books: BookMeta[] } | null>(null)
  const [q, setQ] = useState('')
  const { p } = useStore()
  useEffect(() => {
    loadIndex().then(setIdx).catch(() => setIdx(null))
  }, [])
  const k = norm(q.trim())
  const books = (idx?.books ?? []).filter((b) => !k || norm(`${b.title} ${b.author} ${b.desc}`).includes(k))
  const saved = p.saved.map(lessonById).filter((l) => !!l)
  const [rows, setRows] = useState<Hit[] | null>(null)
  useEffect(() => {
    if (q.trim().length >= 2 && !rows) loadSearch().then(setRows).catch(() => setRows([]))
  }, [q, rows])
  // جست‌وجو در ترجمهٔ قرآن و متن‌های ترجمه‌شده؛ نمایه فقط با نخستین جست‌وجو بار می‌شود
  const hits = useMemo(() => {
    const words = k.split(' ').filter((w) => w.length > 1)
    if (!rows || !words.length) return []
    const found: Hit[] = []
    for (const r of rows) {
      const t = norm(r[4])
      if (words.every((w) => t.includes(w)) && found.push(r) >= 80) break
    }
    return found
  }, [rows, k])
  const titleOf = (id: string) => (id === 'quran' ? 'قرآن کریم' : (idx?.books.find((b) => b.id === id)?.title ?? id))

  return (
    <div className="fade-up">
      <header className="quiet-head">
        <div className="eyebrow">کتابخانه</div>
        <h1 className="h1">
          {idx ? `${fa(idx.books.length + 1)} کتاب، ${fa(idx.books.reduce((s, b) => s + b.count, 0))} متن` : 'کتابخانه'}
        </h1>
        <p className="muted">متن عربی هر کتاب کامل و از منبع است. ترجمهٔ فارسی و توضیح ساده، کتاب‌به‌کتاب افزوده می‌شود.</p>
      </header>
      <label className="lib-search">
        {Icon.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در کتاب‌ها و متن‌ها؛ مثلاً «صبر» یا «همسایه»" />
      </label>

      {k.length >= 2 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>در متن‌ها</h2>
            <small>{!rows ? 'در حال جست‌وجو…' : hits.length >= 80 ? 'بیش از ۸۰ نتیجه؛ واژهٔ دقیق‌تری بنویس' : `${fa(hits.length)} نتیجه در ترجمهٔ قرآن و متن‌های ترجمه‌شده`}</small>
          </div>
          <div className="marks">
            {hits.map((h) => (
              <button
                key={h.slice(0, 4).join(':')}
                className="mark-row"
                onClick={() => {
                  if (h[0] === 'quran') return openSurah(h[1])
                  const b = idx?.books.find((x) => x.id === h[0])
                  if (b) openAt(b, h[1], h[2])
                }}
              >
                <small>
                  {titleOf(h[0])} · {h[0] === 'quran' ? `سورهٔ ${fa(h[1])}، آیهٔ ${fa(h[3])}` : `متن ${fa(h[3])}`}
                </small>
                <p>{h[4].length > 240 ? `${h[4].slice(0, 240)}…` : h[4]}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {!k && <TopicGrid open={openTopic} />}

      {!k && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>درس‌نامه‌ها</h2>
            <small>شرح جمله‌به‌جملهٔ {fa(lessons.length)} متن برگزیده، در پنج موضوع</small>
          </div>
          <div className="lesson-shelf">
            {CHAPTERS.map((c) => (
              <div key={c.id} className="topic-card">
                <b>{c.title}</b>
                <small>{c.subtitle}</small>
                <ol>
                  {c.lessons.map((id) => {
                    const l = lessonById(id)
                    return (
                      l && (
                        <li key={id}>
                          <button onClick={() => openLesson(id)}>
                            <span>{l.title}</span>
                            {p.completed[id] && <i>{Icon.check}</i>}
                          </button>
                        </li>
                      )
                    )
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {saved.length > 0 && !k && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>درس‌نامه‌های نشان‌شده</h2>
          </div>
          <div className="saved-row">
            {saved.map((l) => (
              <button key={l!.id} className="saved-card" onClick={() => openLesson(l!.id)}>
                <span className="saved-art" style={{ backgroundImage: `url(${l!.cover})` }} />
                <b>{l!.title}</b>
                <small>{l!.source.ref}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {(idx?.shelves ?? []).map((s) => {
        const list = books.filter((b) => b.shelf === s.id)
        if (!list.length) return null
        return (
          <section key={s.id} className="shelf">
            <div className="shelf-head">
              <h2>{s.title}</h2>
              <small>{fa(list.length)} کتاب</small>
            </div>
            <div className="book-grid">
              {list.map((b) => (
                <motion.button key={b.id} className="book-tile" data-shelf={b.shelf} onClick={() => (b.kind === 'quran' ? openQuran() : openBook(b))} whileHover={{ y: -3 }}>
                  <span className={`book-spine ${SPINE[b.shelf]}`}>
                    <Medallion />
                    <span>{b.title}</span>
                  </span>
                  <span className="bt-text">
                    <b>{b.title}</b>
                    <small>{b.author}</small>
                    <span className="bt-meta">
                      {fa(b.count)} متن
                      {b.translated > 0 && <em>{b.translated >= b.count ? 'ترجمهٔ کامل' : `${fa(b.translated)} با ترجمه`}</em>}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        )
      })}
      {!idx && <p className="muted">در حال باز کردن کتابخانه…</p>}
    </div>
  )
}

/** فهرست یک کتاب */
export function BookToc({ meta, onClose, open }: { meta: BookMeta; onClose: () => void; open: (sec: number, ch: number) => void }) {
  const [book, setBook] = useState<Book | null>(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    loadBook(meta.id).then(setBook)
  }, [meta.id])
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
            <span>{meta.translated ? `${fa(meta.translated)} متن با ترجمهٔ فارسی` : 'ترجمهٔ فارسی در دست تهیه'}</span>
            {meta.source && (
              <a href={meta.source} target="_blank" rel="noreferrer">
                منبع متن ↗
              </a>
            )}
          </div>
        </header>
        <label className="lib-search">
          {Icon.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در عنوان بخش‌ها" />
        </label>
        {!book && <p className="muted center">در حال باز کردن کتاب…</p>}
        {book?.sections.map((s, si) => {
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
                        {c.ta && <small lang={/[ً-ْ]/.test(c.ta) ? 'ar' : undefined}>{c.ta}</small>}
                      </span>
                      <span className="toc-n">
                        {fa(c.items.length)}
                        {c.items.some((i) => i.fa) && <i>ترجمه</i>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </ReaderShell>
  )
}

/** خواندن یک باب */
export function ChapterReader({ meta, sec, ch, onClose, go }: { meta: BookMeta; sec: number; ch: number; onClose: () => void; go: (sec: number, ch: number) => void }) {
  const [book, setBook] = useState<Book | null>(null)
  const [showAr, setShowAr] = useState(true)
  const scroller = useRef<HTMLDivElement>(null)
  const { p, toggleMark } = useStore()
  useEffect(() => {
    loadBook(meta.id).then(setBook)
  }, [meta.id])
  const chapter: Chapter | undefined = book?.sections[sec]?.chapters[ch]
  const flat = useMemo(() => book?.sections.flatMap((s, si) => s.chapters.map((_, ci) => [si, ci] as const)) ?? [], [book])
  const pos = flat.findIndex(([a, b]) => a === sec && b === ch)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    if (chapter) savePlace({ book: meta.id, title: meta.title, sec, ch, label: chapter.t })
  }, [chapter, meta, sec, ch])

  const title = chapter ? `${meta.title} · ${chapter.t}` : meta.title
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
        {chapter && (
          <header className="chapter-head">
            <div className="eyebrow">{book?.sections[sec].t || meta.title}</div>
            <h1>{chapter.t}</h1>
            {chapter.ta && <p className={/[ً-ْ]/.test(chapter.ta) ? 'arabic' : ''}>{chapter.ta}</p>}
          </header>
        )}
        {chapter?.items.map((it, k) => (
          <TextBlock key={it.i} it={it} n={k + 1} ctx={{ key: `b:${meta.id}:${it.i}`, title: `${meta.title}، ${chapter.t}`, source: `${meta.title}، ${chapter.t}`, shelf: meta.shelf }} showAr={showAr || !it.fa} marked={p.marks.some((m) => m.key === `b:${meta.id}:${it.i}`)} onMark={() => toggleMark({ key: `b:${meta.id}:${it.i}`, title: `${meta.title}، ${chapter.t}`, text: it.fa ?? it.ar })} />
        ))}
        {book && (
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

function TextBlock({ it, n, showAr, marked, onMark, ctx }: { it: Item; n: number; showAr: boolean; marked: boolean; onMark: () => void; ctx: TextCtx }) {
  const { p, setNote } = useStore()
  const note = p.notes[ctx.key]
  const [writing, setWriting] = useState(false)
  const [word, setWord] = useState<number | null>(null)
  const save = (patch: { note?: string; answer?: string }) => setNote(ctx.key, { title: ctx.title, text: it.sm ?? it.fa ?? it.ar, question: it.mr, ...patch })
  return (
    <article className="text-block">
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
                <textarea className="tb-answer" rows={note?.answer ? 3 : 1} placeholder="پاسخ من… (فقط برای خودت ذخیره می‌شود)" defaultValue={note?.answer ?? ''} onBlur={(e) => e.target.value !== (note?.answer ?? '') && save({ answer: e.target.value })} />
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
            {showAr && <ArabicText kind="hadith" text={it.ar} className="tb-ar" />}
            <p className="tb-fa">{it.fa}</p>
          </div>
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
