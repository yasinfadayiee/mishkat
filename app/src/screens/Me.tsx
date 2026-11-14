import { useEffect, useMemo, useRef, useState } from 'react'
import { AutoText } from '../autotext'
import { parseBackup, persistStorage, restoreBackup, saveBackup } from '../backup'
import { loadIndex, norm } from '../books'
import { lessonCard } from '../data/lesson-index'
import { exportNotes } from '../export-notes'
import { DisplaySettings } from '../display'
import { canRemind, scheduleReminders } from '../reminder'
import { go, href } from '../router'
import { fa, useStore, type ThemeId } from '../store'
import { Icon } from '../ui'
import { VERSION } from '../version'

const THEMES: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: 'paper', name: 'کاغذی گرم', colors: ['#fbf6ea', '#1f3f73', '#855a0c'] },
  { id: 'white', name: 'سفید خنثی', colors: ['#ffffff', '#0f5b55', '#76560f'] },
  { id: 'sage', name: 'سبز ملایم', colors: ['#f1f5ee', '#0b5560', '#7a3e1d'] },
]

/** کتابِ یک کلید (q:… یا b:کتاب:…) */
const bookOf = (key: string) => (key.startsWith('q:') ? 'quran' : key.split(':')[1])
const when = (iso: string) => new Date(iso).toLocaleDateString('fa-IR')

/** دفتر من: یادداشت‌ها، نشان‌ها، دفتر درس‌نامه‌ها؛ با جست‌وجو، فیلتر کتاب، ویرایش و حذف */
export function Me({ openMark }: { openMark: (key: string) => void }) {
  const { p, set, setNote, toggleMark } = useStore()
  const [q, setQ] = useState('')
  const [book, setBook] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [titles, setTitles] = useState<Record<string, string>>({ quran: 'قرآن کریم' })
  useEffect(() => {
    loadIndex()
      .then((x) => setTitles(Object.fromEntries(x.books.map((b) => [b.id, b.title]))))
      .catch(() => {})
  }, [])
  const k = norm(q.trim())
  const match = (key: string, ...texts: (string | undefined)[]) => (!book || bookOf(key) === book) && (!k || norm(texts.join(' ')).includes(k))
  const notes = Object.entries(p.notes)
    .sort((a, b) => b[1].at.localeCompare(a[1].at))
    .filter(([key, n]) => match(key, n.title, n.text, n.note, n.answer))
  const marks = p.marks.filter((m) => match(m.key, m.title, m.text))
  const journal = book ? [] : p.journal.filter((j) => !k || norm(j.text).includes(k))
  const books = useMemo(() => [...new Set([...Object.keys(p.notes), ...p.marks.map((m) => m.key)].map(bookOf))], [p.notes, p.marks])
  const empty = !Object.keys(p.notes).length && !p.marks.length && !p.journal.length

  return (
    <div className="fade-up">
      <header className="quiet-head with-tool" data-art="notes">
        <div>
          <div className="eyebrow">دفتر من</div>
          <h1 className="h1">{p.name ? `دفتر ${p.name}` : 'دفتر من'}</h1>
          <p className="muted">
            {fa(Object.keys(p.notes).length)} یادداشت، {fa(p.marks.length)} نشان، {fa(p.journal.length)} نوشته در درس‌نامه‌ها
          </p>
        </div>
        <button className="icon-btn" onClick={() => go('/settings')} aria-label="تنظیمات">
          {Icon.gear}
        </button>
      </header>

      {empty ? (
        <div className="empty-state">
          <span className="es-icon">{Icon.pen}</span>
          <b>دفترت هنوز خالی است</b>
          <p>هنگام خواندن، هر متنی را که به دلت نشست با دکمهٔ نشان نگه دار، یا زیرش برای خودت یادداشت بنویس. همه این‌جا جمع می‌شود.</p>
          <button className="btn btn-gold" onClick={() => go(href.chapter('Nahj-al-Balagha-Radi', 2, 0))}>
            از این‌جا شروع کن: حکمت‌های نهج‌البلاغه ←
          </button>
        </div>
      ) : (
        <>
          <label className="lib-search">
            {Icon.search}
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجو در یادداشت‌ها و نشان‌ها" aria-label="جست‌وجو در دفتر" />
          </label>
          {books.length > 1 && (
            <div className="filter-row" role="group" aria-label="فیلتر کتاب">
              <button className={!book ? 'on' : ''} aria-pressed={!book} onClick={() => setBook(null)}>
                همه
              </button>
              {books.map((b) => (
                <button key={b} className={book === b ? 'on' : ''} aria-pressed={book === b} onClick={() => setBook(b)}>
                  {titles[b] ?? b}
                </button>
              ))}
            </div>
          )}

          {notes.length > 0 && (
            <section className="shelf">
              <div className="shelf-head">
                <h2>آنچه نوشته‌ام</h2>
                <small>پاسخ‌هایت به پرسش‌های آینه و یادداشت‌هایت روی متن‌ها</small>
              </div>
              <div className="marks">
                {notes.map(([key, n]) => (
                  <article key={key} className="mark-row my-note">
                    <button className="mr-open" onClick={() => openMark(key)}>
                      <small>
                        {n.title}، {when(n.at)}
                      </small>
                      <p className="mn-text">{n.text.length > 160 ? `${n.text.slice(0, 160)}…` : n.text}</p>
                    </button>
                    {editing === key ? (
                      <div className="mn-edit">
                        {(n.note !== undefined || !n.answer) && <AutoText label="یادداشت من" value={n.note ?? ''} onSave={(v) => setNote(key, { title: n.title, text: n.text, note: v })} autoFocus />}
                        {n.answer !== undefined && n.question && (
                          <>
                            <em>{n.question}</em>
                            <AutoText label="پاسخ من" value={n.answer ?? ''} onSave={(v) => setNote(key, { title: n.title, text: n.text, answer: v })} />
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        {n.answer && (
                          <p className="mn-answer">
                            <em>{n.question}</em>
                            {n.answer}
                          </p>
                        )}
                        {n.note && <p className="mn-note">{n.note}</p>}
                      </>
                    )}
                    <div className="mr-tools">
                      <button className="link-btn" onClick={() => setEditing(editing === key ? null : key)}>
                        {editing === key ? 'تمام' : 'ویرایش'}
                      </button>
                      <button
                        className="link-btn danger"
                        onClick={() => {
                          if (confirm('این یادداشت پاک شود؟ این کار برگشت ندارد.')) setNote(key, { title: n.title, text: n.text, note: '', answer: '' })
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {marks.length > 0 && (
            <section className="shelf">
              <div className="shelf-head">
                <h2>متن‌های نشان‌شده</h2>
                <small>{fa(marks.length)} متن</small>
              </div>
              <div className="marks">
                {marks.map((m) => (
                  <article key={m.key} className="mark-row">
                    <button className="mr-open" onClick={() => openMark(m.key)}>
                      <small>{m.title}</small>
                      <p>{m.text.length > 220 ? `${m.text.slice(0, 220)}…` : m.text}</p>
                    </button>
                    <div className="mr-tools">
                      <button className="link-btn danger" onClick={() => confirm('نشان این متن برداشته شود؟') && toggleMark(m)}>
                        برداشتن نشان
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {journal.length > 0 && (
            <section className="shelf">
              <div className="shelf-head">
                <h2>نوشته‌هایم در درس‌نامه‌ها</h2>
              </div>
              <div className="marks">
                {journal.map((j) => (
                  <article key={`${j.lessonId}-${j.date}-${j.text.slice(0, 12)}`} className="mark-row">
                    <button className="mr-open" onClick={() => go(href.lesson(j.lessonId))}>
                      <small>
                        {lessonCard(j.lessonId)?.title}، {when(j.date)}
                      </small>
                      <p style={{ whiteSpace: 'pre-line' }}>{j.text}</p>
                    </button>
                    <div className="mr-tools">
                      <button className="link-btn danger" onClick={() => confirm('این نوشته پاک شود؟ این کار برگشت ندارد.') && set((x) => ({ ...x, journal: x.journal.filter((y) => y !== j) }))}>
                        حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {!notes.length && !marks.length && !journal.length && <p className="muted center">چیزی با این جست‌وجو پیدا نشد.</p>}
        </>
      )}

      {p.saved.length > 0 && !k && !book && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>درس‌نامه‌های نشان‌شده</h2>
          </div>
          <div className="saved-row">
            {p.saved.map((id) => {
              const l = lessonCard(id)
              return (
                l && (
                  <button key={id} className="saved-card" onClick={() => go(href.lesson(id))}>
                    <span className="saved-art" style={{ backgroundImage: `url(${l.cover})` }} />
                    <b>{l.title}</b>
                    <small>{l.ref}</small>
                  </button>
                )
              )
            })}
          </div>
        </section>
      )}

      {(p.habits ?? []).length > 0 && !k && !book && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>تمرین‌هایی که پذیرفته‌ام</h2>
          </div>
          <ul className="habit-list">
            {p.habits!.map((h) => (
              <li key={h.lessonId}>
                <span>{h.short}</span>
                <button className="link-btn" onClick={() => go(href.lesson(h.lessonId))}>
                  {lessonCard(h.lessonId)?.title} ←
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** تنظیمات: نام، پوسته، نمایش متن، یادآور، پشتیبان و دربارهٔ مشکات */
export function Settings() {
  const { p, set } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    persistStorage()
  }, [])

  const restore = async (f: File) => {
    try {
      const data = parseBackup(await f.text())
      const n = JSON.parse(data['mishkat.progress.v1'])
      if (confirm(`همهٔ دادهٔ فعلی با این پشتیبان جایگزین شود؟\n${fa(Object.keys(n.notes ?? {}).length)} یادداشت و ${fa((n.marks ?? []).length)} نشان در این فایل هست.`)) restoreBackup(data)
    } catch (e) {
      setMsg((e as Error).message || 'فایل خوانده نشد')
    }
  }

  return (
    <div className="fade-up settings">
      <header className="quiet-head with-tool" data-art="settings">
        <div>
          <div className="eyebrow">دفتر من</div>
          <h1 className="h1">تنظیمات</h1>
        </div>
        <button className="icon-btn" onClick={() => go('/notes')} aria-label="بازگشت به دفتر">
          {Icon.close}
        </button>
      </header>

      <section className="shelf">
        <h2 className="set-h">نام تو</h2>
        <label className="name-field">
          <span className="sr-only">نام تو</span>
          <input value={p.name} onChange={(e) => set((x) => ({ ...x, name: e.target.value }))} placeholder="اختیاری" />
        </label>
      </section>

      <section className="shelf">
        <h2 className="set-h">پوسته</h2>
        <div className="theme-grid" role="radiogroup" aria-label="پوسته">
          {THEMES.map((t) => (
            <button key={t.id} role="radio" aria-checked={p.theme === t.id} className={`theme-swatch ${p.theme === t.id ? 'on' : ''}`} onClick={() => set((x) => ({ ...x, theme: t.id, themeSet: true }))}>
              <span className="sw" style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0 55%, ${t.colors[1]} 55% 78%, ${t.colors[2]} 78%)` }} />
              <b>{t.name}</b>
              {p.theme === t.id && <i>{Icon.check}</i>}
            </button>
          ))}
        </div>
      </section>

      <section className="shelf">
        <h2 className="set-h">نمایش متن</h2>
        <DisplaySettings />
      </section>

      {canRemind() && (
        <section className="shelf">
          <h2 className="set-h">یادآور روزانه</h2>
          <label className="name-field remind-field">
            <span>هر روز یک حکمت نهج‌البلاغه</span>
            <select
              value={p.remindHour ?? ''}
              onChange={async (e) => {
                const h = e.target.value === '' ? null : Number(e.target.value)
                const ok = await scheduleReminders(h)
                set((x) => ({ ...x, remindHour: ok ? h : null }))
              }}
            >
              <option value="">خاموش</option>
              {[6, 7, 8, 9, 12, 17, 20, 21, 22].map((h) => (
                <option key={h} value={h}>
                  ساعت {fa(h)}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <section className="shelf">
        <h2 className="set-h">پشتیبان</h2>
        <p className="muted">یادداشت‌ها و نشان‌ها فقط روی همین دستگاه‌اند. اگر حافظهٔ مرورگر یا برنامه پاک شود از بین می‌روند؛ گاهی یک پشتیبان بگیر.</p>
        <div className="me-tools">
          <button className="btn btn-gold" onClick={saveBackup}>
            {Icon.download} ذخیرهٔ پشتیبان
          </button>
          <button className="btn btn-ghost" onClick={() => file.current?.click()}>
            بازگردانی از پشتیبان
          </button>
          <button className="btn btn-ghost" onClick={() => exportNotes(p)}>
            {Icon.pen} خروجی دفتر برای چاپ
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        </div>
        {msg && (
          <p className="warn-text" role="alert">
            {msg}
          </p>
        )}
      </section>

      <section className="shelf about">
        <h2 className="set-h">دربارهٔ مشکات</h2>
        <p>
          نسخهٔ {VERSION}. متن قرآن از تنزیل با ترجمهٔ آیت‌الله مکارم شیرازی؛ احادیث شیعه از پایگاه ثقلین؛ غررالحکم و تحف‌العقول از پیکرهٔ OpenITI؛ صحیفهٔ سجادیه از ویکی‌نبشتهٔ عربی؛ تلاوت از EveryAyah.
        </p>
        <p className="muted">ترجمه‌ها، «یعنی چه؟» و شرح‌ها پیش‌نویس‌اند. اگر جایی خطا دیدی، از منوی «⋯» کنار همان متن «رونوشت نشانی برای گزارش خطا» را بزن و برای ما بفرست.</p>
        <button className="card trust-banner" onClick={() => go('/trust')}>
          <span className="shield">{Icon.shield}</span>
          <span style={{ flex: 1 }}>
            <b style={{ display: 'block' }}>زنجیرهٔ اعتبار مشکات</b>
            <small className="muted">منابع، روش تطبیق و وضعیت بازبینی</small>
          </span>
          <span style={{ color: 'var(--gold)' }}>←</span>
        </button>
      </section>
    </div>
  )
}
