import { motion } from 'framer-motion'
import { useState } from 'react'
import { lessonById } from '../data/lessons'
import { programs } from '../data/paths'
import type { Program } from '../data/types'
import { activeDays, dayKey, fa, useStore } from '../store'
import { PageHero } from '../fx'
import { Sheet } from '../ui'
import { LessonCard } from './Home'

function Ring({ value, color }: { value: number; color: string }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 28 28)" style={{ transition: '0.8s' }} />
    </svg>
  )
}

function daysSince(iso: string) {
  const a = new Date(iso + 'T00:00:00')
  const b = new Date(dayKey() + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function Paths({ openLesson }: { openLesson: (id: string) => void }) {
  const { p, set } = useStore()
  const [open, setOpen] = useState<Program | null>(null)
  const active = activeDays(p)

  const progressOf = (pr: Program) => {
    const st = p.programs[pr.id]
    if (!st) return 0
    let n = 0
    for (let d = 0; d <= daysSince(st.startedAt); d++) {
      const x = new Date(st.startedAt + 'T00:00:00')
      x.setDate(x.getDate() + d)
      if (active.has(dayKey(x))) n++
    }
    return Math.min(n, pr.days)
  }

  return (
    <>
      <PageHero art="covers/c2.webp" eyebrow="چله‌ها" title={<>چهل روز، <span className="gold-text">یک عادت تازه</span></>}>
        <p>در فرهنگ ما «چله» یعنی چهل روز پایداری برای ساختن خود. هر روزی که درس بخوانی یا تمرینت را تیک بزنی، یک خانه روشن می‌شود.</p>
      </PageHero>

      <div className="grid two" style={{ marginTop: 18 }}>
        {programs.map((pr, k) => {
          const n = progressOf(pr)
          const started = !!p.programs[pr.id]
          return (
            <motion.button key={pr.id} className="card program-card" onClick={() => setOpen(pr)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.07 }}>
              <span className="program-art" style={{ backgroundImage: `url(${lessonById(pr.lessons[0])?.cover})` }} />
              <span className="glowdot" style={{ background: pr.hue }} />
              <span className="ring">
                <Ring value={n / pr.days} color={pr.hue} />
              </span>
              <div className="eyebrow" style={{ color: pr.hue }}>
                {started ? `روز ${fa(n)} از ${fa(pr.days)}` : `${fa(pr.days)} روز`}
              </div>
              <b style={{ fontSize: 20, display: 'block', margin: '6px 0 4px' }}>{pr.title}</b>
              <p className="muted" style={{ margin: 0, fontSize: 14, maxWidth: '80%' }}>
                {pr.tagline}
              </p>
              <div style={{ marginTop: 14, fontSize: 13 }}>
                <span className="chip">تمرین روزانه: {pr.dailyAction}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <>
            <div className="eyebrow" style={{ color: open.hue }}>
              {fa(open.days)} روز
            </div>
            <h3 className="h1" style={{ fontSize: 26 }}>
              {open.title}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {open.tagline}
            </p>
            <div className="heat" style={{ gridTemplateColumns: 'repeat(10, 1fr)', margin: '10px 0 18px' }}>
              {Array.from({ length: open.days }, (_, d) => (
                <i key={d} className={d < progressOf(open) ? 'on' : ''} />
              ))}
            </div>
            <b>درس‌های این چله</b>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
              {open.lessons.filter((id) => lessonById(id)).map((id) => (
                <LessonCard
                  key={id}
                  id={id}
                  done={!!p.completed[id]}
                  onOpen={(x) => {
                    setOpen(null)
                    openLesson(x)
                  }}
                />
              ))}
            </div>
            {!p.programs[open.id] ? (
              <button
                className="btn btn-gold"
                style={{ width: '100%', marginTop: 20 }}
                onClick={() => set((x) => ({ ...x, programs: { ...x.programs, [open.id]: { startedAt: dayKey() } } }))}
              >
                چله را از امروز شروع می‌کنم
              </button>
            ) : (
              <p className="chip ok" style={{ marginTop: 18 }}>
                از {new Date(p.programs[open.id].startedAt).toLocaleDateString('fa-IR')} شروع کرده‌ای؛ ادامه بده!
              </p>
            )}
          </>
        )}
      </Sheet>
    </>
  )
}
