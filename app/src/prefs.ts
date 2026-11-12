// تنظیمات نمایش خوانشگر: حالت ساده یا کامل، عربی، اندازهٔ جدای عربی و فارسی، فاصلهٔ خط‌ها
import { useEffect, useState } from 'react'

export interface Display {
  /** ساده: فقط ترجمه و «یعنی چه؟»؛ کامل: همه‌چیز */
  mode: 'simple' | 'full'
  showAr: boolean
  /** ضریب اندازهٔ متن عربی و فارسی (۰٫۸۵ تا ۱٫۶) */
  ar: number
  fa: number
  /** فاصلهٔ خط‌ها (۱٫۶ تا ۲٫۶) */
  lh: number
}
const KEY = 'mishkat.display'
const OLD = 'mishkat.textScale'
export const DEFAULT: Display = { mode: 'full', showAr: true, ar: 1, fa: 1, lh: 2 }

const read = (): Display => {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (x) return { ...DEFAULT, ...x }
    // اندازهٔ متنی که در نسخه‌های قبل انتخاب شده بود
    const old = Number(localStorage.getItem(OLD))
    if (old) return { ...DEFAULT, ar: old, fa: old }
  } catch {
    /* حافظه در دسترس نیست */
  }
  return DEFAULT
}

let state = read()
const subs = new Set<(d: Display) => void>()
export const getDisplay = () => state
export function setDisplay(patch: Partial<Display>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* بدون ذخیره */
  }
  subs.forEach((f) => f(state))
}

export function useDisplay(): [Display, (p: Partial<Display>) => void] {
  const [d, setD] = useState(state)
  useEffect(() => {
    subs.add(setD)
    return () => void subs.delete(setD)
  }, [])
  return [d, setDisplay]
}

/** متغیرهای CSS خوانشگر */
export const displayVars = (d: Display) => ({ '--ts': d.fa, '--ts-ar': d.ar, '--lh': d.lh }) as React.CSSProperties
