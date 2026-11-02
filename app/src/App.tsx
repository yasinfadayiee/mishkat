import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { lessonById } from './data/lessons'
import { Home, todaysLesson } from './screens/Home'
import { Intro } from './screens/Intro'
import { LessonPlayer } from './screens/Lesson'
import { Library } from './screens/Library'
import { Me, Trust } from './screens/Me'
import { Onboarding } from './screens/Onboarding'
import { Paths } from './screens/Paths'
import { StoreProvider, useStore } from './store'
import { Girih, Icon } from './ui'

type Tab = 'home' | 'paths' | 'library' | 'me' | 'trust'

const NAV: { id: Exclude<Tab, 'trust'>; label: string; icon: keyof typeof Icon }[] = [
  { id: 'home', label: 'امروز', icon: 'home' },
  { id: 'paths', label: 'چله‌ها', icon: 'path' },
  { id: 'library', label: 'کتابخانه', icon: 'book' },
  { id: 'me', label: 'من', icon: 'me' },
]

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
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [intro, setIntro] = useState(!introSeen())
  const lesson = lessonId ? lessonById(lessonId) : undefined
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

  if (intro) return <AnimatePresence>{intro && <Intro onDone={endIntro} />}</AnimatePresence>

  if (!p.onboarded)
    return (
      <div className="shell">
        <Girih id="g0" />
        <Onboarding />
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
            <span>نور کلام، برای زندگی</span>
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
        <div className="rail-foot">نسخهٔ پیش‌نمایش · ۸ درس نخست</div>
      </aside>

      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'home' && <Home openLesson={setLessonId} goTo={setTab} />}
            {tab === 'paths' && <Paths openLesson={setLessonId} />}
            {tab === 'library' && <Library openLesson={setLessonId} />}
            {tab === 'me' && <Me goTo={setTab} />}
            {tab === 'trust' && <Trust back={() => setTab('home')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="tabbar">
        {NAV.map((n, k) => (
          <Fragment key={n.id}>
            {k === 2 && (
              <button className="fab" onClick={() => setLessonId(todaysLesson(p.completed).id)} aria-label="درس امروز">
                <img src="icons/icon-192.png" alt="" />
              </button>
            )}
            <button className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
              {Icon[n.icon]}
              {n.label}
            </button>
          </Fragment>
        ))}
      </nav>

      <AnimatePresence>{lesson && <LessonPlayer key={lesson.id} lesson={lesson} onClose={() => setLessonId(null)} />}</AnimatePresence>
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
