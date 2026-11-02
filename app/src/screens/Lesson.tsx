import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Lesson } from '../data/types'
import { fa, useStore } from '../store'
import { ArabicText, GradingChip, Icon, Recitation, Sparks } from '../ui'

type StepId = 'hook' | 'source' | 'words' | 'teacher' | 'example' | 'parallels' | 'quiz' | 'practice' | 'reflect' | 'finish'

const STEP_LABEL: Record<StepId, [string, keyof typeof Icon]> = {
  hook: ['شروع', 'story'],
  source: ['متن اصلی', 'quote'],
  words: ['کلمه به کلمه', 'words'],
  teacher: ['معلم می‌گوید', 'teacher'],
  example: ['در زندگی واقعی', 'life'],
  parallels: ['هم‌صدا با این کلام', 'link'],
  quiz: ['خودت را بسنج', 'quiz'],
  practice: ['تمرین امروز', 'target'],
  reflect: ['با خودت خلوت کن', 'pen'],
  finish: ['پایان', 'spark'],
}

const kindLabel = { quran: 'قرآن کریم', nahj: 'نهج‌البلاغه', hadith: 'حدیث' }

export function LessonPlayer({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { completeLesson, adoptHabit, addJournal, p, streak } = useStore()
  const steps = useMemo<StepId[]>(
    () => ['hook', 'source', 'words', 'teacher', 'example', ...(lesson.parallels.length ? (['parallels'] as StepId[]) : []), 'quiz', 'practice', 'reflect', 'finish'],
    [lesson],
  )
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [note, setNote] = useState('')
  const step = steps[i]
  const adopted = p.habits.some((h) => h.lessonId === lesson.id)

  const go = useCallback(
    (d: number) => {
      setDir(d)
      setI((x) => Math.min(steps.length - 1, Math.max(0, x + d)))
    },
    [steps.length],
  )

  const canNext = step !== 'quiz' || picked !== null

  const next = useCallback(() => {
    if (!canNext) return
    if (step === 'reflect' && note.trim()) addJournal(lesson.id, note.trim())
    if (steps[i + 1] === 'finish') completeLesson(lesson.id, picked === lesson.quiz.answer)
    if (step === 'finish') return onClose()
    go(1)
  }, [canNext, step, note, steps, i, go, onClose, addJournal, completeLesson, lesson, picked])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' || e.key === 'Enter') next()
      if (e.key === 'ArrowRight') go(-1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, go, onClose])

  const [label, icon] = STEP_LABEL[step]
  const s = lesson.source

  return (
    <motion.div className="player" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
      <div className="player-top">
        <div className="bars">
          {steps.map((_, k) => (
            <i key={k}>
              <b style={{ width: k < i ? '100%' : k === i ? '55%' : '0%' }} />
            </i>
          ))}
        </div>
        <div className="player-head">
          <button className="icon-btn" onClick={onClose} aria-label="بستن">
            {Icon.close}
          </button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{lesson.topic}</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{lesson.title}</div>
          </div>
          <button className="icon-btn" onClick={() => go(-1)} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} aria-label="قبلی">
            {Icon.back}
          </button>
        </div>
      </div>

      <div className="player-stage">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * 40 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {step !== 'finish' && (
              <div className="step-title">
                {Icon[icon]} {label}
              </div>
            )}

            {step === 'hook' && (
              <>
                <div className="card" style={{ overflow: 'hidden', borderRadius: 26, marginBottom: 18 }}>
                  <div style={{ aspectRatio: '16/10', backgroundImage: `url(${lesson.cover})`, backgroundSize: 'cover', backgroundPosition: 'center 35%' }} />
                </div>
                <h2 className="h1" style={{ marginBottom: 8 }}>
                  {lesson.hook.title}
                </h2>
                <p className="story">{lesson.hook.body}</p>
              </>
            )}

            {step === 'source' && (
              <>
                <div className="card verse-box">
                  <div className="frame" />
                  <div className="speaker">{s.speaker ? `${s.speaker} فرمود:` : 'خداوند می‌فرماید:'}</div>
                  <ArabicText kind={s.kind} text={s.kind === 'quran' ? `﴿ ${s.arabic} ﴾` : s.arabic} className="verse-text" />
                  <p className="translation">{s.translation}</p>
                  <div className="source-line">
                    <span className="chip">{kindLabel[s.kind]}</span>
                    <span className="chip">{s.ref}</span>
                    {s.grading && <GradingChip g={s.grading} />}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  {s.ayah && <Recitation {...s.ayah} />}
                  <a className="btn btn-ghost" href={s.verifyUrl} target="_blank" rel="noreferrer" style={{ padding: '9px 16px', fontSize: 13.5 }}>
                    {Icon.shield} تطبیق با منبع
                  </a>
                </div>
                <p className="muted" style={{ fontSize: 12.5, textAlign: 'center', marginTop: 14 }}>
                  ترجمه: {s.translator}
                </p>
              </>
            )}

            {step === 'words' && (
              <>
                <p className="muted" style={{ marginTop: 0 }}>
                  روی هر کلمه بزن تا معنایش آشکار شود. اول خودت حدس بزن!
                </p>
                <div className="words">
                  {lesson.words.map((w, k) => (
                    <motion.button
                      key={k}
                      className={`word ${revealed.has(k) ? '' : 'hidden'}`}
                      onClick={() => setRevealed((r) => new Set(r).add(k))}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: k * 0.06 }}
                    >
                      <span className="ar">{w.ar}</span>
                      <span className="fa">{w.fa}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="card" style={{ padding: 18, marginTop: 20 }}>
                  <ArabicText kind={s.kind} text={s.arabic} className="" />
                </div>
              </>
            )}

            {step === 'teacher' &&
              lesson.teacher.map((t, k) => (
                <motion.div key={k} className="card point" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + k * 0.18 }}>
                  <div className="num">{fa(k + 1)}</div>
                  <div>
                    <h4>{t.title}</h4>
                    <p>{t.body}</p>
                  </div>
                </motion.div>
              ))}

            {step === 'example' && (
              <div className="card" style={{ padding: 24 }}>
                <h3 className="h2" style={{ marginBottom: 10, color: 'var(--gold)' }}>
                  {lesson.example.title}
                </h3>
                <p className="story" style={{ margin: 0, fontSize: 17 }}>
                  {lesson.example.body}
                </p>
              </div>
            )}

            {step === 'parallels' && (
              <>
                <p className="muted" style={{ marginTop: 0 }}>
                  این آموزه تنها نیست؛ آیات و روایات دیگر، و حتی منابع مذاهب دیگر، همین را می‌گویند.
                </p>
                {lesson.parallels.map((x, k) => (
                  <motion.div key={k} className="card parallel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.12 }}>
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
                  </motion.div>
                ))}
              </>
            )}

            {step === 'quiz' && (
              <>
                <h2 className="h2" style={{ fontSize: 20, margin: '4px 0 16px', lineHeight: 1.8 }}>
                  {lesson.quiz.q}
                </h2>
                {lesson.quiz.options.map((o, k) => {
                  const state = picked === null ? '' : k === lesson.quiz.answer ? 'right' : k === picked ? 'wrong' : ''
                  return (
                    <button key={k} className={`option ${state}`} onClick={() => picked === null && setPicked(k)}>
                      {o}
                    </button>
                  )
                })}
                <AnimatePresence>
                  {picked !== null && (
                    <motion.div className="card" style={{ padding: 18, marginTop: 6 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <b style={{ color: picked === lesson.quiz.answer ? 'var(--accent)' : 'var(--gold)' }}>
                        {picked === lesson.quiz.answer ? 'آفرین! درست است ✦' : 'نزدیک بودی؛ ببین چرا:'}
                      </b>
                      <p style={{ margin: '6px 0 0', color: 'var(--ink-2)' }}>{lesson.quiz.why}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {step === 'practice' && (
              <>
                <div className="card" style={{ padding: 22 }}>
                  <h3 className="h2" style={{ color: 'var(--gold)', fontSize: 21 }}>
                    {lesson.practice.title}
                  </h3>
                  <div style={{ marginTop: 10 }}>
                    {lesson.practice.steps.map((t, k) => (
                      <div key={k} className="practice-step">
                        <i>{fa(k + 1)}</i>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className={`btn ${adopted ? 'btn-ghost' : 'btn-gold'}`} style={{ width: '100%', marginTop: 16 }} onClick={() => adoptHabit(lesson.id, lesson.practice.short)}>
                  {adopted ? (
                    <>
                      {Icon.check} به تمرین‌های روزانه‌ات اضافه شد
                    </>
                  ) : (
                    'قبول می‌کنم؛ هر روز یادم بینداز'
                  )}
                </button>
              </>
            )}

            {step === 'reflect' && (
              <>
                <h2 className="h2" style={{ fontSize: 19, lineHeight: 1.9, margin: '4px 0 14px' }}>
                  {lesson.reflect}
                </h2>
                <textarea className="journal-input" placeholder="چند خط برای خودت بنویس… فقط خودت می‌بینی." value={note} onChange={(e) => setNote(e.target.value)} />
                <p className="muted" style={{ fontSize: 12.5 }}>
                  نوشتن، فکر را روشن می‌کند. یادداشت‌هایت در بخش «من» نگه داشته می‌شود.
                </p>
              </>
            )}

            {step === 'finish' && (
              <div className="finish">
                <Sparks show />
                <motion.div className="big-lamp" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}>
                  <img src="icons/hero-lamp.webp" alt="" style={{ filter: `brightness(${0.85 + Math.min(streak, 10) * 0.03})` }} />
                </motion.div>
                <h2 className="h1" style={{ color: 'var(--gold)' }}>
                  چراغت روشن‌تر شد
                </h2>
                <p className="muted" style={{ fontSize: 16 }}>
                  {streak > 1 ? `${fa(streak)} روز پیاپی با نورِ کلام همراه بوده‌ای.` : 'اولین قدم برداشته شد. فردا هم منتظرت هستیم.'}
                </p>
                <div className="card" style={{ padding: 18, textAlign: 'right', marginTop: 18 }}>
                  <div className="eyebrow">امروز یادت بماند</div>
                  <ArabicText kind={s.kind} text={s.arabic} className="" />
                  <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14.5 }}>{s.translation}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="player-foot">
        <button className="btn btn-gold" onClick={next} disabled={!canNext} style={{ opacity: canNext ? 1 : 0.45 }}>
          {step === 'finish' ? 'بازگشت به خانه' : step === 'reflect' ? (note.trim() ? 'ذخیره و پایان درس' : 'پایان درس') : 'ادامه'}
          {step !== 'finish' && Icon.next}
        </button>
      </div>
    </motion.div>
  )
}
