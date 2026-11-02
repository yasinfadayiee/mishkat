import { motion, useScroll, useTransform } from 'framer-motion'
import { useState } from 'react'
import { CHAPTERS, lessonById, lessons } from '../data/lessons'
import { programs, situations } from '../data/paths'
import type { Situation } from '../data/types'
import { ArchFrame, LightDust, Ornament, Stars, Tilt, skyPhase } from '../fx'
import { dayKey, fa, useStore } from '../store'
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
  const shamsi = d.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })
  let qamari = ''
  try {
    qamari = d.toLocaleDateString('fa-IR-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' })
  } catch {
    /* تقویم قمری پشتیبانی نشد */
  }
  return { shamsi, qamari }
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
    <button className="lesson-arch" onClick={() => onOpen(id)}>
      <ArchFrame>
        <div className="lesson-arch-art" style={{ backgroundImage: `url(${l.cover})` }} />
        <div className="lesson-arch-shade" />
        {done && <span className="done-badge">{Icon.check}</span>}
        <div className="lesson-arch-body">
          <small>{l.topic}</small>
          <b>{l.title}</b>
        </div>
      </ArchFrame>
      <span className="lesson-arch-meta">
        {fa(l.minutes)} دقیقه · {l.source.kind === 'quran' ? 'قرآن' : l.source.kind === 'nahj' ? 'نهج‌البلاغه' : 'حدیث'}
      </span>
    </button>
  )
}

/** مسیر نور: هر منزل، هشت ایستگاه روی یک راهِ پیچ‌درپیچ */
function JourneyPath({ onOpen }: { onOpen: (id: string) => void }) {
  const { p } = useStore()
  const firstOpen = CHAPTERS.findIndex((c) => c.lessons.some((id) => lessonById(id) && !p.completed[id]))
  const [ci, setCi] = useState(firstOpen === -1 ? 0 : firstOpen)
  const chapter = CHAPTERS[ci]
  const items = chapter.lessons.map((id) => lessonById(id)).filter((l) => !!l)
  const offset = CHAPTERS.slice(0, ci).reduce((n, c) => n + c.lessons.length, 0)
  const current = items.findIndex((l) => !p.completed[l!.id])
  const xs = [50, 76, 50, 24]
  const step = 175
  const pts = items.map((_, i) => ({ x: xs[i % xs.length], y: 150 + i * step }))
  const d = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M${pt.x} ${pt.y}`
    const prev = pts[i - 1]
    const my = (prev.y + pt.y) / 2
    return `${acc} C${prev.x} ${my} ${pt.x} ${my} ${pt.x} ${pt.y}`
  }, '')
  const height = 150 + (items.length - 1) * step + 100
  const doneUpTo = current === -1 ? items.length - 1 : current

  return (
    <>
      <div className="scroller chapter-row">
        {CHAPTERS.map((c, k) => {
          const done = c.lessons.filter((id) => p.completed[id]).length
          return (
            <button key={c.id} className={`chapter-chip ${k === ci ? 'on' : ''}`} onClick={() => setCi(k)}>
              <small>منزل {fa(k + 1)}</small>
              <b>{c.title}</b>
              <span className="chapter-bar">
                <i style={{ width: `${(done / c.lessons.length) * 100}%` }} />
              </span>
            </button>
          )
        })}
      </div>
      <div className="journey" style={{ height }} key={chapter.id}>
        <div className="journey-bg" style={{ backgroundImage: 'url(art/home-night.webp)' }} />
        <div className="journey-title">
          <span className="gold-text">منزل {fa(ci + 1)}: {chapter.title}</span>
          <small>{chapter.subtitle}</small>
        </div>
        <svg className="journey-line" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="pathGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff0c2" />
              <stop offset="1" stopColor="#b98b3f" />
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth="10" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".35" />
          <path d={d} fill="none" stroke="var(--gold)" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <motion.path
            d={d}
            fill="none"
            stroke="url(#pathGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,200,110,.8))' }}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: Math.max(0.02, doneUpTo / Math.max(1, items.length - 1)) }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </svg>
        {items.map((l, i) => {
          const state = p.completed[l!.id] ? 'done' : i === current ? 'current' : 'next'
          return (
            <motion.button
              key={l!.id}
              className={`node node-${state}`}
              style={{ left: `${pts[i].x}%`, top: pts[i].y }}
              onClick={() => onOpen(l!.id)}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ type: 'spring', damping: 14, delay: 0.05 }}
            >
              <span className="node-ring">
                <span className="node-art" style={{ backgroundImage: `url(${l!.cover})` }} />
                {state === 'done' && <span className="node-check">{Icon.check}</span>}
              </span>
              {state === 'current' && <span className="node-flag">اینجا هستی</span>}
              <span className="node-label">
                <small>ایستگاه {fa(offset + i + 1)}</small>
                {l!.title}
              </span>
            </motion.button>
          )
        })}
      </div>
    </>
  )
}

export function Home({ openLesson, goTo }: { openLesson: (id: string) => void; goTo: (tab: 'paths' | 'trust') => void }) {
  const { p, streak, toggleCheckin } = useStore()
  const [sit, setSit] = useState<Situation | null>(null)
  const today = todaysLesson(p.completed)
  const doneToday = p.checkins[dayKey()] ?? []
  const habitsDone = p.habits.filter((h) => doneToday.includes(h.lessonId)).length
  const phase = skyPhase()
  const { shamsi, qamari } = dates()
  const { scrollY } = useScroll()
  const artY = useTransform(scrollY, [0, 600], [0, 140])
  const skyY = useTransform(scrollY, [0, 600], [0, 60])
  const shortOnes = lessons.filter((l) => l.source.arabic.length < 140)
  const wordLesson = shortOnes[Math.floor(Date.now() / 86400000) % shortOnes.length]
  const word = wordLesson.source

  return (
    <div className="home">
      <section className={`scene has-art phase-${phase}`}>
        <motion.div className="scene-sky" style={{ y: skyY }} />
        {phase !== 'day' && <Stars count={phase === 'night' ? 150 : 60} />}
        {phase === 'night' && <div className="scene-moon" />}
        <motion.div className="scene-art" style={{ y: artY, backgroundImage: 'url(art/home-night.webp)' }} />
        <LightDust density={36} />
        <div className="scene-fade" />
        <div className="scene-content">
          <div className="scene-top">
            <div>
              <div className="scene-date">
                {shamsi}
                {qamari && <span> · {qamari}</span>}
              </div>
              <div className="scene-hello">
                {greeting()}
                {p.name ? `، ${p.name}` : ''}
              </div>
            </div>
            <div className="streak-badge" title="روزهای پیاپی">
              <span className="streak-lamp" style={{ filter: `brightness(${streak ? 1 : 0.55}) saturate(${streak ? 1.1 : 0.5})` }}>
                <img src="icons/hero-lamp.webp" alt="" />
              </span>
              <b>{fa(streak)}</b>
              <small>روز</small>
            </div>
          </div>
          <motion.h1 className="scene-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
            امروز یک چراغ
            <br />
            <span className="gold-text">برای زندگی‌ات</span>
          </motion.h1>
        </div>
      </section>

      <div className="home-body">
        <motion.div className="today" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}>
          <Tilt className="today-tilt">
            <button className="today-card" onClick={() => openLesson(today.id)}>
              <ArchFrame glow>
                <div className="today-art" style={{ backgroundImage: `url(${today.cover})` }} />
                <div className="today-shade" />
                <div className="today-body">
                  <span className="chip chip-glass">✦ درس امروز · {fa(today.minutes + (today.sharh ? today.sharh.parts.length * 2 : 0))} دقیقه</span>
                  <h2>{today.title}</h2>
                  <p>{today.subtitle}</p>
                  <span className="btn btn-gold btn-shine">
                    {p.completed[today.id] ? 'خواندن دوباره' : 'خواندن درس'} {Icon.play}
                  </span>
                </div>
              </ArchFrame>
            </button>
          </Tilt>
        </motion.div>

        {today.sharh && (
          <motion.button className="today-essence" onClick={() => openLesson(today.id)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>
            <span className="te-kicker">آنچه امروز می‌فهمی</span>
            <p>{today.sharh.essence}</p>
            <span className="te-meta">
              {Icon.teacher} {fa(today.sharh.parts.length)} جمله، یکی‌یکی شرح داده شده
            </span>
          </motion.button>
        )}

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">معلمِ لحظه‌ها</div>
              <h2 className="h2">الان چه حالی داری؟</h2>
            </div>
          </div>
          <div className="scroller mood-row">
            {situations.map((s, k) => (
              <motion.button key={s.id} className="mood" onClick={() => setSit(s)} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.05 }}>
                <span className="mood-emoji">{s.emoji}</span>
                <span>{s.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="word-card card">
            <div className="word-card-bg" style={{ backgroundImage: `url(${wordLesson.cover})` }} />
            <div className="eyebrow" style={{ justifyContent: 'center' }}>
              کلام روز
            </div>
            <Ornament />
            <ArabicText kind={word.kind} text={word.arabic} className="word-card-text" />
            <p className="word-card-fa">{word.translation}</p>
            <div className="word-card-ref">
              {word.speaker ? `${word.speaker} · ` : ''}
              {word.ref}
            </div>
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
                  <motion.button key={h.lessonId} className={`habit ${done ? 'done' : ''}`} onClick={() => toggleCheckin(h.lessonId)} whileTap={{ scale: 0.97 }}>
                    <span className="tick">{done && Icon.check}</span>
                    <span style={{ flex: 1 }}>
                      <span className="habit-text" style={{ display: 'block', fontWeight: 600 }}>
                        {h.short}
                      </span>
                      <small className="muted">از درس «{lessonById(h.lessonId)?.title}»</small>
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">قدم‌به‌قدم</div>
              <h2 className="h2">مسیر نور</h2>
            </div>
            <span className="chip">
              {fa(Object.keys(p.completed).length)} از {fa(lessons.length)} ایستگاه
            </span>
          </div>
          <JourneyPath onOpen={openLesson} />
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
            {programs.map((pr) => (
              <button key={pr.id} className="chelle-card" onClick={() => goTo('paths')} style={{ ['--hue' as string]: pr.hue }}>
                <span className="chelle-num">{fa(pr.days)}</span>
                <span className="chelle-glow" />
                <b>{pr.title}</b>
                <small>{pr.tagline}</small>
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
      </div>

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
              {sit.lessons.filter((id) => lessonById(id)).map((id) => (
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
    </div>
  )
}
