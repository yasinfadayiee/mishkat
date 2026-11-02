// ادغام پیش‌نویس‌های ChatGPT با متن‌های تأییدشده → app/src/data/lessons2.ts
// متن عربی و ترجمهٔ مکارم فقط از content/batch2-sources.json می‌آید؛ از خروجی ChatGPT فقط بخش آموزشی برداشته می‌شود.
// اجرا: node scripts/merge-batch2.mjs <lessons-A.json> <lessons-B.json>
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const sources = JSON.parse(fs.readFileSync(path.join(root, 'content', 'batch2-sources.json'), 'utf8'))
const drafts = process.argv.slice(2).flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')))

const COVER = {
  // هر منزل، هشت تصویر متفاوت
  'hearts-tire': 'c9', 'two-patience': 'c10', 'small-sins': 'c12', capacity: 'c16', 'self-account': 'c22',
  'forgive-power': 'c18', 'answer-peace': 'c23', 'heart-rest': 'c11', ease: 'c12', 'hope-relapse': 'c20', 'reason-desire': 'c10',
  'think-speak': 'c22', 'word-chain': 'c13', silence: 'c11', lying: 'c19', 'verify-news': 'c24', 'say-do': 'c15', dignity: 'c10',
  'golden-rule': 'c14', friends: 'c6', 'among-people': 'c7', 'good-character': 'c23', humility: 'c18', envy: 'c21', 'own-faults': 'c2', 'truth-trust': 'c19',
  'knowledge-wealth': 'c9', 'say-idk': 'c15', 'lessons-life': 'c3', 'three-hours': 'c16', parents: 'c17', 'young-heart': 'c1',
}

const arabicWord = /[ء-يً-ْ]*[َُّْ][ء-يً-ْ]*[َُّْ][ء-يً-ْ]*/g
const problems = []
const lessons = []
for (const s of sources) {
  const d = drafts.find((x) => x.id === s.id)
  if (!d) {
    problems.push(`${s.id}: پیش‌نویس ندارد`)
    continue
  }
  const isQuran = s.source.kind === 'quran'
  const tr = isQuran ? s.source.translation : (d.sourceTranslation || '').trim()
  if (!tr) problems.push(`${s.id}: ترجمه ندارد`)
  for (const w of d.words ?? []) if (!s.source.arabic.includes(w.ar)) problems.push(`${s.id}: کلمهٔ «${w.ar}» عیناً در متن نیست`)
  if ((d.teacher ?? []).length !== 3) problems.push(`${s.id}: معلم باید ۳ نکته باشد`)
  if ((d.parallels ?? []).length !== s.parallels.length) problems.push(`${s.id}: تعداد شاهدها ${d.parallels?.length} به‌جای ${s.parallels.length}`)
  const prose = JSON.stringify([d.hook, d.teacher, d.example, d.quiz, d.practice, d.reflect])
  const harakat = prose.match(arabicWord) ?? []
  if (harakat.length) problems.push(`${s.id}: متن عربیِ اعراب‌دار در توضیحات → ${harakat.slice(0, 3).join(' | ')}`)
  const banned = prose.match(/تفسیر|المیزان|نمونه‌ای از تفسیر|علامه|شهید مطهری|آیت‌الله|بحارالانوار|پژوهش‌ها|تحقیقات نشان|دانشمندان|روانشناس|درصد/g)
  if (banned) problems.push(`${s.id}: واژهٔ ممنوع در توضیحات → ${[...new Set(banned)].join('، ')}`)
  lessons.push({
    id: s.id,
    title: d.title,
    subtitle: d.subtitle,
    topic: s.topic,
    minutes: d.minutes,
    cover: `covers/${COVER[s.id] ?? 'c1'}.webp`,
    hook: d.hook,
    source: {
      kind: s.source.kind,
      ...(s.source.speaker ? { speaker: s.source.speaker } : {}),
      arabic: s.source.arabic,
      translation: tr,
      translator: s.source.translator,
      ref: s.source.ref,
      ...(s.source.grading ? { grading: s.source.grading } : {}),
      verifyUrl: s.source.verifyUrl,
      ...(s.source.ayah ? { ayah: s.source.ayah } : {}),
    },
    words: d.words,
    teacher: d.teacher,
    example: d.example,
    parallels: s.parallels.map((p, i) => ({
      label: d.parallels?.[i]?.label ?? '',
      arabic: p.arabic,
      translation: p.school === 'quran' ? p.translation : (d.parallels?.[i]?.translation ?? '').trim(),
      ref: p.ref,
      school: p.school,
      ...(p.grading ? { grading: p.grading } : {}),
      verifyUrl: p.verifyUrl,
      ...(d.parallels?.[i]?.note ? { note: d.parallels[i].note } : {}),
    })),
    quiz: d.quiz,
    practice: d.practice,
    reflect: d.reflect,
    review: { sourceText: 'verified', explanation: 'draft' },
  })
}

if (problems.length) {
  console.log(`${problems.length} مورد:\n- ` + problems.join('\n- '))
}
const ts = `import type { Lesson } from './types'

// تولید خودکار با scripts/merge-batch2.mjs — متن عربی و ترجمهٔ آیات از منبع؛ توضیحات پیش‌نویس است.
export const lessons2: Lesson[] = ${JSON.stringify(lessons, null, 2)}
`
fs.writeFileSync(path.join(root, 'app', 'src', 'data', 'lessons2.ts'), ts)
console.log(`${lessons.length} درس نوشته شد`)
