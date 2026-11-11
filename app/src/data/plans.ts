// برنامه‌های مطالعه: یک بخش از کتاب، تقسیم‌شده به روزها. بدون امتیاز و رقابت؛ فقط جای مطالعه را نگه می‌دارد.
import type { Book } from '../books'

export interface Plan {
  id: string
  title: string
  desc: string
  book: string
  /** شمارهٔ بخش در کتاب */
  sec: number
  /** چند باب در هر روز */
  per: number
}

export const PLANS: Plan[] = [
  { id: 'nahj-hikam', title: 'حکمت‌های نهج‌البلاغه', desc: 'سخنان کوتاه امام علی (ع)؛ هر روز بیست حکمت.', book: 'Nahj-al-Balagha-Radi', sec: 2, per: 1 },
  { id: 'nahj-letters', title: 'نامه‌های نهج‌البلاغه', desc: 'نامه‌ها و سفارش‌ها، از جمله نامهٔ مالک اشتر؛ هر روز دو نامه.', book: 'Nahj-al-Balagha-Radi', sec: 1, per: 2 },
  { id: 'nahj-sermons', title: 'خطبه‌های نهج‌البلاغه', desc: 'همهٔ خطبه‌ها به ترتیب؛ هر روز چهار خطبه.', book: 'Nahj-al-Balagha-Radi', sec: 0, per: 4 },
  { id: 'ghurar-tongue', title: 'غرر: زبان و گفتار', desc: 'سخنان امام علی (ع) دربارهٔ حرف‌زدن، سکوت، راستی و دروغ.', book: 'ghurar', sec: 9, per: 2 },
  { id: 'ghurar-friends', title: 'غرر: دوستی و برادری', desc: 'سخنان امام علی (ع) دربارهٔ دوست، رفاقت و برادری.', book: 'ghurar', sec: 20, per: 1 },
]

/** روزهای یک برنامه: فهرست باب‌ها ([بخش، باب]) برای هر روز */
export const planDays = (plan: Plan, book: Book): [number, number][][] => {
  const chs = book.sections[plan.sec]?.chapters.map((_, ci) => [plan.sec, ci] as [number, number]) ?? []
  const days: [number, number][][] = []
  for (let i = 0; i < chs.length; i += plan.per) days.push(chs.slice(i, i + plan.per))
  return days
}
