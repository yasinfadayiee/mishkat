// کارت تصویریِ یک متن برای فرستادن به دیگران: رنگ کتاب، شمسه، متن عربی، «یعنی چه؟» و منبع
const TONES: Record<string, [string, string, string]> = {
  quran: ['#0f5a45', '#06281f', '#e6c27d'],
  nahj: ['#1f4597', '#0b1d47', '#f0c97e'],
  arbaa: ['#0e6f78', '#06343a', '#9fe3dc'],
  saduq: ['#9a4a2e', '#4a1d10', '#f3c08a'],
  other: ['#5b2e6e', '#2a1236', '#e6b8f0'],
  sunni: ['#3d4a5a', '#1b222c', '#cfd8e3'],
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > width && line) (lines.push(line), (line = w))
    else line = t
  }
  if (line) lines.push(line)
  return lines
}

function medallion(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.lineWidth = r / 30
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6)
    ctx.beginPath()
    ctx.moveTo(0, -r)
    ctx.bezierCurveTo(r * 0.18, -r * 0.74, r * 0.18, -r * 0.52, 0, -r * 0.35)
    ctx.bezierCurveTo(-r * 0.18, -r * 0.52, -r * 0.18, -r * 0.74, 0, -r)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.37, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export async function shareCard({ ar, gist, fa, source, shelf = 'nahj' }: { ar: string; gist?: string; fa: string; source: string; shelf?: string }) {
  const [c1, c2, hi] = TONES[shelf] ?? TONES.nahj
  const W = 1080
  const H = 1350
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  await document.fonts.ready
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, c1)
  bg.addColorStop(1, c2)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // کادر دوخطیِ تذهیب
  ctx.strokeStyle = hi
  ctx.globalAlpha = 0.8
  ctx.lineWidth = 3
  ctx.strokeRect(48, 48, W - 96, H - 96)
  ctx.lineWidth = 1.5
  ctx.strokeRect(62, 62, W - 124, H - 124)
  ctx.globalAlpha = 0.18
  medallion(ctx, W / 2, H / 2, 420, hi)
  ctx.globalAlpha = 1
  medallion(ctx, W / 2, 170, 60, hi)

  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff8ea'
  ctx.font = '54px "ArParen", "Amiri", serif'
  let y = 320
  const arLines = wrap(ctx, ar.replace(/^[\s۰-۹٠-٩0-9]+[.\-–]\s*/, '').replace(/\s+/g, ' ').trim(), W - 220).slice(0, 6)
  for (const l of arLines) (ctx.fillText(l, W / 2, y), (y += 86))

  y += 30
  ctx.fillStyle = hi
  ctx.font = '700 40px "Vazirmatn", sans-serif'
  for (const l of wrap(ctx, gist || fa, W - 240).slice(0, 7)) (ctx.fillText(l, W / 2, y), (y += 64))

  ctx.font = '600 30px "Vazirmatn", sans-serif'
  ctx.fillStyle = 'rgba(255, 248, 234, 0.78)'
  ctx.fillText(source, W / 2, H - 150)
  ctx.font = '800 30px "Vazirmatn", sans-serif'
  ctx.fillStyle = hi
  ctx.fillText('مِشکات', W / 2, H - 100)

  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/png'))
  const file = new File([blob], 'mishkat.png', { type: 'image/png' })
  // روی گوشی پنجرهٔ اشتراک باز می‌شود؛ جای دیگر فایل ذخیره می‌شود
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'مشکات' })
      return
    } catch {
      /* کاربر منصرف شد؛ به ذخیره برمی‌گردیم */
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'mishkat.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/** پیوند یک متن: پنجرهٔ هم‌رسانی گوشی، یا رونوشت در حافظه */
export async function shareLink(url: string, title: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  await copyText(url, 'پیوند رونوشت شد')
}

/** رونوشت متن در حافظه، با پیام کوتاه */
export async function copyText(text: string, done = 'رونوشت شد') {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const t = document.createElement('textarea')
    t.value = text
    document.body.append(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
  toast(done)
}

/* ───────── پیام کوتاه پایین صفحه ───────── */
type ToastFn = (msg: string) => void
let listener: ToastFn | null = null
export const toast = (msg: string) => listener?.(msg)
export const onToast = (fn: ToastFn | null) => {
  listener = fn
}
