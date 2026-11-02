import { motion } from 'framer-motion'
import { lessonById, lessons } from '../data/lessons'
import { activeDays, dayKey, fa, useStore, type ThemeId } from '../store'
import { Icon, Lamp } from '../ui'

const THEMES: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: 'emerald', name: 'شب زمردی', colors: ['#06201a', '#3fcf9f', '#e6c27d'] },
  { id: 'isfahan', name: 'فیروزه‌ای اصفهان', colors: ['#08172f', '#3fd3d8', '#ecc77f'] },
  { id: 'parchment', name: 'کاغذ کاهی', colors: ['#f7efdf', '#0e7a5c', '#9a6f27'] },
]

export function Me({ goTo }: { goTo: (t: 'trust') => void }) {
  const { p, set, streak } = useStore()
  const active = activeDays(p)
  const days = Array.from({ length: 28 }, (_, k) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - k))
    return dayKey(d)
  })
  const completed = Object.keys(p.completed).length

  return (
    <>
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Lamp level={streak ? Math.min(1, 0.35 + streak / 10) : 0.15} className="" />
        <div>
          <div className="eyebrow">مسیر من</div>
          <h1 className="h1" style={{ marginTop: 0 }}>
            {p.name || 'همراه مشکات'}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {streak ? `چراغت ${fa(streak)} روز است که روشن مانده.` : 'با اولین درس، چراغت را روشن کن.'}
          </p>
        </div>
      </div>
      <style>{`.fade-up > svg{width:96px;height:120px;flex:none}`}</style>

      <div className="grid three" style={{ marginTop: 20, gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card stat">
          <b>{fa(streak)}</b>
          <span>روز پیاپی</span>
        </div>
        <div className="card stat">
          <b>
            {fa(completed)}/{fa(lessons.length)}
          </b>
          <span>درس کامل</span>
        </div>
        <div className="card stat">
          <b>{fa(p.habits.length)}</b>
          <span>تمرین فعال</span>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">چهار هفتهٔ اخیر</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            هر خانهٔ طلایی = یک روز مطالعه یا تمرین
          </span>
        </div>
        <div className="card" style={{ padding: 18, maxWidth: 380 }}>
          <div className="heat">
            {days.map((d) => (
              <i key={d} className={`${active.has(d) ? 'on' : ''} ${d === dayKey() ? 'today' : ''}`} title={new Date(d).toLocaleDateString('fa-IR')} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          پوستهٔ برنامه
        </h2>
        <div className="grid three">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-swatch ${p.theme === t.id ? 'on' : ''}`} onClick={() => set((x) => ({ ...x, theme: t.id }))}>
              <span className="dots" style={{ paddingLeft: 6 }}>
                {t.colors.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <b style={{ flex: 1 }}>{t.name}</b>
              {p.theme === t.id && <span style={{ color: 'var(--gold)', width: 20 }}>{Icon.check}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="h2" style={{ marginBottom: 12 }}>
          دفتر خلوت من
        </h2>
        {p.journal.length === 0 ? (
          <div className="card" style={{ padding: 20 }}>
            <p className="muted" style={{ margin: 0 }}>
              هنوز یادداشتی ننوشته‌ای. در پایان هر درس، یک سؤال برای خلوت با خودت هست.
            </p>
          </div>
        ) : (
          <div className="grid two">
            {p.journal.map((j, k) => (
              <motion.div key={k} className="card" style={{ padding: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className="chip">{lessonById(j.lessonId)?.title}</span>
                  <small className="muted">{new Date(j.date).toLocaleDateString('fa-IR')}</small>
                </div>
                <p style={{ margin: '10px 0 0', whiteSpace: 'pre-line' }}>{j.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <button className="card trust-banner" onClick={() => goTo('trust')}>
          <span className="shield">{Icon.shield}</span>
          <span style={{ flex: 1 }}>
            <b style={{ display: 'block' }}>زنجیرهٔ اعتبار مشکات</b>
            <small className="muted">منابع، روش تطبیق و وضعیت بازبینی هر درس</small>
          </span>
          <span style={{ color: 'var(--gold)' }}>←</span>
        </button>
      </section>
    </>
  )
}

export function Trust({ back }: { back: () => void }) {
  return (
    <div className="fade-up" style={{ maxWidth: 860 }}>
      <button className="btn btn-quiet" onClick={back} style={{ paddingRight: 0 }}>
        {Icon.back} بازگشت
      </button>
      <div className="eyebrow">زنجیرهٔ اعتبار</div>
      <h1 className="h1">هر کلمه، با سند</h1>
      <p className="muted">کسی که بر اساس این متن‌ها زندگی‌اش را تغییر می‌دهد، حق دارد بداند هر جمله از کجا آمده است. برای همین مشکات چهار قانون دارد:</p>

      {[
        ['متن اصلی دست نمی‌خورد', 'متن آیات عیناً از نسخهٔ عثمانی «تنزیل» آورده می‌شود. احادیث از پایگاه «ثقلین» (کافی، نهج‌البلاغه، امالی) و صحیح بخاری و مسلم گرفته می‌شود؛ فقط گاهی اعرابِ ناقص برای خوانایی کامل شده است. یک برنامهٔ بازبین خودکار، پیش از هر انتشار، همهٔ متن‌ها را حرف‌به‌حرف با منبع مقایسه می‌کند.'],
        ['درجهٔ سند پنهان نمی‌شود', 'برای احادیث کافی، نظر علامه مجلسی در «مرآة العقول» دربارهٔ سند (صحیح، حسن، مجهول، ضعیف) کنار حدیث نمایش داده می‌شود؛ حتی وقتی ضعیف است. حدیث ضعیف‌السند فقط به‌عنوان شاهد کنار آیه یا روایت معتبر می‌آید.'],
        ['ترجمه و توضیح از هم جدا هستند', 'ترجمه همیشه با نام مترجم می‌آید. بخش «معلم می‌گوید» برداشت و توضیح است، نه متن معصوم، و به‌روشنی از متن اصلی جدا نشان داده می‌شود.'],
        ['هر توضیح، پیش از انتشار عمومی بازبینی می‌شود', 'توضیحات و مثال‌ها پیش‌نویس تیم مشکات است و پیش از انتشار عمومی باید به تأیید کارشناس دینی برسد. هر کس می‌تواند با دکمهٔ «تطبیق با منبع» متن را خودش ببیند.'],
      ].map(([t, b], k) => (
        <motion.div key={k} className="card point" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08 }}>
          <div className="num">{fa(k + 1)}</div>
          <div>
            <h4>{t}</h4>
            <p>{b}</p>
          </div>
        </motion.div>
      ))}

      <h2 className="h2" style={{ margin: '26px 0 12px' }}>
        وضعیت درس‌ها
      </h2>
      <div className="card" style={{ padding: 6 }}>
        {lessons.map((l) => (
          <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderBottom: '1px dashed var(--line)', flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 160 }}>{l.title}</b>
            <span className="chip ok">متن: تطبیق‌شده با منبع</span>
            <span className={`chip ${l.review.explanation === 'verified' ? 'ok' : 'warn'}`}>توضیح: {l.review.explanation === 'verified' ? 'تأییدشده' : 'در انتظار بازبینی کارشناس'}</span>
          </div>
        ))}
      </div>

      <h2 className="h2" style={{ margin: '26px 0 12px' }}>
        منابع
      </h2>
      <div className="card" style={{ padding: 20, lineHeight: 2.2, fontSize: 14.5 }}>
        <div>
          متن قرآن: <a href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil.net</a> (نسخهٔ عثمانی، بدون تغییر) · ترجمه: آیت‌الله ناصر مکارم شیرازی
        </div>
        <div>
          احادیث شیعه: <a href="https://thaqalayn.net" target="_blank" rel="noreferrer">Thaqalayn.net</a> · درجهٔ سند: علامه محمدباقر مجلسی، مرآة العقول
        </div>
        <div>
          احادیث اهل سنت: صحیح بخاری و صحیح مسلم (<a href="https://sunnah.com" target="_blank" rel="noreferrer">Sunnah.com</a>)
        </div>
        <div>
          تلاوت: مشاری راشد العفاسی، از <a href="https://everyayah.com" target="_blank" rel="noreferrer">EveryAyah.com</a>
        </div>
      </div>
    </div>
  )
}
