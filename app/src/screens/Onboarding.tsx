import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../ui'

const SLIDES = [
  {
    title: 'مِشکات',
    lead: 'نورِ قرآن و کلام معصومان، برای زندگی امروز',
    body: '«مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ» — مشکات، جایگاهِ چراغ است. اینجا هر روز یک چراغ برای زندگی‌ات روشن می‌کنیم.',
  },
  {
    title: 'یک معلم، نه یک کتاب',
    lead: 'هر جمله را ساده، عمیق و با مثال توضیح می‌دهیم',
    body: 'داستان، متن اصلی، معنای کلمه‌به‌کلمه، توضیح معلم، مثال از زندگی واقعی، آزمونک و تمرینِ همان روز. هر درس فقط پنج تا هفت دقیقه.',
  },
  {
    title: 'از دانستن تا عادت',
    lead: 'هدف حفظ کردن نیست؛ تغییر کردن است',
    body: 'با «چله»های چهل‌روزه، عادت‌های اشتباه را کنار بگذار و عادت‌های درست بساز. چراغِ تو با هر روز پایداری روشن‌تر می‌شود.',
  },
]

export function Onboarding() {
  const { set } = useStore()
  const [i, setI] = useState(0)
  const [name, setName] = useState('')
  const last = i === SLIDES.length

  const finish = () => set((x) => ({ ...x, onboarded: true, name: name.trim() }))

  return (
    <div className="onboard">
      <motion.img src="icons/icon-512.png" className="logo" alt="" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }} />
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }} style={{ width: '100%' }}>
          {!last ? (
            <>
              <h1>{SLIDES[i].title}</h1>
              <p className="lead">{SLIDES[i].lead}</p>
              <p className="muted" style={{ fontSize: 15.5 }}>
                {SLIDES[i].body}
              </p>
            </>
          ) : (
            <>
              <h1>خوش آمدی</h1>
              <p className="lead">دوست داری با چه نامی صدایت کنیم؟</p>
              <input className="text-input" placeholder="نام تو (اختیاری)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finish()} autoFocus />
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="dots-nav">
        {[...SLIDES, 0].map((_, k) => (
          <i key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => (last ? finish() : setI(i + 1))}>
        {last ? 'شروع سفر' : 'ادامه'} {Icon.next}
      </button>
      {!last && (
        <button className="btn btn-quiet" onClick={() => setI(SLIDES.length)} style={{ marginTop: 6 }}>
          رد شدن
        </button>
      )}
    </div>
  )
}
