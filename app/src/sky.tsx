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

// ستاره‌های ثابت (هر بار همان جا، تا آسمان آرام بماند)
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 97.13 + n * 13.7) + 1) / 2) % 1
  return { x: r(1) * 100, y: r(2) * 62, s: 0.6 + r(3) * 1.6, d: r(4) * 6 }
})

/** آسمانِ زنده: رنگ، خورشید یا ماه، ستاره‌ها و نیم‌رخ گنبد و مناره بر اساس هنگامِ روز */
export function Sky({ children }: { children?: React.ReactNode }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const phase = phaseOf(now)
  const pos = useMemo(() => bodyPos(now, phase), [now, phase])
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
      <svg className="sky-city" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <g className="far">
          <ellipse cx="150" cy="200" rx="14" ry="46" />
          <ellipse cx="185" cy="205" rx="11" ry="34" />
          <path d="M250 200 V150 H330 V200 Z M262 152 Q262 112 290 98 Q318 112 318 152 Z" />
          <path d="M860 200 V156 H950 V200 Z M872 158 Q872 118 905 102 Q938 118 938 158 Z" />
          <ellipse cx="1030" cy="200" rx="13" ry="44" />
          <ellipse cx="1062" cy="206" rx="10" ry="30" />
        </g>
        <g className="near">
          <rect x="0" y="196" width="1200" height="24" />
          <rect x="462" y="122" width="276" height="80" />
          <rect x="528" y="96" width="144" height="30" />
          <path d="M516 100 Q516 46 600 22 Q684 46 684 100 Z" />
          <rect x="598" y="2" width="4" height="24" />
          <circle cx="600" cy="6" r="5" />
          <rect x="424" y="34" width="18" height="168" />
          <rect x="418" y="74" width="30" height="7" />
          <path d="M424 36 L433 10 L442 36 Z" />
          <rect x="758" y="34" width="18" height="168" />
          <rect x="752" y="74" width="30" height="7" />
          <path d="M758 36 L767 10 L776 36 Z" />
          <ellipse cx="380" cy="198" rx="12" ry="40" />
          <ellipse cx="820" cy="198" rx="12" ry="40" />
        </g>
        <g className="lights">
          <path d="M582 202 V160 Q600 138 618 160 V202 Z" />
          <path d="M494 196 V166 Q506 152 518 166 V196 Z" />
          <path d="M682 196 V166 Q694 152 706 166 V196 Z" />
        </g>
      </svg>
      <div className="sky-fade" />
      {children}
    </div>
  )
}
