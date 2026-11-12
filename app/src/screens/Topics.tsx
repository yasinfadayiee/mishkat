import { useEffect, useMemo, useState } from 'react'
import { loadIndex, loadTopic, type BookMeta } from '../books'
import { LoadFail, Skeleton, useLoad } from '../load'
import { TOPICS } from '../data/topics'
import { ReaderShell } from '../reader'
import { fa } from '../store'
import { Medallion } from '../ui'

type Row = { book: string; sec: number; ch: number; i: number; n: number; fa: string; sm: string }

/** صفحهٔ یک موضوع: همهٔ متن‌های مرتبط، به ترتیبِ قرآن، نهج‌البلاغه، غرر و بقیه */
export function TopicReader({ id, onClose, openAt, openSurah }: { id: string; onClose: () => void; openAt: (b: BookMeta, sec: number, ch: number, focus?: number) => void; openSurah: (n: number, ayah?: number) => void }) {
  const topic = TOPICS.find((t) => t.id === id)!
  const [books, setBooks] = useState<BookMeta[]>([])
  const r = useLoad(() => loadTopic(id), [id])
  const [more, setMore] = useState<Record<string, boolean>>({})
  useEffect(() => {
    loadIndex()
      .then((x) => setBooks(x.books))
      .catch(() => {})
  }, [])
  const rows: Row[] | null = useMemo(() => r.data?.rows.map(([book, sec, ch, i, n, f, sm]) => ({ book, sec, ch, i, n, fa: f, sm })) ?? null, [r.data])
  const total = (b: string) => r.data?.count[b] ?? 0

  const groups = useMemo(() => {
    const order = ['quran', 'Nahj-al-Balagha-Radi', 'ghurar', 'sahifa', 'tuhaf']
    const g = new Map<string, Row[]>()
    for (const r of rows ?? []) g.set(r.book, [...(g.get(r.book) ?? []), r])
    return [...g.entries()].sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99) || b[1].length - a[1].length)
  }, [rows])
  const title = (b: string) => (b === 'quran' ? 'قرآن کریم' : (books.find((x) => x.id === b)?.title ?? b))
  const shelf = (b: string) => (b === 'quran' ? 'quran' : books.find((x) => x.id === b)?.shelf)

  return (
    <ReaderShell title={`موضوع: ${topic.name}`} onClose={onClose}>
      <div className="reader-body">
        <header className="topic-head">
          <Medallion className="cover-medallion" />
          <div className="eyebrow">{topic.group}</div>
          <h1>{topic.name}</h1>
          <p>{topic.line}</p>
          {rows && (
            <div className="topic-map">
              {groups.map(([b]) => (
                <button key={b} data-shelf={shelf(b)} onClick={() => document.getElementById(`t-${b}`)?.scrollIntoView({ behavior: 'smooth' })}>
                  {title(b)} <em>{fa(total(b))}</em>
                </button>
              ))}
            </div>
          )}
        </header>
        {r.error ? <LoadFail error={r.error} retry={r.retry} what="این موضوع" /> : null}
        {!rows && !r.error && <Skeleton kind="list" rows={6} />}
        {rows && !rows.length && <p className="muted center">هنوز متن ترجمه‌شده‌ای دربارهٔ این موضوع پیدا نشد.</p>}
        {groups.map(([b, list]) => {
          const shown = more[b] ? list.slice(0, 60) : list.slice(0, 6)
          return (
            <section key={b} id={`t-${b}`} className="topic-sec" data-shelf={shelf(b)}>
              <h2>
                {title(b)} <small>{fa(total(b))} متن</small>
              </h2>
              {shown.map((r) => (
                <button
                  key={`${r.sec}:${r.ch}:${r.i}`}
                  className="topic-item"
                  onClick={() => {
                    if (b === 'quran') return openSurah(r.sec, r.i)
                    const m = books.find((x) => x.id === b)
                    if (m) openAt(m, r.sec, r.ch, r.i)
                  }}
                >
                  {r.sm && <b>{r.sm}</b>}
                  <p>{r.fa.length > 260 ? `${r.fa.slice(0, 260)}…` : r.fa}</p>
                  <small>{b === 'quran' ? `آیهٔ ${fa(r.n)}` : r.n ? `شمارهٔ ${fa(r.n)}` : 'در کتاب'} ←</small>
                </button>
              ))}
              {list.length > 6 && !more[b] && (
                <button className="link-btn topic-more" onClick={() => setMore((x) => ({ ...x, [b]: true }))}>
                  {fa(Math.min(60, list.length) - 6)} متن دیگر ←
                </button>
              )}
            </section>
          )
        })}
      </div>
    </ReaderShell>
  )
}
