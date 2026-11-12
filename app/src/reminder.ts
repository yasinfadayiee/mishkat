// یادآور روزانه (فقط در نسخهٔ اندروید/آیفون): هر روز در ساعت انتخاب‌شده، یک حکمت نهج‌البلاغه با «یعنی چه؟»
import { Capacitor } from '@capacitor/core'
import { loadDaily } from './books'

export const canRemind = () => Capacitor.isNativePlatform()

const DAYS = 30
const BASE_ID = 7000

/** یادآورهای ۳۰ روز آینده را از نو می‌چیند؛ با هر بار باز شدن برنامه تازه می‌شود */
export async function scheduleReminders(hour: number | null): Promise<boolean> {
  if (!canRemind()) return false
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const pending = await LocalNotifications.getPending()
  const ours = pending.notifications.filter((n) => n.id >= BASE_ID && n.id < BASE_ID + DAYS)
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
  if (hour === null) return true
  const perm = await LocalNotifications.requestPermissions()
  if (perm.display !== 'granted') return false

  const sayings = (await loadDaily()).sayings.filter((i) => i.fa.length < 160)
  const start = new Date()
  start.setHours(hour, 0, 0, 0)
  if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1)
  // هر روز سخنی تازه، بسته به تاریخ (بدون تکرار در یک ماه)
  const offset = Math.floor(start.getTime() / 864e5)
  await LocalNotifications.schedule({
    notifications: Array.from({ length: DAYS }, (_, k) => {
      const at = new Date(start)
      at.setDate(start.getDate() + k)
      const s = sayings[(offset + k * 7) % sayings.length]
      return { id: BASE_ID + k, title: 'سخن امروز، امام علی (ع)', body: s.fa, largeBody: `${s.fa}\n\n${s.sm}`, schedule: { at, allowWhileIdle: true } }
    }),
  })
  return true
}
