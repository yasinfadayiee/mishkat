import { AnimatePresence, LazyMotion, m } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { findItem, loadIndex, type BookMeta, type Place } from './books'
import { ErrorBoundary } from './load'
import { Home } from './screens/Home'

// فقط خانه همراه فایل اول می‌آید؛ بقیهٔ صفحه‌ها جدا بار می‌شوند (و پس از باز شدن خانه، در پس‌زمینه از پیش گرفته می‌شوند)
const loadBook = () => import('./screens/Book')
const loadQuran = () => import('./screens/Quran')
const loadLibrary = () => import('./screens/Library')
const loadMe = () => import('./screens/Me')
const loadSearch = () => import('./screens/Search')
const BookToc = lazy(() => loadBook().then((m) => ({ default: m.BookToc })))
const ChapterReader = lazy(() => loadBook().then((m) => ({ default: m.ChapterReader })))
const Quran = lazy(() => loadQuran().then((m) => ({ default: m.Quran })))
const SurahReader = lazy(() => loadQuran().then((m) => ({ default: m.SurahReader })))
const Library = lazy(() => loadLibrary().then((m) => ({ default: m.Library })))
const Me = lazy(() => loadMe().then((m) => ({ default: m.Me })))
const SearchPage = lazy(() => loadSearch().then((m) => ({ default: m.SearchPage })))
const prefetch = () => [loadBook, loadQuran, loadLibrary, loadMe, loadSearch].forEach((f) => f().catch(() => {}))
const LessonScreen = lazy(() => import('./screens/Lesson'))
const TopicReader = lazy(() => import('./screens/Topics').then((m) => ({ default: m.TopicReader })))
const Trust = lazy(() => import('./screens/Trust').then((m) => ({ default: m.Trust })))
const Onboarding = lazy(() => import('./screens/Onboarding').then((m) => ({ default: m.Onboarding })))
const Intro = lazy(() => import('./screens/Intro').then((m) => ({ default: m.Intro })))
import { scheduleReminders } from './reminder'
import { StoreProvider, useStore } from './store'
import { Girih, Icon } from './ui'

type Tab = 'home' | 'quran' | 'library' | 'me' | 'trust' | 'search'

const NAV: { id: Exclude<Tab, 'trust'>; label: string; icon: keyof typeof Icon }[] = [
  { id: 'home', label: 'خانه', icon: 'home' },
  { id: 'quran', label: 'قرآن', icon: 'quote' },
  { id: 'library', label: 'کتابخانه', icon: 'book' },
  { id: 'me', label: 'یادداشت‌ها', icon: 'pen' },
]

/** آنچه روی صفحه باز است (درس‌نامه، سوره، فهرست کتاب یا یک باب) */
type View = { kind: 'lesson'; id: string } | { kind: 'surah'; n: number } | { kind: 'toc'; book: BookMeta } | { kind: 'chapter'; book: BookMeta; sec: number; ch: number; focus?: number } | { kind: 'topic'; id: string } | null

const loadMotion = () => import('./motion-features').then((x) => x.default)

const introSeen = () => {
  try {
    return sessionStorage.getItem('mishkat.intro') === '1'
  } catch {
    return false
  }
}

function Shell() {
  const { p } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [view, setView] = useState<View>(null)
  const [back, setBack] = useState<View>(null)
  const [intro, setIntro] = useState(!introSeen())
  const [searchQ, setSearchQ] = useState('')
  const endIntro = useCallback(() => {
    setIntro(false)
    try {
      sessionStorage.setItem('mishkat.intro', '1')
    } catch {
      /* بدون ذخیره هم ادامه می‌دهیم */
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  // پس از نخستین نمایش، صفحه‌های دیگر آرام در پس‌زمینه گرفته می‌شوند تا جابه‌جایی بی‌مکث باشد
  useEffect(() => {
    const t = setTimeout(prefetch, 2500)
    return () => clearTimeout(t)
  }, [])

  // یادآورهای روزانه با هر بار باز شدن برنامه برای ۳۰ روز آینده تازه می‌شوند
  const remindHour = p.remindHour
  useEffect(() => {
    if (remindHour !== undefined && remindHour !== null) scheduleReminders(remindHour).catch(() => {})
  }, [remindHour])

  const openLesson = (id: string) => setView({ kind: 'lesson', id })
  const openQuran = (n?: number) => (n ? setView({ kind: 'surah', n }) : (setView(null), setTab('quran')))
  const openBook = (book: BookMeta, sec?: number, ch?: number) => (sec === undefined ? setView({ kind: 'toc', book }) : (setBack({ kind: 'toc', book }), setView({ kind: 'chapter', book, sec, ch: ch ?? 0 })))
  const openPlace = async (pl: Place) => {
    if (pl.book === 'quran') return setView({ kind: 'surah', n: pl.sec })
    const book = (await loadIndex()).books.find((b) => b.id === pl.book)
    if (book) openBook(book, pl.sec, pl.ch)
  }
  // متن نشان‌شده: q:سوره:آیه یا b:کتاب:شناسه
  const openMark = async (key: string) => {
    const [k, a, b] = key.split(':')
    if (k === 'q') return setView({ kind: 'surah', n: Number(a) })
    const meta = (await loadIndex()).books.find((x) => x.id === a)
    const at = meta && (await findItem(a, Number(b)).catch(() => null))
    if (meta && at) (setBack(null), setView({ kind: 'chapter', book: meta, sec: at[0], ch: at[1], focus: Number(b) }))
  }
  const close = () => {
    setView(back)
    setBack(null)
  }

  if (intro)
    return (
      <Suspense fallback={<div className="intro" />}>
        <AnimatePresence>{intro && <Intro onDone={endIntro} />}</AnimatePresence>
      </Suspense>
    )

  if (!p.onboarded)
    return (
      <div className="shell">
        <Girih id="g0" />
        <Suspense fallback={null}>
          <Onboarding />
        </Suspense>
      </div>
    )

  return (
    <div className="shell">
      <Girih />
      <aside className="rail">
        <div className="brand">
          <img src="icons/icon-192.png" alt="" />
          <div>
            <b>مِشکات</b>
            <span>کتابخانهٔ قرآن و حدیث</span>
          </div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {Icon[n.icon]} {n.label}
          </button>
        ))}
        <button className={tab === 'trust' ? 'on' : ''} onClick={() => setTab('trust')}>
          {Icon.shield} زنجیرهٔ اعتبار
        </button>
        <div className="rail-foot">نسخهٔ پیش‌نمایش · ترجمه‌ها و شرح‌ها در انتظار تأیید کارشناس</div>
      </aside>

      <main className="main">
        <Suspense fallback={<div className="tab-wait" />}>
        <AnimatePresence mode="wait">
          <m.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'home' && <Home openLesson={openLesson} openQuran={openQuran} openBook={openBook} openPlace={openPlace} goTo={setTab} />}
            {tab === 'quran' && <Quran open={(n) => setView({ kind: 'surah', n })} />}
            {tab === 'library' && <Library openLesson={openLesson} openBook={(b) => openBook(b)} openQuran={() => setTab('quran')} openTopic={(id) => setView({ kind: 'topic', id })} openSearch={(q) => (setSearchQ(q), setTab('search'))} />}
            {tab === 'search' && <SearchPage initial={searchQ} open={(h, meta) => (h.book === 'quran' ? setView({ kind: 'surah', n: h.sec }) : meta && setView({ kind: 'chapter', book: meta, sec: h.sec, ch: h.ch, focus: h.i }))} />}
            {tab === 'me' && <Me goTo={setTab} openLesson={openLesson} openMark={openMark} />}
            {tab === 'trust' && (
              <Suspense fallback={null}>
                <Trust back={() => setTab('home')} />
              </Suspense>
            )}
          </m.div>
        </AnimatePresence>
        </Suspense>
      </main>

      <nav className="tabbar">
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {Icon[n.icon]}
            {n.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={null}>
      <AnimatePresence>
        {view?.kind === 'lesson' && <LessonScreen key={view.id} id={view.id} onClose={close} />}
        {view?.kind === 'surah' && <SurahReader key="surah" n={view.n} onClose={close} go={(n) => setView({ kind: 'surah', n })} />}
        {view?.kind === 'toc' && <BookToc key={`toc-${view.book.id}`} meta={view.book} onClose={close} open={(sec, ch) => (setBack(view), setView({ kind: 'chapter', book: view.book, sec, ch }))} />}
        {view?.kind === 'topic' && <TopicReader key={`topic-${view.id}`} id={view.id} onClose={close} openAt={(b, sec, ch, focus) => (setBack(view), setView({ kind: 'chapter', book: b, sec, ch, focus }))} openSurah={(n) => (setBack(view), setView({ kind: 'surah', n }))} />}
        {view?.kind === 'chapter' && (
          <ChapterReader
            key={`ch-${view.book.id}`}
            meta={view.book}
            sec={view.sec}
            ch={view.ch}
            focus={view.focus}
            onClose={close}
            go={(sec, ch) => setView({ ...view, sec, ch, focus: undefined })}
            openOther={async (id, sec, ch, focus) => {
              const other = (await loadIndex()).books.find((b) => b.id === id)
              if (other) (setBack(view), setView({ kind: 'chapter', book: other, sec, ch, focus }))
            }}
          />
        )}
      </AnimatePresence>
      </Suspense>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={loadMotion} strict>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </LazyMotion>
    </ErrorBoundary>
  )
}
