// خروجی دفتر: متن‌های نشان‌شده، یادداشت‌ها و پاسخ‌ها در یک فایل HTML که چاپ یا PDF هم می‌شود
import type { Progress } from './store'

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const day = (iso: string) => new Date(iso).toLocaleDateString('fa-IR')

export function exportNotes(p: Progress) {
  const notes = Object.values(p.notes).sort((a, b) => b.at.localeCompare(a.at))
  const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>دفتر مشکات</title>
<style>
body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:760px;margin:32px auto;padding:0 18px;line-height:2;color:#1b1b1b;background:#fffdf7}
h1{font-size:26px;margin:0}h2{font-size:19px;border-bottom:2px solid #c9a45c;padding-bottom:4px;margin-top:36px}
.it{border:1px solid #eadfca;border-radius:12px;padding:12px 16px;margin:12px 0;break-inside:avoid}
small{color:#8a7a5c}.q{color:#6b5a35}.a{background:#f6efe0;border-radius:8px;padding:6px 10px}
@media print{body{margin:0}.it{border-color:#ccc}}
</style></head><body>
<h1>دفتر ${esc(p.name || 'من')}</h1>
<small>مشکات · ${day(new Date().toISOString())}</small>
${notes.length ? `<h2>آنچه نوشته‌ام</h2>${notes.map((n) => `<div class="it"><small>${esc(n.title)} · ${day(n.at)}</small><p>${esc(n.text)}</p>${n.question ? `<p class="q">${esc(n.question)}</p>` : ''}${n.answer ? `<p class="a">${esc(n.answer)}</p>` : ''}${n.note ? `<p class="a">${esc(n.note)}</p>` : ''}</div>`).join('')}` : ''}
${p.marks.length ? `<h2>متن‌های نشان‌شده</h2>${p.marks.map((m) => `<div class="it"><small>${esc(m.title)} · ${day(m.at)}</small><p>${esc(m.text)}</p></div>`).join('')}` : ''}
${p.journal.length ? `<h2>یادداشت درس‌نامه‌ها</h2>${p.journal.map((j) => `<div class="it"><small>${day(j.date)}</small><p>${esc(j.text)}</p></div>`).join('')}` : ''}
</body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `mishkat-notes-${new Date().toISOString().slice(0, 10)}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
