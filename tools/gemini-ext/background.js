// درخواست‌ها به پلِ محلی از این‌جا فرستاده می‌شوند (صفحهٔ Gemini مستقیم به 127.0.0.1 دسترسی ندارد)
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type !== 'bridge') return
  fetch(`http://127.0.0.1:8791${msg.path}`, {
    method: msg.body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' },
    body: msg.body ? JSON.stringify(msg.body) : undefined,
  })
    .then((r) => r.json())
    .then((data) => reply({ ok: true, data }))
    .catch((e) => reply({ ok: false, error: String(e) }))
  return true
})
