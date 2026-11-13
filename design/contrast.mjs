// اندازه‌گیری تضاد WCAG 2.x برای تم‌های روشن پیشنهادی
export const themes = {
  paper:  { name:'کاغذ گرم (پیش‌فرض)', bg:'#FAF5EA', surface:'#FFFDF7', ink:'#1F1A14', ink2:'#5C5345', accent:'#1F3F7A', gold:'#7A5A12', line:'#E4D9C2', soft:'#F1E9D6' },
  white:  { name:'سپید خنثی',          bg:'#FFFFFF', surface:'#F5F6F4', ink:'#17191C', ink2:'#555B63', accent:'#0B6468', gold:'#7A5A12', line:'#E2E4E0', soft:'#EEF1EF' },
  sage:   { name:'سبز ملایم',          bg:'#EEF3EC', surface:'#F9FBF7', ink:'#17241D', ink2:'#48584E', accent:'#1E5B43', gold:'#73550F', line:'#D2DDD2', soft:'#E2EAE0' },
  sepia:  { name:'شیری کم‌نور (شب)',    bg:'#F1E7D3', surface:'#F8F0E0', ink:'#2A2118', ink2:'#5A4E3C', accent:'#7A3B1E', gold:'#6B4E0E', line:'#DCCDB0', soft:'#E8DCC3' },
}
const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4 }
const L = h => { const n=parseInt(h.slice(1),16); return 0.2126*lin(n>>16)+0.7152*lin((n>>8)&255)+0.0722*lin(n&255) }
export const ratio = (a,b) => { const [x,y]=[L(a),L(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05) }
if (import.meta.url === `file://${process.argv[1]}`) {
  let ok = true
  for (const [id,t] of Object.entries(themes)) {
    const rows = [['متن اصلی/زمینه',t.ink,t.bg,7],['متن اصلی/کارت',t.ink,t.surface,7],['متن اصلی/زمینهٔ نرم',t.ink,t.soft,7],['متن فرعی/زمینه',t.ink2,t.bg,4.5],['متن فرعی/کارت',t.ink2,t.surface,4.5],['متن فرعی/زمینهٔ نرم',t.ink2,t.soft,4.5],['رنگ تأکید/زمینه',t.accent,t.bg,4.5],['رنگ تأکید/زمینهٔ نرم',t.accent,t.soft,4.5],['طلایی متنی/زمینه',t.gold,t.bg,4.5],['طلایی متنی/زمینهٔ نرم',t.gold,t.soft,4.5],['سفید روی تأکید',t.surface,t.accent,4.5]]
    console.log(`\n${id} — ${t.name}`)
    for (const [n,a,b,min] of rows) { const r=ratio(a,b); if(r<min) ok=false; console.log(`  ${r>=min?'✓':'✗'} ${r.toFixed(2).padStart(5)} (حداقل ${min})  ${n}`) }
  }
  process.exit(ok?0:1)
}
