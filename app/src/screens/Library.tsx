import { m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { loadIndex, norm, type BookMeta, type Shelf } from '../books'
import { CHAPTERS, LESSONS as lessons, lessonCard as lessonById } from '../data/lesson-index'
import { Skeleton } from '../load'
import { TopicGrid } from './TopicGrid'
import { fa, useStore } from '../store'
import { Icon, Medallion } from '../ui'

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
export function Library({ openLesson, openBook, openQuran, openTopic, openSearch }: { openLesson: (id: string) => void; openBook: (b: BookMeta) => void; openQuran: () => void; openTopic: (id: string) => void; openSearch: (q: string) => void }) {
  const [idx, setIdx] = useState<{ shelves: Shelf[]; books: BookMeta[] } | null>(null)
  const [q, setQ] = useState('')
  const { p } = useStore()
  useEffect(() => {
    loadIndex().then(setIdx).catch(() => setIdx(null))
  }, [])
  const k = norm(q.trim())
  const books = (idx?.books ?? []).filter((b) => !k || norm(`${b.title} ${b.author} ${b.desc}`).includes(k))
  const saved = p.saved.map(lessonById).filter((l) => !!l)
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در نام کتاب‌ها؛ یا در متن‌ها" />
      </label>

      {k.length >= 2 && (
        <button className="card search-jump" onClick={() => openSearch(q)}>
          {Icon.search} جست‌وجوی «{q.trim()}» در متن همهٔ کتاب‌ها ←
        </button>
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
                <small>{l!.ref}</small>
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
                <m.button key={b.id} className="book-tile" data-shelf={b.shelf} onClick={() => (b.kind === 'quran' ? openQuran() : openBook(b))} whileHover={{ y: -3 }}>
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
                </m.button>
              ))}
            </div>
          </section>
        )
      })}
      {!idx && <Skeleton kind="list" rows={6} />}
    </div>
  )
}

