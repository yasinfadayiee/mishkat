import { AnimatePresence, LazyMotion, m } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findItem, loadIndex, type BookMeta, type Place } from './books'
import { ErrorBoundary, LoadFail, Skeleton, useLoad } from './load'
import { scheduleReminders } from './reminder'
import { back, canGoBack, go, href, useRoute, type Tab } from './router'
import { Home } from './screens/Home'
import { onToast } from './share'
import { StoreProvider, useStore } from './store'
import { Girih, Icon } from './ui'
import { VERSION } from './version'

// فقط خانه همراه فایل اول می‌آید؛ بقیهٔ صفحه‌ها جدا بار می‌شوند (و پس از باز شدن خانه، در پس‌زمینه از پیش گرفته می‌شوند)
const loadBookScreens = () => import('./screens/Book')
const loadQuran = () => import('./screens/Quran')
const loadLibrary = () => import('./screens/Library')
const loadMe = () => import('./screens/Me')
const loadSearch = () => import('./screens/Search')
const BookToc = lazy(() => loadBookScreens().then((x) => ({ default: x.BookToc })))
const ChapterReader = lazy(() => loadBookScreens().then((x) => ({ default: x.ChapterReader })))
const Quran = lazy(() => loadQuran().then((x) => ({ default: x.Quran })))
const SurahReader = lazy(() => loadQuran().then((x) => ({ default: x.SurahReader })))
const Library = lazy(() => loadLibrary().then((x) => ({ default: x.Library })))
const Me = lazy(() => loadMe().then((x) => ({ default: x.Me })))
const Settings = lazy(() => loadMe().then((x) => ({ default: x.Settings })))
const SearchPage = lazy(() => loadSearch().then((x) => ({ default: x.SearchPage })))
const LessonScreen = lazy(() => import('./screens/Lesson'))
const TopicReader = lazy(() => import('./screens/Topics').then((x) => ({ default: x.TopicReader })))
const Trust = lazy(() => import('./screens/Trust').then((x) => ({ default: x.Trust })))
const Onboarding = lazy(() => import('./screens/Onboarding').then((x) => ({ default: x.Onboarding })))
const Intro = lazy(() => import('./screens/Intro').then((x) => ({ default: x.Intro })))
const prefetch = () => [loadBookScreens, loadQuran, loadLibrary, loadMe, loadSearch].forEach((f) => f().catch(() => {}))
const loadMotion = () => import('./motion-features').then((x) => x.default)

type NavTab = 'home' | 'quran' | 'library' | 'notes'
const NAV: { id: NavTab; label: string; icon: keyof typeof Icon }[] = [
  { id: 'home', label: 'خانه', icon: 'home' },
  { id: 'quran', label: 'قرآن', icon: 'rahl' },
  { id: 'library', label: 'کتابخانه', icon: 'book' },
  { id: 'notes', label: 'دفتر من', icon: 'pen' },
]
const tabPath = (t: Tab) => (t === 'home' ? '/' : `/${t}`)

const introSeen = () => {
  try {
    return sessionStorage.getItem('mishkat.intro') === '1'
  } catch {
    return false
  }
}

/** کتابی که در نشانی آمده: اول مشخصاتش از فهرست کتابخانه گرفته می‌شود */
function WithBook({ id, children }: { id: string; children: (meta: BookMeta) => React.ReactNode }) {
  const idx = useLoad(loadIndex, [])
  const meta = idx.data?.books.find((b) => b.id === id)
  if (idx.error)
    return (
      <div className="study reader">
        <div className="reader-scroll">
          <div className="reader-body">
            <LoadFail error={idx.error} retry={idx.retry} what="این کتاب" />
          </div>
        </div>
      </div>
    )
  if (!idx.data) return null
  if (!meta) {
    go('/library', true)
    return null
  }
  return <>{children(meta)}</>
}

/** پیام کوتاه (مثلاً «پیوند رونوشت شد») */
function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    onToast((m) => {
      setMsg(m)
      clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2400)
    })
    return () => onToast(null)
  }, [])
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg && <span>{msg}</span>}
    </div>
  )
}

function Shell() {
  const { p } = useStore()
  const route = useRoute()
  // زیر صفحه‌های تمام‌صفحه (سوره، باب، درس) همان زبانهٔ قبلی می‌ماند
  const [lastTab, setLastTab] = useState<Tab>(route.tab ?? 'home')
  const tab = route.tab ?? lastTab
  useEffect(() => {
    if (route.tab) setLastTab(route.tab)
  }, [route.tab])
  const view = route.view
  const [intro, setIntro] = useState(!introSeen())
  const endIntro = useCallback(() => {
    setIntro(false)
    try {
      sessionStorage.setItem('mishkat.intro', '1')
    } catch {
      /* بدون ذخیره هم ادامه می‌دهیم */
    }
  }, [])

  // جای اسکرول هر زبانه هنگام رفت‌وبرگشت حفظ می‌شود
  const scrolls = useRef<Record<string, number>>({})
  const shown = useRef(tab)
  useLayoutEffect(() => {
    if (shown.current === tab) return
    scrolls.current[shown.current] = window.scrollY
    shown.current = tab
    const y = scrolls.current[tab] ?? 0
    let n = 0
    const restore = () => {
      window.scrollTo({ top: y })
      if (Math.abs(window.scrollY - y) > 2 && n++ < 20) requestAnimationFrame(restore)
    }
    restore()
  }, [tab])

  // پس از نخستین نمایش، صفحه‌های دیگر آرام در پس‌زمینه گرفته می‌شوند تا جابه‌جایی بی‌مکث باشد
  useEffect(() => {
    const t = setTimeout(prefetch, 2500)
    return () => clearTimeout(t)
  }, [])

  // دکمهٔ بازگشت اندروید: یک پله در تاریخچه؛ فقط در خانه برنامه بسته می‌شود
  useEffect(() => {
    let off: (() => void) | undefined
    import('@capacitor/core').then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return
      const { App } = await import('@capacitor/app')
      const h = await App.addListener('backButton', () => {
        const r = location.hash.replace(/^#/, '') || '/'
        if (document.querySelector('.sheet-backdrop')) return window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        if (r === '/' && !canGoBack()) return App.exitApp()
        back('/')
      })
      off = () => h.remove()
    })
    return () => off?.()
  }, [])

  // میان‌برهای صفحه‌کلید (دسکتاپ): «/» برای جست‌وجو
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        go('/search')
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  // یادآورهای روزانه با هر بار باز شدن برنامه برای ۳۰ روز آینده تازه می‌شوند
  const remindHour = p.remindHour
  useEffect(() => {
    if (remindHour !== undefined && remindHour !== null) scheduleReminders(remindHour).catch(() => {})
  }, [remindHour])

  const openPlace = (pl: Place) => go(pl.book === 'quran' ? href.surah(pl.sec, pl.i) : href.chapter(pl.book, pl.sec, pl.ch, pl.i))
  // متن نشان‌شده یا یادداشت: q:سوره:آیه یا b:کتاب:شناسه
  const openMark = async (key: string) => {
    const [k, a, b] = key.split(':')
    if (k === 'q') return go(href.surah(Number(a), Number(b)))
    const at = await findItem(a, Number(b)).catch(() => null)
    if (at) go(href.chapter(a, at[0], at[1], Number(b)))
  }
  const close = (fallback: string) => () => back(fallback)

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

  const navOn = (id: NavTab) => tab === id || (id === 'notes' && tab === 'settings')

  return (
    <div className="shell">
      <a className="skip-link" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        رفتن به محتوا
      </a>
      <Girih />
      <aside className="rail" aria-label="بخش‌ها">
        <div className="brand">
          <img src="icons/icon-192.png" alt="" />
          <div>
            <b>مِشکات</b>
            <span>کتابخانهٔ قرآن و حدیث</span>
          </div>
        </div>
        <nav role="tablist" aria-label="بخش‌های برنامه">
          {NAV.map((n) => (
            <button key={n.id} role="tab" aria-selected={navOn(n.id)} aria-current={navOn(n.id) ? 'page' : undefined} className={navOn(n.id) ? 'on' : ''} onClick={() => go(tabPath(n.id))}>
              {Icon[n.icon]} {n.label}
            </button>
          ))}
          <button role="tab" aria-selected={tab === 'search'} aria-current={tab === 'search' ? 'page' : undefined} className={tab === 'search' ? 'on' : ''} onClick={() => go('/search')}>
            {Icon.search} جست‌وجو
          </button>
          <button role="tab" aria-selected={tab === 'trust'} aria-current={tab === 'trust' ? 'page' : undefined} className={tab === 'trust' ? 'on' : ''} onClick={() => go('/trust')}>
            {Icon.shield} زنجیرهٔ اعتبار
          </button>
        </nav>
        <div className="rail-foot">
          نسخهٔ {VERSION}
          <span>ترجمه‌ها و شرح‌ها پیش‌نویس‌اند و در انتظار بازبینی کارشناس.</span>
        </div>
      </aside>

      <main className="main" id="main" tabIndex={-1}>
        <Suspense fallback={<div className="tab-wait" />}>
          <m.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
            {tab === 'home' && <Home openPlace={openPlace} />}
            {tab === 'quran' && <Quran />}
            {tab === 'library' && <Library sub={route.tab === 'library' ? route.sub : undefined} />}
            {tab === 'notes' && <Me openMark={openMark} />}
            {tab === 'settings' && <Settings />}
            {tab === 'search' && <SearchPage initial={route.q.get('q') ?? ''} />}
            {tab === 'trust' && <Trust back={() => back('/')} />}
          </m.div>
        </Suspense>
      </main>

      <nav className="tabbar" role="tablist" aria-label="بخش‌های برنامه">
        {NAV.map((n) => (
          <button key={n.id} role="tab" aria-selected={navOn(n.id)} aria-current={navOn(n.id) ? 'page' : undefined} className={navOn(n.id) ? 'on' : ''} onClick={() => go(tabPath(n.id))}>
            {Icon[n.icon]}
            {n.label}
          </button>
        ))}
      </nav>

      <Suspense fallback={<div className="study reader"><div className="reader-scroll"><div className="reader-body"><Skeleton kind="reader" rows={3} /></div></div></div>}>
        <AnimatePresence>
          {view?.kind === 'lesson' && <LessonScreen key={`lesson-${view.id}`} id={view.id} onClose={close(tabPath(lastTab))} />}
          {view?.kind === 'surah' && <SurahReader key="surah" n={view.n} ayah={view.ayah} onClose={close('/quran')} />}
          {view?.kind === 'topic' && <TopicReader key={`topic-${view.id}`} id={view.id} onClose={close('/library/topics')} />}
          {view?.kind === 'toc' && <WithBook key={`toc-${view.book}`} id={view.book}>{(meta) => <BookToc meta={meta} onClose={close('/library')} />}</WithBook>}
          {view?.kind === 'chapter' && (
            <WithBook key={`ch-${view.book}`} id={view.book}>
              {(meta) => <ChapterReader meta={meta} sec={view.sec} ch={view.ch} focus={view.focus} onClose={close(href.toc(view.book))} />}
            </WithBook>
          )}
        </AnimatePresence>
      </Suspense>
      <Toaster />
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
