import { loadIndex, type BookMeta } from '../books'
import { CHAPTERS, lessonCard } from '../data/lesson-index'
import { Load, Skeleton, useLoad } from '../load'
import { go, href } from '../router'
import { fa, useStore } from '../store'
import { Icon, Medallion } from '../ui'
import { TopicGrid } from './TopicGrid'

const SPINE: Record<string, string> = {
  quran: 'spine-emerald',
  nahj: 'spine-gold',
  arbaa: 'spine-azure',
  saduq: 'spine-rose',
  other: 'spine-violet',
  sunni: 'spine-stone',
}

const TABS = [
  ['', 'کتاب‌ها'],
  ['topics', 'موضوع‌ها'],
  ['lessons', 'درس‌نامه‌ها'],
] as const

/** وضع ترجمهٔ یک کتاب، کوتاه */
export const trLabel = (b: BookMeta) => (b.translated >= b.count ? 'ترجمهٔ کامل' : b.translated ? `${fa(b.translated)} از ${fa(b.count)} با ترجمه` : 'فقط متن عربی')

function BookTile({ b }: { b: BookMeta }) {
  return (
    <button className="book-tile" data-shelf={b.shelf} onClick={() => go(b.kind === 'quran' ? '/quran' : href.toc(b.id))}>
      <span className={`book-spine ${SPINE[b.shelf]}`}>
        <Medallion />
        <span>{b.title}</span>
      </span>
      <span className="bt-text">
        <b>{b.title}</b>
        <small>{b.author}</small>
        <span className="bt-meta">
          {fa(b.count)} متن
          {b.translated > 0 && <em>{trLabel(b)}</em>}
        </span>
      </span>
    </button>
  )
}

/** کتابخانه: کتاب‌ها، موضوع‌ها و درس‌نامه‌ها در سه زبانه */
export function Library({ sub }: { sub?: string }) {
  const idx = useLoad(loadIndex, [])
  const { p } = useStore()
  const tab = sub === 'topics' || sub === 'lessons' ? sub : ''
  const books = idx.data?.books ?? []
  const translated = books.filter((b) => b.translated > 0)
  const full = books.filter((b) => b.translated >= b.count).length
  const arabicOnly = books.filter((b) => !b.translated)
  const saved = p.saved.map(lessonCard).filter((l) => !!l)

  return (
    <div className="fade-up">
      <header className="quiet-head" data-art="library">
        <div className="eyebrow">کتابخانه</div>
        <h1 className="h1">{idx.data ? `${fa(books.length)} کتاب، ${fa(full)} با ترجمهٔ کامل` : 'کتابخانه'}</h1>
        <p className="muted">متن عربی همهٔ کتاب‌ها کامل و از منبع است. ترجمهٔ فارسی و توضیح ساده کتاب‌به‌کتاب افزوده می‌شود.</p>
      </header>
      <button className="lib-search search-btn" onClick={() => go('/search')}>
        {Icon.search}
        <span>جست‌وجو در متن همهٔ کتاب‌ها</span>
        <kbd aria-hidden>/</kbd>
      </button>
      <div className="seg-tabs" role="tablist" aria-label="بخش‌های کتابخانه">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => go(id ? `/library/${id}` : '/library', true)}>
            {label}
          </button>
        ))}
      </div>

      {tab === '' && (
        <Load r={idx} what="کتابخانه" skel={<Skeleton kind="list" rows={6} />}>
          {() => (
            <>
              <section className="shelf">
                <div className="shelf-head">
                  <h2>با ترجمهٔ فارسی</h2>
                  <small>{fa(translated.length)} کتاب</small>
                </div>
                <div className="book-grid">
                  {translated.map((b) => (
                    <BookTile key={b.id} b={b} />
                  ))}
                </div>
              </section>
              <details className="shelf arabic-shelf">
                <summary>
                  <span>
                    <b>فقط متن عربی</b>
                    <small>ترجمه در راه است؛ {fa(arabicOnly.length)} کتاب</small>
                  </span>
                  <i>{Icon.next}</i>
                </summary>
                {(idx.data?.shelves ?? []).map((s) => {
                  const list = arabicOnly.filter((b) => b.shelf === s.id)
                  if (!list.length) return null
                  return (
                    <div key={s.id} className="sub-shelf">
                      <h3>{s.title}</h3>
                      <div className="book-grid">
                        {list.map((b) => (
                          <BookTile key={b.id} b={b} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </details>
            </>
          )}
        </Load>
      )}

      {tab === 'topics' && <TopicGrid open={(id) => go(href.topic(id))} />}

      {tab === 'lessons' && (
        <>
          {saved.length > 0 && (
            <section className="shelf">
              <div className="shelf-head">
                <h2>درس‌نامه‌های نشان‌شده</h2>
              </div>
              <div className="saved-row">
                {saved.map((l) => (
                  <button key={l!.id} className="saved-card" onClick={() => go(href.lesson(l!.id))}>
                    <span className="saved-art" style={{ backgroundImage: `url(${l!.cover})` }} />
                    <b>{l!.title}</b>
                    <small>{l!.ref}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="shelf">
            <div className="shelf-head">
              <h2>درس‌نامه‌ها</h2>
              <small>شرح جمله‌به‌جملهٔ {fa(CHAPTERS.reduce((n, c) => n + c.lessons.length, 0))} متن برگزیده، در پنج موضوع</small>
            </div>
            <div className="lesson-shelf">
              {CHAPTERS.map((c) => (
                <div key={c.id} className="topic-card">
                  <b>{c.title}</b>
                  <small>{c.subtitle}</small>
                  <ol>
                    {c.lessons.map((id) => {
                      const l = lessonCard(id)
                      return (
                        l && (
                          <li key={id}>
                            <button onClick={() => go(href.lesson(id))}>
                              <span>{l.title}</span>
                              {p.completed[id] && <i aria-label="خوانده شده">{Icon.check}</i>}
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
        </>
      )}
    </div>
  )
}
