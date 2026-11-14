import { useEffect, useRef, useState } from 'react'
import { ask, CHAT_ERROR_TEXT, CHAT_URL, ChatError, deleteChat, getChat, loadChats, newId, saveChat, takePending, type Chat, type ChatErrorCode } from '../chat'
import { go } from '../router'
import { Icon } from '../ui'

const SUGGEST = ['این جمله را ساده‌تر توضیح بده', 'امام این را در چه موقعیتی گفته است؟', 'این حرف در زندگی امروز من چه معنایی دارد؟']
const GENERAL = ['نهج‌البلاغه را از کجا شروع کنم؟', 'فرق خطبه، نامه و حکمت در نهج‌البلاغه چیست؟', 'آیهٔ نور دربارهٔ چیست؟']

/** گفت‌وگو: بدون شناسه فهرست گفت‌وگوها، با «new» گفت‌وگوی تازه (شاید دربارهٔ یک متن)، با شناسه ادامهٔ همان گفت‌وگو */
export default function ChatScreen({ sub }: { sub?: string }) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [list, setList] = useState<Chat[]>(() => loadChats())
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ChatErrorCode | null>(null)
  const abort = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sub) {
      setChat(null)
      setList(loadChats())
    } else if (sub === 'new') {
      const ctx = takePending() ?? undefined
      setChat((c) => (c && !c.msgs.length && !ctx ? c : { id: newId(), title: ctx?.title ?? 'گفت‌وگوی تازه', at: new Date().toISOString(), ctx, msgs: [] }))
    } else {
      setChat((c) => (c?.id === sub ? c : (getChat(sub) ?? null)))
    }
    setError(null)
  }, [sub])
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [chat?.msgs.length, busy])

  async function send(q: string) {
    const question = q.trim()
    if (!question || busy) return
    const base: Chat = chat ?? { id: newId(), title: 'گفت‌وگوی تازه', at: new Date().toISOString(), msgs: [] }
    const asked = [...base.msgs, { role: 'user' as const, content: question }]
    const title = base.msgs.length ? base.title : (base.ctx?.title ?? question.slice(0, 60))
    let cur: Chat = { ...base, title, at: new Date().toISOString(), msgs: [...asked, { role: 'assistant', content: '' }] }
    setChat(cur)
    setText('')
    setError(null)
    setBusy(true)
    abort.current = new AbortController()
    let answer = ''
    try {
      for await (const piece of ask(asked, base.ctx, abort.current.signal)) {
        answer += piece
        cur = { ...cur, msgs: [...asked, { role: 'assistant', content: answer }] }
        setChat(cur)
      }
      saveChat(cur)
      if (sub !== cur.id) go(`/chat/${cur.id}`, true)
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      // پاسخ نیمه‌کاره نگه داشته نمی‌شود؛ پرسش به جعبهٔ نوشتن برمی‌گردد تا دوباره فرستاده شود
      setChat({ ...base, title })
      setText(question)
      setError(e instanceof ChatError ? e.code : 'failed')
    } finally {
      setBusy(false)
    }
  }

  const composer = (
    <form
      className="chat-form"
      onSubmit={(e) => {
        e.preventDefault()
        void send(text)
      }}
    >
      <textarea
        id="chat-input"
        aria-label="پرسش تو"
        rows={2}
        value={text}
        placeholder={chat?.ctx ? 'دربارهٔ همین متن بپرس…' : 'هر چه دربارهٔ قرآن، نهج‌البلاغه و حدیث می‌خواهی بپرس…'}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void send(text)
          }
        }}
      />
      <button className="btn" disabled={busy || !text.trim()}>
        {busy ? 'در حال نوشتن…' : 'بفرست'}
      </button>
    </form>
  )
  const notice = (
    <>
      {!CHAT_URL && <p className="chat-error">{CHAT_ERROR_TEXT.unset}</p>}
      {error && (
        <p className="chat-error" role="alert">
          {CHAT_ERROR_TEXT[error]}
        </p>
      )}
    </>
  )

  if (!chat)
    return (
      <div className="chat-page">
        <header className="chat-head">
          <span className="eyebrow">گفت‌وگو</span>
          <h1>هر جا گیر کردی، بپرس</h1>
          <p>پاسخ‌ها را هوش مصنوعی می‌نویسد و ممکن است خطا داشته باشد. برای حکم شرعی به مرجع خودت مراجعه کن. گفت‌وگوها روی همین دستگاه می‌مانند، ولی پرسش‌ها برای پاسخ به سرویس Google Gemini فرستاده می‌شوند؛ اطلاعات شخصی ننویس.</p>
        </header>
        <div className="chat-chips">
          {GENERAL.map((s) => (
            <button key={s} onClick={() => void send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
        {notice}
        {composer}
        {list.length > 0 && (
          <section className="chat-list" aria-label="گفت‌وگوهای قبلی">
            <h2>گفت‌وگوهای قبلی</h2>
            {list.map((c) => (
              <div key={c.id} className="chat-row">
                <button className="chat-open" onClick={() => go(`/chat/${c.id}`)}>
                  <b>{c.title}</b>
                  <small>
                    {new Date(c.at).toLocaleDateString('fa-IR')}، {(c.msgs.length / 2).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} پرسش
                  </small>
                </button>
                <button
                  className="mini-btn"
                  aria-label={`پاک کردن گفت‌وگوی ${c.title}`}
                  onClick={() => {
                    deleteChat(c.id)
                    setList(loadChats())
                  }}
                >
                  {Icon.close}
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    )

  return (
    <div className="chat-page">
      <div className="chat-top">
        <button className="link-btn" onClick={() => go('/chat')}>
          → همهٔ گفت‌وگوها
        </button>
        <b>{chat.title}</b>
      </div>
      {chat.ctx && (
        <aside className="chat-ctx ms-frame">
          {chat.ctx.ar && (
            <p className="quran" lang="ar">
              {chat.ctx.ar}
            </p>
          )}
          {chat.ctx.fa && <p>{chat.ctx.fa}</p>}
          <small>
            {chat.ctx.source}
            {chat.ctx.path && (
              <>
                {' · '}
                <button className="link-btn" onClick={() => go(chat.ctx!.path!)}>
                  برگشت به متن
                </button>
              </>
            )}
          </small>
        </aside>
      )}
      {!chat.msgs.length && (
        <div className="chat-chips">
          {(chat.ctx ? SUGGEST : GENERAL).map((s) => (
            <button key={s} onClick={() => void send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="chat-log" aria-live="polite">
        {chat.msgs.map((m, k) => (
          <div key={k} className={`chat-msg ${m.role}`}>
            <small>{m.role === 'user' ? 'تو' : 'پاسخ'}</small>
            {m.content ? m.content.split(/\n+/).map((t, j) => <p key={j}>{t}</p>) : <p className="chat-wait">در حال فکر کردن…</p>}
          </div>
        ))}
        <div ref={end} />
      </div>
      {notice}
      {composer}
      <p className="chat-foot">پاسخ هوش مصنوعی است، نه نظر عالم دینی. با متن و منبع بسنج.</p>
    </div>
  )
}
