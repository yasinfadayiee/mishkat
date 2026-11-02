import { motion } from 'framer-motion'
import { useState } from 'react'
import { lessons } from '../data/lessons'
import { library } from '../data/paths'
import { useStore } from '../store'
import { PageHero } from '../fx'
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

export function Library({ openLesson }: { openLesson: (id: string) => void }) {
  const [book, setBook] = useState<Book | null>(null)
  const { p } = useStore()

  if (book) {
    const items = inBook(book)
    return (
      <div className="fade-up">
        <button className="btn btn-quiet" onClick={() => setBook(null)} style={{ paddingRight: 0 }}>
          {Icon.back} کتابخانه
        </button>
        <h1 className="h1">{book.title}</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          {book.note}
        </p>
        <div style={{ maxWidth: 820 }}>
          {items.map((l, k) => (
            <motion.div key={l.id} className="card reader-item" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.06 }}>
              {l.source.speaker && <div className="speaker">{l.source.speaker}</div>}
              <ArabicText kind={l.source.kind} text={l.source.arabic} />
              <p style={{ margin: 0, color: 'var(--ink-2)' }}>{l.source.translation}</p>
              <div className="source-line" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip">{l.source.ref}</span>
                  {l.source.grading && <GradingChip g={l.source.grading} />}
                </span>
                <button className="btn btn-gold" style={{ padding: '9px 16px', fontSize: 14 }} onClick={() => openLesson(l.id)}>
                  {Icon.teacher} {p.completed[l.id] ? 'مرور با معلم' : 'برایم توضیح بده'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHero art="art/home-night.webp" eyebrow="کتابخانه" title={<>منابع اصیل، <span className="gold-text">به زبان امروز</span></>}>
        <p>متن اصلی را بخوان و هرجا خواستی بزن «برایم توضیح بده» تا معلم، جمله‌به‌جمله و با مثال همراهت شود.</p>
      </PageHero>
      <div className="grid two" style={{ marginTop: 18 }}>
        {library.map((b, k) => (
          <motion.button
            key={b.id}
            className="card"
            disabled={!b.ready}
            onClick={() => setBook(b)}
            style={{ padding: 22, textAlign: 'right', opacity: b.ready ? 1 : 0.55, display: 'flex', gap: 16, alignItems: 'center' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: b.ready ? 1 : 0.55, y: 0 }}
            transition={{ delay: k * 0.06 }}
          >
            <span className="book-art" style={{ backgroundImage: `url(${BOOK_ART[b.id]})` }} />
            <span style={{ flex: 1 }}>
              <b style={{ display: 'block', fontSize: 18 }}>{b.title}</b>
              <small className="muted">{b.note}</small>
              <div style={{ marginTop: 8 }}>
                {b.ready ? <span className="chip ok">{inBook(b).length.toLocaleString('fa-IR')} درس آماده</span> : <span className="chip">به‌زودی</span>}
              </div>
            </span>
          </motion.button>
        ))}
      </div>
    </>
  )
}
