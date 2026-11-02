export type SourceKind = 'quran' | 'nahj' | 'hadith'

/** درجهٔ اعتبار سند — فقط از منبع منتشرشده نقل می‌شود، هرگز حدس زده نمی‌شود */
export interface Grading {
  value: string
  by: string
}

export interface SourceText {
  kind: SourceKind
  /** گوینده؛ برای آیات خالی است */
  speaker?: string
  arabic: string
  translation: string
  translator: string
  ref: string
  grading?: Grading
  /** لینکی که هر کس بتواند متن را با منبع تطبیق دهد */
  verifyUrl: string
  /** برای آیات: شمارهٔ سوره و آیه جهت پخش تلاوت */
  ayah?: { surah: number; from: number; to?: number }
}

export interface Parallel {
  label: string
  arabic: string
  translation: string
  ref: string
  school: 'quran' | 'shia' | 'sunni'
  grading?: Grading
  verifyUrl: string
  note?: string
}

export interface Word {
  ar: string
  fa: string
}

export interface TeacherPoint {
  title: string
  body: string
}

export interface Quiz {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface Practice {
  title: string
  steps: string[]
  /** متن کوتاهی که در فهرست «تمرین‌های امروز» دیده می‌شود */
  short: string
}

/** یک تکه از متن اصلی با شرح ساده و ژرف آن */
export interface SharhPart {
  /** عیناً بخشی از متن عربی؛ کنار هم گذاشتن همهٔ تکه‌ها باید کل متن را بسازد */
  ar: string
  fa: string
  plain: string
  deep: string
  life: string
}

export interface Sharh {
  /** پیام اصلی متن در یک جمله */
  essence: string
  parts: SharhPart[]
  misread: { wrong: string; right: string }[]
}

export type ReviewState = 'verified' | 'draft'

export interface Lesson {
  id: string
  title: string
  subtitle: string
  topic: string
  minutes: number
  cover: string
  hook: { title: string; body: string }
  source: SourceText
  words: Word[]
  teacher: TeacherPoint[]
  example: { title: string; body: string }
  parallels: Parallel[]
  /** دیگر نمایش داده نمی‌شود؛ برنامه آزمون ندارد */
  quiz?: Quiz
  sharh?: Sharh
  practice: Practice
  reflect: string
  review: { sourceText: ReviewState; explanation: ReviewState }
}

export interface Program {
  id: string
  title: string
  tagline: string
  days: number
  lessons: string[]
  dailyAction: string
  hue: string
}

export interface Situation {
  id: string
  label: string
  emoji: string
  lessons: string[]
}
