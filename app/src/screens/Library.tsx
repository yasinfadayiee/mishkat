import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { lessonById, lessons } from '../data/lessons'
import { library } from '../data/paths'
import type { Lesson } from '../data/types'
import { fa, useStore } from '../store'
import { LightDust, PageHero } from '../fx'
import { ArabicText, GradingChip, Icon } from '../ui'

type Book = (typeof library)[number]

const BOOK_ART: Record<string, string> = {
  quran: 'art/splash.webp',
  nahj: 'covers/c6.webp',
  kafi: 'covers/c1.webp',
  ghurar: 'covers/c3.webp',
  sahifa: 'covers/c5.webp',
  tuhaf: 'covers/c8.webp',
}

const inBook = (b: Book) =>
  lessons.filter((l) => (b.id === 'quran' ? l.source.kind === 'quran' : b.id === 'nahj' ? l.source.kind === 'nahj' : b.id === 'kafi' ? l.source.ref.startsWith('الکافی') : false))

// جست‌وجو بی‌توجه به نیم‌فاصله و ی/ک عربی
const norm = (t: string) =>
  t
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[‌\s]+/g, ' ')
    .toLowerCase()
const haystack = (l: Lesson) =>
  norm([l.title, l.subtitle, l.topic, l.source.translation, l.source.arabic, l.source.ref, l.source.speaker ?? '', l.sharh?.essence ?? ''].join(' '))

function TextCard({ l, n, openLesson }: { l: Lesson; n: number; openLesson: (id: string) => void }) {
  const { p } = useStore()
  const done = !!p.completed[l.id]
  return (
    <motion.article className="text-card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <header>
        <span className="tc-num">{fa(n)}</span>
        <span className="tc-speaker">{l.source.speaker ?? 'قرآن کریم'}</span>
        <span className="tc-topic">{l.topic}</span>
        {done && <span className="tc-done">{Icon.check}</span>}
      </header>
      <ArabicText kind={l.source.kind} text={l.source.arabic} className="tc-ar" />
      <p className="tc-fa">{l.source.translation}</p>
      {l.sharh && <p className="tc-essence">{l.sharh.essence}</p>}
      <footer>
        <span className="tc-chips">
          <span className="chip">{l.source.ref}</span>
          {l.source.grading && <GradingChip g={l.source.grading} />}
        </span>
        <button className="btn btn-gold" onClick={() => openLesson(l.id)}>
          {Icon.teacher} {l.sharh ? `شرح ${fa(l.sharh.parts.length)} جمله` : 'خواندن درس'}
        </button>
      </footer>
    </motion.article>
  )
}

export function Library({ openLesson }: { openLesson: (id: string) => void }) {
  const [book, setBook] = useState<Book | null>(null)
  const [q, setQ] = useState('')
  const { p } = useStore()
  const hits = useMemo(() => {
    const words = norm(q).trim().split(' ').filter(Boolean)
    if (!words.length) return null
    return lessons.filter((l) => {
      const h = haystack(l)
      return words.every((w) => h.includes(w))
    })
  }, [q])
  const saved = p.saved.map(lessonById).filter((l): l is Lesson => !!l)

  if (book) {
    const items = inBook(book)
    const read = items.filter((l) => p.completed[l.id]).length
    return (
      <div className="fade-up">
        <header className="book-hero">
          <div className="book-hero-art" style={{ backgroundImage: `url(${BOOK_ART[book.id]})` }} />
          <LightDust density={18} />
          <div className="book-hero-fade" />
          <button className="icon-btn book-back" onClick={() => setBook(null)} aria-label="بازگشت به کتابخانه">
            {Icon.back}
          </button>
          <div className="book-hero-text">
            <div className="eyebrow">کتابخانهٔ مشکات</div>
            <h1 className="h1">{book.title}</h1>
            <p>{book.note}</p>
            <div className="book-progress">
              <i>
                <b style={{ width: `${items.length ? (read / items.length) * 100 : 0}%` }} />
              </i>
              <span>
                {fa(read)} از {fa(items.length)} متن خوانده شده
              </span>
            </div>
          </div>
        </header>
        <div className="text-list">
          {items.map((l, k) => (
            <TextCard key={l.id} l={l} n={k + 1} openLesson={openLesson} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHero art="art/home-night.webp" eyebrow="کتابخانه" title={<>منابع اصیل، <span className="gold-text">به زبان امروز</span></>}>
        <p>هر متن، جمله‌به‌جمله شرح داده شده است؛ ساده برای تازه‌کار، عمیق برای اهل تأمل.</p>
      </PageHero>

      <label className="lib-search">
        {Icon.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`جست‌وجو میان ${fa(lessons.length)} متن: موضوع، واژه یا ترجمه`} />
        {q && (
          <button onClick={() => setQ('')} aria-label="پاک کردن">
            {Icon.close}
          </button>
        )}
      </label>

      {hits ? (
        <section className="section">
          <div className="section-head">
            <h2 className="h2">{hits.length ? `${fa(hits.length)} متن پیدا شد` : 'متنی پیدا نشد'}</h2>
          </div>
          {!hits.length && <p className="muted">واژهٔ دیگری امتحان کن؛ مثلاً «خشم»، «دوست»، «صبر» یا «زبان».</p>}
          <div className="text-list">
            {hits.map((l, k) => (
              <TextCard key={l.id} l={l} n={k + 1} openLesson={openLesson} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <div className="grid two" style={{ marginTop: 18 }}>
            {library.map((b, k) => {
              const count = inBook(b).length
              return (
                <motion.button
                  key={b.id}
                  className={`book-card ${b.ready ? '' : 'soon'}`}
                  disabled={!b.ready}
                  onClick={() => setBook(b)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: k * 0.06 }}
                >
                  <span className="book-art" style={{ backgroundImage: `url(${BOOK_ART[b.id]})` }} />
                  <span className="book-card-text">
                    <b>{b.title}</b>
                    <small>{b.note}</small>
                    {b.ready ? <span className="chip ok">{fa(count)} متن با شرح کامل</span> : <span className="chip">در حال آماده‌سازی</span>}
                  </span>
                  {b.ready && <span className="book-go">{Icon.next}</span>}
                </motion.button>
              )
            })}
          </div>

          {saved.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="h2">نشان‌شده‌های تو</h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {fa(saved.length)} درس
                </span>
              </div>
              <div className="saved-row">
                {saved.map((l) => (
                  <button key={l.id} className="saved-card" onClick={() => openLesson(l.id)}>
                    <span className="saved-art" style={{ backgroundImage: `url(${l.cover})` }} />
                    <b>{l.title}</b>
                    <small>{l.source.ref}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
