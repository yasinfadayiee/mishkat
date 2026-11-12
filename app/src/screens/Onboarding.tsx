import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { NUR } from '../data/verses'
import { LightDust } from '../fx'
import { useStore } from '../store'
import { Icon } from '../ui'

const SLIDES = [
  {
    art: 'art/splash.webp',
    title: 'مِشکات',
    lead: 'نورِ قرآن و کلام معصومان، برای زندگی امروز',
    body: 'مشکات یعنی جایگاهِ چراغ. اینجا هر روز یک چراغ برای زندگی‌ات روشن می‌کنیم.',
    verse: true,
  },
  {
    art: 'art/home-night.webp',
    title: 'یک معلم، نه یک کتاب',
    lead: 'هر جمله را ساده، عمیق و با مثال توضیح می‌دهیم',
    body: 'متن اصلی را جمله‌به‌جمله با هم می‌خوانیم: اول معنای ساده، بعد لایهٔ عمیق‌تر، بعد جایش در زندگی امروز تو. بدون آزمون و نمره؛ فقط فهمیدن و عمل کردن.',
  },
  {
    art: 'covers/c1.webp',
    title: 'از دانستن تا عادت',
    lead: 'هدف حفظ کردن نیست؛ تغییر کردن است',
    body: 'با «چله»های چهل‌روزه عادت‌های اشتباه را کنار بگذار و عادت‌های درست بساز. چراغِ تو با هر روز پایداری روشن‌تر می‌شود.',
  },
]

export function Onboarding() {
  const { set } = useStore()
  const [i, setI] = useState(0)
  const [name, setName] = useState('')
  const last = i === SLIDES.length
  const slide = SLIDES[Math.min(i, SLIDES.length - 1)]
  const art = last ? 'covers/c2.webp' : slide.art

  const finish = () => set((x) => ({ ...x, onboarded: true, name: name.trim() }))

  return (
    <div className="onboard-full">
      <AnimatePresence mode="popLayout">
        <m.div
          key={art}
          className="onboard-art"
          style={{ backgroundImage: `url(${art})` }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </AnimatePresence>
      <LightDust density={40} />
      <div className="onboard-panel">
        <AnimatePresence mode="wait">
          <m.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}>
            {!last ? (
              <>
                {slide.verse && (
                  <div className="quran" lang="ar">
                    {NUR.arabic}
                  </div>
                )}
                <h1 className={slide.verse ? 'gold-text' : ''} style={slide.verse ? { fontSize: 52 } : undefined}>
                  {slide.title}
                </h1>
                <p className="lead">{slide.lead}</p>
                <p className="body">{slide.body}</p>
              </>
            ) : (
              <>
                <h1>خوش آمدی</h1>
                <p className="lead">دوست داری با چه نامی صدایت کنیم؟</p>
                <input className="text-input" placeholder="نام تو (اختیاری)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finish()} autoFocus />
              </>
            )}
          </m.div>
        </AnimatePresence>
        <div className="dots-nav">
          {[...SLIDES, 0].map((_, k) => (
            <i key={k} className={k === i ? 'on' : ''} />
          ))}
        </div>
        <button className="btn btn-gold btn-shine" style={{ width: '100%' }} onClick={() => (last ? finish() : setI(i + 1))}>
          {last ? 'شروع سفر' : 'ادامه'} {Icon.next}
        </button>
        <button className="btn btn-quiet" onClick={() => (last ? finish() : setI(SLIDES.length))} style={{ marginTop: 4, color: '#cfc6ae' }}>
          {last ? 'بعداً' : 'رد شدن'}
        </button>
      </div>
    </div>
  )
}
