import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { lastPlace, loadBook, loadIndex, loadSurahs, type BookMeta, type Item, type Place, type SurahMeta } from '../books'
import { lessonById, lessons } from '../data/lessons'
import { situations } from '../data/paths'
import type { Situation } from '../data/types'
import { fa, useStore } from '../store'
import { ArabicText, Icon, Sheet } from '../ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'شب‌بخیر'
  if (h < 12) return 'صبح بخیر'
  if (h < 17) return 'روز بخیر'
  return 'عصر بخیر'
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
function useSaying() {
  const [s, setS] = useState<{ item: Item; label: string; sec: number; ch: number } | null>(null)
  useEffect(() => {
    loadBook('Nahj-al-Balagha-Radi')
      .then((b) => {
        const pool = b.sections.flatMap((sec, si) => sec.chapters.flatMap((c, ci) => c.items.filter((i) => i.fa && i.ar.split(' ').length < 40).map((item) => ({ item, label: `نهج‌البلاغه، ${item.n ? `حکمت ${fa(item.n)}` : c.t}`, sec: si, ch: ci }))))
        if (pool.length) setS(pool[(today * 7) % pool.length])
      })
      .catch(() => setS(null))
  }, [])
  return s
}

/** آیهٔ امروز: از آیه‌های برگزیدهٔ درس‌نامه‌ها، تا آیه بیرون از سیاقش نیاید */
function useAyah() {
  const pool = lessons.flatMap((l) => [
    ...(l.source.kind === 'quran' ? [{ ar: l.source.arabic, fa: l.source.translation, ref: l.source.verifyUrl }] : []),
    ...l.parallels.filter((x) => x.school === 'quran').map((x) => ({ ar: x.arabic, fa: x.translation, ref: x.verifyUrl })),
  ])
  const a = pool[(today * 5) % pool.length]
  const [n, ayah] = (a.ref.split('#')[1] ?? '1:1').split(':')
  return { ar: a.ar, fa: a.fa, n: Number(n), ayah: ayah.replace(/\d/g, (d) => fa(Number(d))) }
}

export function Home({
  openLesson,
  openQuran,
  openBook,
  openPlace,
  goTo,
}: {
  openLesson: (id: string) => void
  openQuran: (n?: number) => void
  openBook: (b: BookMeta, sec?: number, ch?: number) => void
  openPlace: (p: Place) => void
  goTo: (tab: 'library' | 'trust') => void
}) {
  const { p } = useStore()
  const { shamsi, qamari } = dates()
  const [sit, setSit] = useState<Situation | null>(null)
  const [books, setBooks] = useState<BookMeta[]>([])
  const place = lastPlace()
  const lesson = todaysLesson(p.completed)
  const saying = useSaying()
  const ayah = useAyah()
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
  const featured = ['Nahj-al-Balagha-Radi', 'sahifa', 'Al-Kafi-Volume-2-Kulayni', 'Risalat-al-Huquq-Abidin', 'Al-Khisal-Saduq', 'Al-Amali-Saduq'].map((id) => books.find((b) => b.id === id)).filter((b): b is BookMeta => !!b)

  return (
    <div className="home2">
      <header className="masthead">
        <div className="masthead-art" style={{ backgroundImage: "url(art/home-night.webp)" }} />
        <div className="masthead-fade" />
        <div className="masthead-text">
          <div className="mast-date">
            {shamsi}
            {qamari && <span> · {qamari}</span>}
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
            <motion.article className="daily-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="dc-kicker">آیهٔ امروز</div>
              <ArabicText kind="quran" text={ayah.ar} className="dc-ar" />
              <p className="dc-fa">{ayah.fa}</p>
              <footer>
                <span>{surahs[ayah.n - 1] && `سورهٔ ${surahs[ayah.n - 1].name}، آیهٔ ${ayah.ayah}`}</span>
                <button className="link-btn" onClick={() => openQuran(ayah.n)}>
                  خواندن سوره ←
                </button>
              </footer>
            </motion.article>
          )}
          {saying && (
            <motion.article className="daily-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="dc-kicker">سخن امروز · امام علی (ع)</div>
              <ArabicText kind="hadith" text={saying.item.ar} className="dc-ar" />
              <p className="dc-fa">{saying.item.fa}</p>
              {saying.item.nt && <p className="dc-note">{saying.item.nt}</p>}
              {saying.item.mr && (
                <p className="dc-mirror">
                  {Icon.life} {saying.item.mr}
                </p>
              )}
              <footer>
                <span>{saying.label}</span>
                {nahj && (
                  <button className="link-btn" onClick={() => openBook(nahj, saying.sec, saying.ch)}>
                    در کتاب ←
                  </button>
                )}
              </footer>
            </motion.article>
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
                {lesson.topic} · {lesson.source.ref}
              </small>
              <b>{lesson.title}</b>
              {lesson.sharh && <span>{lesson.sharh.essence}</span>}
              <em>
                {lesson.sharh ? `شرح ${fa(lesson.sharh.parts.length)} جمله، یکی‌یکی` : lesson.subtitle}
                {p.completed[lesson.id] && ' · خوانده شده'}
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

        <section className="home-sec">
          <div className="hs-head">
            <h2>کتاب‌های برگزیده</h2>
            <button className="link-btn" onClick={() => goTo('library')}>
              کتابخانه ←
            </button>
          </div>
          <div className="featured">
            <button className="feat-book quran-book" onClick={() => openQuran()}>
              <b>قرآن کریم</b>
              <small>۱۱۴ سوره · ترجمهٔ کامل</small>
            </button>
            {featured.map((b) => (
              <button key={b.id} className="feat-book" onClick={() => openBook(b)}>
                <b>{b.title}</b>
                <small>
                  {fa(b.count)} متن{b.translated ? ` · ${fa(b.translated)} با ترجمه` : ''}
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
                    <small>{l!.source.ref}</small>
                  </span>
                </button>
              ))}
          </>
        )}
      </Sheet>
    </div>
  )
}
