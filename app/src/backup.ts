// پشتیبان‌گیری از همهٔ دادهٔ کاربر (یادداشت‌ها، نشان‌ها، برنامه‌ها، تنظیمات) در یک فایل JSON
import { copyText, toast } from './share'

const PREFIX = 'mishkat.'

export function backupData() {
  const data: Record<string, string> = {}
  for (let k = 0; k < localStorage.length; k++) {
    const key = localStorage.key(k)!
    if (key.startsWith(PREFIX)) data[key] = localStorage.getItem(key)!
  }
  return { app: 'mishkat', version: 1, at: new Date().toISOString(), data }
}

/** فایل پشتیبان: روی گوشی پنجرهٔ هم‌رسانی (برای ذخیره در فایل‌ها یا فرستادن)، جای دیگر دانلود */
export async function saveBackup() {
  const json = JSON.stringify(backupData(), null, 1)
  const name = `mishkat-backup-${new Date().toISOString().slice(0, 10)}.json`
  const file = new File([json], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'پشتیبان مشکات' })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  // در اندرویدِ بدون دانلود، متن پشتیبان رونوشت می‌شود تا جایی (مثلاً یادداشت گوشی) نگه داشته شود
  const { Capacitor } = await import('@capacitor/core')
  if (Capacitor.isNativePlatform()) return copyText(json, 'متن پشتیبان رونوشت شد؛ آن را جایی امن نگه دار')
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  toast('فایل پشتیبان ذخیره شد')
}

/** خواندن پشتیبان؛ اگر معتبر نبود خطا می‌دهد */
export function parseBackup(text: string): Record<string, string> {
  const x = JSON.parse(text)
  if (x?.app !== 'mishkat' || typeof x.data !== 'object') throw new Error('این فایل پشتیبان مشکات نیست')
  const data: Record<string, string> = {}
  for (const [k, v] of Object.entries(x.data)) if (k.startsWith(PREFIX) && typeof v === 'string') data[k] = v
  if (!data['mishkat.progress.v1']) throw new Error('در این فایل دادهٔ یادداشت‌ها نیست')
  JSON.parse(data['mishkat.progress.v1'])
  return data
}

/** جایگزینی دادهٔ فعلی با پشتیبان و باز کردن دوبارهٔ برنامه */
export function restoreBackup(data: Record<string, string>) {
  for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k)
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
  sessionStorage.setItem('mishkat.intro', '1')
  location.hash = '/notes'
  location.reload()
}

/** از مرورگر می‌خواهد دادهٔ برنامه را هنگام کمبود جا پاک نکند */
export async function persistStorage() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* پشتیبانی نمی‌شود */
  }
}
