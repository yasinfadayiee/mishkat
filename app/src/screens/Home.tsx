import { m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { lastPlace, loadDaily, loadIndex, type BookMeta, type DailyAyah, type DailySaying, type Place } from '../books'
import { lessonCard } from '../data/lesson-index'
import { situations } from '../data/paths'
import { surahName } from '../data/surah-fa'
import type { Situation } from '../data/types'
import { go, href } from '../router'
import { shareCard } from '../share'
import { Sky } from '../sky'
import { fa, PHASE_NAME, phaseOf, THEME_PHASE, useStore } from '../store'
import { ArabicText, Icon, Medallion, Sheet } from '../ui'
import { PlanSection } from './Plans'

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

/** سخن امروز (از daily.json، چند ده کیلوبایت) و آیهٔ امروز */
function useDaily() {
  const [d, setD] = useState<{ saying: DailySaying; ayah: DailyAyah } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    loadDaily()
      .then(({ sayings, ayahs }) => setD({ saying: sayings[today % sayings.length], ayah: ayahs[(today * 5) % ayahs.length] }))
      .catch(() => setFailed(true))
  }, [])
  return { d, failed }
}

const MAIN = ['Nahj-al-Balagha-Radi', 'ghurar']

export function Home({ openPlace }: { openPlace: (p: Place) => void }) {
  const { p, toggleMark } = useStore()
  const { shamsi, qamari } = dates()
  const [sit, setSit] = useState<Situation | null>(null)
  const [allSits, setAllSits] = useState(false)
  const [books, setBooks] = useState<BookMeta[]>([])
  const place = lastPlace()
  const { d: daily, failed } = useDaily()
  const saying = daily?.saying
  const ayah = daily?.ayah
  useEffect(() => {
    loadIndex()
      .then((x) => setBooks(x.books))
      .catch(() => setBooks([]))
  }, [])
  const main = MAIN.map((id) => books.find((b) => b.id === id)).filter((b): b is BookMeta => !!b)
  const sayKey = saying ? `b:Nahj-al-Balagha-Radi:${saying.i}` : ''
  const ayahFirst = ayah ? Number(ayah.a.split('-')[0]) : 0

  return (
    <div className="home2">
      <header className="masthead short">
        <Sky phase={p.theme === 'auto' ? undefined : THEME_PHASE[p.theme]} />
        <div className="masthead-text">
          <div className="mast-date">
            {shamsi}
            {qamari && <span>، {qamari}</span>}
            <span className="mast-phase">، هنگام {PHASE_NAME[phaseOf()]}</span>
          </div>
          <h1 className="mast-hi">
            {greeting()}
            {p.name ? `، ${p.name}` : ''}
          </h1>
          <p>
            کتابخانهٔ <span className="gold-text">مشکات</span>: قرآن، نهج‌البلاغه و غررالحکم، به زبان امروز.
          </p>
        </div>
      </header>

      <div className="home2-body">
        {place && (
          <button className="continue-card" onClick={() => openPlace(place)}>
            <span className="cc-icon">{place.book === 'quran' ? Icon.rahl : Icon.book}</span>
            <span className="cc-text">
              <small>ادامهٔ مطالعه</small>
              <b>{place.book === 'quran' ? surahName(place.sec) : place.title}</b>
              <span>{place.book === 'quran' ? (place.i ? `از آیهٔ ${fa(place.i)}` : '') : place.label}</span>
            </span>
            <span className="cc-go">{Icon.next}</span>
          </button>
        )}

        <PlanSection />

        {failed && <p className="muted">سخن و آیهٔ امروز بدون اینترنت باز نشد.</p>}
        <div className="daily-grid">
          {saying && (
            <m.article className="daily-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="dc-kicker">سخن امروز، امام علی (ع)</div>
              <ArabicText kind="hadith" text={saying.ar.replace(/^\s*[0-9٠-٩۰-۹]+\s*[.\-–]\s*/, '')} className="dc-ar" />
              <p className="dc-fa">{saying.fa}</p>
              <p className="dc-note">{saying.sm}</p>
              <footer>
                <span>نهج‌البلاغه، حکمت {fa(saying.n)}</span>
                <span className="dc-tools">
                  <button className={`mini-btn ${p.marks.some((x) => x.key === sayKey) ? 'on' : ''}`} aria-label="نشان کردن" aria-pressed={p.marks.some((x) => x.key === sayKey)} onClick={() => toggleMark({ key: sayKey, title: `نهج‌البلاغه، حکمت ${fa(saying.n)}`, text: saying.fa })}>
                    {p.marks.some((x) => x.key === sayKey) ? Icon.bookmarked : Icon.bookmark}
                  </button>
                  <button className="mini-btn" aria-label="کارت تصویری برای فرستادن" onClick={() => shareCard({ ar: saying.ar, gist: saying.sm, fa: saying.fa, source: `نهج‌البلاغه، حکمت ${fa(saying.n)}`, shelf: 'nahj' })}>
                    {Icon.card}
                  </button>
                  <button className="link-btn" onClick={() => go(href.chapter('Nahj-al-Balagha-Radi', saying.sec, saying.ch, saying.i))}>
                    در کتاب ←
                  </button>
                </span>
              </footer>
            </m.article>
          )}
          {ayah && (
            <m.article className="daily-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <div className="dc-kicker">آیهٔ امروز</div>
              <ArabicText kind="quran" text={ayah.ar} className="dc-ar" />
              <p className="dc-fa">{ayah.fa}</p>
              <footer>
                <span>
                  {surahName(ayah.s)}، آیهٔ {ayah.a.replace(/\d+/g, (x) => fa(Number(x)))}
                </span>
                <button className="link-btn" onClick={() => go(href.surah(ayah.s, ayahFirst || undefined))}>
                  در سوره ←
                </button>
              </footer>
            </m.article>
          )}
        </div>

        <section className="home-sec">
          <div className="hs-head">
            <h2>وقتی…</h2>
            <button className="link-btn" onClick={() => setAllSits(true)}>
              همه ←
            </button>
          </div>
          <div className="sit-row" role="list">
            {situations.map((s) => (
              <button key={s.id} role="listitem" onClick={() => setSit(s)}>
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="home-sec">
          <div className="hs-head">
            <h2>کتاب‌ها</h2>
            <button className="link-btn" onClick={() => go('/library')}>
              همهٔ کتاب‌ها ←
            </button>
          </div>
          <div className="featured three">
            <button className="feat-book quran-book" data-shelf="quran" onClick={() => go('/quran')}>
              <Medallion />
              <b>قرآن کریم</b>
              <small>۱۱۴ سوره، ترجمهٔ کامل</small>
            </button>
            {main.map((b) => (
              <button key={b.id} className="feat-book" data-shelf={b.shelf} onClick={() => go(href.toc(b.id))}>
                <Medallion />
                <b>{b.title}</b>
                <small>
                  {fa(b.count)} متن، {b.translated >= b.count ? 'ترجمهٔ کامل' : `${fa(b.translated)} با ترجمه`}
                </small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <Sheet open={allSits} onClose={() => setAllSits(false)} label="وقتی…">
        <h3 className="h2 sheet-title">وقتی…</h3>
        <p className="muted">از موقعیت زندگی‌ات، به درس‌نامه‌ای که دربارهٔ آن است.</p>
        <div className="situations">
          {situations.map((s) => (
            <button key={s.id} onClick={() => (setAllSits(false), setSit(s))}>
              {s.label}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!sit} onClose={() => setSit(null)} label={sit?.label}>
        {sit && (
          <>
            <h3 className="h2 sheet-title">{sit.label}</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              این درس‌نامه‌ها دربارهٔ همین موقعیت‌اند:
            </p>
            {sit.lessons
              .map((id) => lessonCard(id))
              .filter((l) => !!l)
              .map((l) => (
                <button key={l!.id} className="sheet-lesson" onClick={() => (setSit(null), go(href.lesson(l!.id)))}>
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
