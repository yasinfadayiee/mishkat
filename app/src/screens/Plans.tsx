import { useEffect, useState } from 'react'
import { loadIndex, loadToc, type BookMeta, type Toc } from '../books'
import { PLANS, planDays, type Plan } from '../data/plans'
import { fa, useStore } from '../store'

type Loaded = { plan: Plan; meta: BookMeta; book: Toc; days: [number, number][][] }

/** بخش «برنامهٔ مطالعه» در خانه: برنامهٔ در جریان، یا فهرست برنامه‌ها برای شروع */
export function PlanSection({ openAt }: { openAt: (meta: BookMeta, sec: number, ch: number) => void }) {
  const { p, startPlan, stopPlan, togglePlanDay } = useStore()
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({})
  const [browsing, setBrowsing] = useState(false)
  const active = PLANS.filter((x) => p.programs[x.id])
  const activeKey = active.map((x) => x.id).join(',')

  // فقط کتاب برنامه‌های فعال (یا هنگام دیدن فهرست) بارگذاری می‌شود
  useEffect(() => {
    const ids = activeKey ? activeKey.split(',') : []
    const need = (browsing || !ids.length ? PLANS : PLANS.filter((x) => ids.includes(x.id))).filter((x) => !loaded[x.id])
    if (!need.length) return
    let live = true
    loadIndex().then(async (ix) => {
      const next: Record<string, Loaded> = {}
      for (const plan of need) {
        const meta = ix.books.find((b) => b.id === plan.book)
        if (!meta) continue
        const book = await loadToc(plan.book).catch(() => null)
        if (!book) continue
        next[plan.id] = { plan, meta, book, days: planDays(plan, book) }
      }
      if (live) setLoaded((l) => ({ ...l, ...next }))
    })
    return () => {
      live = false
    }
  }, [browsing, activeKey, loaded])

  const chapterTitle = (l: Loaded, [s, c]: [number, number]) => l.book.sections[s]?.chapters[c]?.t ?? ''

  return (
    <section className="home-sec">
      <div className="hs-head">
        <h2>برنامهٔ مطالعه</h2>
        {active.length > 0 && (
          <button className="link-btn" onClick={() => setBrowsing((x) => !x)}>
            {browsing ? 'بستن' : 'برنامهٔ دیگر ←'}
          </button>
        )}
      </div>

      {active.map((plan) => {
        const l = loaded[plan.id]
        if (!l) return null
        const done = p.programs[plan.id].done ?? []
        const day = l.days.findIndex((_, k) => !done.includes(k))
        const finished = day === -1
        const today = finished ? [] : l.days[day]
        return (
          <article key={plan.id} className="card plan-card">
            <div className="plan-top">
              <div>
                <b>{plan.title}</b>
                <small>
                  {finished ? 'تمام شد' : `روز ${fa(day + 1)} از ${fa(l.days.length)}`}
                </small>
              </div>
              <div className="plan-bar" aria-hidden>
                <i style={{ width: `${(done.length / l.days.length) * 100}%` }} />
              </div>
            </div>
            {!finished && (
              <>
                <div className="plan-today">
                  {today.map((sc) => (
                    <button key={sc.join('-')} className="plan-ch" onClick={() => openAt(l.meta, sc[0], sc[1])}>
                      {chapterTitle(l, sc)} ←
                    </button>
                  ))}
                </div>
                <div className="plan-actions">
                  <button className="btn btn-gold" onClick={() => togglePlanDay(plan.id, day)}>
                    این روز را خواندم
                  </button>
                  {done.length > 0 && (
                    <button className="link-btn" onClick={() => togglePlanDay(plan.id, Math.max(...done))}>
                      برگرداندن روز قبل
                    </button>
                  )}
                </div>
              </>
            )}
            {finished && <p className="muted">همهٔ روزهای این برنامه خوانده شد.</p>}
            <button className="link-btn plan-stop" onClick={() => stopPlan(plan.id)}>
              کنار گذاشتن برنامه
            </button>
          </article>
        )
      })}

      {(browsing || !active.length) && (
        <div className="plan-list">
          {!active.length && <p className="muted">یک کتاب را آرام‌آرام و روزبه‌روز بخوان؛ برنامه جای مطالعه‌ات را نگه می‌دارد.</p>}
          {PLANS.filter((x) => !p.programs[x.id]).map((plan) => {
            const l = loaded[plan.id]
            return (
              <button key={plan.id} className="card plan-pick" onClick={() => (startPlan(plan.id), setBrowsing(false))}>
                <b>{plan.title}</b>
                <small>{plan.desc}</small>
                <span>{l ? `${fa(l.days.length)} روز، شروع ←` : 'شروع ←'}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
