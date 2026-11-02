import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { loadBook, loadIndex, type BookMeta, type Place } from './books'
import { lessonById } from './data/lessons'
import { Home } from './screens/Home'
import { Intro } from './screens/Intro'
import { LessonPlayer } from './screens/Lesson'
import { BookToc, ChapterReader, Library } from './screens/Library'
import { Me, Trust } from './screens/Me'
import { Onboarding } from './screens/Onboarding'
import { Quran, SurahReader } from './screens/Quran'
import { StoreProvider, useStore } from './store'
import { Girih, Icon } from './ui'

type Tab = 'home' | 'quran' | 'library' | 'me' | 'trust'

const NAV: { id: Exclude<Tab, 'trust'>; label: string; icon: keyof typeof Icon }[] = [
  { id: 'home', label: 'خانه', icon: 'home' },
  { id: 'quran', label: 'قرآن', icon: 'quote' },
  { id: 'library', label: 'کتابخانه', icon: 'book' },
  { id: 'me', label: 'یادداشت‌ها', icon: 'pen' },
]

/** آنچه روی صفحه باز است (درس‌نامه، سوره، فهرست کتاب یا یک باب) */
type View = { kind: 'lesson'; id: string } | { kind: 'surah'; n: number } | { kind: 'toc'; book: BookMeta } | { kind: 'chapter'; book: BookMeta; sec: number; ch: number } | null

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
    if (!meta) return
    const book = await loadBook(a)
    book.sections.forEach((s, si) => s.chapters.forEach((c, ci) => c.items.some((i) => i.i === Number(b)) && openBook(meta, si, ci)))
  }
  const close = () => {
    setView(back)
    setBack(null)
  }

  if (intro) return <AnimatePresence>{intro && <Intro onDone={endIntro} />}</AnimatePresence>

  if (!p.onboarded)
    return (
      <div className="shell">
        <Girih id="g0" />
        <Onboarding />
      </div>
    )

  const lesson = view?.kind === 'lesson' ? lessonById(view.id) : undefined

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
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'home' && <Home openLesson={openLesson} openQuran={openQuran} openBook={openBook} openPlace={openPlace} goTo={setTab} />}
            {tab === 'quran' && <Quran open={(n) => setView({ kind: 'surah', n })} />}
            {tab === 'library' && <Library openLesson={openLesson} openBook={(b) => openBook(b)} openQuran={() => setTab('quran')} openAt={(b, sec, ch) => openBook(b, sec, ch)} openSurah={(n) => setView({ kind: 'surah', n })} />}
            {tab === 'me' && <Me goTo={setTab} openLesson={openLesson} openMark={openMark} />}
            {tab === 'trust' && <Trust back={() => setTab('home')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="tabbar">
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {Icon[n.icon]}
            {n.label}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {lesson && <LessonPlayer key={lesson.id} lesson={lesson} onClose={close} />}
        {view?.kind === 'surah' && <SurahReader key="surah" n={view.n} onClose={close} go={(n) => setView({ kind: 'surah', n })} />}
        {view?.kind === 'toc' && <BookToc key={`toc-${view.book.id}`} meta={view.book} onClose={close} open={(sec, ch) => (setBack(view), setView({ kind: 'chapter', book: view.book, sec, ch }))} />}
        {view?.kind === 'chapter' && <ChapterReader key={`ch-${view.book.id}`} meta={view.book} sec={view.sec} ch={view.ch} onClose={close} go={(sec, ch) => setView({ ...view, sec, ch })} />}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
