import { exportNotes } from '../export-notes'
import { canRemind, scheduleReminders } from '../reminder'
import { m } from 'framer-motion'
import { LESSONS as lessons, lessonCard as lessonById } from '../data/lesson-index'
import { fa, useStore, type ThemeId } from '../store'
import { Icon } from '../ui'

const THEMES: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: 'auto', name: 'همراه با آسمان (خودکار)', colors: ['#3a2a5c', '#f2b866', '#0d2347'] },
  { id: 'dawn', name: 'سحر', colors: ['#1d1638', '#f0a3a8', '#f3cf8a'] },
  { id: 'parchment', name: 'کاغذ کاهی', colors: ['#f7efdf', '#0e7a5c', '#9a6f27'] },
  { id: 'noon', name: 'کاشیِ ظهر', colors: ['#eef6f4', '#0f7f86', '#b3832f'] },
  { id: 'dusk', name: 'عصر و مغرب', colors: ['#2a1418', '#e8875a', '#f0c27a'] },
  { id: 'isfahan', name: 'شبِ فیروزه‌ای', colors: ['#08172f', '#3fd3d8', '#ecc77f'] },
  { id: 'emerald', name: 'شب زمردی', colors: ['#06201a', '#3fcf9f', '#e6c27d'] },
]

/** یادداشت‌ها: نشان‌ها، دفتر، تمرین‌ها و تنظیمات */
export function Me({ goTo, openLesson, openMark }: { goTo: (t: 'trust') => void; openLesson: (id: string) => void; openMark: (key: string) => void }) {
  const { p, set } = useStore()
  const read = lessons.filter((l) => p.completed[l.id]).length

  return (
    <div className="fade-up">
      <header className="quiet-head">
        <div className="eyebrow">یادداشت‌های من</div>
        <h1 className="h1">{p.name ? `دفتر ${p.name}` : 'دفتر من'}</h1>
        <p className="muted">
          {fa(p.marks.length)} متن نشان‌شده · {fa(p.journal.length)} یادداشت · {fa(read)} از {fa(lessons.length)} درس‌نامه خوانده شده
        </p>
      </header>

      {Object.keys(p.notes).length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>آنچه نوشته‌ام</h2>
            <small>پاسخ‌هایت به پرسش‌های آینه و یادداشت‌هایت روی متن‌ها</small>
          </div>
          <div className="marks">
            {Object.entries(p.notes)
              .sort((a, b) => b[1].at.localeCompare(a[1].at))
              .map(([key, n]) => (
                <button key={key} className="mark-row my-note" onClick={() => openMark(key)}>
                  <small>
                    {n.title} · {new Date(n.at).toLocaleDateString('fa-IR')}
                  </small>
                  <p className="mn-text">{n.text.length > 160 ? `${n.text.slice(0, 160)}…` : n.text}</p>
                  {n.answer && (
                    <p className="mn-answer">
                      <em>{n.question}</em>
                      {n.answer}
                    </p>
                  )}
                  {n.note && <p className="mn-note">{n.note}</p>}
                </button>
              ))}
          </div>
        </section>
      )}

      <section className="shelf">
        <div className="shelf-head">
          <h2>متن‌های نشان‌شده</h2>
          <small>آیه‌ها و حدیث‌هایی که نشان کرده‌ای</small>
        </div>
        {p.marks.length === 0 ? (
          <p className="muted">هنگام خواندن قرآن یا کتاب‌ها، با دکمهٔ نشان، متن را این‌جا نگه دار.</p>
        ) : (
          <div className="marks">
            {p.marks.map((m) => (
              <button key={m.key} className="mark-row" onClick={() => openMark(m.key)}>
                <small>{m.title}</small>
                <p>{m.text.length > 220 ? `${m.text.slice(0, 220)}…` : m.text}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {p.saved.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>درس‌نامه‌های نشان‌شده</h2>
          </div>
          <div className="saved-row">
            {p.saved.map((id) => {
              const l = lessonById(id)
              return (
                l && (
                  <button key={id} className="saved-card" onClick={() => openLesson(id)}>
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

      {p.habits.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>تمرین‌هایی که پذیرفته‌ام</h2>
          </div>
          <ul className="habit-list">
            {p.habits.map((h) => (
              <li key={h.lessonId}>
                <span>{h.short}</span>
                <button className="link-btn" onClick={() => openLesson(h.lessonId)}>
                  {lessonById(h.lessonId)?.title} ←
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shelf">
        <div className="shelf-head">
          <h2>دفتر یادداشت</h2>
        </div>
        {p.journal.length === 0 ? (
          <p className="muted">پایان هر درس‌نامه یک پرسش برای خلوت با خودت هست؛ پاسخ‌هایت این‌جا می‌ماند.</p>
        ) : (
          <div className="grid two">
            {p.journal.map((j, k) => (
              <m.div key={k} className="card" style={{ padding: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className="chip">{lessonById(j.lessonId)?.title}</span>
                  <small className="muted">{new Date(j.date).toLocaleDateString('fa-IR')}</small>
                </div>
                <p style={{ margin: '10px 0 0', whiteSpace: 'pre-line' }}>{j.text}</p>
              </m.div>
            ))}
          </div>
        )}
      </section>

      <section className="shelf">
        <div className="shelf-head">
          <h2>تنظیمات</h2>
        </div>
        <div className="me-tools">
          <button className="btn btn-ghost" onClick={() => exportNotes(p)}>
            {Icon.pen} خروجی دفتر (برای چاپ یا PDF)
          </button>
          {canRemind() && (
            <label className="name-field remind-field">
              <span>یادآور روزانه</span>
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
          )}
        </div>
        <label className="name-field">
          <span>نام تو</span>
          <input value={p.name} onChange={(e) => set((x) => ({ ...x, name: e.target.value }))} placeholder="اختیاری" />
        </label>
        <div className="grid three" style={{ marginTop: 12 }}>
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-swatch ${p.theme === t.id ? 'on' : ''}`} onClick={() => set((x) => ({ ...x, theme: t.id, themeSet: true }))}>
              <span className="dots" style={{ paddingLeft: 6 }}>
                {t.colors.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <b style={{ flex: 1 }}>{t.name}</b>
              {p.theme === t.id && <span style={{ color: 'var(--gold)', width: 20 }}>{Icon.check}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="shelf">
        <button className="card trust-banner" onClick={() => goTo('trust')}>
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

