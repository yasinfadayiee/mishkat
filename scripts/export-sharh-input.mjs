// ورودی کار شرح جمله‌به‌جمله را برای ChatGPT می‌سازد (دو دستهٔ ۲۰تایی)
import fs from 'node:fs'
import { lessons } from '../app/src/data/lessons.ts'
const out = 'C:/Users/Yas PC/.claude/gpt-share'
const rows = lessons.map((l) => ({
  id: l.id,
  title: l.title,
  topic: l.topic,
  speaker: l.source.speaker ?? 'قرآن کریم (سخن خداوند)',
  ref: l.source.ref,
  arabic: l.source.arabic,
  translation: l.source.translation,
  words: l.words,
  teacher_points_already_in_lesson: l.teacher.map((t) => t.title),
}))
fs.writeFileSync(`${out}/mishkat-sharh-A.json`, JSON.stringify(rows.slice(0, 20), null, 1))
fs.writeFileSync(`${out}/mishkat-sharh-B.json`, JSON.stringify(rows.slice(20), null, 1))
console.log(rows.length, rows.map((r) => r.arabic.split(' ').length).join(','))
