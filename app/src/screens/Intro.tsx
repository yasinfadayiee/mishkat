import { m } from 'framer-motion'
import { useEffect } from 'react'
import { NUR } from '../data/verses'
import { LightDust, Rays } from '../fx'

/** صحنهٔ آغاز: محراب و چراغ روشن می‌شوند، پرتوها پخش می‌شوند و آیهٔ نور کلمه‌به‌کلمه ظاهر می‌شود */
export function Intro({ onDone }: { onDone: () => void }) {
  const words = NUR.arabic.split(' ')
  const verseStart = 1.3
  const total = verseStart + words.length * 0.17 + 2.2

  useEffect(() => {
    const t = setTimeout(onDone, total * 1000)
    return () => clearTimeout(t)
  }, [onDone, total])

  return (
    <m.div className="intro" onClick={onDone} exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }} transition={{ duration: 0.8 }}>
      <m.div
        className="intro-bg"
        style={{ backgroundImage: 'url(art/splash.webp)' }}
        initial={{ opacity: 0, scale: 1.12, filter: 'brightness(0.15)' }}
        animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
        transition={{ duration: 2.2, ease: [0.2, 0.7, 0.2, 1] }}
      />
      <div className="intro-shade" />
      <Rays />
      <LightDust density={80} />
      <div style={{ height: '46vh' }} />
      <div className="intro-verse quran" lang="ar">
        {words.map((w, i) => (
          <m.span
            key={i}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: verseStart + i * 0.17, duration: 0.7 }}
          >
            {w}&nbsp;
          </m.span>
        ))}
      </div>
      <m.div
        className="intro-title"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: verseStart + words.length * 0.17 + 0.2, duration: 1 }}
      >
        <span className="gold-text">مِشکات</span>
        <small>نور کلام، برای زندگی</small>
      </m.div>
      <m.span className="intro-skip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
        برای ورود ضربه بزن
      </m.span>
    </m.div>
  )
}
