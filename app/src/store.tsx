import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeId = 'emerald' | 'isfahan' | 'parchment'

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
  programs: Record<string, { startedAt: string }>
  /** درس‌های نشان‌شده برای مطالعهٔ دوباره */
  saved: string[]
}

const KEY = 'mishkat.progress.v1'

const initial: Progress = {
  onboarded: false,
  name: '',
  theme: 'emerald',
  completed: {},
  quiz: {},
  habits: [],
  checkins: {},
  studyDays: [],
  journal: [],
  programs: {},
  saved: [],
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
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
    document.documentElement.dataset.theme = p.theme
  }, [p])

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
      toggleSaved: (lessonId) =>
        set((x) => ({ ...x, saved: x.saved.includes(lessonId) ? x.saved.filter((i) => i !== lessonId) : [lessonId, ...x.saved] })),
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
