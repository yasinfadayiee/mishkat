import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadIndex, type BookMeta } from '../books'
import { useSearch, type SearchHit } from '../search'
import { go, href } from '../router'
import { fa } from '../store'
import { Icon } from '../ui'

const RECENT = 'mishkat.recentSearch'
const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT) ?? '[]')
  } catch {
    return []
  }
}
const saveRecent = (q: string) => {
  try {
    localStorage.setItem(RECENT, JSON.stringify([q, ...readRecent().filter((x) => x !== q)].slice(0, 8)))
  } catch {
    /* بدون ذخیره */
  }
}

// هر حرف با شکل‌های عربی و فارسی‌اش، و اعراب یا نیم‌فاصلهٔ احتمالی میان حرف‌ها
const VARIANTS: Record<string, string> = { ی: 'یيىئ', ک: 'کك', ا: 'اأإآٱ', ه: 'هةۀ', و: 'وؤ' }
const esc = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const fold = (w: string) =>
  [...w]
    .map((c) => (VARIANTS[c] ? `[${VARIANTS[c]}]` : esc(c)))
    .join('[\\u064B-\\u0670\\u06D6-\\u06ED\\u0640\\u200c]*')

/** واژه‌های جست‌وجوشده را در متن پررنگ می‌کند */
export function Highlight({ text, words }: { text: string; words: string[] }) {
  const re = useMemo(() => (words.length ? new RegExp(`(${words.map(fold).join('|')})`, 'gi') : null), [words])
  if (!re) return <>{text}</>
  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<mark key={m.index}>{m[0]}</mark>)
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}

/** تکه‌ای از متن بلند که واژهٔ جست‌وجوشده در آن است */
const snippet = (t: string, words: string[], len = 240) => {
  if (t.length <= len) return t
  const at = words.length ? t.search(new RegExp(words.map(fold).join('|'), 'i')) : -1
  const start = Math.max(0, at - 60)
  return `${start > 0 ? '…' : ''}${t.slice(start, start + len)}…`
}

const MAIN = ['quran', 'Nahj-al-Balagha-Radi', 'ghurar']

/** صفحهٔ جست‌وجو: نتیجه‌ها کتاب‌به‌کتاب با تعداد هر گروه، فیلتر کتاب و جست‌وجوهای اخیر */
export function SearchPage({ initial = '' }: { initial?: string }) {
  const open = (h: SearchHit) => go(h.book === 'quran' ? href.surah(h.sec, h.i) : href.chapter(h.book, h.sec, h.ch, h.i))
  const [q, setQ] = useState(initial)
  const [books, setBooks] = useState<BookMeta[]>([])
  const [only, setOnly] = useState<string | null>(null)
  const [more, setMore] = useState<Record<string, boolean>>({})
  const [recent, setRecent] = useState(readRecent)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    loadIndex()
      .then((x) => setBooks(x.books))
      .catch(() => {})
    input.current?.focus()
  }, [])
  // پیش‌فرض: قرآن و همهٔ کتاب‌های دارای ترجمه؛ کتاب‌های فقط عربی با انتخاب
  const translated = books.filter((b) => b.kind === 'book' && b.translated > 0)
  const arabicOnly = books.filter((b) => b.kind === 'book' && !b.translated)
  const scope = only ? [only] : ['quran', ...translated.map((b) => b.id)]
  const res = useSearch(books.length ? q : '', scope)
  const words = useMemo(
    () =>
      q
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 1),
    [q],
  )
  const title = (id: string) => (id === 'quran' ? 'قرآن کریم' : (books.find((b) => b.id === id)?.title ?? id))
  const order = (id: string) => (MAIN.indexOf(id) + 1 || 9)
  const groups = Object.entries(res?.hits ?? {}).sort((a, b) => order(a[0]) - order(b[0]))
  const total = Object.values(res?.counts ?? {}).reduce((s, n) => s + n, 0)

  // واژهٔ جست‌وجو در نشانی می‌ماند تا با «بازگشت» از یک نتیجه، همین فهرست دوباره بیاید
  useEffect(() => {
    const t = setTimeout(() => go(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search', true), 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!res?.done || !total) return
    const t = setTimeout(() => (saveRecent(q.trim()), setRecent(readRecent())), 1200)
    return () => clearTimeout(t)
  }, [res?.done, total, q])

  const place = (h: SearchHit) => (h.book === 'quran' ? `سورهٔ ${h.place}، آیهٔ ${fa(h.i)}` : `${h.place}${h.n ? `، شمارهٔ ${fa(h.n)}` : ''}`)

  return (
    <div className="search-page fade-up">
      <header className="quiet-head">
        <div className="eyebrow">جست‌وجو</div>
        <h1 className="h1">در همهٔ کتاب‌ها</h1>
      </header>
      <label className="lib-search big">
        {Icon.search}
        <input ref={input} type="search" value={q} onChange={(e) => (setQ(e.target.value), setMore({}))} placeholder="واژه‌ای فارسی یا عربی؛ مثلاً «صبر» یا «الصبر»" aria-label="جست‌وجو" />
        {q && (
          <button className="clear-btn" onClick={() => setQ('')} aria-label="پاک کردن">
            {Icon.close}
          </button>
        )}
      </label>
      <div className="filter-row" role="group" aria-label="فیلتر کتاب">
        <button className={!only ? 'on' : ''} onClick={() => setOnly(null)} aria-pressed={!only}>
          همهٔ کتاب‌های ترجمه‌شده
        </button>
        {['quran', ...translated.map((b) => b.id)].map((id) => (
          <button key={id} className={only === id ? 'on' : ''} onClick={() => setOnly(id)} aria-pressed={only === id}>
            {title(id)}
            {res?.counts[id] !== undefined && !only && <em>{fa(res.counts[id])}</em>}
          </button>
        ))}
        {arabicOnly.length > 0 && (
          <select value={arabicOnly.some((b) => b.id === only) ? (only ?? '') : ''} onChange={(e) => setOnly(e.target.value || null)} aria-label="کتاب‌های فقط عربی">
            <option value="">کتاب‌های فقط عربی…</option>
            {arabicOnly.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {q.trim().length < 2 ? (
        recent.length > 0 && (
          <section className="recent">
            <small>جست‌وجوهای اخیر</small>
            <div>
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)}>
                  {r}
                </button>
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          <p className="search-status" aria-live="polite">
            {!res || !res.done ? 'در حال گشتن…' : total ? `${fa(total)} نتیجه در ${fa(groups.length)} کتاب` : 'نتیجه‌ای پیدا نشد. واژهٔ دیگری امتحان کن، یا کتاب دیگری را انتخاب کن.'}
            {res?.failed.length ? ` (${fa(res.failed.length)} کتاب بدون اینترنت گشته نشد)` : ''}
          </p>
          {groups.map(([id, list]) => {
            const shown = more[id] ? list : list.slice(0, 5)
            const meta = books.find((b) => b.id === id)
            return (
              <section key={id} className="search-group" data-shelf={id === 'quran' ? 'quran' : meta?.shelf}>
                <h2>
                  {title(id)} <small>{fa(res!.counts[id])} نتیجه</small>
                </h2>
                <div className="marks">
                  {shown.map((h) => (
                    <button key={`${h.sec}:${h.ch}:${h.i}`} className="mark-row" onClick={() => open(h)}>
                      <small>{place(h)}</small>
                      {h.ar ? (
                        <p className="arabic" lang="ar">
                          <Highlight text={snippet(h.ar, words)} words={words} />
                        </p>
                      ) : (
                        <p>
                          <Highlight text={snippet(h.fa, words)} words={words} />
                        </p>
                      )}
                    </button>
                  ))}
                </div>
                {list.length > shown.length && (
                  <button className="link-btn topic-more" onClick={() => setMore((x) => ({ ...x, [id]: true }))}>
                    {fa(list.length - shown.length)} نتیجهٔ دیگر ←
                  </button>
                )}
                {res!.counts[id] > list.length && more[id] && <small className="muted">{fa(list.length)} نتیجهٔ اول نشان داده شد؛ واژهٔ دقیق‌تری بنویس.</small>}
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
