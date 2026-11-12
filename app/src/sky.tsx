import { useEffect, useMemo, useState } from 'react'
import { phaseOf, type Phase } from './store'

/** جای خورشید یا ماه روی کمانِ آسمان، بر اساس ساعت */
function bodyPos(d: Date, phase: Phase) {
  let h = d.getHours() + d.getMinutes() / 60
  if (import.meta.env.DEV) h = Number(localStorage.getItem('mishkat.hour') ?? h)
  const day = phase !== 'night' && phase !== 'sahar'
  // روز: از ۶ تا ۲۰؛ شب: از ۲۰ تا ۶ صبح
  const t = day ? (h - 6) / 14 : ((h + 24 - 20) % 24) / 10
  const x = 88 - Math.min(1, Math.max(0, t)) * 76
  const y = 36 - Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * 26
  return { x, y, day }
}

// جای ثابت خورشید یا ماه وقتی آسمان از پوستهٔ انتخابی پیروی می‌کند
const FIXED: Record<Phase, { x: number; y: number; day: boolean }> = {
  sahar: { x: 78, y: 30, day: false },
  morning: { x: 78, y: 26, day: true },
  noon: { x: 50, y: 14, day: true },
  asr: { x: 26, y: 26, day: true },
  maghrib: { x: 16, y: 38, day: true },
  night: { x: 70, y: 22, day: false },
}

// ستاره‌های ثابت (هر بار همان جا، تا آسمان آرام بماند)
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 97.13 + n * 13.7) + 1) / 2) % 1
  return { x: r(1) * 100, y: r(2) * 62, s: 0.6 + r(3) * 1.6, d: r(4) * 6 }
})

/** آسمانِ زنده: رنگ، خورشید یا ماه و ستاره‌ها بر اساس هنگامِ روز (یا پوسته‌ای که کاربر خودش انتخاب کرده) */
export function Sky({ children, phase: forced }: { children?: React.ReactNode; phase?: Phase }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const phase = forced ?? phaseOf(now)
  const pos = useMemo(() => (forced ? FIXED[forced] : bodyPos(now, phase)), [now, phase, forced])
  const starry = phase === 'night' || phase === 'sahar' || phase === 'maghrib'

  return (
    <div className={`sky sky-${phase}`}>
      <div className="sky-grad" />
      <svg className="sky-girih" aria-hidden="true">
        <defs>
          <pattern id="sky-star" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M32 6 L38 26 L58 32 L38 38 L32 58 L26 38 L6 32 L26 26 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="32" cy="32" r="5" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sky-star)" />
      </svg>
      {starry && (
        <div className="sky-stars">
          {STARS.map((s, i) => (
            <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
          ))}
        </div>
      )}
      <div className={`sky-body ${pos.day ? 'sun' : 'moon'}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
      <div className="sky-fade" />
      {children}
    </div>
  )
}
