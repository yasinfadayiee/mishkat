import type { Program, Situation } from './types'

/** «چله»ها: برنامه‌های ۴۰ روزهٔ تغییر عادت */
export const programs: Program[] = [
  {
    id: 'steadfast',
    title: 'چلهٔ پایداری',
    tagline: 'هر روز دو دقیقه؛ تا کار خوب، خُلق تو شود',
    days: 40,
    lessons: ['consistency', 'change-within', 'opportunity', 'hearts-tire', 'two-patience', 'small-sins', 'capacity', 'self-account'],
    dailyAction: 'دو دقیقه کار خوبِ هرروزه',
    hue: 'var(--emerald-glow)',
  },
  {
    id: 'calm',
    title: 'چلهٔ آرامش',
    tagline: 'خشم را بشناس، فاصله بینداز، ببخش',
    days: 40,
    lessons: ['anger-key', 'forgive', 'forgive-power', 'answer-peace', 'heart-rest', 'reason-desire'],
    dailyAction: 'در خشم: هیچ تصمیم و پیامی، تا بیست دقیقه',
    hue: 'var(--rose)',
  },
  {
    id: 'tongue',
    title: 'چلهٔ زبان',
    tagline: 'چهل روز بی‌غیبت و بی‌دروغ؛ دلی سبک‌تر',
    days: 40,
    lessons: ['tongue', 'think-speak', 'word-chain', 'silence', 'lying', 'verify-news'],
    dailyAction: 'امروز دربارهٔ هیچ غایبی عیبی نگو',
    hue: 'var(--azure)',
  },
  {
    id: 'honesty',
    title: 'چلهٔ صداقت',
    tagline: 'راست بگو، به قولت وفا کن، امانت‌دار باش',
    days: 40,
    lessons: ['truth-trust', 'lying', 'say-do', 'dignity'],
    dailyAction: 'امروز فقط قولی بده که می‌توانی',
    hue: 'var(--gold)',
  },
  {
    id: 'family',
    title: 'چلهٔ خانواده',
    tagline: 'مهربانی از خانه شروع می‌شود',
    days: 40,
    lessons: ['parents', 'young-heart', 'golden-rule', 'good-character', 'humility'],
    dailyAction: 'یک کار محبت‌آمیز برای پدر و مادر',
    hue: 'var(--violet)',
  },
  {
    id: 'thanks',
    title: 'چلهٔ شکر و امید',
    tagline: 'هر شب سه نعمت؛ نگاهی تازه به زندگی',
    days: 40,
    lessons: ['gratitude', 'ease', 'hope-relapse', 'envy'],
    dailyAction: 'سه نعمتِ امروز را بنویس',
    hue: 'var(--gold)',
  },
  {
    id: 'decide',
    title: 'چلهٔ خرد',
    tagline: 'مشورت، دانش، درس گرفتن، وقت‌شناسی',
    days: 40,
    lessons: ['consult', 'knowledge-wealth', 'say-idk', 'lessons-life', 'three-hours'],
    dailyAction: 'روزی یک چیز تازه یاد بگیر',
    hue: 'var(--emerald-glow)',
  },
]

/** «الان چه حالی داری؟» — راه میان‌بر از موقعیت زندگی به درس مناسب */
export const situations: Situation[] = [
  { id: 'angry', label: 'عصبانی‌ام', emoji: '🔥', lessons: ['anger-key', 'forgive'] },
  { id: 'anxious', label: 'نگران و مضطربم', emoji: '🌊', lessons: ['heart-rest', 'ease'] },
  { id: 'bored', label: 'حوصلهٔ مطالعه ندارم', emoji: '📚', lessons: ['hearts-tire', 'consistency'] },
  { id: 'procrastinate', label: 'کارهایم را عقب می‌اندازم', emoji: '⏳', lessons: ['opportunity', 'three-hours'] },
  { id: 'relapse', label: 'دوباره همان خطا را کردم', emoji: '🔄', lessons: ['hope-relapse', 'small-sins'] },
  { id: 'quit', label: 'عادت خوب را ادامه نمی‌دهم', emoji: '🌱', lessons: ['consistency', 'two-patience'] },
  { id: 'decision', label: 'باید تصمیم مهمی بگیرم', emoji: '🧭', lessons: ['consult'] },
  { id: 'insulted', label: 'کسی به من بی‌احترامی کرد', emoji: '🛡️', lessons: ['answer-peace', 'forgive-power'] },
  { id: 'gossip', label: 'پشت سر کسی حرف زدم', emoji: '🤐', lessons: ['tongue', 'think-speak'] },
  { id: 'rumor', label: 'خبری شنیدم، مطمئن نیستم', emoji: '📰', lessons: ['verify-news'] },
  { id: 'envy', label: 'به کسی حسادت می‌کنم', emoji: '🍂', lessons: ['envy', 'gratitude'] },
  { id: 'lacking', label: 'حس می‌کنم کم دارم', emoji: '🍃', lessons: ['gratitude'] },
  { id: 'parents', label: 'با پدر و مادرم مشکل دارم', emoji: '🏠', lessons: ['parents'] },
  { id: 'lonely', label: 'دوست خوبی ندارم', emoji: '🤝', lessons: ['friends', 'among-people'] },
  { id: 'hurt', label: 'از کسی دلخورم', emoji: '💔', lessons: ['forgive', 'golden-rule'] },
  { id: 'stuck', label: 'می‌خواهم زندگی‌ام عوض شود', emoji: '🚪', lessons: ['change-within', 'self-account'] },
]

export const library = [
  { id: 'quran', title: 'قرآن کریم', note: 'متن عثمانی تنزیل · ترجمهٔ مکارم شیرازی', kind: 'quran' as const, ready: true },
  { id: 'nahj', title: 'نهج‌البلاغه', note: 'سید رضی · ترتیب صبحی صالح', kind: 'nahj' as const, ready: true },
  { id: 'kafi', title: 'الکافی', note: 'کلینی · با درجهٔ سند علامه مجلسی', kind: 'hadith' as const, ready: true },
  { id: 'ghurar', title: 'غررالحکم و دررالکلم', note: 'آمدی · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
  { id: 'sahifa', title: 'صحیفهٔ سجادیه', note: 'امام سجاد (ع) · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
  { id: 'tuhaf', title: 'تحف‌العقول', note: 'ابن شعبه حرانی · در حال آماده‌سازی', kind: 'hadith' as const, ready: false },
]
