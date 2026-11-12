import { useDisplay } from './prefs'
import { fa } from './store'

function Range({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: (v: number) => string }) {
  return (
    <label className="range-field">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{show(value)}</output>
    </label>
  )
}

/** تنظیمات نمایش متن (هم در «تنظیمات» و هم در برگهٔ «نمایش» خوانشگر) */
export function DisplaySettings() {
  const [d, setD] = useDisplay()
  const pct = (v: number) => `${fa(Math.round(v * 100))}٪`
  return (
    <div className="display-settings">
      <div className="seg-tabs small" role="radiogroup" aria-label="حالت خواندن">
        {(
          [
            ['simple', 'ساده', 'فقط متن، ترجمه و «یعنی چه؟»'],
            ['full', 'کامل', 'با واژه‌ها، «عمیق‌تر» و پرسش آینه'],
          ] as const
        ).map(([id, label, hint]) => (
          <button key={id} role="radio" aria-checked={d.mode === id} className={d.mode === id ? 'on' : ''} onClick={() => setD({ mode: id })}>
            <b>{label}</b>
            <small>{hint}</small>
          </button>
        ))}
      </div>
      <label className="switch-field">
        <span>نمایش متن عربی</span>
        <input type="checkbox" checked={d.showAr} onChange={(e) => setD({ showAr: e.target.checked })} />
      </label>
      <Range label="اندازهٔ عربی" value={d.ar} min={0.85} max={1.6} step={0.05} onChange={(v) => setD({ ar: v })} show={pct} />
      <Range label="اندازهٔ فارسی" value={d.fa} min={0.85} max={1.6} step={0.05} onChange={(v) => setD({ fa: v })} show={pct} />
      <Range label="فاصلهٔ خط‌ها" value={d.lh} min={1.6} max={2.6} step={0.1} onChange={(v) => setD({ lh: v })} show={(v) => fa(Number(v.toFixed(1)))} />
      <p className="ds-sample" style={{ fontSize: `calc(17px * ${d.fa})`, lineHeight: d.lh }}>
        نمونه: هر کس خود را بشناسد، پروردگارش را شناخته است.
      </p>
    </div>
  )
}

