import { m } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { chapterOf, lessonById, lessons } from '../data/lessons'
import type { Lesson, Word } from '../data/types'
import { fa, useStore } from '../store'
import { LightDust, Ornament } from '../fx'
import { ArabicText, GradingChip, Icon, Recitation } from '../ui'

const CARTOUCHE = 'M50,0 C58,5 70,7 84,7 C93,7 100,13 100,22 L100,78 C100,87 93,93 84,93 C70,93 58,95 50,100 C42,95 30,93 16,93 C7,93 0,87 0,78 L0,22 C0,13 7,7 16,7 C30,7 42,5 50,0 Z'
const kindLabel = { quran: 'قرآن کریم', nahj: 'نهج‌البلاغه', hadith: 'حدیث' }

// برای پیدا کردن واژه‌های هر تکه، حرکات و شکل‌های مختلف الف و یاء یکسان گرفته می‌شود
const bare = (t: string) =>
  t
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/[،؛.:!؟«»()﴿﴾]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const SCALE_KEY = 'mishkat.textScale'
const readScale = () => {
  try {
    return Number(localStorage.getItem(SCALE_KEY)) || 1
  } catch {
    return 1
  }
}

/* ستارهٔ هشت‌پر با شماره، برای هر تکهٔ شرح */
function Medallion({ n }: { n: number }) {
  return (
    <div className="medallion" aria-hidden>
      <svg viewBox="0 0 40 40">
        <rect x="8" y="8" width="24" height="24" rx="2" />
        <rect x="8" y="8" width="24" height="24" rx="2" transform="rotate(45 20 20)" />
      </svg>
      <span>{fa(n)}</span>
    </div>
  )
}

function Section({ id, icon, kicker, title, children }: { id: string; icon: keyof typeof Icon; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="study-section" id={`s-${id}`} data-sec={id}>
      <header className="sec-head">
        <span className="sec-icon">{Icon[icon]}</span>
        <div>
          <div className="sec-kicker">{kicker}</div>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  )
}

export default function LessonScreen({ id, onClose }: { id: string; onClose: () => void }) {
  const lesson = lessonById(id)
  return lesson ? <LessonPlayer key={id} lesson={lesson} onClose={onClose} /> : null
}

export function LessonPlayer({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { completeLesson, adoptHabit, addJournal, toggleSaved, p } = useStore()
  const isSaved = p.saved.includes(lesson.id)
  const scroller = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('intro')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [done, setDone] = useState(false)
  const [scale, setScale] = useState(readScale)
  const s = lesson.source
  const sh = lesson.sharh
  const adopted = p.habits.some((h) => h.lessonId === lesson.id)
  const chapter = chapterOf(lesson.id)
  const station = lessons.findIndex((l) => l.id === lesson.id) + 1

  const toc = useMemo(
    () =>
      [
        ['intro', 'آغاز'],
        ['text', 'متن'],
        ['sharh', sh ? 'شرح جمله‌به‌جمله' : 'واژه‌ها'],
        ...(sh?.misread.length ? [['misread', 'برداشت نادرست']] : []),
        ['lessons', 'درس‌ها'],
        ...(lesson.mirror ? [['life', 'آینهٔ زندگی']] : []),
        ...(lesson.parallels.length ? [['parallels', 'هم‌صدا']] : []),
        ['act', 'عمل'],
      ] as [string, string][],
    [lesson, sh],
  )

  // نوار پیشرفت مطالعه و بخش فعال فهرست
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? el.scrollTop / max : 0)
      const secs = [...el.querySelectorAll<HTMLElement>('[data-sec]')]
      const top = el.getBoundingClientRect().top + 140
      let cur = secs[0]?.dataset.sec ?? 'intro'
      for (const x of secs) if (x.getBoundingClientRect().top <= top) cur = x.dataset.sec!
      setActive(cur)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SCALE_KEY, String(scale))
    } catch {
      /* حافظهٔ مرورگر در دسترس نیست */
    }
  }, [scale])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // چیپ فعال فهرست همیشه در دید بماند
  // (scrollIntoView صفحه را هم جابه‌جا می‌کند، پس فقط نوار افقی اسکرول می‌شود)
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.study-toc')
    const chip = bar?.querySelector<HTMLElement>(`[data-to="${active}"]`)
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const jump = (id: string) => {
    const el = scroller.current
    const target = el?.querySelector<HTMLElement>(`#s-${id}`)
    if (el && target) el.scrollTo({ top: el.scrollTop + target.getBoundingClientRect().top - el.getBoundingClientRect().top - 104, behavior: 'smooth' })
  }

  const wordsIn = (ar: string): Word[] => lesson.words.filter((w) => bare(ar).includes(bare(w.ar)))

  const finish = () => {
    if (note.trim() && !saved) addJournal(lesson.id, note.trim())
    completeLesson(lesson.id)
    setDone(true)
  }

  return (
    <m.div className="study" style={{ ['--ts' as string]: scale }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}>
      <div className="study-progress">
        <b style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="study-bar">
        <button className="icon-btn" onClick={onClose} aria-label="بستن">
          {Icon.close}
        </button>
        <div className={`study-bar-title ${progress > 0.06 ? 'on' : ''}`}>{lesson.title}</div>
        <button className={`icon-btn ${isSaved ? 'saved' : ''}`} onClick={() => toggleSaved(lesson.id)} aria-label={isSaved ? 'برداشتن نشان' : 'نشان کردن درس'}>
          {isSaved ? Icon.bookmarked : Icon.bookmark}
        </button>
        <div className="text-size" role="group" aria-label="اندازهٔ متن">
          <button onClick={() => setScale((x) => Math.max(0.9, +(x - 0.1).toFixed(1)))} aria-label="متن کوچک‌تر">
            آ<sub>−</sub>
          </button>
          <button onClick={() => setScale((x) => Math.min(1.4, +(x + 0.1).toFixed(1)))} aria-label="متن بزرگ‌تر">
            آ<sup>+</sup>
          </button>
        </div>
      </div>

      <div className="study-scroll" ref={scroller}>
        <header className="study-hero">
          <div className="study-hero-art" style={{ backgroundImage: `url(${lesson.cover})` }} />
          <LightDust density={22} />
          <div className="study-hero-fade" />
          <div className="study-hero-text">
            <div className="study-kicker">
              {chapter ? `منزل ${chapter.title}` : lesson.topic} · ایستگاه {fa(station)}
            </div>
            <h1>{lesson.title}</h1>
            <p>{lesson.subtitle}</p>
            <div className="study-meta">
              <span>{kindLabel[s.kind]}</span>
              <span>{s.ref}</span>
              <span>{fa(lesson.minutes + (sh ? sh.parts.length * 2 : 0))} دقیقه مطالعه</span>
            </div>
          </div>
        </header>

        <nav className="study-toc">
          {toc.map(([id, label]) => (
            <button key={id} data-to={id} className={active === id ? 'on' : ''} onClick={() => jump(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="study-body">
          <Section id="intro" icon="story" kicker="پیش از خواندن" title={lesson.hook.title}>
            <p className="prose lead">{lesson.hook.body}</p>
          </Section>

          <Section id="text" icon="quote" kicker="متن اصلی" title={s.speaker ? `سخن ${s.speaker}` : 'کلام خداوند'}>
            <div className="cartouche">
              <div className="cartouche-glass" />
              <svg className="cartouche-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="cartGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff0c2" />
                    <stop offset="0.4" stopColor="#e6c27d" />
                    <stop offset="0.75" stopColor="#a8772f" />
                    <stop offset="1" stopColor="#f3d999" />
                  </linearGradient>
                </defs>
                <path d={CARTOUCHE} fill="none" stroke="url(#cartGold)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d={CARTOUCHE} fill="none" stroke="rgba(255,236,190,.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" transform="translate(3 4) scale(.94 .92)" />
              </svg>
              <Ornament width={120} />
              <div className="speaker">{s.speaker ? `${s.speaker} فرمود:` : 'خداوند می‌فرماید:'}</div>
              <div className={`${s.kind === 'quran' ? 'quran' : 'arabic'} verse-text`} lang="ar">
                {(s.kind === 'quran' ? `﴿ ${s.arabic} ﴾` : s.arabic).split(' ').map((w, k) => (
                  <m.span
                    key={k}
                    className="reveal-word"
                    initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + k * 0.08, duration: 0.5 }}
                  >
                    {w}&nbsp;
                  </m.span>
                ))}
              </div>
              <p className="translation">{s.translation}</p>
              <div className="source-line">
                <span className="chip">{s.ref}</span>
                {s.grading && <GradingChip g={s.grading} />}
              </div>
            </div>
            <div className="text-actions">
              {s.ayah && <Recitation {...s.ayah} />}
              <a className="btn btn-ghost" href={s.verifyUrl} target="_blank" rel="noreferrer">
                {Icon.shield} تطبیق با منبع
              </a>
            </div>
            <p className="muted tiny center">ترجمه: {s.translator}</p>
            {sh && (
              <m.blockquote className="essence" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <span>پیام اصلی</span>
                {sh.essence}
              </m.blockquote>
            )}
          </Section>

          {sh ? (
            <Section id="sharh" icon="teacher" kicker="معلم کنار توست" title="شرح جمله‌به‌جمله">
              <p className="prose muted-prose">متن را تکه‌تکه با هم می‌خوانیم. برای هر تکه اول می‌بینی دقیقاً چه می‌گوید، بعد لایهٔ عمیق‌ترش، و در آخر جایش در زندگی امروز تو.</p>
              <div className="sharh">
                {sh.parts.map((part, k) => {
                  const ws = wordsIn(part.ar)
                  return (
                    <m.article key={k} className="sharh-part" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
                      <Medallion n={k + 1} />
                      <div className="sp-card">
                        <ArabicText kind={s.kind} text={part.ar} className="sp-ar" />
                        <p className="sp-fa">{part.fa}</p>
                        {ws.length > 0 && (
                          <div className="sp-words">
                            {ws.map((w, j) => (
                              <span key={j}>
                                <b lang="ar">{w.ar}</b>
                                {w.fa}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="sp-h">یعنی چه؟</h3>
                        <p className="prose">{part.plain}</p>
                        <div className="sp-deep">
                          <h3 className="sp-h">
                            {Icon.spark} ژرف‌تر
                          </h3>
                          <p className="prose">{part.deep}</p>
                        </div>
                        <div className="sp-life">
                          {Icon.life}
                          <p>{part.life}</p>
                        </div>
                      </div>
                    </m.article>
                  )
                })}
              </div>
            </Section>
          ) : (
            <Section id="sharh" icon="words" kicker="کلمه به کلمه" title="واژه‌های کلیدی">
              <div className="words">
                {lesson.words.map((w, k) => (
                  <div key={k} className="word">
                    <span className="ar">{w.ar}</span>
                    <span className="fa">{w.fa}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {sh && sh.misread.length > 0 && (
            <Section id="misread" icon="shield" kicker="مراقب باش" title="برداشت‌های نادرست">
              {sh.misread.map((m, k) => (
                <div key={k} className="misread">
                  <div className="mr-wrong">
                    <i>✕</i>
                    <p>
                      <b>برداشت نادرست</b>
                      {m.wrong}
                    </p>
                  </div>
                  <div className="mr-right">
                    <i>✓</i>
                    <p>
                      <b>آنچه متن می‌گوید</b>
                      {m.right}
                    </p>
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section id="lessons" icon="target" kicker="از این سخن چه بیاموزیم" title="سه درس برای زندگی">
            {lesson.teacher.map((t, k) => (
              <div key={k} className="card point">
                <div className="num">{fa(k + 1)}</div>
                <div>
                  <h4>{t.title}</h4>
                  <p>{t.body}</p>
                </div>
              </div>
            ))}
          </Section>

          {lesson.mirror && (
            <Section id="life" icon="life" kicker="خودت را در این سخن ببین" title="در آینهٔ زندگی تو">
              <p className="prose lead-sm">{lesson.mirror.intro}</p>
              <ul className="mirror-moments">
                {lesson.mirror.moments.map((m, k) => (
                  <li key={k}>{m}</li>
                ))}
              </ul>
              <div className="mirror-box">
                <h3 className="sp-h">از خودت بپرس</h3>
                {lesson.mirror.signs.map((q, k) => (
                  <p key={k} className="mirror-q">
                    {q}
                  </p>
                ))}
              </div>
              <div className="mirror-box turn">
                <h3 className="sp-h">{Icon.target} دفعهٔ بعد</h3>
                <ol>
                  {lesson.mirror.turn.map((t, k) => (
                    <li key={k}>{t}</li>
                  ))}
                </ol>
              </div>
            </Section>
          )}

          {lesson.parallels.length > 0 && (
            <Section id="parallels" icon="link" kicker="این سخن تنها نیست" title="هم‌صدا با این کلام">
              {lesson.parallels.map((x, k) => (
                <div key={k} className="card parallel">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`chip ${x.school === 'sunni' ? '' : 'ok'}`}>{x.school === 'quran' ? 'قرآن' : x.school === 'shia' ? 'منابع شیعه' : 'منابع اهل سنت'}</span>
                    <b style={{ fontSize: 14.5 }}>{x.label}</b>
                  </div>
                  <ArabicText kind={x.school === 'quran' ? 'quran' : 'shia'} text={x.arabic} />
                  <p>{x.translation}</p>
                  <div className="source-line" style={{ justifyContent: 'flex-start' }}>
                    <span className="chip">{x.ref}</span>
                    {x.grading && <GradingChip g={x.grading} />}
                    <a className="chip" href={x.verifyUrl} target="_blank" rel="noreferrer">
                      تطبیق ↗
                    </a>
                  </div>
                  {x.note && <div className="note">{x.note}</div>}
                </div>
              ))}
            </Section>
          )}

          <Section id="act" icon="pen" kicker="از دانستن تا شدن" title={lesson.practice.title}>
            <div className="card act-card">
              {lesson.practice.steps.map((t, k) => (
                <div key={k} className="practice-step">
                  <i>{fa(k + 1)}</i>
                  <span>{t}</span>
                </div>
              ))}
              <button className={`btn ${adopted ? 'btn-ghost' : 'btn-gold'}`} style={{ width: '100%', marginTop: 14 }} onClick={() => adoptHabit(lesson.id, lesson.practice.short)}>
                {adopted ? <>{Icon.check} در تمرین‌های روزانه‌ات است</> : 'این را تمرین روزانه‌ام می‌کنم'}
              </button>
            </div>
            <div className="reflect">
              <div className="sec-kicker">با خودت خلوت کن</div>
              <p className="reflect-q">{lesson.reflect}</p>
              <textarea className="journal-input" placeholder="چند خط برای خودت بنویس… فقط خودت می‌بینی." value={note} onChange={(e) => (setNote(e.target.value), setSaved(false))} />
              {note.trim() && (
                <button className="btn btn-ghost" disabled={saved} onClick={() => (addJournal(lesson.id, note.trim()), setSaved(true))}>
                  {saved ? <>{Icon.check} در دفترت ذخیره شد</> : 'ذخیره در دفتر من'}
                </button>
              )}
            </div>
          </Section>

          <div className="study-end">
            <Ornament width={160} />
            <button className={`btn ${done || p.completed[lesson.id] ? 'btn-ghost' : 'btn-gold'}`} onClick={finish}>
              {done || p.completed[lesson.id] ? <>{Icon.check} خوانده شد</> : 'علامت بزن: این درس را خواندم'}
            </button>
            <p className="muted tiny">پیش‌نویس شرح‌ها هنوز در انتظار تأیید کارشناس است؛ متن‌های عربی با منبع تطبیق داده شده‌اند.</p>
          </div>
        </div>
      </div>

    </m.div>
  )
}
