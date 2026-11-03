import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSurah, loadSurahs, norm, savePlace, type Surah, type SurahMeta } from '../books'
import { MarkButton, ReaderShell } from '../reader'
import { fa, useStore } from '../store'
import { Icon } from '../ui'

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
type Mode = 'both' | 'ar' | 'fa'
const pad = (n: number) => String(n).padStart(3, '0')

/** فهرست سوره‌ها */
export function Quran({ open }: { open: (n: number) => void }) {
  const [list, setList] = useState<SurahMeta[]>([])
  const [q, setQ] = useState('')
  useEffect(() => {
    loadSurahs().then(setList).catch(() => setList([]))
  }, [])
  const shown = useMemo(() => {
    const k = norm(q.trim())
    if (!k) return list
    return list.filter((s) => norm(s.name).includes(k) || String(s.n) === q.trim() || fa(s.n) === q.trim())
  }, [list, q])

  return (
    <div className="fade-up">
      <header className="quiet-head">
        <div className="eyebrow">قرآن کریم</div>
        <h1 className="h1">۱۱۴ سوره، با ترجمهٔ کامل</h1>
        <p className="muted">متن عثمانی «تنزیل» · ترجمهٔ آیت‌الله مکارم شیرازی · تلاوت مشاری العفاسی</p>
      </header>
      <label className="lib-search">
        {Icon.search}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام یا شمارهٔ سوره" />
      </label>
      <div className="surah-grid">
        {shown.map((s) => (
          <button key={s.n} className="surah-row" onClick={() => open(s.n)}>
            <span className="sr-n">{fa(s.n)}</span>
            <span className="sr-name quran">{s.name}</span>
            <small>
              {s.type} · {fa(s.count)} آیه
            </small>
          </button>
        ))}
      </div>
    </div>
  )
}

/** خواندن یک سوره */
export function SurahReader({ n, onClose, go }: { n: number; onClose: () => void; go: (n: number) => void }) {
  const [s, setS] = useState<Surah | null>(null)
  const [mode, setMode] = useState<Mode>('both')
  const [playing, setPlaying] = useState<number | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const { p, toggleMark } = useStore()

  useEffect(() => {
    setS(null)
    loadSurah(n).then((x) => {
      setS(x)
      savePlace({ book: 'quran', title: 'قرآن کریم', sec: n, ch: 0, label: `سورهٔ ${x.name.replace(/^سُورَةُ\s*/, '')}` })
    })
    scroller.current?.scrollTo({ top: 0 })
  }, [n])

  useEffect(() => () => audio.current?.pause(), [])

  const play = (k: number) => {
    if (!audio.current) {
      audio.current = new Audio()
      audio.current.onerror = () => setPlaying(null)
    }
    if (playing === k) {
      audio.current.pause()
      return setPlaying(null)
    }
    // پس از پایان هر آیه، آیهٔ بعد پخش می‌شود
    audio.current.onended = () => (s && k < s.ayahs.length ? play(k + 1) : setPlaying(null))
    audio.current.src = `https://everyayah.com/data/Alafasy_128kbps/${pad(n)}${pad(k)}.mp3`
    audio.current.play().catch(() => setPlaying(null))
    setPlaying(k)
    document.getElementById(`a-${k}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const name = s?.name.replace(/^سُورَةُ\s*/, '') ?? ''
  // در متن تنزیل، آیهٔ اول هر سوره (جز فاتحه و توبه) با بسم‌الله آغاز می‌شود؛ بسم‌الله جدا در سربرگ می‌آید
  const stripBasmala = (ar: string) => {
    const w = ar.split(' ')
    return norm(w.slice(0, 4).join(' ')) === norm(BISMILLAH) ? w.slice(4).join(' ') : ar
  }
  const ayahs = (s?.ayahs ?? []).map(([ar, f], k) => [k === 0 && n !== 1 && n !== 9 ? stripBasmala(ar) : ar, f] as const)

  return (
    <ReaderShell tone="quran"
      title={s ? `سورهٔ ${name}` : ''}
      onClose={onClose}
      scrollRef={scroller}
      actions={
        <div className="seg">
          {(['both', 'ar', 'fa'] as Mode[]).map((m) => (
            <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {{ both: 'هر دو', ar: 'عربی', fa: 'فارسی' }[m]}
            </button>
          ))}
        </div>
      }
    >
      <div className="reader-body">
        <header className="surah-head">
          <div className="surah-frame">
            <span className="quran">{s?.name}</span>
          </div>
          {s && (
            <p className="muted">
              سورهٔ {fa(n)} · {fa(s.ayahs.length)} آیه
            </p>
          )}
          {s && n !== 1 && n !== 9 && <div className="bismillah quran">{BISMILLAH}</div>}
        </header>

        {!s && <p className="muted center">در حال باز کردن سوره…</p>}

        {mode === 'ar' ? (
          <div className="mushaf quran" lang="ar">
            {ayahs.map(([ar], k) => (
              <span key={k} id={`a-${k + 1}`} className={playing === k + 1 ? 'playing' : ''} onClick={() => play(k + 1)}>
                {ar} <i className="ayah-no">{fa(k + 1)}</i>{' '}
              </span>
            ))}
          </div>
        ) : (
          ayahs.map(([ar, f], k) => {
            const key = `q:${n}:${k + 1}`
            return (
              <article key={k} id={`a-${k + 1}`} className={`ayah ${playing === k + 1 ? 'playing' : ''}`}>
                <div className="ayah-tools">
                  <span className="ayah-badge">{fa(k + 1)}</span>
                  <button className="mini-btn" onClick={() => play(k + 1)} aria-label="شنیدن تلاوت">
                    {playing === k + 1 ? Icon.pause : Icon.sound}
                  </button>
                  <MarkButton on={p.marks.some((m) => m.key === key)} onClick={() => toggleMark({ key, title: `سورهٔ ${name}، آیهٔ ${fa(k + 1)}`, text: f })} />
                </div>
                {mode === 'both' && (
                  <p className="ayah-ar quran" lang="ar">
                    {ar}
                  </p>
                )}
                <p className="ayah-fa">{f}</p>
              </article>
            )
          })
        )}

        {s && (
          <nav className="reader-nav">
            <button className="btn btn-ghost" disabled={n === 1} onClick={() => go(n - 1)}>
              {Icon.back} سورهٔ قبل
            </button>
            <button className="btn btn-ghost" disabled={n === 114} onClick={() => go(n + 1)}>
              سورهٔ بعد {Icon.next}
            </button>
          </nav>
        )}
      </div>
      <AnimatePresence>
        {playing && (
          <motion.div className="now-playing" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            {Icon.sound} تلاوت آیهٔ {fa(playing)}
            <button onClick={() => play(playing)}>{Icon.pause}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </ReaderShell>
  )
}
