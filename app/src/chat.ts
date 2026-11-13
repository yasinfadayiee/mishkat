// گفت‌وگو با هوش مصنوعی: تاریخچه فقط روی همین دستگاه می‌ماند (localStorage) و پرسش‌ها از راه واسطِ سمت سرور فرستاده می‌شوند.
// کلید API در برنامه نیست؛ فقط نشانی واسط (VITE_CHAT_URL) هنگام ساخت برنامه داده می‌شود.
import { go } from './router'

/** متنی که گفت‌وگو درباره‌اش است: همان چیزی که خواننده روی صفحه می‌بیند، با نشانی منبع */
export interface ChatCtx {
  title?: string
  ar?: string
  fa?: string
  plain?: string
  deep?: string
  words?: [string, string][]
  source?: string
  url?: string
  /** نشانی همین متن در برنامه، برای برگشتن به آن */
  path?: string
}
export interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}
export interface Chat {
  id: string
  title: string
  at: string
  ctx?: ChatCtx
  msgs: ChatMsg[]
}

const KEY = 'mishkat.chats'
const KEEP = 40
export const CHAT_URL = String(import.meta.env.VITE_CHAT_URL ?? '').replace(/\/$/, '')

export function loadChats(): Chat[] {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(x) ? x : []
  } catch {
    return []
  }
}
const store = (list: Chat[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, KEEP)))
  } catch {
    /* حافظه پر یا مسدود است؛ گفت‌وگو فقط تا بسته شدن صفحه می‌ماند */
  }
}
export const getChat = (id: string) => loadChats().find((c) => c.id === id)
export const saveChat = (chat: Chat) => store([chat, ...loadChats().filter((c) => c.id !== chat.id)])
export const deleteChat = (id: string) => store(loadChats().filter((c) => c.id !== id))
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// متنی که دکمهٔ «بپرس» کنارش زده شده، تا صفحهٔ گفت‌وگو باز شود
let pending: ChatCtx | null = null
export function askAbout(ctx: ChatCtx) {
  pending = ctx
  go('/chat/new')
}
export const takePending = () => {
  const p = pending
  pending = null
  return p
}

export type ChatErrorCode = 'offline' | 'unset' | 'daily_user' | 'daily_total' | 'busy' | 'refusal' | 'failed'
export class ChatError extends Error {
  code: ChatErrorCode
  constructor(code: ChatErrorCode) {
    super(code)
    this.code = code
  }
}
export const CHAT_ERROR_TEXT: Record<ChatErrorCode, string> = {
  offline: 'اینترنت وصل نیست. گفت‌وگو به اینترنت نیاز دارد؛ بقیهٔ برنامه بدون اینترنت هم کار می‌کند. پرسشت پاک نشده، بعد از وصل شدن دوباره بفرست.',
  unset: 'گفت‌وگو هنوز در این نسخه راه‌اندازی نشده است.',
  daily_user: 'سقف پرسش‌های امروزت پر شده است. فردا دوباره می‌توانی بپرسی.',
  daily_total: 'گفت‌وگو امروز به سقف استفادهٔ کل برنامه رسیده است. فردا دوباره باز می‌شود.',
  busy: 'سرور گفت‌وگو الان شلوغ است. کمی بعد دوباره بفرست.',
  refusal: 'به این پرسش نمی‌توانم جواب بدهم. آن را جور دیگری بپرس.',
  failed: 'پاسخ نرسید. دوباره بفرست.',
}

/** پرسش را می‌فرستد و تکه‌های پاسخ را همان‌طور که می‌رسند برمی‌گرداند */
export async function* ask(msgs: ChatMsg[], ctx: ChatCtx | undefined, signal: AbortSignal): AsyncGenerator<string> {
  if (!CHAT_URL) throw new ChatError('unset')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ChatError('offline')
  let res: Response
  try {
    const { path: _path, ...context } = ctx ?? {}
    res = await fetch(`${CHAT_URL}/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: msgs, context: ctx ? context : undefined }), signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ChatError('offline')
  }
  if (!res.ok || !res.body) {
    const code = await res
      .json()
      .then((x: { error?: string }) => x.error)
      .catch(() => undefined)
    throw new ChatError(code === 'daily_user' || code === 'daily_total' ? code : res.status >= 500 ? 'busy' : 'failed')
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let finished = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let cut: number
    while ((cut = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, cut).trim()
      buf = buf.slice(cut + 2)
      if (!line.startsWith('data:')) continue
      const ev = JSON.parse(line.slice(5)) as { t?: string; done?: boolean; error?: string }
      if (ev.t) yield ev.t
      if (ev.error) throw new ChatError(ev.error === 'refusal' || ev.error === 'busy' ? ev.error : 'failed')
      if (ev.done) finished = true
    }
  }
  // اتصال وسط پاسخ قطع شده است
  if (!finished) throw new ChatError('failed')
}
