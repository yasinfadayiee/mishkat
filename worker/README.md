# واسط گفت‌وگوی مشکات (Cloudflare Worker)

کلید Anthropic فقط در این Worker است. برنامه به `/chat` درخواست می‌فرستد و پاسخ را جریانی می‌گیرد.

## استقرار (یک بار)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create LIMITS
```

شناسه‌ای که دستور آخر چاپ می‌کند را در `wrangler.toml` جای `REPLACE_WITH_KV_ID` بگذار. بعد:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

نشانی‌ای که `deploy` چاپ می‌کند (مثل `https://mishkat-chat.<نام>.workers.dev`) را در GitHub، بخش
Settings ← Secrets and variables ← Actions ← Variables با نام `VITE_CHAT_URL` ثبت کن تا بیلد بعدی برنامه به آن وصل شود.

## محدودیت‌ها

- `ALLOWED_ORIGINS`: فقط این دامنه‌ها پذیرفته می‌شوند. این جلوی سایت‌های دیگر را در مرورگر می‌گیرد؛ جلوی اسکریپت را نمی‌گیرد، برای همین سقف‌های زیر هم هست.
- `DAILY_PER_USER`: سقف پرسش روزانهٔ هر نشانی اینترنتی (پیش‌فرض ۲۰).
- `DAILY_TOTAL`: سقف روزانهٔ کل برنامه (پیش‌فرض ۴۰۰). بعد از آن گفت‌وگو تا روز بعد بسته می‌شود.
- مدل: `claude-sonnet-5-5`، با سقف ۶۰۰۰ توکن خروجی برای هر پاسخ.
