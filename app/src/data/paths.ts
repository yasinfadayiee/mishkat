import type { Situation } from './types'

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
