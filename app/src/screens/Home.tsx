import { motion } from 'framer-motion'
import { useState } from 'react'
import { lessonById, lessons } from '../data/lessons'
import { programs, situations } from '../data/paths'
import type { Situation } from '../data/types'
import { dayKey, fa, useStore } from '../store'
import { Icon, Lamp, Sheet } from '../ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'شب‌بخیر'
  if (h < 12) return 'صبح بخیر'
  if (h < 17) return 'روز بخیر'
  return 'عصر بخیر'
}

/** درس امروز: اولین درسِ تمام‌نشده؛ اگر همه تمام شده، چرخشی بر اساس روز */
export function todaysLesson(completed: Record<string, string>) {
  const open = lessons.find((l) => !completed[l.id])
  if (open) return open
  const day = Math.floor(Date.now() / 86400000)
  return lessons[day % lessons.length]
}

export function LessonCard({ id, onOpen, done }: { id: string; onOpen: (id: string) => void; done?: boolean }) {
  const l = lessonById(id)!
  return (
    <button className="lesson-card" onClick={() => onOpen(id)}>
      <div className="art" style={{ backgroundImage: `url(${l.cover})` }}>
        {done && <span className="done-badge">{Icon.check}</span>}
      </div>
      <div className="body">
        <small>{l.topic}</small>
        <b>{l.title}</b>
        <small>
          {fa(l.minutes)} دقیقه · {l.source.kind === 'quran' ? 'قرآن' : l.source.kind === 'nahj' ? 'نهج‌البلاغه' : 'حدیث'}
        </small>
      </div>
    </button>
  )
}

export function Home({ openLesson, goTo }: { openLesson: (id: string) => void; goTo: (tab: 'paths' | 'trust') => void }) {
  const { p, streak, toggleCheckin } = useStore()
  const [sit, setSit] = useState<Situation | null>(null)
  const today = todaysLesson(p.completed)
  const doneToday = p.checkins[dayKey()] ?? []
  const habitsDone = p.habits.filter((h) => doneToday.includes(h.lessonId)).length

  return (
    <>
      <header className="topbar fade-up">
        <div>
          <div className="muted" style={{ fontSize: 14 }}>
            {greeting()}
            {p.name ? `، ${p.name}` : ''}
          </div>
          <div style={{ fontWeight: 800, fontSize: 21 }}>امروز چه چیزی یاد بگیریم؟</div>
        </div>
        <div className="lamp-pill" title="روزهای پیاپی">
          <Lamp level={streak ? Math.min(1, 0.35 + streak / 10) : 0.15} />
          {fa(streak)} روز
        </div>
      </header>

      <motion.button
        className="card hero"
        style={{ marginTop: 18, width: '100%', textAlign: 'right', padding: 0 }}
        onClick={() => openLesson(today.id)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.005 }}
      >
        <div className="hero-art" style={{ backgroundImage: `url(${today.cover})` }} />
        <div className="hero-body">
          <div className="hero-meta">
            <span className="chip">✦ درس امروز</span>
            <span className="chip">{fa(today.minutes)} دقیقه</span>
            <span className="chip">{today.topic}</span>
          </div>
          <h1 className="h1">{today.title}</h1>
          <p>{today.subtitle}</p>
          <span className="btn btn-gold">
            {p.completed[today.id] ? 'مرور دوباره' : 'شروع درس'} {Icon.play}
          </span>
        </div>
      </motion.button>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">معلمِ لحظه‌ها</div>
            <h2 className="h2">الان چه حالی داری؟</h2>
          </div>
        </div>
        <div className="situations">
          {situations.map((s, k) => (
            <motion.button key={s.id} className="situation" onClick={() => setSit(s)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.04 }}>
              <span>{s.emoji}</span>
              {s.label}
            </motion.button>
          ))}
        </div>
      </section>

      {p.habits.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">عمل، نه فقط خواندن</div>
              <h2 className="h2">تمرین‌های امروز</h2>
            </div>
            <span className="chip ok">
              {fa(habitsDone)} از {fa(p.habits.length)}
            </span>
          </div>
          <div className="grid two">
            {p.habits.map((h) => {
              const done = doneToday.includes(h.lessonId)
              return (
                <button key={h.lessonId} className={`habit ${done ? 'done' : ''}`} onClick={() => toggleCheckin(h.lessonId)}>
                  <span className="tick">{done && Icon.check}</span>
                  <span style={{ flex: 1 }}>
                    <span className="habit-text" style={{ display: 'block', fontWeight: 600 }}>
                      {h.short}
                    </span>
                    <small className="muted">از درس «{lessonById(h.lessonId)?.title}»</small>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">گنجینهٔ درس‌ها</div>
            <h2 className="h2">برای زندگی امروز</h2>
          </div>
        </div>
        <div className="scroller">
          {lessons.map((l) => (
            <LessonCard key={l.id} id={l.id} onOpen={openLesson} done={!!p.completed[l.id]} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">چهل روز تا یک عادت تازه</div>
            <h2 className="h2">چله‌ها</h2>
          </div>
          <button className="link" onClick={() => goTo('paths')}>
            همه ←
          </button>
        </div>
        <div className="scroller">
          {programs.slice(0, 4).map((pr) => (
            <button key={pr.id} className="card program-card" style={{ width: 260 }} onClick={() => goTo('paths')}>
              <span className="glowdot" style={{ background: pr.hue }} />
              <div className="eyebrow" style={{ color: pr.hue }}>
                {fa(pr.days)} روز
              </div>
              <b style={{ fontSize: 18, display: 'block', margin: '6px 0 4px' }}>{pr.title}</b>
              <small className="muted">{pr.tagline}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <button className="card trust-banner" onClick={() => goTo('trust')}>
          <span className="shield">{Icon.shield}</span>
          <span style={{ flex: 1 }}>
            <b style={{ display: 'block' }}>هر کلمه، با سند</b>
            <small className="muted">متن آیات و روایات عیناً از منابع معتبر، با درجهٔ اعتبار و لینک تطبیق. ببین چطور.</small>
          </span>
          <span style={{ color: 'var(--gold)' }}>←</span>
        </button>
      </section>

      <Sheet open={!!sit} onClose={() => setSit(null)}>
        {sit && (
          <>
            <div className="eyebrow">
              {sit.emoji} {sit.label}
            </div>
            <h3 className="h2" style={{ margin: '6px 0 4px' }}>
              این درس‌ها برای همین لحظه است
            </h3>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
              چند دقیقه وقت بگذار؛ معلم کنارت است.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {sit.lessons.map((id) => (
                <LessonCard
                  key={id}
                  id={id}
                  done={!!p.completed[id]}
                  onOpen={(x) => {
                    setSit(null)
                    openLesson(x)
                  }}
                />
              ))}
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}
