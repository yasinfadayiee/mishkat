import { PlanSection } from './Plans'
import { go, href } from '../router'
import { m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { lastPlace, loadDaily, loadIndex, loadSurahs, type BookMeta, type DailyAyah, type DailySaying, type Place, type SurahMeta } from '../books'
import { LESSONS as lessons, lessonCard as lessonById } from '../data/lesson-index'
import { situations } from '../data/paths'
import type { Situation } from '../data/types'
import { Sky } from '../sky'
import { fa, PHASE_NAME, phaseOf, THEME_PHASE, useStore } from '../store'
import { ArabicText, Icon, Medallion, Sheet } from '../ui'

function greeting() {
  return { sahar: 'سحر بخیر', morning: 'صبح بخیر', noon: 'ظهر بخیر', asr: 'عصر بخیر', maghrib: 'عصر بخیر', night: 'شب بخیر' }[phaseOf()]
}

function dates() {
  const d = new Date()
  // ترتیب بخش‌ها دستی چیده می‌شود تا تاریخ به‌صورت «سه‌شنبه ۱۲ آبان ۱۴۰۵» خوانده شود
  const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fa-IR', o)
  const shamsi = `${part({ weekday: 'long' })} ${part({ day: 'numeric' })} ${part({ month: 'long' })} ${part({ year: 'numeric' })}`
  let qamari = ''
  try {
    const q = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fa-IR-u-ca-islamic-umalqura', o)
    qamari = `${q({ day: 'numeric' })} ${q({ month: 'long' })} ${q({ year: 'numeric' }).replace(/\s*ه‍?\.ق\.?/, '')} ق`
  } catch {
    /* تقویم قمری پشتیبانی نشد */
  }
  return { shamsi, qamari }
}

const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000)

/** درس‌نامهٔ امروز: اولین درسِ نخوانده؛ اگر همه خوانده شده، چرخشی بر اساس روز */
export function todaysLesson(completed: Record<string, string>) {
  return lessons.find((l) => !completed[l.id]) ?? lessons[today % lessons.length]
}

/** سخن امروز از حکمت‌های ترجمه‌شدهٔ نهج‌البلاغه */
function useDaily() {
  const [d, setD] = useState<{ saying: DailySaying; ayah: DailyAyah } | null>(null)
  useEffect(() => {
    loadDaily()
      .then(({ sayings, ayahs }) => setD({ saying: sayings[today % sayings.length], ayah: ayahs[(today * 5) % ayahs.length] }))
      .catch(() => setD(null))
  }, [])
  return d
}

export function Home({ openPlace }: { openPlace: (p: Place) => void }) {
  const openLesson = (id: string) => go(href.lesson(id))
  const openQuran = (n?: number, a?: number) => go(n ? href.surah(n, a) : '/quran')
  const openBook = (b: BookMeta, sec?: number, ch?: number, i?: number) => go(sec === undefined ? href.toc(b.id) : href.chapter(b.id, sec, ch ?? 0, i))
  const goTo = (t: 'library' | 'trust') => go(`/${t}`)
  const { p } = useStore()
  const { shamsi, qamari } = dates()
  const [sit, setSit] = useState<Situation | null>(null)
  const [books, setBooks] = useState<BookMeta[]>([])
  const place = lastPlace()
  const lesson = todaysLesson(p.completed)
  const daily = useDaily()
  const saying = daily?.saying
  const ayah = daily && { ...daily.ayah, n: daily.ayah.s, ayah: daily.ayah.a.replace(/\d/g, (d) => fa(Number(d))) }
  const [surahs, setSurahs] = useState<SurahMeta[]>([])
  useEffect(() => {
    loadSurahs()
      .then(setSurahs)
      .catch(() => setSurahs([]))
    loadIndex()
      .then((x) => setBooks(x.books))
      .catch(() => setBooks([]))
  }, [])
  const nahj = books.find((b) => b.id === 'Nahj-al-Balagha-Radi')
  const featured = ['Nahj-al-Balagha-Radi', 'ghurar', 'sahifa', 'Risalat-al-Huquq-Abidin', 'Sifat-al-Shia-Saduq', 'Al-Kafi-Volume-2-Kulayni'].map((id) => books.find((b) => b.id === id)).filter((b): b is BookMeta => !!b)

  return (
    <div className="home2">
      <header className="masthead">
        <Sky phase={p.theme === 'auto' ? undefined : THEME_PHASE[p.theme]} />
        <div className="masthead-text">
          <div className="mast-date">
            {shamsi}
            {qamari && <span>، {qamari}</span>}
            <span className="mast-phase">، هنگام {PHASE_NAME[phaseOf()]}</span>
          </div>
          <div className="mast-hi">
            {greeting()}
            {p.name ? `، ${p.name}` : ''}
          </div>
          <h1>
            کتابخانهٔ <span className="gold-text">مشکات</span>
          </h1>
          <p>قرآن، نهج‌البلاغه و کتاب‌های حدیث؛ کامل، مستند و به زبان امروز.</p>
        </div>
      </header>

      <div className="home2-body">
        {place && (
          <button className="continue-card" onClick={() => openPlace(place)}>
            <span className="cc-icon">{Icon.book}</span>
            <span className="cc-text">
              <small>ادامهٔ مطالعه</small>
              <b>{place.title}</b>
              <span>{place.label}</span>
            </span>
            <span className="cc-go">{Icon.next}</span>
          </button>
        )}

        <div className="daily-grid">
          {ayah && (
            <m.article className="daily-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="dc-kicker">آیهٔ امروز</div>
              <ArabicText kind="quran" text={ayah.ar} className="dc-ar" />
              <p className="dc-fa">{ayah.fa}</p>
              <footer>
                <span>{surahs[ayah.n - 1] && `سورهٔ ${surahs[ayah.n - 1].name}، آیهٔ ${ayah.ayah}`}</span>
                <button className="link-btn" onClick={() => openQuran(ayah.n, Number(daily!.ayah.a.split('-')[0]) || undefined)}>
                  خواندن سوره ←
                </button>
              </footer>
            </m.article>
          )}
          {saying && (
            <m.article className="daily-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="dc-kicker">سخن امروز، امام علی (ع)</div>
              <ArabicText kind="hadith" text={saying.ar} className="dc-ar" />
              <p className="dc-fa">{saying.fa}</p>
              {saying.sm && <p className="dc-note">{saying.sm}</p>}
              {saying.mr && (
                <p className="dc-mirror">
                  {Icon.life} {saying.mr}
                </p>
              )}
              <footer>
                <span>نهج‌البلاغه، حکمت {fa(saying.n)}</span>
                {nahj && (
                  <button className="link-btn" onClick={() => openBook(nahj, saying.sec, saying.ch, saying.i)}>
                    در کتاب ←
                  </button>
                )}
              </footer>
            </m.article>
          )}
        </div>

        <section className="home-sec">
          <div className="hs-head">
            <h2>درس‌نامهٔ امروز</h2>
            <button className="link-btn" onClick={() => goTo('library')}>
              همهٔ درس‌نامه‌ها ←
            </button>
          </div>
          <button className="lesson-feature" onClick={() => openLesson(lesson.id)}>
            <span className="lf-art" style={{ backgroundImage: `url(${lesson.cover})` }} />
            <span className="lf-text">
              <small>
                {lesson.topic}، {lesson.ref}
              </small>
              <b>{lesson.title}</b>
              {lesson.essence && <span>{lesson.essence}</span>}
              <em>
                {lesson.subtitle}
                {p.completed[lesson.id] && '، خوانده شده'}
              </em>
            </span>
          </button>
        </section>

        <section className="home-sec">
          <div className="hs-head">
            <h2>وقتی…</h2>
            <small className="muted">از موقعیت زندگی‌ات، به متنی که دربارهٔ آن است</small>
          </div>
          <div className="situations">
            {situations.map((s) => (
              <button key={s.id} onClick={() => setSit(s)}>
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <PlanSection openAt={(meta, sec, ch) => openBook(meta, sec, ch)} />

        <section className="home-sec">
          <div className="hs-head">
            <h2>کتاب‌های برگزیده</h2>
            <button className="link-btn" onClick={() => goTo('library')}>
              کتابخانه ←
            </button>
          </div>
          <div className="featured">
            <button className="feat-book quran-book" data-shelf="quran" onClick={() => openQuran()}>
              <Medallion />
              <b>قرآن کریم</b>
              <small>۱۱۴ سوره، ترجمهٔ کامل</small>
            </button>
            {featured.map((b) => (
              <button key={b.id} className="feat-book" data-shelf={b.shelf} onClick={() => openBook(b)}>
                <Medallion />
                <b>{b.title}</b>
                <small>
                  {fa(b.count)} متن{b.translated ? `، ${fa(b.translated)} با ترجمه` : ''}
                </small>
              </button>
            ))}
          </div>
        </section>

        <section className="home-sec">
          <button className="card trust-banner" onClick={() => goTo('trust')}>
            <span className="shield">{Icon.shield}</span>
            <span style={{ flex: 1 }}>
              <b style={{ display: 'block' }}>هر متن، با سند</b>
              <small className="muted">منبع هر آیه و حدیث، درجهٔ سند، و این‌که کدام بخش ترجمه یا توضیح است</small>
            </span>
            <span style={{ color: 'var(--gold)' }}>←</span>
          </button>
        </section>
      </div>

      <Sheet open={!!sit} onClose={() => setSit(null)}>
        {sit && (
          <>
            <h3 className="h2" style={{ marginTop: 4 }}>
              {sit.label}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              این درس‌نامه‌ها دربارهٔ همین موقعیت‌اند:
            </p>
            {sit.lessons
              .map((id) => lessonById(id))
              .filter((l) => !!l)
              .map((l) => (
                <button key={l!.id} className="sheet-lesson" onClick={() => (setSit(null), openLesson(l!.id))}>
                  <span className="sl-art" style={{ backgroundImage: `url(${l!.cover})` }} />
                  <span>
                    <b>{l!.title}</b>
                    <small>{l!.ref}</small>
                  </span>
                </button>
              ))}
          </>
        )}
      </Sheet>
    </div>
  )
}
