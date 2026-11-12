import { m } from 'framer-motion'
import { lessons } from '../data/lessons'
import { fa } from '../store'
import { Icon } from '../ui'

export function Trust({ back }: { back: () => void }) {
  return (
    <div className="fade-up" style={{ maxWidth: 860 }}>
      <button className="btn btn-quiet" onClick={back} style={{ paddingRight: 0 }}>
        {Icon.back} بازگشت
      </button>
      <div className="eyebrow">زنجیرهٔ اعتبار</div>
      <h1 className="h1">هر کلمه، با سند</h1>
      <p className="muted">کسی که بر اساس این متن‌ها زندگی‌اش را تغییر می‌دهد، حق دارد بداند هر جمله از کجا آمده است. برای همین مشکات چهار قانون دارد:</p>

      {[
        ['متن اصلی دست نمی‌خورد', 'متن آیات عیناً از نسخهٔ عثمانی «تنزیل» آورده می‌شود. متن ۳۹ کتاب حدیث شیعه (کتب اربعه، نهج‌البلاغه، آثار شیخ صدوق و دیگران) عیناً از پایگاه «ثقلین»، صحیفهٔ سجادیه از ویکی‌نبشتهٔ عربی، و صحیح بخاری و مسلم از نسخهٔ عمومی آن‌ها آمده است. فایل کتاب‌ها مستقیم از همین منابع ساخته می‌شود و متن عربی هرگز دستی ویرایش نمی‌شود؛ متن‌های درس‌نامه‌ها هم پیش از هر انتشار با یک بازبین خودکار، حرف‌به‌حرف با منبع مقایسه می‌شوند.'],
        ['درجهٔ سند پنهان نمی‌شود', 'برای احادیث کافی، نظر علامه مجلسی در «مرآة العقول» دربارهٔ سند (صحیح، حسن، مجهول، ضعیف) کنار حدیث نمایش داده می‌شود؛ حتی وقتی ضعیف است. حدیث ضعیف‌السند فقط به‌عنوان شاهد کنار آیه یا روایت معتبر می‌آید.'],
        ['ترجمه و توضیح از هم جدا هستند', 'ترجمهٔ قرآن از آیت‌الله مکارم شیرازی است. ترجمهٔ فارسی احادیث، «توضیح ساده»، شرح جمله‌به‌جمله و پرسش‌های «آینه» پیش‌نویس تیم مشکات است؛ برداشت و توضیح است، نه متن معصوم، و جدا از متن اصلی نشان داده می‌شود.'],
        ['هر توضیح، پیش از انتشار عمومی بازبینی می‌شود', 'توضیحات و مثال‌ها پیش‌نویس تیم مشکات است و پیش از انتشار عمومی باید به تأیید کارشناس دینی برسد. هر کس می‌تواند با دکمهٔ «تطبیق با منبع» متن را خودش ببیند.'],
      ].map(([t, b], k) => (
        <m.div key={k} className="card point" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.08 }}>
          <div className="num">{fa(k + 1)}</div>
          <div>
            <h4>{t}</h4>
            <p>{b}</p>
          </div>
        </m.div>
      ))}

      <h2 className="h2" style={{ margin: '26px 0 12px' }}>
        وضعیت درس‌ها
      </h2>
      <div className="card" style={{ padding: 6 }}>
        {lessons.map((l) => (
          <div key={l.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', borderBottom: '1px dashed var(--line)', flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 160 }}>{l.title}</b>
            <span className="chip ok">متن: تطبیق‌شده با منبع</span>
            <span className={`chip ${l.review.explanation === 'verified' ? 'ok' : 'warn'}`}>توضیح: {l.review.explanation === 'verified' ? 'تأییدشده' : 'در انتظار بازبینی کارشناس'}</span>
          </div>
        ))}
      </div>

      <h2 className="h2" style={{ margin: '26px 0 12px' }}>
        منابع
      </h2>
      <div className="card" style={{ padding: 20, lineHeight: 2.2, fontSize: 14.5 }}>
        <div>
          متن قرآن: <a href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil.net</a> (نسخهٔ عثمانی، بدون تغییر) · ترجمه: آیت‌الله ناصر مکارم شیرازی
        </div>
        <div>
          احادیث شیعه: <a href="https://thaqalayn.net" target="_blank" rel="noreferrer">Thaqalayn.net</a> · درجهٔ سند: علامه محمدباقر مجلسی، مرآة العقول
        </div>
        <div>
          احادیث اهل سنت: صحیح بخاری و صحیح مسلم (<a href="https://sunnah.com" target="_blank" rel="noreferrer">Sunnah.com</a>)
        </div>
        <div>
          تلاوت: مشاری راشد العفاسی، از <a href="https://everyayah.com" target="_blank" rel="noreferrer">EveryAyah.com</a>
        </div>
        <div>
          غررالحکم و تحف‌العقول: پیکرهٔ آزاد <a href="https://github.com/OpenITI" target="_blank" rel="noreferrer">OpenITI</a> · صحیفهٔ سجادیه: <a href="https://ar.wikisource.org/wiki/الصحيفة_السجادية" target="_blank" rel="noreferrer">ویکی‌نبشتهٔ عربی</a>
        </div>
        <div dir="ltr" style={{ textAlign: 'left', fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>
          Quran text: Tanzil Quran Text (Uthmani, Version 1.1). Copyright (C) 2007-2021 Tanzil Project. License: Creative Commons Attribution 3.0. This copy of the text may be used in any website or application, provided that its source (Tanzil Project) is clearly indicated, and a link is made to tanzil.net to enable users to keep track of changes. Translation: Naser Makarem Shirazi, via tanzil.net (non-commercial use).
        </div>
      </div>
    </div>
  )
}
