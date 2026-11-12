// فهرست سبک درس‌نامه‌ها (عنوان، تصویر، منبع) برای صفحه‌هایی که خود درس را لازم ندارند.
// دادهٔ کامل درس‌نامه‌ها (حدود ۵۰۰ کیلوبایت) فقط هنگام باز شدن یک درس بار می‌شود.
// اجرا: node scripts/make-lesson-index.mjs  (پیش از هر build خودکار اجرا می‌شود)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHAPTERS, lessons } from '../app/src/data/lessons.ts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const rows = lessons.map((l) => ({ id: l.id, title: l.title, subtitle: l.subtitle, topic: l.topic, cover: l.cover, ref: l.source.ref, essence: l.sharh?.essence ?? '' }))
const src = `// ساخته‌شده با scripts/make-lesson-index.mjs — دستی ویرایش نشود
export interface LessonCard {
  id: string
  title: string
  subtitle: string
  topic: string
  cover: string
  ref: string
  essence: string
}
export const CHAPTERS: { id: string; title: string; subtitle: string; lessons: string[] }[] = ${JSON.stringify(CHAPTERS, null, 1)}
export const LESSONS: LessonCard[] = ${JSON.stringify(rows, null, 1)}
export const lessonCard = (id: string) => LESSONS.find((l) => l.id === id)
`
const out = path.join(root, 'app', 'src', 'data', 'lesson-index.ts')
if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== src) fs.writeFileSync(out, src)
console.log(`فهرست درس‌نامه‌ها: ${rows.length} درس`)
