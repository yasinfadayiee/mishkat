import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeId = 'auto' | 'emerald' | 'isfahan' | 'parchment' | 'dawn' | 'noon' | 'dusk'

/** هنگامِ روز؛ پوستهٔ «خودکار» رنگ‌هایش را با آن عوض می‌کند */
export type Phase = 'sahar' | 'morning' | 'noon' | 'asr' | 'maghrib' | 'night'
export function phaseOf(d = new Date()): Phase {
  let h = d.getHours() + d.getMinutes() / 60
  // فقط برای آزمایش در حالت توسعه: localStorage['mishkat.hour']
  if (import.meta.env.DEV) h = Number(localStorage.getItem('mishkat.hour') ?? h)
  if (h >= 3.5 && h < 6) return 'sahar'
  if (h >= 6 && h < 11) return 'morning'
  if (h >= 11 && h < 15) return 'noon'
  if (h >= 15 && h < 17.5) return 'asr'
  if (h >= 17.5 && h < 20) return 'maghrib'
  return 'night'
}
export const PHASE_THEME: Record<Phase, Exclude<ThemeId, 'auto'>> = { sahar: 'dawn', morning: 'parchment', noon: 'noon', asr: 'dusk', maghrib: 'dusk', night: 'isfahan' }
export const PHASE_NAME: Record<Phase, string> = { sahar: 'سحر', morning: 'صبح', noon: 'ظهر', asr: 'عصر', maghrib: 'مغرب', night: 'شب' }

export interface Habit {
  lessonId: string
  short: string
  addedAt: string
}

export interface JournalEntry {
  lessonId: string
  text: string
  date: string
}

/** متن نشان‌شده در قرآن یا کتاب‌ها */
export interface Mark {
  /** q:سوره:آیه یا b:کتاب:شناسه */
  key: string
  title: string
  text: string
  at: string
}

/** یادداشتِ من روی یک متن: نوشتهٔ آزاد و پاسخ به پرسشِ آینه */
export interface Note {
  title: string
  /** متنِ اصلی (برای نمایش در یادداشت‌ها) */
  text: string
  note?: string
  answer?: string
  question?: string
  at: string
}

export interface Progress {
  onboarded: boolean
  name: string
  theme: ThemeId
  completed: Record<string, string>
  quiz: Record<string, boolean>
  habits: Habit[]
  /** کلید: تاریخ روز؛ مقدار: شناسهٔ درس‌هایی که تمرینشان آن روز انجام شد */
  checkins: Record<string, string[]>
  studyDays: string[]
  journal: JournalEntry[]
  /** برنامه‌های مطالعه: روزهای خوانده‌شده (شمارهٔ روز از ۰) */
  programs: Record<string, { startedAt: string; done?: number[] }>
  /** درس‌های نشان‌شده برای مطالعهٔ دوباره */
  saved: string[]
  marks: Mark[]
  /** کلید: q:سوره:آیه یا b:کتاب:شناسه */
  notes: Record<string, Note>
  /** کاربر خودش پوسته انتخاب کرده است (وگرنه پوستهٔ خودکار) */
  themeSet?: boolean
}

const KEY = 'mishkat.progress.v1'

const initial: Progress = {
  onboarded: false,
  name: '',
  theme: 'auto',
  completed: {},
  quiz: {},
  habits: [],
  checkins: {},
  studyDays: [],
  journal: [],
  programs: {},
  saved: [],
  marks: [],
  notes: {},
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const x: Progress = { ...initial, ...JSON.parse(raw) }
      return x.themeSet ? x : { ...x, theme: 'auto' }
    }
  } catch {
    /* حالت خصوصی مرورگر یا ذخیره‌سازی مسدود */
  }
  return initial
}

export const dayKey = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** روزهای پیاپی مطالعه یا تمرین، تا امروز (یا دیروز اگر امروز هنوز کاری نشده) */
export function streakOf(p: Progress) {
  const active = new Set([...p.studyDays, ...Object.keys(p.checkins).filter((k) => p.checkins[k].length)])
  let cursor = new Date()
  if (!active.has(dayKey(cursor))) cursor = addDays(cursor, -1)
  let n = 0
  while (active.has(dayKey(cursor))) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function activeDays(p: Progress) {
  return new Set([...p.studyDays, ...Object.keys(p.checkins).filter((k) => p.checkins[k].length)])
}

interface Store {
  p: Progress
  set: (fn: (p: Progress) => Progress) => void
  completeLesson: (id: string) => void
  adoptHabit: (lessonId: string, short: string) => void
  toggleCheckin: (lessonId: string) => void
  addJournal: (lessonId: string, text: string) => void
  toggleSaved: (lessonId: string) => void
  toggleMark: (m: Omit<Mark, 'at'>) => void
  setNote: (key: string, patch: Partial<Note> & Pick<Note, 'title' | 'text'>) => void
  /** شروع یا کنار گذاشتن برنامهٔ مطالعه، و علامت روز خوانده‌شده */
  startPlan: (id: string) => void
  stopPlan: (id: string) => void
  togglePlanDay: (id: string, day: number) => void
  streak: number
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      /* بدون ذخیره‌سازی هم اپ کار می‌کند */
    }
  }, [p])

  // پوستهٔ خودکار هر چند دقیقه با هنگامِ روز هماهنگ می‌شود
  useEffect(() => {
    const apply = () => {
      const phase = phaseOf()
      document.documentElement.dataset.phase = phase
      document.documentElement.dataset.theme = p.theme === 'auto' ? PHASE_THEME[phase] : p.theme
    }
    apply()
    const t = setInterval(apply, 5 * 60000)
    return () => clearInterval(t)
  }, [p.theme])

  const set = useCallback((fn: (p: Progress) => Progress) => setP((prev) => fn(prev)), [])

  const store = useMemo<Store>(() => {
    const today = dayKey()
    return {
      p,
      set,
      streak: streakOf(p),
      completeLesson: (id) =>
        set((x) => ({
          ...x,
          completed: { ...x.completed, [id]: x.completed[id] ?? today },
          studyDays: x.studyDays.includes(today) ? x.studyDays : [...x.studyDays, today],
        })),
      adoptHabit: (lessonId, short) =>
        set((x) =>
          x.habits.some((h) => h.lessonId === lessonId)
            ? x
            : { ...x, habits: [...x.habits, { lessonId, short, addedAt: today }] },
        ),
      toggleCheckin: (lessonId) =>
        set((x) => {
          const list = x.checkins[today] ?? []
          const next = list.includes(lessonId) ? list.filter((i) => i !== lessonId) : [...list, lessonId]
          return { ...x, checkins: { ...x.checkins, [today]: next } }
        }),
      addJournal: (lessonId, text) =>
        set((x) => ({ ...x, journal: [{ lessonId, text, date: today }, ...x.journal] })),
      toggleMark: (m) =>
        set((x) => ({ ...x, marks: x.marks.some((k) => k.key === m.key) ? x.marks.filter((k) => k.key !== m.key) : [{ ...m, at: today }, ...x.marks] })),
      setNote: (key, patch) =>
        set((x) => {
          const n = { ...x.notes[key], ...patch, at: today }
          const notes = { ...x.notes }
          if (n.note?.trim() || n.answer?.trim()) notes[key] = n
          else delete notes[key]
          return { ...x, notes }
        }),
      toggleSaved: (lessonId) =>
        set((x) => ({ ...x, saved: x.saved.includes(lessonId) ? x.saved.filter((i) => i !== lessonId) : [lessonId, ...x.saved] })),
      startPlan: (id) => set((x) => ({ ...x, programs: { ...x.programs, [id]: x.programs[id] ?? { startedAt: today, done: [] } } })),
      stopPlan: (id) =>
        set((x) => {
          const programs = { ...x.programs }
          delete programs[id]
          return { ...x, programs }
        }),
      togglePlanDay: (id, day) =>
        set((x) => {
          const cur = x.programs[id] ?? { startedAt: today, done: [] }
          const done = cur.done ?? []
          return { ...x, programs: { ...x.programs, [id]: { ...cur, done: done.includes(day) ? done.filter((d) => d !== day) : [...done, day] } } }
        }),
    }
  }, [p, set])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

export const fa = (n: number) => n.toLocaleString('fa-IR')
