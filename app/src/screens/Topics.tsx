import { useEffect, useMemo, useState } from 'react'
import { loadIndex, loadSearch, loadTopics, norm, type BookMeta, type TopicHit } from '../books'
import { TOPICS, type Topic } from '../data/topics'
import { ReaderShell } from '../reader'
import { fa } from '../store'
import { Medallion } from '../ui'

/** فهرست موضوع‌ها، گروه‌گروه (در کتابخانه) */
export function TopicGrid({ open }: { open: (id: string) => void }) {
  const groups = [...new Set(TOPICS.map((t) => t.group))]
  return (
    <section className="shelf topic-shelf">
      <div className="shelf-head">
        <h2>یک موضوع، از همهٔ کتاب‌ها</h2>
        <small>قرآن، نهج‌البلاغه، غرر و کتاب‌های حدیث، کنار هم</small>
      </div>
      {groups.map((g) => (
        <div key={g} className="topic-group">
          <b>{g}</b>
          <div className="topic-chips">
            {TOPICS.filter((t) => t.group === g).map((t) => (
              <button key={t.id} onClick={() => open(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

type Row = { book: string; sec: number; ch: number; n: number; fa: string; sm: string; score: number }

// جست‌وجوی کلیدواژه فقط در آغاز واژه، تا «مال» در «کمال» پیدا نشود
const keyRe = (t: Topic) => new RegExp(`(^|[\\s«(،؛:.])(${t.keys.map((k) => norm(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')

/** صفحهٔ یک موضوع: همهٔ متن‌های مرتبط، به ترتیبِ قرآن، نهج‌البلاغه، غرر و بقیه */
export function TopicReader({ id, onClose, openAt, openSurah }: { id: string; onClose: () => void; openAt: (b: BookMeta, sec: number, ch: number) => void; openSurah: (n: number) => void }) {
  const topic = TOPICS.find((t) => t.id === id)!
  const [books, setBooks] = useState<BookMeta[]>([])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [more, setMore] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadIndex().then((x) => setBooks(x.books))
    Promise.all([loadSearch(), loadTopics().catch(() => ({}) as Record<string, TopicHit[]>)]).then(([search, tags]) => {
      const re = keyRe(topic)
      const seen = new Set<string>()
      const out: Row[] = []
      // اول متن‌هایی که برچسب همین موضوع را دارند، بعد هر متنی که کلیدواژه‌اش در ترجمه آمده
      for (const [book, sec, ch, n, f, sm] of tags[id] ?? []) {
        seen.add(`${book}:${sec}:${ch}:${n}`)
        out.push({ book, sec, ch, n, fa: f, sm, score: 100 })
      }
      for (const [book, sec, ch, n, f] of search) {
        const key = `${book}:${sec}:${ch}:${n}`
        if (seen.has(key)) continue
        const hits = norm(f).match(re)?.length ?? 0
        // متن کوتاه که موضوعش همین است بر متن بلندی که گذرا اشاره کرده برتری دارد
        if (hits) out.push({ book, sec, ch, n, fa: f, sm: '', score: hits * 10 - Math.min(9.5, f.length / 50) })
      }
      setRows(out.sort((a, b) => b.score - a.score))
    })
  }, [id, topic])

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
              {groups.map(([b, list]) => (
                <a key={b} href={`#t-${b}`} data-shelf={shelf(b)}>
                  {title(b)} <em>{fa(list.length)}</em>
                </a>
              ))}
            </div>
          )}
        </header>
        {!rows && <p className="muted center">در حال گشتن در همهٔ کتاب‌ها…</p>}
        {rows && !rows.length && <p className="muted center">هنوز متن ترجمه‌شده‌ای دربارهٔ این موضوع پیدا نشد.</p>}
        {groups.map(([b, list]) => {
          const shown = more[b] ? list.slice(0, 60) : list.slice(0, 6)
          return (
            <section key={b} id={`t-${b}`} className="topic-sec" data-shelf={shelf(b)}>
              <h2>
                {title(b)} <small>{fa(list.length)} متن</small>
              </h2>
              {shown.map((r) => (
                <button
                  key={`${r.sec}:${r.ch}:${r.n}`}
                  className="topic-item"
                  onClick={() => {
                    if (b === 'quran') return openSurah(r.sec)
                    const m = books.find((x) => x.id === b)
                    if (m) openAt(m, r.sec, r.ch)
                  }}
                >
                  {r.sm && <b>{r.sm}</b>}
                  <p>{r.fa.length > 260 ? `${r.fa.slice(0, 260)}…` : r.fa}</p>
                  <small>{b === 'quran' ? `سورهٔ ${fa(r.sec)}، آیهٔ ${fa(r.n)}` : `متن ${fa(r.n)}`} ←</small>
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
