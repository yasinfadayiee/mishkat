# واسط گفت‌وگوی مشکات (Cloudflare Worker)

کلید هوش مصنوعی فقط در این Worker است. برنامه به `/chat` درخواست می‌فرستد و پاسخ را جریانی می‌گیرد.

## مدل

Google Gemini از راه سهمیهٔ رایگان. مدل‌ها به ترتیب امتحان می‌شوند (متغیر `GEMINI_MODELS` در `wrangler.toml`):

1. `gemini-3.6-flash`: قوی‌ترین مدلی که در آزمایش ۲۰۲۶-۱۱-۱۴ در سهمیهٔ رایگان سریع جواب داد (حدود ۷ ثانیه تا اولین کلمه).
2. `gemini-3.5-flash-lite`: سبک‌تر و سریع‌تر، برای وقتی که مدل اول شلوغ است یا سهمیه‌اش تمام شده.

در همان آزمایش، `gemini-4-carbon`، `gemini-4-argon` و `gemini-3.1-pro` سهمیهٔ رایگان نداشتند (خطای 429)،
و `gemini-4-hydrogen` جواب می‌داد ولی حدود یک دقیقه تا اولین کلمه طول می‌کشید.

توجه: در سهمیهٔ رایگان، Google ممکن است متن درخواست‌ها را برای بهبود سرویس خود استفاده کند. برای همین در صفحهٔ گفت‌وگو
به کاربر گفته می‌شود اطلاعات شخصی ننویسد.

## استقرار (یک بار)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create LIMITS
```

شناسه‌ای که دستور آخر چاپ می‌کند را در `wrangler.toml` جای `REPLACE_WITH_KV_ID` بگذار. بعد کلید Gemini (از aistudio.google.com) را وارد کن:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```

نشانی‌ای که `deploy` چاپ می‌کند (مثل `https://mishkat-chat.<نام>.workers.dev`) را در GitHub، بخش
Settings ← Secrets and variables ← Actions ← Variables با نام `VITE_CHAT_URL` ثبت کن تا بیلد بعدی برنامه به آن وصل شود.

## آزمایش محلی

فایل `worker/.dev.vars` با یک خط `GEMINI_API_KEY=...` بساز (در git نیست) و `npx wrangler dev` را اجرا کن.

## محدودیت‌ها

- `ALLOWED_ORIGINS`: فقط این دامنه‌ها پذیرفته می‌شوند. این جلوی سایت‌های دیگر را در مرورگر می‌گیرد؛ جلوی اسکریپت را نمی‌گیرد، برای همین سقف‌های زیر هم هست.
- `DAILY_PER_USER`: سقف پرسش روزانهٔ هر نشانی اینترنتی (پیش‌فرض ۲۰).
- `DAILY_TOTAL`: سقف روزانهٔ کل برنامه (پیش‌فرض ۴۰۰). بعد از آن گفت‌وگو تا روز بعد بسته می‌شود.
