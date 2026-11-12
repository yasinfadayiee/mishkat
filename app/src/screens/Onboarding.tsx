import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { NUR } from '../data/verses'
import { useStore } from '../store'
import { Icon } from '../ui'

const SLIDES = [
  {
    art: 'art/splash.webp',
    title: 'مِشکات',
    lead: 'کتابخانه‌ای آرام برای خواندن کلام خدا و امیرالمؤمنین (ع)',
    body: 'مشکات یعنی جایگاه چراغ. این‌جا کتاب را به زبان امروز می‌خوانی، بی‌شتاب و هر وقت خواستی.',
    verse: true,
  },
  {
    art: 'art/home-night.webp',
    title: 'چه کتاب‌هایی دارد؟',
    lead: 'قرآن، نهج‌البلاغه و غررالحکم، کامل و با ترجمهٔ روان',
    body: 'قرآن کامل با ترجمهٔ آیت‌الله مکارم شیرازی و تلاوت پنج قاری. همهٔ خطبه‌ها، نامه‌ها و حکمت‌های نهج‌البلاغه و بیش از یازده هزار سخن غررالحکم با ترجمهٔ فارسی. ده‌ها کتاب حدیث دیگر هم فعلاً با متن عربی کامل هست.',
  },
  {
    art: 'covers/c1.webp',
    title: '«یعنی چه؟» و «عمیق‌تر»',
    lead: 'هر سخن، اول ساده؛ بعد اگر خواستی، عمیق',
    body: 'زیر ترجمهٔ هر سخن، «یعنی چه؟» آن را در یک جملهٔ خودمانی می‌گوید. «عمیق‌تر» لایهٔ زیرین معنا را باز می‌کند، و «از خودت بپرس» کمکت می‌کند آن را با زندگی خودت بسنجی.',
  },
  {
    art: 'covers/c3.webp',
    title: 'هر متن، سند دارد',
    lead: 'متن عربی دست نخورده است',
    body: 'متن هر آیه و حدیث عیناً از منبعش آمده و کنار هر متن دکمهٔ «سند» هست تا خودت ببینی. ترجمه و توضیح جدا از متن اصلی نشان داده می‌شوند، چون برداشت ما هستند، نه کلام معصوم.',
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
        <m.div key={art} className="onboard-art" style={{ backgroundImage: `url(${art})` }} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
      </AnimatePresence>
      <div className="onboard-panel">
        <AnimatePresence mode="wait">
          <m.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {!last ? (
              <>
                {slide.verse && (
                  <div className="onboard-verse quran" lang="ar">
                    {NUR.arabic}
                  </div>
                )}
                <h1 className={slide.verse ? 'gold-text big' : ''}>{slide.title}</h1>
                <p className="lead">{slide.lead}</p>
                <p className="body">{slide.body}</p>
              </>
            ) : (
              <>
                <h1>خوش آمدی</h1>
                <p className="lead">دوست داری با چه نامی صدایت کنیم؟</p>
                <input className="text-input" placeholder="نام تو (اختیاری)" aria-label="نام تو" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finish()} autoFocus />
              </>
            )}
          </m.div>
        </AnimatePresence>
        <div className="dots-nav" role="tablist" aria-label="مرحله‌ها">
          {[...SLIDES, 0].map((_, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={`مرحلهٔ ${(k + 1).toLocaleString('fa-IR')}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
        <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => (last ? finish() : setI(i + 1))}>
          {last ? 'شروع' : 'ادامه'} {Icon.next}
        </button>
        <button className="btn btn-quiet onboard-skip" onClick={() => (last ? finish() : setI(SLIDES.length))}>
          {last ? 'بعداً' : 'رد شدن'}
        </button>
      </div>
    </div>
  )
}
