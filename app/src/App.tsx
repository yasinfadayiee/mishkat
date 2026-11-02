import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { lessonById } from './data/lessons'
import { Home } from './screens/Home'
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

function Shell() {
  const { p } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [lessonId, setLessonId] = useState<string | null>(null)
  const lesson = lessonId ? lessonById(lessonId) : undefined

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

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
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'on' : ''} onClick={() => setTab(n.id)}>
            {Icon[n.icon]}
            {n.label}
          </button>
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
