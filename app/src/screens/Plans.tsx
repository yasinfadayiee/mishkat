import { useEffect, useState } from 'react'
import { loadIndex, loadToc, type BookMeta, type Toc } from '../books'
import { PLANS, planDays, type Plan } from '../data/plans'
import { Skeleton } from '../load'
import { go, href } from '../router'
import { fa, useStore } from '../store'
import { Icon, Sheet } from '../ui'

type Loaded = { plan: Plan; meta: BookMeta; book: Toc; days: [number, number][][] }

/** فهرست کتاب‌های برنامه‌ها (کوچک‌اند: فقط عنوان باب‌ها) */
function usePlans(ids: string[], enabled: boolean) {
  const [loaded, setLoaded] = useState<Record<string, Loaded>>({})
  const key = ids.join(',')
  useEffect(() => {
    if (!enabled) return
    const need = PLANS.filter((x) => key.split(',').includes(x.id))
    let live = true
    loadIndex()
      .then(async (ix) => {
        const next: Record<string, Loaded> = {}
        for (const plan of need) {
          const meta = ix.books.find((b) => b.id === plan.book)
          const book = meta && (await loadToc(plan.book).catch(() => null))
          if (meta && book) next[plan.id] = { plan, meta, book, days: planDays(plan, book) }
        }
        if (live) setLoaded((l) => ({ ...l, ...next }))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [key, enabled])
  return loaded
}

/** برنامه‌های در جریان (در خانه)؛ اگر برنامه‌ای نیست، فقط یک کارت باریک برای شروع */
export function PlanSection() {
  const { p, stopPlan, togglePlanDay } = useStore()
  const [picking, setPicking] = useState(false)
  const active = PLANS.filter((x) => p.programs[x.id])
  const loaded = usePlans(
    active.map((x) => x.id),
    active.length > 0,
  )

  return (
    <section className="home-sec">
      {active.length > 0 && (
        <div className="hs-head">
          <h2>برنامهٔ مطالعهٔ من</h2>
          <button className="link-btn" onClick={() => setPicking(true)}>
            برنامهٔ دیگر ←
          </button>
        </div>
      )}
      {active.map((plan) => {
        const l = loaded[plan.id]
        if (!l) return <Skeleton key={plan.id} kind="card" />
        const done = p.programs[plan.id].done ?? []
        const day = l.days.findIndex((_, k) => !done.includes(k))
        const finished = day === -1
        const today = finished ? [] : l.days[day]
        return (
          <article key={plan.id} className="card plan-card">
            <div className="plan-top">
              <div>
                <b>{plan.title}</b>
                <small>{finished ? 'تمام شد' : `روز ${fa(day + 1)} از ${fa(l.days.length)}`}</small>
              </div>
              <div className="plan-bar" aria-hidden>
                <i style={{ width: `${(done.length / l.days.length) * 100}%` }} />
              </div>
            </div>
            {!finished && (
              <>
                <div className="plan-today">
                  {today.map((sc) => (
                    <button key={sc.join('-')} className="plan-ch" onClick={() => go(href.chapter(plan.book, sc[0], sc[1]))}>
                      {l.book.sections[sc[0]]?.chapters[sc[1]]?.t ?? ''} ←
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
            <button className="link-btn plan-stop" onClick={() => confirm('این برنامه کنار گذاشته شود؟') && stopPlan(plan.id)}>
              کنار گذاشتن برنامه
            </button>
          </article>
        )
      })}
      {!active.length && (
        <button className="card slim-card" onClick={() => setPicking(true)}>
          <span className="cc-icon">{Icon.book}</span>
          <span>
            <b>یک برنامهٔ مطالعه شروع کن</b>
            <small>یک کتاب را آرام‌آرام و روزبه‌روز بخوان</small>
          </span>
          <i>{Icon.next}</i>
        </button>
      )}
      <PlanPicker open={picking} onClose={() => setPicking(false)} />
    </section>
  )
}

/** برگهٔ پایینی: فهرست برنامه‌ها، با تعداد روز هر کدام */
function PlanPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { p, startPlan } = useStore()
  const loaded = usePlans(
    PLANS.map((x) => x.id),
    open,
  )
  const list = PLANS.filter((x) => !p.programs[x.id])
  return (
    <Sheet open={open} onClose={onClose} label="برنامه‌های مطالعه">
      <h3 className="h2 sheet-title">برنامه‌های مطالعه</h3>
      <p className="muted">برنامه جای مطالعه‌ات را نگه می‌دارد؛ هر روز چند باب، بی‌شتاب.</p>
      <div className="plan-list">
        {list.map((plan) => {
          const l = loaded[plan.id]
          return (
            <button key={plan.id} className="card plan-pick" onClick={() => (startPlan(plan.id), onClose())}>
              <b>{plan.title}</b>
              <small>{plan.desc}</small>
              <span>{l ? `${fa(l.days.length)} روز، شروع ←` : '…'}</span>
            </button>
          )
        })}
        {!list.length && <p className="muted">همهٔ برنامه‌ها را شروع کرده‌ای.</p>}
      </div>
    </Sheet>
  )
}
