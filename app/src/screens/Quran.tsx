import { useEffect, useMemo, useRef, useState } from 'react'
import { askAbout } from '../chat'
import { AutoText } from '../autotext'
import { lastPlace, loadJuz, loadSurah, loadSurahs, norm, savePlace, type Surah } from '../books'
import { SURAH_FA, surahName } from '../data/surah-fa'
import { Load, LoadFail, Skeleton, useLoad } from '../load'
import { MarkButton, ReaderShell } from '../reader'
import { go, href, shareUrl } from '../router'
import { copyText, shareCard, shareLink, toast } from '../share'
import { fa, useStore } from '../store'
import { Icon, Sheet } from '../ui'

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
type Mode = 'both' | 'ar' | 'fa'
const pad = (n: number) => String(n).padStart(3, '0')

/** قاریان (فایل‌های هر آیه از everyayah.com) */
const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'مشاری العفاسی' },
  { id: 'Parhizgar_48kbps', name: 'شهریار پرهیزگار' },
  { id: 'Minshawy_Murattal_128kbps', name: 'محمدصدیق منشاوی' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبدالباسط (ترتیل)' },
  { id: 'Husary_128kbps', name: 'محمود خلیل حصری' },
] as const
const PREF = 'mishkat.player'
type PlayerPrefs = { reciter: string; rate: number; rep: number }
const readPrefs = (): PlayerPrefs => {
  const d = { reciter: RECITERS[0].id as string, rate: 1, rep: 1 }
  try {
    const old = localStorage.getItem('mishkat.reciter')
    return { ...d, ...(old && { reciter: old }), ...JSON.parse(localStorage.getItem(PREF) ?? '{}') }
  } catch {
    return d
  }
}
const audioUrl = (reciter: string, s: number, a: number) => `https://everyayah.com/data/${reciter}/${pad(s)}${pad(a)}.mp3`

/** فهرست سوره‌ها: دو زبانهٔ «سوره» و «جزء»، «برو به آیه» و «ادامه از آیهٔ …» */
export function Quran() {
  const list = useLoad(loadSurahs, [])
  const juz = useLoad(loadJuz, [])
  const [tab, setTab] = useState<'surah' | 'juz'>('surah')
  const [q, setQ] = useState('')
  const [to, setTo] = useState({ s: 1, a: '' })
  const place = lastPlace()
  const last = place?.book === 'quran' ? place : null
  const shown = useMemo(() => {
    const k = norm(q.trim())
    const rows = list.data ?? []
    if (!k) return rows
    return rows.filter((s) => norm(`${s.name} ${SURAH_FA[s.n - 1]}`).includes(k) || String(s.n) === q.trim() || fa(s.n) === q.trim())
  }, [list.data, q])
  const count = list.data?.[to.s - 1]?.count ?? 0
  const jump = () => {
    const a = Number(to.a.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
    if (a >= 1 && a <= count) go(href.surah(to.s, a))
    else toast(`سورهٔ ${SURAH_FA[to.s - 1]} ${fa(count)} آیه دارد`)
  }

  return (
    <div className="fade-up">
      <header className="quiet-head" data-art="quran">
        <div className="eyebrow">قرآن کریم</div>
        <h1 className="h1">۱۱۴ سوره، با ترجمهٔ کامل</h1>
        <p className="muted">متن عثمانی «تنزیل»، ترجمهٔ آیت‌الله مکارم شیرازی، تلاوت با پنج قاری</p>
      </header>

      {last && (
        <button className="continue-card" onClick={() => go(href.surah(last.sec, last.i))}>
          <span className="cc-icon">{Icon.rahl}</span>
          <span className="cc-text">
            <small>ادامهٔ خواندن</small>
            <b>
              {surahName(last.sec)}
              {last.i ? `، از آیهٔ ${fa(last.i)}` : ''}
            </b>
          </span>
          <span className="cc-go">{Icon.next}</span>
        </button>
      )}

      <form className="goto-ayah" onSubmit={(e) => (e.preventDefault(), jump())}>
        <b>برو به آیه</b>
        <select value={to.s} onChange={(e) => setTo({ ...to, s: Number(e.target.value) })} aria-label="سوره">
          {SURAH_FA.map((n, k) => (
            <option key={k} value={k + 1}>
              {fa(k + 1)}. {n}
            </option>
          ))}
        </select>
        <input inputMode="numeric" value={to.a} onChange={(e) => setTo({ ...to, a: e.target.value })} placeholder={count ? `آیه (۱ تا ${fa(count)})` : 'آیه'} aria-label="شمارهٔ آیه" />
        <button className="btn btn-gold" type="submit">
          برو
        </button>
      </form>

      <div className="seg-tabs" role="tablist" aria-label="فهرست">
        <button role="tab" aria-selected={tab === 'surah'} className={tab === 'surah' ? 'on' : ''} onClick={() => setTab('surah')}>
          سوره
        </button>
        <button role="tab" aria-selected={tab === 'juz'} className={tab === 'juz' ? 'on' : ''} onClick={() => setTab('juz')}>
          جزء
        </button>
      </div>

      {tab === 'surah' ? (
        <>
          <label className="lib-search">
            {Icon.search}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="نام یا شمارهٔ سوره؛ مثلاً «بقره»" aria-label="جست‌وجوی سوره" />
          </label>
          <Load r={list} what="فهرست سوره‌ها" skel={<Skeleton kind="list" rows={8} />}>
            {() => (
              <div className="surah-grid">
                {shown.map((s) => (
                  <button key={s.n} className="surah-row" onClick={() => go(href.surah(s.n))}>
                    <span className="sr-n">{fa(s.n)}</span>
                    <span className="sr-names">
                      <b>{SURAH_FA[s.n - 1]}</b>
                      <span className="sr-name quran" lang="ar">
                        {s.name}
                      </span>
                    </span>
                    <small>
                      {s.type}، {fa(s.count)} آیه
                    </small>
                  </button>
                ))}
              </div>
            )}
          </Load>
        </>
      ) : (
        <Load r={juz} what="فهرست جزءها" skel={<Skeleton kind="list" rows={8} />}>
          {(rows) => (
            <div className="surah-grid">
              {rows.map((j) => (
                <button key={j.j} className="surah-row" onClick={() => go(href.surah(j.s, j.a > 1 ? j.a : undefined))}>
                  <span className="sr-n">{fa(j.j)}</span>
                  <span className="sr-names">
                    <b>جزء {fa(j.j)}</b>
                  </span>
                  <small>
                    از {surahName(j.s)}، آیهٔ {fa(j.a)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </Load>
      )}
    </div>
  )
}

/* ───────── پخش تلاوت ───────── */
interface Play {
  playing: number | null
  start: (a: number) => void
  stop: () => void
  toggle: (a: number) => void
  startRange: (r: { from: number; to: number; times: number }) => void
}

function usePlayer(s: Surah | null, n: number, prefs: PlayerPrefs, range: { from: number; to: number; times: number } | null): Play {
  const [playing, setPlaying] = useState<number | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const next = useRef<HTMLAudioElement | null>(null)
  const st = useRef({ s, prefs, range, left: 1, loops: 1 })
  st.current.s = s
  st.current.prefs = prefs
  st.current.range = range

  const stop = () => {
    audio.current?.pause()
    setPlaying(null)
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
  }

  const start = (a: number, fresh = true) => {
    const { s, prefs } = st.current
    if (!s) return
    if (fresh) {
      st.current.left = prefs.rep
      st.current.loops = st.current.range?.times ?? 1
    }
    if (!audio.current) {
      audio.current = new Audio()
      audio.current.onerror = () => {
        stop()
        toast(navigator.onLine ? 'فایل تلاوت باز نشد؛ کمی بعد دوباره امتحان کن.' : 'اینترنت نیست؛ تلاوت بدون اینترنت پخش نمی‌شود.')
      }
    }
    const el = audio.current
    // پس از پایان هر آیه: تکرار همان آیه، یا آیهٔ بعد، یا برگشت به آغاز بازه
    el.onended = () => {
      const { s, range, prefs } = st.current
      if (--st.current.left > 0) return start(a, false)
      st.current.left = prefs.rep
      const end = range ? range.to : (s?.ayahs.length ?? a)
      if (a < end) return start(a + 1, false)
      if (range && --st.current.loops > 0) return start(range.from, false)
      stop()
    }
    el.src = audioUrl(prefs.reciter, n, a)
    el.playbackRate = prefs.rate
    el.play().catch((e) => e.name !== 'AbortError' && stop())
    setPlaying(a)
    // فایل آیهٔ بعد از پیش گرفته می‌شود تا میان آیه‌ها مکث نباشد
    if (a < s.ayahs.length) {
      next.current ??= new Audio()
      next.current.preload = 'auto'
      next.current.src = audioUrl(prefs.reciter, n, a + 1)
    }
    document.getElementById(`a-${a}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: `${surahName(n)}، آیهٔ ${fa(a)}`, artist: RECITERS.find((r) => r.id === prefs.reciter)?.name ?? '', album: 'مشکات', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] })
      navigator.mediaSession.playbackState = 'playing'
    }
  }

  const ref = useRef({ start, stop, playing })
  ref.current = { start, stop, playing }
  // کنترل از صفحهٔ قفل گوشی
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h)
      } catch {
        /* پشتیبانی نمی‌شود */
      }
    }
    set('play', () => (audio.current?.src ? (audio.current.play(), setPlaying(ref.current.playing ?? 1)) : ref.current.start(1)))
    set('pause', () => ref.current.stop())
    set('previoustrack', () => ref.current.playing && ref.current.playing > 1 && ref.current.start(ref.current.playing - 1))
    set('nexttrack', () => ref.current.playing && st.current.s && ref.current.playing < st.current.s.ayahs.length && ref.current.start(ref.current.playing + 1))
    return () => ['play', 'pause', 'previoustrack', 'nexttrack'].forEach((a) => set(a as MediaSessionAction, null))
  }, [])

  useEffect(() => () => audio.current?.pause(), [])
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = prefs.rate
  }, [prefs.rate])

  return {
    playing,
    start,
    stop,
    toggle: (a) => (playing === a ? stop() : start(a)),
    startRange: (r) => {
      st.current.range = r
      start(r.from)
    },
  }
}

/** خواندن یک سوره */
export function SurahReader({ n, ayah, onClose }: { n: number; ayah?: number; onClose: () => void }) {
  const r = useLoad(() => loadSurah(n), [n])
  const s = r.data
  const [mode, setMode] = useState<Mode>('both')
  const [prefs, setPrefs] = useState(readPrefs)
  const [range, setRange] = useState<{ from: number; to: number; times: number } | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [menu, setMenu] = useState<number | null>(null)
  const [writing, setWriting] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const { p, toggleMark, setNote } = useStore()
  const player = usePlayer(s, n, prefs, range)
  const savePrefs = (x: Partial<PlayerPrefs>) => {
    const next = { ...prefs, ...x }
    setPrefs(next)
    try {
      localStorage.setItem(PREF, JSON.stringify(next))
    } catch {
      /* بدون ذخیره */
    }
  }

  useEffect(() => {
    if (!s) return
    savePlace({ book: 'quran', title: 'قرآن کریم', sec: n, ch: 0, label: surahName(n), ...(ayah && { i: ayah }) })
    const el = ayah ? document.getElementById(`a-${ayah}`) : null
    if (el) {
      el.scrollIntoView({ block: 'start' })
      el.classList.remove('flash')
      void el.offsetWidth
      el.classList.add('flash')
    } else scroller.current?.scrollTo({ top: 0 })
  }, [s, n, ayah])

  // «ادامهٔ مطالعه» آیه‌ای را که بالای صفحه است نگه می‌دارد
  useEffect(() => {
    const el = scroller.current
    if (!el || !s) return
    let t: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const top = el.getBoundingClientRect().top + 90
        const first = [...el.querySelectorAll<HTMLElement>('[id^="a-"]')].find((x) => x.getBoundingClientRect().bottom > top)
        if (first) savePlace({ book: 'quran', title: 'قرآن کریم', sec: n, ch: 0, label: surahName(n), i: Number(first.id.slice(2)) })
      }, 400)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => (el.removeEventListener('scroll', onScroll), clearTimeout(t))
  }, [s, n])

  // در متن تنزیل، آیهٔ اول هر سوره (جز فاتحه و توبه) با بسم‌الله آغاز می‌شود؛ بسم‌الله جدا در سربرگ می‌آید
  const stripBasmala = (ar: string) => {
    const w = ar.split(' ')
    return norm(w.slice(0, 4).join(' ')) === norm(BISMILLAH) ? w.slice(4).join(' ') : ar
  }
  const ayahs = (s?.ayahs ?? []).map(([ar, f], k) => [k === 0 && n !== 1 && n !== 9 ? stripBasmala(ar) : ar, f] as const)
  const marker = (k: number) => {
    const x = s?.m?.[k]
    if (!x || (!x.j && !x.h) || (n === 1 && k === 1)) return null
    return (
      <div className="q-marker" aria-label="نشانهٔ تنزیل">
        {x.j ? `آغاز جزء ${fa(x.j)}` : ''}
        {x.j && x.h ? '، ' : ''}
        {x.h ? `حزب ${fa(x.h)}` : ''}
      </div>
    )
  }

  // در حالت «عربی»، پخش فقط با نگه‌داشتن انگشت روی آیه (نه با لمس ساده)
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const holdProps = (k: number) => ({
    onPointerDown: () => (hold.current = setTimeout(() => player.start(k), 600)),
    onPointerUp: () => clearTimeout(hold.current),
    onPointerLeave: () => clearTimeout(hold.current),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const ctxOf = (k: number) => {
    const [ar, f] = ayahs[k - 1] ?? ['', '']
    const key = `q:${n}:${k}`
    const title = `${surahName(n)}، آیهٔ ${fa(k)}`
    const url = shareUrl(href.surah(n, k))
    return { ar, f, key, title, url }
  }
  const actions = (k: number): [keyof typeof Icon, string, () => void][] => {
    const c = ctxOf(k)
    return [
      ['sound', 'شنیدن از این آیه', () => player.start(k)],
      ['chat', 'بپرس از هوش مصنوعی', () => askAbout({ title: c.title, ar: c.ar, fa: c.f, source: `${c.title}؛ متن تنزیل، ترجمهٔ آیت‌الله مکارم شیرازی`, path: c.url.replace(/^.*#/, '') })],
      ['pen', p.notes[c.key]?.note ? 'ویرایش یادداشت من' : 'یادداشت من', () => setWriting(k)],
      ['card', 'کارت تصویری برای فرستادن', () => shareCard({ ar: c.ar, fa: c.f, source: c.title, shelf: 'quran' })],
      ['copy', 'رونوشت آیه و ترجمه', () => copyText(`${c.ar}\n\n${c.f}\n\n${c.title}`, 'آیه رونوشت شد')],
      ['link', 'هم‌رسانی پیوند', () => shareLink(c.url, c.title)],
      ['flag', 'رونوشت نشانی برای گزارش خطا در ترجمه', () => copyText(`${c.title}\n${c.url}`, 'نشانی آیه رونوشت شد؛ همراه توضیح خطا بفرست')],
    ]
  }

  return (
    <ReaderShell
      tone="quran"
      title={surahName(n)}
      sub={s ? `${fa(s.ayahs.length)} آیه، ${s.type === 'Meccan' ? 'مکی' : 'مدنی'}` : undefined}
      prev={n > 1 ? () => go(href.surah(n - 1), true) : null}
      next={n < 114 ? () => go(href.surah(n + 1), true) : null}
      onClose={onClose}
      scrollRef={scroller}
      actions={
        <div className="seg" role="radiogroup" aria-label="حالت خواندن">
          {(['both', 'ar', 'fa'] as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {{ both: 'هر دو', ar: 'عربی', fa: 'فارسی' }[m]}
            </button>
          ))}
        </div>
      }
    >
      <div className="reader-body quran-body">
        <header className="surah-head">
          <div className="surah-frame">
            <span className="quran" lang="ar">
              {s?.name}
            </span>
          </div>
          <p className="muted">
            {surahName(n)}، سورهٔ {fa(n)} قرآن
          </p>
          {s && n !== 1 && n !== 9 && <div className="bismillah quran">{BISMILLAH}</div>}
        </header>

        {r.error ? <LoadFail error={r.error} retry={r.retry} what="این سوره" /> : !s && <Skeleton kind="reader" rows={4} />}

        {s &&
          (mode === 'ar' ? (
            <>
              <p className="hold-hint">برای شنیدن هر آیه، انگشتت را روی آن نگه دار.</p>
              <div className="mushaf quran" lang="ar">
                {ayahs.map(([ar], k) => (
                  <span key={k} id={`a-${k + 1}`} className={player.playing === k + 1 ? 'playing' : ''} {...holdProps(k + 1)}>
                    {s.m?.[k + 1]?.j && k > 0 ? <i className="juz-inline">جزء {fa(s.m[k + 1].j!)}</i> : null}
                    {ar} <i className="ayah-no">{fa(k + 1)}</i>{' '}
                  </span>
                ))}
              </div>
            </>
          ) : (
            ayahs.map(([ar, f], k) => {
              const a = k + 1
              const key = `q:${n}:${a}`
              const note = p.notes[key]
              return (
                <div key={k}>
                  {marker(a)}
                  <article id={`a-${a}`} className={`ayah ${player.playing === a ? 'playing' : ''}`}>
                    <div className="ayah-tools">
                      <span className="ayah-badge">{fa(a)}</span>
                      {s.m?.[a]?.sj && <span className="chip sajda">آیهٔ سجده</span>}
                      <span style={{ flex: 1 }} />
                      <button className="mini-btn" onClick={() => player.toggle(a)} aria-label={player.playing === a ? 'توقف تلاوت' : 'شنیدن تلاوت'}>
                        {player.playing === a ? Icon.pause : Icon.sound}
                      </button>
                      <MarkButton on={p.marks.some((m) => m.key === key)} onClick={() => toggleMark({ key, title: `${surahName(n)}، آیهٔ ${fa(a)}`, text: f })} />
                      <button className="mini-btn" onClick={() => setMenu(a)} aria-label="کارهای دیگر با این آیه" aria-haspopup="dialog">
                        {Icon.more}
                      </button>
                    </div>
                    {mode === 'both' && (
                      <p className="ayah-ar quran" lang="ar">
                        {ar}
                      </p>
                    )}
                    <p className="ayah-fa">{f}</p>
                    {(writing === a || note?.note) && (
                      <div className="tb-mynote">
                        <small>یادداشت من</small>
                        <AutoText label="یادداشت من" value={note?.note ?? ''} autoFocus={writing === a && !note?.note} placeholder="هرچه از این آیه فهمیدی یا می‌خواهی به یاد بماند…" onSave={(v) => setNote(key, { title: `${surahName(n)}، آیهٔ ${fa(a)}`, text: f, note: v })} />
                      </div>
                    )}
                  </article>
                </div>
              )
            })
          ))}

        {s && (
          <nav className="reader-nav" aria-label="سورهٔ قبل و بعد">
            <button className="btn btn-ghost" disabled={n === 1} onClick={() => go(href.surah(n - 1), true)}>
              {Icon.back} {n > 1 ? surahName(n - 1) : 'سورهٔ قبل'}
            </button>
            <button className="btn btn-ghost" disabled={n === 114} onClick={() => go(href.surah(n + 1), true)}>
              {n < 114 ? surahName(n + 1) : 'سورهٔ بعد'} {Icon.next}
            </button>
          </nav>
        )}
      </div>

      {s && (
        <div className="player-bar" role="region" aria-label="پخش تلاوت">
          <button className="pb-main" onClick={() => (player.playing ? player.stop() : player.start(range?.from ?? 1))} aria-label={player.playing ? 'توقف' : 'پخش'}>
            {player.playing ? Icon.pause : Icon.play}
          </button>
          <button className="icon-btn" disabled={!player.playing || player.playing <= 1} onClick={() => player.playing && player.start(player.playing - 1)} aria-label="آیهٔ قبل">
            {Icon.back}
          </button>
          <button className="icon-btn" disabled={!player.playing || player.playing >= s.ayahs.length} onClick={() => player.playing && player.start(player.playing + 1)} aria-label="آیهٔ بعد">
            {Icon.next}
          </button>
          <span className="pb-label">
            <b>{player.playing ? `آیهٔ ${fa(player.playing)}` : range ? `آیهٔ ${fa(range.from)} تا ${fa(range.to)}` : 'کل سوره'}</b>
            <small>
              {RECITERS.find((x) => x.id === prefs.reciter)?.name}
              {prefs.rate !== 1 ? `، سرعت ${fa(prefs.rate)}` : ''}
              {prefs.rep > 1 ? `، هر آیه ${fa(prefs.rep)} بار` : ''}
            </small>
          </span>
          <button className="icon-btn" onClick={() => setShowPlayer(true)} aria-label="قاری، سرعت و تکرار" aria-haspopup="dialog">
            {Icon.gear}
          </button>
        </div>
      )}

      <Sheet open={showPlayer} onClose={() => setShowPlayer(false)} label="تنظیم تلاوت">
        <h3 className="h2 sheet-title">تلاوت</h3>
        <div className="player-set">
          <label>
            <span>قاری</span>
            <select value={prefs.reciter} onChange={(e) => savePrefs({ reciter: e.target.value })}>
              {RECITERS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <div className="opt-row" role="radiogroup" aria-label="سرعت">
            <span>سرعت</span>
            {[0.75, 1, 1.25, 1.5].map((v) => (
              <button key={v} role="radio" aria-checked={prefs.rate === v} className={prefs.rate === v ? 'on' : ''} onClick={() => savePrefs({ rate: v })}>
                {fa(v)}
              </button>
            ))}
          </div>
          <div className="opt-row" role="radiogroup" aria-label="تکرار هر آیه">
            <span>تکرار هر آیه</span>
            {[1, 3, 5, 10].map((v) => (
              <button key={v} role="radio" aria-checked={prefs.rep === v} className={prefs.rep === v ? 'on' : ''} onClick={() => savePrefs({ rep: v })}>
                {v === 1 ? 'یک بار' : `${fa(v)} بار`}
              </button>
            ))}
          </div>
          <fieldset className="range-set">
            <legend>تکرار یک بازه برای حفظ</legend>
            <label>
              از آیهٔ
              <input type="number" min={1} max={s?.ayahs.length} value={range?.from ?? 1} onChange={(e) => setRange({ from: Math.max(1, Number(e.target.value)), to: Math.max(Number(e.target.value), range?.to ?? 1), times: range?.times ?? 3 })} />
            </label>
            <label>
              تا
              <input type="number" min={1} max={s?.ayahs.length} value={range?.to ?? Math.min(5, s?.ayahs.length ?? 5)} onChange={(e) => setRange({ from: range?.from ?? 1, to: Math.min(s?.ayahs.length ?? 1, Number(e.target.value)), times: range?.times ?? 3 })} />
            </label>
            <label>
              <select value={range?.times ?? 3} onChange={(e) => setRange({ from: range?.from ?? 1, to: range?.to ?? Math.min(5, s?.ayahs.length ?? 5), times: Number(e.target.value) })} aria-label="چند بار">
                {[3, 5, 10].map((v) => (
                  <option key={v} value={v}>
                    {fa(v)} بار
                  </option>
                ))}
              </select>
            </label>
            <div className="range-actions">
              <button
                className="btn btn-gold"
                onClick={() => {
                  const rr = range ?? { from: 1, to: Math.min(5, s?.ayahs.length ?? 5), times: 3 }
                  setRange(rr)
                  setShowPlayer(false)
                  player.startRange(rr)
                }}
              >
                پخش بازه
              </button>
              {range && (
                <button className="link-btn" onClick={() => setRange(null)}>
                  برداشتن بازه
                </button>
              )}
            </div>
          </fieldset>
        </div>
      </Sheet>

      <Sheet open={menu !== null} onClose={() => setMenu(null)} label="کارها با این آیه">
        {menu !== null && (
          <>
            <h3 className="h2 sheet-title">
              {surahName(n)}، آیهٔ {fa(menu)}
            </h3>
            <div className="action-list">
              {actions(menu).map(([icon, label, run]) => (
                <button key={label} onClick={() => (setMenu(null), run())}>
                  {Icon[icon]}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </Sheet>
    </ReaderShell>
  )
}
