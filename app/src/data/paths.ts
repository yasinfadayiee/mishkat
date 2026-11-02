import type { Program, Situation } from './types'

/** «چله»ها: برنامه‌های ۴۰ روزهٔ تغییر عادت */
export const programs: Program[] = [
  {
    id: 'steadfast',
    title: 'چلهٔ پایداری',
    tagline: 'هر روز دو دقیقه؛ تا کار خوب، خُلق تو شود',
    days: 40,
    lessons: ['consistency', 'change-within', 'opportunity'],
    dailyAction: 'دو دقیقه کار خوبِ هرروزه',
    hue: 'var(--emerald-glow)',
  },
  {
    id: 'calm',
    title: 'چلهٔ آرامش',
    tagline: 'خشم را بشناس، فاصله بینداز، ببخش',
    days: 40,
    lessons: ['anger-key', 'forgive'],
    dailyAction: 'در خشم: هیچ تصمیم و پیامی، تا بیست دقیقه',
    hue: 'var(--rose)',
  },
  {
    id: 'tongue',
    title: 'چلهٔ زبان',
    tagline: 'چهل روز بی‌غیبت؛ دلی سبک‌تر',
    days: 40,
    lessons: ['tongue'],
    dailyAction: 'امروز دربارهٔ هیچ غایبی عیبی نگو',
    hue: 'var(--azure)',
  },
  {
    id: 'thanks',
    title: 'چلهٔ شکر',
    tagline: 'هر شب سه نعمت؛ نگاهی تازه به زندگی',
    days: 40,
    lessons: ['gratitude'],
    dailyAction: 'سه نعمتِ امروز را بنویس',
    hue: 'var(--gold)',
  },
  {
    id: 'decide',
    title: 'چلهٔ تصمیم درست',
    tagline: 'خرد، ادب، مشورت، توکل',
    days: 40,
    lessons: ['consult', 'change-within'],
    dailyAction: 'یک تصمیم، دو مشاورِ امین',
    hue: 'var(--violet)',
  },
]

/** «الان چه حالی داری؟» — راه میان‌بر از موقعیت زندگی به درس مناسب */
export const situations: Situation[] = [
  { id: 'angry', label: 'عصبانی‌ام', emoji: '🔥', lessons: ['anger-key', 'forgive'] },
  { id: 'procrastinate', label: 'کارهایم را عقب می‌اندازم', emoji: '⏳', lessons: ['opportunity', 'consistency'] },
  { id: 'quit', label: 'عادت خوب را ادامه نمی‌دهم', emoji: '🌱', lessons: ['consistency', 'change-within'] },
  { id: 'decision', label: 'باید تصمیم مهمی بگیرم', emoji: '🧭', lessons: ['consult'] },
  { id: 'lacking', label: 'حس می‌کنم کم دارم', emoji: '🍃', lessons: ['gratitude'] },
  { id: 'gossip', label: 'پشت سر کسی حرف زدم', emoji: '🤐', lessons: ['tongue'] },
  { id: 'hurt', label: 'از کسی دلخورم', emoji: '💔', lessons: ['forgive'] },
  { id: 'stuck', label: 'می‌خواهم زندگی‌ام عوض شود', emoji: '🚪', lessons: ['change-within', 'consistency'] },
]

export const library = [
  { id: 'quran', title: 'قرآن کریم', note: 'متن عثمانی تنزیل · ترجمهٔ مکارم شیرازی', kind: 'quran' as const, ready: true },
  { id: 'nahj', title: 'نهج‌البلاغه', note: 'سید رضی · ترتیب صبحی صالح', kind: 'nahj' as const, ready: true },
  { id: 'kafi', title: 'الکافی', note: 'کلینی · با درجهٔ سند علامه مجلسی', kind: 'hadith' as const, ready: true },
  { id: 'ghurar', title: 'غررالحکم و دررالکلم', note: 'آمدی · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
  { id: 'sahifa', title: 'صحیفهٔ سجادیه', note: 'امام سجاد (ع) · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
  { id: 'tuhaf', title: 'تحف‌العقول', note: 'ابن شعبه حرانی · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
]
