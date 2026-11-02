import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/vazirmatn/arabic-400.css'
import '@fontsource/vazirmatn/arabic-600.css'
import '@fontsource/vazirmatn/arabic-700.css'
import '@fontsource/vazirmatn/arabic-800.css'
import '@fontsource/vazirmatn/arabic-900.css'
import '@fontsource/vazirmatn/latin-400.css'
import '@fontsource/amiri-quran/arabic-400.css'
import '@fontsource/amiri/arabic-400.css'
import './styles.css'
import './styles-v2.css'
import './styles-study.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// فقط روی نسخهٔ وب (https)؛ ویندوز و اندروید فایل‌ها را از خود بسته می‌خوانند
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
